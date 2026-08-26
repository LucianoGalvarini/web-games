import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import {
  BOARD_SIZE,
  DIAGONAL_DIRS,
  DROPPABLE_KINDS,
  KING_DELTAS,
  ORTHOGONAL_DIRS,
  SQUARE_COUNT,
  fileOf,
  forward,
  goldDeltas,
  inBoard,
  inPromotionZone,
  isForcedPromotion,
  rankOf,
  silverDeltas,
  knightDeltas,
  squareIndex,
} from './constants'
import type { Dir } from './constants'
import { kingIndex } from './board'
import type { DroppableKind, Piece, ShogiBoard, ShogiMove, ShogiPosition } from './types'

function stepMoves(board: ShogiBoard, from: number, player: Player, deltas: readonly Dir[], moves: ShogiMove[]): void {
  const f = fileOf(from)
  const r = rankOf(from)
  for (const { dx, dy } of deltas) {
    const file = f + dx
    const rank = r + dy
    if (!inBoard(file, rank)) {
      continue
    }
    const to = squareIndex(file, rank)
    const occupant = board[to]
    if (!occupant || occupant.player !== player) {
      moves.push({ kind: 'move', from, to, capture: Boolean(occupant) })
    }
  }
}

function slideMoves(board: ShogiBoard, from: number, player: Player, dirs: readonly Dir[], moves: ShogiMove[]): void {
  const f = fileOf(from)
  const r = rankOf(from)
  for (const { dx, dy } of dirs) {
    let file = f + dx
    let rank = r + dy
    while (inBoard(file, rank)) {
      const to = squareIndex(file, rank)
      const occupant = board[to]
      if (!occupant) {
        moves.push({ kind: 'move', from, to, capture: false })
      } else {
        if (occupant.player !== player) {
          moves.push({ kind: 'move', from, to, capture: true })
        }
        break
      }
      file += dx
      rank += dy
    }
  }
}

function pseudoMovesForPiece(board: ShogiBoard, from: number, piece: Piece, moves: ShogiMove[]): void {
  const { kind, promoted, player } = piece
  const fwd = forward(player)

  if (kind === 'k') {
    stepMoves(board, from, player, KING_DELTAS, moves)
    return
  }
  if (kind === 'g' || (promoted && (kind === 's' || kind === 'n' || kind === 'l' || kind === 'p'))) {
    stepMoves(board, from, player, goldDeltas(fwd), moves)
    return
  }
  if (kind === 'r') {
    slideMoves(board, from, player, ORTHOGONAL_DIRS, moves)
    if (promoted) {
      stepMoves(board, from, player, DIAGONAL_DIRS, moves)
    }
    return
  }
  if (kind === 'b') {
    slideMoves(board, from, player, DIAGONAL_DIRS, moves)
    if (promoted) {
      stepMoves(board, from, player, ORTHOGONAL_DIRS, moves)
    }
    return
  }
  if (kind === 's') {
    stepMoves(board, from, player, silverDeltas(fwd), moves)
    return
  }
  if (kind === 'n') {
    stepMoves(board, from, player, knightDeltas(fwd), moves)
    return
  }
  if (kind === 'l') {
    slideMoves(board, from, player, [{ dx: 0, dy: fwd }], moves)
    return
  }
  stepMoves(board, from, player, [{ dx: 0, dy: fwd }], moves)
}

function addWithPromotionVariants(moves: ShogiMove[], move: ShogiMove, piece: Piece, player: Player): void {
  if (move.kind !== 'move') {
    return
  }
  const canPromote =
    piece.kind !== 'k' && piece.kind !== 'g' && !piece.promoted &&
    (inPromotionZone(player, rankOf(move.from)) || inPromotionZone(player, rankOf(move.to)))
  const forced = canPromote && isForcedPromotion(piece.kind, player, rankOf(move.to))

  if (canPromote) {
    moves.push({ ...move, promote: true })
  }
  if (!forced) {
    moves.push({ ...move })
  }
}

function hasUnpromotedPawnOnFile(board: ShogiBoard, player: Player, file: number): boolean {
  for (let rank = 0; rank < BOARD_SIZE; rank += 1) {
    const piece = board[squareIndex(file, rank)]
    if (piece?.player === player && piece.kind === 'p' && !piece.promoted) {
      return true
    }
  }
  return false
}

function addDrops(position: ShogiPosition, player: Player, moves: ShogiMove[]): void {
  const hand = position.hands[player]
  for (const kind of DROPPABLE_KINDS) {
    if ((hand[kind] ?? 0) <= 0) {
      continue
    }
    for (let to = 0; to < SQUARE_COUNT; to += 1) {
      if (position.board[to]) {
        continue
      }
      const rank = rankOf(to)
      if (isForcedPromotion(kind, player, rank)) {
        continue
      }
      if (kind === 'p') {
        if (hasUnpromotedPawnOnFile(position.board, player, fileOf(to))) {
          continue
        }
        const dropMove: ShogiMove = { kind: 'drop', to, piece: kind }
        const next = applyMove(position, dropMove)
        if (inCheck(next.board, next.current) && legalMoves(next).length === 0) {
          continue
        }
      }
      moves.push({ kind: 'drop', to, piece: kind })
    }
  }
}

