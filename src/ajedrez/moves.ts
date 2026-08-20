import type { Player } from '../shared/types'
import { opponent } from '../shared/player'
import {
  BISHOP_DIR,
  BLACK_KING,
  BLACK_ROOK_K,
  BLACK_ROOK_Q,
  KING_DELTA,
  KNIGHT_DELTA,
  ROOK_DIR,
  SQUARE_COUNT,
  WHITE_KING,
  WHITE_ROOK_K,
  WHITE_ROOK_Q,
  fileOf,
  inBoard,
  pawnDir,
  promoRank,
  rankOf,
  startRank,
} from './constants'
import { kingIndex } from './board'
import type { ChessMove, ChessPosition, Piece, PieceKind } from './types'

const PROMOTE: PieceKind[] = ['q', 'r', 'b', 'n']

function onBoardDelta(from: number, to: number, delta: number): boolean {
  if (to < 0 || to >= SQUARE_COUNT) {
    return false
  }
  if (Math.abs(delta) === 1) {
    return rankOf(from) === rankOf(to)
  }
  if (Math.abs(delta) === 8) {
    return fileOf(from) === fileOf(to)
  }
  if (Math.abs(delta) === 7 || Math.abs(delta) === 9) {
    return Math.abs(fileOf(from) - fileOf(to)) === 1 && Math.abs(rankOf(from) - rankOf(to)) === 1
  }
  if (Math.abs(delta) === 6 || Math.abs(delta) === 10) {
    return Math.abs(fileOf(from) - fileOf(to)) === 2 && Math.abs(rankOf(from) - rankOf(to)) === 1
  }
  if (Math.abs(delta) === 15 || Math.abs(delta) === 17) {
    return Math.abs(fileOf(from) - fileOf(to)) === 1 && Math.abs(rankOf(from) - rankOf(to)) === 2
  }
  return false
}

function pushMove(
  moves: ChessMove[],
  from: number,
  to: number,
  capture: boolean,
  extra: Partial<ChessMove> = {},
): void {
  moves.push({ from, to, capture, ...extra })
}

function slide(squares: (Piece | null)[], from: number, player: Player, dirs: number[], moves: ChessMove[]): void {
  for (const dir of dirs) {
    let current = from
    while (true) {
      const next = current + dir
      if (!onBoardDelta(current, next, dir)) {
        break
      }
      const occupant = squares[next]
      if (!occupant) {
        pushMove(moves, from, next, false)
      } else {
        if (occupant.player !== player) {
          pushMove(moves, from, next, true)
        }
        break
      }
      current = next
    }
  }
}

function pawnMoves(position: ChessPosition, from: number, player: Player, moves: ChessMove[]): void {
  const dir = pawnDir(player)
  const one = from + dir
  const rank = rankOf(from)
  const file = fileOf(from)
  const promo = promoRank(player)

  if (one >= 0 && one < SQUARE_COUNT && rankOf(one) === rank + (player === 'white' ? -1 : 1) && !position.squares[one]) {
    if (rankOf(one) === promo) {
      for (const kind of PROMOTE) {
        pushMove(moves, from, one, false, { promoteTo: kind })
      }
    } else {
      pushMove(moves, from, one, false)
      if (rank === startRank(player)) {
        const two = from + dir * 2
        if (!position.squares[two]) {
          pushMove(moves, from, two, false)
        }
      }
    }
  }

  for (const side of [-1, 1]) {
    const captureFile = file + side
    const captureRank = rank + (player === 'white' ? -1 : 1)
    if (!inBoard(captureFile, captureRank)) {
      continue
    }
    const to = captureRank * 8 + captureFile
    const occupant = position.squares[to]
    if (occupant && occupant.player !== player) {
      if (captureRank === promo) {
        for (const kind of PROMOTE) {
          pushMove(moves, from, to, true, { promoteTo: kind })
        }
      } else {
        pushMove(moves, from, to, true)
      }
    } else if (position.ep === to) {
      pushMove(moves, from, to, true, { enPassant: true })
    }
  }
}

