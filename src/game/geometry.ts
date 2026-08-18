import { COLS, ROWS } from './constants'
import type { Dir, Point } from './types'

export { keyOf, samePoint } from '../shared/point'
export { opponent, playerLabel } from '../shared/player'

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS
}

export function isStrong(x: number, y: number): boolean {
  return (x + y) % 2 === 0
}

export function isDiagonal(dir: Dir): boolean {
  return dir.dx !== 0 && dir.dy !== 0
}

export function canStepFrom(from: Point, dir: Dir): boolean {
  if (isDiagonal(dir) && !isStrong(from.x, from.y)) {
    return false
  }
  return inBounds(from.x + dir.dx, from.y + dir.dy)
}

export function directionBetween(from: Point, to: Point): Dir {
  return { dx: to.x - from.x, dy: to.y - from.y }
}

export function sameDir(a: Dir, b: Dir): boolean {
  return a.dx === b.dx && a.dy === b.dy
}
