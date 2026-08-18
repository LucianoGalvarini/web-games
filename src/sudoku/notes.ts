import { SIZE } from './constants'
import { boxOf } from './board'

export function hasNote(mask: number, digit: number): boolean {
  return (mask & (1 << digit)) !== 0
}

export function toggleNote(mask: number, digit: number): number {
  return mask ^ (1 << digit)
}

export function clearDigitInHouse(notes: number[][], row: number, col: number, digit: number): number[][] {
  const next = notes.map((line) => line.slice())
  const bit = 1 << digit
  const box = boxOf(row, col)
  for (let i = 0; i < SIZE; i += 1) {
    next[row][i] &= ~bit
    next[i][col] &= ~bit
  }
  const br = Math.floor(box / 3) * 3
  const bc = (box % 3) * 3
  for (let r = br; r < br + 3; r += 1) {
    for (let c = bc; c < bc + 3; c += 1) {
      next[r][c] &= ~bit
    }
  }
  next[row][col] = 0
  return next
}