export function pseudoLegalMoves(position: ShogiPosition): ShogiMove[] {
  const moves: ShogiMove[] = []
  const player = position.current
  for (let from = 0; from < SQUARE_COUNT; from += 1) {
    const piece = position.board[from]
    if (!piece || piece.player !== player) {
      continue
    }
    const raw: ShogiMove[] = []
    pseudoMovesForPiece(position.board, from, piece, raw)
    for (const move of raw) {
      addWithPromotionVariants(moves, move, piece, player)
    }
  }
  addDrops(position, player, moves)
  return moves
}

export function isSquareAttacked(board: ShogiBoard, target: number, by: Player): boolean {
  const tf = fileOf(target)
  const tr = rankOf(target)
  const fwd = forward(by)

  const stepHit = (dx: number, dy: number, matches: (piece: Piece) => boolean): boolean => {
    const file = tf + dx
    const rank = tr + dy
    if (!inBoard(file, rank)) {
      return false
    }
    const piece = board[squareIndex(file, rank)]
    return Boolean(piece && piece.player === by && matches(piece))
  }

  if (stepHit(0, -fwd, (p) => p.kind === 'p' && !p.promoted)) {
    return true
  }
  if (stepHit(-1, -fwd * 2, (p) => p.kind === 'n' && !p.promoted)) {
    return true
  }
  if (stepHit(1, -fwd * 2, (p) => p.kind === 'n' && !p.promoted)) {
    return true
  }
  for (const { dx, dy } of KING_DELTAS) {
    if (stepHit(-dx, -dy, (p) => p.kind === 'k')) {
      return true
    }
  }
  for (const { dx, dy } of goldDeltas(fwd)) {
    if (
      stepHit(
        -dx,
        -dy,
        (p) => p.kind === 'g' || (p.promoted && (p.kind === 's' || p.kind === 'n' || p.kind === 'l' || p.kind === 'p')),
      )
    ) {
      return true
    }
  }
  for (const { dx, dy } of silverDeltas(fwd)) {
    if (stepHit(-dx, -dy, (p) => p.kind === 's' && !p.promoted)) {
      return true
    }
  }
  for (const { dx, dy } of DIAGONAL_DIRS) {
    if (stepHit(-dx, -dy, (p) => p.kind === 'r' && p.promoted)) {
      return true
    }
  }
  for (const { dx, dy } of ORTHOGONAL_DIRS) {
    if (stepHit(-dx, -dy, (p) => p.kind === 'b' && p.promoted)) {
      return true
    }
  }

  for (const { dx, dy } of ORTHOGONAL_DIRS) {
    let file = tf + dx
    let rank = tr + dy
    while (inBoard(file, rank)) {
      const piece = board[squareIndex(file, rank)]
      if (piece) {
        if (piece.player === by && piece.kind === 'r') {
          return true
        }
        break
      }
      file += dx
      rank += dy
    }
  }
  for (const { dx, dy } of DIAGONAL_DIRS) {
    let file = tf + dx
    let rank = tr + dy
    while (inBoard(file, rank)) {
      const piece = board[squareIndex(file, rank)]
      if (piece) {
        if (piece.player === by && piece.kind === 'b') {
          return true
        }
        break
      }
      file += dx
      rank += dy
    }
  }
  {
    let file = tf
    let rank = tr - fwd
    while (inBoard(file, rank)) {
      const piece = board[squareIndex(file, rank)]
      if (piece) {
        if (piece.player === by && piece.kind === 'l' && !piece.promoted) {
          return true
        }
        break
      }
      rank -= fwd
    }
  }

  return false
}

export function inCheck(board: ShogiBoard, player: Player): boolean {
  const king = kingIndex(board, player)
  if (king < 0) {
    return true
  }
  return isSquareAttacked(board, king, opponent(player))
}

export function applyMove(position: ShogiPosition, move: ShogiMove): ShogiPosition {
  const board = position.board.slice()
  const hands: ShogiPosition['hands'] = {
    white: { ...position.hands.white },
    black: { ...position.hands.black },
  }
  const player = position.current

  if (move.kind === 'drop') {
    board[move.to] = { player, kind: move.piece, promoted: false }
    hands[player][move.piece] -= 1
  } else {
    const piece = board[move.from]
    if (!piece) {
      return { board, hands, current: opponent(player) }
    }
    board[move.from] = null
    if (move.capture) {
      const captured = board[move.to]
      if (captured && captured.kind !== 'k') {
        const baseKind = captured.kind as DroppableKind
        hands[player][baseKind] = (hands[player][baseKind] ?? 0) + 1
      }
    }
    board[move.to] = { player, kind: piece.kind, promoted: move.promote ? true : piece.promoted }
  }

  return { board, hands, current: opponent(player) }
}

export function legalMoves(position: ShogiPosition): ShogiMove[] {
  const player = position.current
  return pseudoLegalMoves(position).filter((move) => !inCheck(applyMove(position, move).board, player))
}

export function sameMove(a: ShogiMove, b: ShogiMove): boolean {
  if (a.kind !== b.kind) {
    return false
  }
  if (a.kind === 'drop' && b.kind === 'drop') {
    return a.to === b.to && a.piece === b.piece
  }
  if (a.kind === 'move' && b.kind === 'move') {
    return a.from === b.from && a.to === b.to && Boolean(a.promote) === Boolean(b.promote)
  }
  return false
}
