import { getCell, piecesOf } from './board'
import { DIRECTIONS } from './constants'
import {
  canStepFrom,
  directionBetween,
  inBounds,
  keyOf,
  opponent,
  sameDir,
} from './geometry'
import type { Board, CaptureKind, ChainState, Dir, Move, Player, Point } from './types'

function collectLine(board: Board, start: Point, dir: Dir, enemy: Player): Point[] {
  const captured: Point[] = []
  let x = start.x
  let y = start.y

  while (inBounds(x, y) && board[y][x] === enemy) {
    captured.push({ x, y })
    x += dir.dx
    y += dir.dy
  }

  return captured
}

export function captureOptions(
  board: Board,
  from: Point,
  to: Point,
  player: Player,
): Array<{ kind: CaptureKind; captured: Point[] }> {
  const dir = directionBetween(from, to)
  const enemy = opponent(player)
  const options: Array<{ kind: CaptureKind; captured: Point[] }> = []

  const approachStart = { x: to.x + dir.dx, y: to.y + dir.dy }
  if (inBounds(approachStart.x, approachStart.y) && getCell(board, approachStart) === enemy) {
    options.push({
      kind: 'approach',
      captured: collectLine(board, approachStart, dir, enemy),
    })
  }

  const withdrawDir = { dx: -dir.dx, dy: -dir.dy }
  const withdrawStart = { x: from.x + withdrawDir.dx, y: from.y + withdrawDir.dy }
  if (inBounds(withdrawStart.x, withdrawStart.y) && getCell(board, withdrawStart) === enemy) {
    options.push({
      kind: 'withdrawal',
      captured: collectLine(board, withdrawStart, withdrawDir, enemy),
    })
  }

  return options
}

function stepsFrom(
  board: Board,
  from: Point,
  player: Player,
  visited: ReadonlySet<string>,
  lastDir: Dir | null,
  capturingOnly: boolean,
): Move[] {
  if (getCell(board, from) !== player) {
    return []
  }

  const moves: Move[] = []

  for (const dir of DIRECTIONS) {
    if (!canStepFrom(from, dir)) {
      continue
    }
    if (lastDir && sameDir(dir, lastDir)) {
      continue
    }

    const to = { x: from.x + dir.dx, y: from.y + dir.dy }
    if (getCell(board, to) !== null) {
      continue
    }
    if (visited.has(keyOf(to))) {
      continue
    }

    const options = captureOptions(board, from, to, player)
    if (options.length > 0) {
      for (const option of options) {
        moves.push({
          from,
          to,
          kind: option.kind,
          captured: option.captured,
        })
      }
    } else if (!capturingOnly) {
      moves.push({
        from,
        to,
        kind: 'paika',
        captured: [],
      })
    }
  }

  return moves
}

export function allCaptureMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = []
  for (const from of piecesOf(board, player)) {
    moves.push(...stepsFrom(board, from, player, new Set(), null, true))
  }
  return moves
}

export function allPaikaMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = []
  for (const from of piecesOf(board, player)) {
    moves.push(
      ...stepsFrom(board, from, player, new Set(), null, false).filter((move) => move.kind === 'paika'),
    )
  }
  return moves
}

export function legalMovesAtTurnStart(board: Board, player: Player): Move[] {
  const captures = allCaptureMoves(board, player)
  if (captures.length > 0) {
    return captures
  }
  return allPaikaMoves(board, player)
}

export function legalMovesInChain(board: Board, chain: ChainState, player: Player): Move[] {
  const visited = new Set(chain.visited.map(keyOf))
  return stepsFrom(board, chain.current, player, visited, chain.lastDir, true)
}

export function legalMoves(board: Board, player: Player, chain: ChainState | null): Move[] {
  if (chain) {
    return legalMovesInChain(board, chain, player)
  }
  return legalMovesAtTurnStart(board, player)
}

export function isCaptureMove(move: Move): boolean {
  return move.kind !== 'paika'
}
