import type { Player } from '../shared/types'
import type { DroppableKind, PieceKind } from './types'

export const BOARD_SIZE = 9
export const SQUARE_COUNT = 81

export type Dir = { dx: number; dy: number }

export const KING_DELTAS: readonly Dir[] = [
  { dx: -1, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: 1 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
]

export const ORTHOGONAL_DIRS: readonly Dir[] = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
]

export const DIAGONAL_DIRS: readonly Dir[] = [
  { dx: -1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 1 },
]

export function forward(player: Player): number {
  return player === 'white' ? -1 : 1
}

export function goldDeltas(fwd: number): Dir[] {
  return [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: fwd }, { dx: 1, dy: fwd }]
}

export function silverDeltas(fwd: number): Dir[] {
  return [{ dx: -1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: 0, dy: fwd }]
}

export function knightDeltas(fwd: number): Dir[] {
  return [{ dx: -1, dy: fwd * 2 }, { dx: 1, dy: fwd * 2 }]
}

export function fileOf(index: number): number {
  return index % BOARD_SIZE
}

export function rankOf(index: number): number {
  return Math.floor(index / BOARD_SIZE)
}

export function squareIndex(file: number, rank: number): number {
  return rank * BOARD_SIZE + file
}

export function inBoard(file: number, rank: number): boolean {
  return file >= 0 && file < BOARD_SIZE && rank >= 0 && rank < BOARD_SIZE
}

export function lastRank(player: Player): number {
  return player === 'white' ? 0 : BOARD_SIZE - 1
}

function secondToLastRank(player: Player): number {
  return player === 'white' ? 1 : BOARD_SIZE - 2
}

export function inPromotionZone(player: Player, rank: number): boolean {
  return player === 'white' ? rank <= 2 : rank >= BOARD_SIZE - 3
}

export function isForcedPromotion(kind: PieceKind, player: Player, rank: number): boolean {
  if (kind === 'p' || kind === 'l') {
    return rank === lastRank(player)
  }
  if (kind === 'n') {
    return rank === lastRank(player) || rank === secondToLastRank(player)
  }
  return false
}

export const DROPPABLE_KINDS: DroppableKind[] = ['r', 'b', 'g', 's', 'n', 'l', 'p']

export const BASE_VALUE: Record<PieceKind, number> = {
  p: 100,
  l: 300,
  n: 350,
  s: 500,
  g: 600,
  b: 800,
  r: 1000,
  k: 100_000,
}

export function pieceValue(kind: PieceKind, promoted: boolean): number {
  if (!promoted || kind === 'k' || kind === 'g') {
    return BASE_VALUE[kind]
  }
  if (kind === 'r' || kind === 'b') {
    return BASE_VALUE[kind] + 200
  }
  return BASE_VALUE.g
}
