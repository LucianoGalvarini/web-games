import type { Player } from '../shared/types'

export const POINT_COUNT = 24
export const CHECKERS_PER_PLAYER = 15

export function step(player: Player): number {
  return player === 'white' ? -1 : 1
}

export function homeRange(player: Player): [number, number] {
  return player === 'white' ? [0, 5] : [18, 23]
}

export function isHomePoint(index: number, player: Player): boolean {
  const [lo, hi] = homeRange(player)
  return index >= lo && index <= hi
}

export function distanceToOff(index: number, player: Player): number {
  return player === 'white' ? index + 1 : POINT_COUNT - index
}

export function entryIndex(player: Player, die: number): number {
  return player === 'white' ? POINT_COUNT - die : die - 1
}

export function pointNumber(index: number): number {
  return index + 1
}
