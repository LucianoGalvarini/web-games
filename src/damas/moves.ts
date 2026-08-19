import { keyOf } from '../shared/point'
import type { Point } from '../shared/point'
import type { Player } from '../shared/types'
import { DIAGONAL_DIRS, forwardDirs, inBounds, pieceAt, piecesOf } from './geometry'
import type { DamasBoard, DamasMove, DamasPosition, PieceKind } from './types'
import type { DamasVariant } from './variants'

export type DeadSet = ReadonlySet<string>

const NO_DEAD: DeadSet = new Set()

function isBlocked(board: DamasBoard, dead: DeadSet, point: Point): boolean {
  return pieceAt(board, point) !== null || dead.has(keyOf(point))
}

function manQuietSteps(board: DamasBoard, from: Point, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of forwardDirs(player)) {
    const to = { x: from.x + dir.dx, y: from.y + dir.dy }
    if (inBounds(to.x, to.y) && pieceAt(board, to) === null) {
      moves.push({ kind: 'slide', from, to })
    }
  }
  return moves
}

function manCaptureSteps(board: DamasBoard, dead: DeadSet, from: Point, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of forwardDirs(player)) {
    const mid = { x: from.x + dir.dx, y: from.y + dir.dy }
    const to = { x: from.x + dir.dx * 2, y: from.y + dir.dy * 2 }
    if (!inBounds(to.x, to.y) || dead.has(keyOf(mid))) {
      continue
    }
    const occupant = pieceAt(board, mid)
    if (!occupant || occupant.player === player || isBlocked(board, dead, to)) {
      continue
    }
    moves.push({ kind: 'jump', from, to, captured: mid })
  }
  return moves
}

function kingQuietStepsShort(board: DamasBoard, from: Point): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of DIAGONAL_DIRS) {
    const to = { x: from.x + dir.dx, y: from.y + dir.dy }
    if (inBounds(to.x, to.y) && pieceAt(board, to) === null) {
      moves.push({ kind: 'slide', from, to })
    }
  }
  return moves
}

function kingCaptureStepsShort(board: DamasBoard, dead: DeadSet, from: Point, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of DIAGONAL_DIRS) {
    const mid = { x: from.x + dir.dx, y: from.y + dir.dy }
    const to = { x: from.x + dir.dx * 2, y: from.y + dir.dy * 2 }
    if (!inBounds(to.x, to.y) || dead.has(keyOf(mid))) {
      continue
    }
    const occupant = pieceAt(board, mid)
    if (!occupant || occupant.player === player || isBlocked(board, dead, to)) {
      continue
    }
    moves.push({ kind: 'jump', from, to, captured: mid })
  }
  return moves
}

function kingQuietStepsFlying(board: DamasBoard, from: Point): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of DIAGONAL_DIRS) {
    let x = from.x + dir.dx
    let y = from.y + dir.dy
    while (inBounds(x, y) && pieceAt(board, { x, y }) === null) {
      moves.push({ kind: 'slide', from, to: { x, y } })
      x += dir.dx
      y += dir.dy
    }
  }
  return moves
}

function kingCaptureStepsFlying(board: DamasBoard, dead: DeadSet, from: Point, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const dir of DIAGONAL_DIRS) {
    let x = from.x + dir.dx
    let y = from.y + dir.dy
    while (inBounds(x, y) && !isBlocked(board, dead, { x, y })) {
      x += dir.dx
      y += dir.dy
    }
    if (!inBounds(x, y) || dead.has(keyOf({ x, y }))) {
      continue
    }
    const hit = { x, y }
    const occupant = pieceAt(board, hit)
    if (!occupant || occupant.player === player) {
      continue
    }
    let lx = x + dir.dx
    let ly = y + dir.dy
    while (inBounds(lx, ly) && !isBlocked(board, dead, { x: lx, y: ly })) {
      moves.push({ kind: 'jump', from, to: { x: lx, y: ly }, captured: hit })
      lx += dir.dx
      ly += dir.dy
    }
  }
  return moves
}

export function pieceQuietSteps(
  variant: DamasVariant,
  board: DamasBoard,
  from: Point,
  player: Player,
  kind: PieceKind,
): DamasMove[] {
  if (kind === 'man') {
    return manQuietSteps(board, from, player)
  }
  return variant.flyingKing ? kingQuietStepsFlying(board, from) : kingQuietStepsShort(board, from)
}

export function pieceCaptureSteps(
  variant: DamasVariant,
  board: DamasBoard,
  dead: DeadSet,
  from: Point,
  player: Player,
  kind: PieceKind,
): DamasMove[] {
  if (kind === 'man') {
    return manCaptureSteps(board, dead, from, player)
  }
  return variant.flyingKing
    ? kingCaptureStepsFlying(board, dead, from, player)
    : kingCaptureStepsShort(board, dead, from, player)
}

function allCaptureSteps(variant: DamasVariant, board: DamasBoard, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const point of piecesOf(board, player)) {
    const square = pieceAt(board, point)
    if (!square) {
      continue
    }
    moves.push(...pieceCaptureSteps(variant, board, NO_DEAD, point, player, square.kind))
  }
  return moves
}

function allQuietSteps(variant: DamasVariant, board: DamasBoard, player: Player): DamasMove[] {
  const moves: DamasMove[] = []
  for (const point of piecesOf(board, player)) {
    const square = pieceAt(board, point)
    if (!square) {
      continue
    }
    moves.push(...pieceQuietSteps(variant, board, point, player, square.kind))
  }
  return moves
}

export function legalStepsAtTurnStart(variant: DamasVariant, position: DamasPosition): DamasMove[] {
  const captures = allCaptureSteps(variant, position.board, position.current)
  return captures.length > 0 ? captures : allQuietSteps(variant, position.board, position.current)
}

export function hasLegalTurn(variant: DamasVariant, position: DamasPosition): boolean {
  return legalStepsAtTurnStart(variant, position).length > 0
}