function knightMoves(squares: (Piece | null)[], from: number, player: Player, moves: ChessMove[]): void {
  for (const delta of KNIGHT_DELTA) {
    const to = from + delta
    if (!onBoardDelta(from, to, delta)) {
      continue
    }
    const occupant = squares[to]
    if (!occupant || occupant.player !== player) {
      pushMove(moves, from, to, Boolean(occupant))
    }
  }
}

function kingMoves(squares: (Piece | null)[], from: number, player: Player, moves: ChessMove[]): void {
  for (const delta of KING_DELTA) {
    const to = from + delta
    if (!onBoardDelta(from, to, delta)) {
      continue
    }
    const occupant = squares[to]
    if (!occupant || occupant.player !== player) {
      pushMove(moves, from, to, Boolean(occupant))
    }
  }
}

export function isSquareAttacked(squares: (Piece | null)[], target: number, by: Player): boolean {
  const pawnFrom = by === 'white' ? [target + 7, target + 9] : [target - 7, target - 9]
  for (const from of pawnFrom) {
    if (from < 0 || from >= SQUARE_COUNT) {
      continue
    }
    if (!onBoardDelta(from, target, target - from)) {
      continue
    }
    const piece = squares[from]
    if (piece?.player === by && piece.kind === 'p') {
      return true
    }
  }

  for (const delta of KNIGHT_DELTA) {
    const from = target + delta
    if (!onBoardDelta(target, from, delta)) {
      continue
    }
    const piece = squares[from]
    if (piece?.player === by && piece.kind === 'n') {
      return true
    }
  }

  for (const delta of KING_DELTA) {
    const from = target + delta
    if (!onBoardDelta(target, from, delta)) {
      continue
    }
    const piece = squares[from]
    if (piece?.player === by && piece.kind === 'k') {
      return true
    }
  }

  for (const dir of [...BISHOP_DIR, ...ROOK_DIR]) {
    const bishopLike = BISHOP_DIR.includes(dir)
    let current = target
    while (true) {
      const from = current + dir
      if (!onBoardDelta(current, from, dir)) {
        break
      }
      const piece = squares[from]
      if (piece) {
        if (piece.player === by) {
          if (piece.kind === 'q' || (bishopLike && piece.kind === 'b') || (!bishopLike && piece.kind === 'r')) {
            return true
          }
        }
        break
      }
      current = from
    }
  }

  return false
}

export function inCheck(squares: (Piece | null)[], player: Player): boolean {
  const king = kingIndex(squares, player)
  if (king < 0) {
    return true
  }
  return isSquareAttacked(squares, king, opponent(player))
}

function addCastling(position: ChessPosition, player: Player, moves: ChessMove[]): void {
  const squares = position.squares
  if (inCheck(squares, player)) {
    return
  }
  const enemy = opponent(player)
  if (player === 'white') {
    if (position.castling.whiteKing && !squares[61] && !squares[62]) {
      if (!isSquareAttacked(squares, 61, enemy) && !isSquareAttacked(squares, 62, enemy)) {
        pushMove(moves, WHITE_KING, 62, false, { castle: 'king' })
      }
    }
    if (position.castling.whiteQueen && !squares[59] && !squares[58] && !squares[57]) {
      if (!isSquareAttacked(squares, 59, enemy) && !isSquareAttacked(squares, 58, enemy)) {
        pushMove(moves, WHITE_KING, 58, false, { castle: 'queen' })
      }
    }
    return
  }
  if (position.castling.blackKing && !squares[5] && !squares[6]) {
    if (!isSquareAttacked(squares, 5, enemy) && !isSquareAttacked(squares, 6, enemy)) {
      pushMove(moves, BLACK_KING, 6, false, { castle: 'king' })
    }
  }
  if (position.castling.blackQueen && !squares[3] && !squares[2] && !squares[1]) {
    if (!isSquareAttacked(squares, 3, enemy) && !isSquareAttacked(squares, 2, enemy)) {
      pushMove(moves, BLACK_KING, 2, false, { castle: 'queen' })
    }
  }
}

