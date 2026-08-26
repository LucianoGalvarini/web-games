import type { LigaDir } from './types'

export function moveCursor(index: number, count: number, dir: LigaDir, cols: number): number {
  if (count <= 0) {
    return 0
  }
  const colsSafe = Math.max(1, cols)
  const col = index % colsSafe
  const row = Math.floor(index / colsSafe)
  const rows = Math.ceil(count / colsSafe)
  let nextCol = col
  let nextRow = row
  if (dir === 'left') {
    nextCol = col === 0 ? colsSafe - 1 : col - 1
  } else if (dir === 'right') {
    nextCol = col === colsSafe - 1 ? 0 : col + 1
  } else if (dir === 'up') {
    nextRow = row === 0 ? rows - 1 : row - 1
  } else {
    nextRow = row === rows - 1 ? 0 : row + 1
  }
  const next = nextRow * colsSafe + nextCol
  if (next >= 0 && next < count) {
    return next
  }
  return index
}

export function isAKey(key: string): boolean {
  return key === 'z' || key === 'Z'
}

export function isStartKey(key: string): boolean {
  return key === 'Enter'
}

export function isBKey(key: string): boolean {
  return key === 'x' || key === 'X' || key === 'Backspace' || key === 'Escape'
}

export function isTurboKey(key: string): boolean {
  return key === ' ' || key === 'Spacebar'
}