export function pseudoLegalMoves(position: ChessPosition): ChessMove[] {
  const moves: ChessMove[] = []
  const player = position.current
  for (let from = 0; from < SQUARE_COUNT; from += 1) {
    const piece = position.squares[from]
    if (!piece || piece.player !== player) {
      continue
    }
    if (piece.kind === 'p') {
      pawnMoves(position, from, player, moves)
    } else if (piece.kind === 'n') {
      knightMoves(position.squares, from, player, moves)
    } else if (piece.kind === 'b') {
      slide(position.squares, from, player, BISHOP_DIR, moves)
    } else if (piece.kind === 'r') {
      slide(position.squares, from, player, ROOK_DIR, moves)
    } else if (piece.kind === 'q') {
      slide(position.squares, from, player, [...BISHOP_DIR, ...ROOK_DIR], moves)
    } else {
      kingMoves(position.squares, from, player, moves)
    }
  }
  addCastling(position, player, moves)
  return moves
}

export function legalMoves(position: ChessPosition): ChessMove[] {
  const player = position.current
  return pseudoLegalMoves(position).filter((move) => !inCheck(applyMove(position, move).squares, player))
}

export function sameMove(a: ChessMove, b: ChessMove): boolean {
  return a.from === b.from && a.to === b.to && a.promoteTo === b.promoteTo && a.castle === b.castle
}

export function isLightSquare(index: number): boolean {
  return (fileOf(index) + rankOf(index)) % 2 === 0
}

export function applyMove(position: ChessPosition, move: ChessMove): ChessPosition {
  const piece = position.squares[move.from]
  if (!piece) {
    return position
  }
  const next: ChessPosition = {
    squares: position.squares.slice(),
    current: opponent(position.current),
    castling: { ...position.castling },
    ep: null,
    halfmove: position.halfmove + 1,
    fullmove: position.current === 'black' ? position.fullmove + 1 : position.fullmove,
  }

  next.squares[move.from] = null
  if (move.enPassant) {
    const captured = move.to + (piece.player === 'white' ? 8 : -8)
    next.squares[captured] = null
  }
  if (move.castle === 'king') {
    if (piece.player === 'white') {
      next.squares[WHITE_ROOK_K] = null
      next.squares[61] = { player: 'white', kind: 'r' }
    } else {
      next.squares[BLACK_ROOK_K] = null
      next.squares[5] = { player: 'black', kind: 'r' }
    }
  }
  if (move.castle === 'queen') {
    if (piece.player === 'white') {
      next.squares[WHITE_ROOK_Q] = null
      next.squares[59] = { player: 'white', kind: 'r' }
    } else {
      next.squares[BLACK_ROOK_Q] = null
      next.squares[3] = { player: 'black', kind: 'r' }
    }
  }

  next.squares[move.to] = move.promoteTo ? { player: piece.player, kind: move.promoteTo } : piece

  if (piece.kind === 'p' || move.capture) {
    next.halfmove = 0
  }
  if (piece.kind === 'p' && Math.abs(move.to - move.from) === 16) {
    next.ep = (move.from + move.to) >> 1
  }
  if (piece.kind === 'k') {
    if (piece.player === 'white') {
      next.castling.whiteKing = false
      next.castling.whiteQueen = false
    } else {
      next.castling.blackKing = false
      next.castling.blackQueen = false
    }
  }
  if (move.from === WHITE_ROOK_K || move.to === WHITE_ROOK_K) {
    next.castling.whiteKing = false
  }
  if (move.from === WHITE_ROOK_Q || move.to === WHITE_ROOK_Q) {
    next.castling.whiteQueen = false
  }
  if (move.from === BLACK_ROOK_K || move.to === BLACK_ROOK_K) {
    next.castling.blackKing = false
  }
  if (move.from === BLACK_ROOK_Q || move.to === BLACK_ROOK_Q) {
    next.castling.blackQueen = false
  }
  return next
}
