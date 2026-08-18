import { BOX, DIGITS, SIZE } from './constants'
import { boxOf, cloneGrid } from './board'

function shuffle<T>(items: readonly T[]): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }
  return next
}

type Masks = {
  rows: number[]
  cols: number[]
  boxes: number[]
}

function masksOf(grid: number[][]): Masks {
  const rows = Array<number>(SIZE).fill(0)
  const cols = Array<number>(SIZE).fill(0)
  const boxes = Array<number>(SIZE).fill(0)
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = grid[row][col]
      if (value === 0) {
        continue
      }
      const bit = 1 << value
      rows[row] |= bit
      cols[col] |= bit
      boxes[boxOf(row, col)] |= bit
    }
  }
  return { rows, cols, boxes }
}

function place(grid: number[][], masks: Masks, row: number, col: number, digit: number): void {
  const bit = 1 << digit
  grid[row][col] = digit
  masks.rows[row] |= bit
  masks.cols[col] |= bit
  masks.boxes[boxOf(row, col)] |= bit
}

function unplace(grid: number[][], masks: Masks, row: number, col: number, digit: number): void {
  const bit = 1 << digit
  grid[row][col] = 0
  masks.rows[row] &= ~bit
  masks.cols[col] &= ~bit
  masks.boxes[boxOf(row, col)] &= ~bit
}

function optionsAt(masks: Masks, row: number, col: number): number[] {
  const used = masks.rows[row] | masks.cols[col] | masks.boxes[boxOf(row, col)]
  return DIGITS.filter((digit) => (used & (1 << digit)) === 0)
}

function firstEmpty(grid: number[][], masks: Masks): { row: number; col: number; options: number[] } | null {
  let best: { row: number; col: number; options: number[] } | null = null
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (grid[row][col] !== 0) {
        continue
      }
      const options = optionsAt(masks, row, col)
      if (options.length === 0) {
        return { row, col, options }
      }
      if (!best || options.length < best.options.length) {
        best = { row, col, options }
      }
    }
  }
  return best
}

function search(grid: number[][], masks: Masks, limit: number, found: { count: number }, randomize: boolean): boolean {
  if (found.count >= limit) {
    return true
  }
  const empty = firstEmpty(grid, masks)
  if (!empty) {
    found.count += 1
    return found.count >= limit
  }
  if (empty.options.length === 0) {
    return false
  }

  const options = randomize ? shuffle(empty.options) : empty.options
  for (const digit of options) {
    place(grid, masks, empty.row, empty.col, digit)
    if (search(grid, masks, limit, found, randomize)) {
      return true
    }
    unplace(grid, masks, empty.row, empty.col, digit)
  }
  return false
}

export function candidatesAt(grid: number[][], row: number, col: number): number {
  if (grid[row][col] !== 0) {
    return 0
  }
  const masks = masksOf(grid)
  const used = masks.rows[row] | masks.cols[col] | masks.boxes[boxOf(row, col)]
  return ((1 << 10) - 2) & ~used
}

export function candidateDigits(grid: number[][], row: number, col: number): number[] {
  const mask = candidatesAt(grid, row, col)
  return DIGITS.filter((digit) => (mask & (1 << digit)) !== 0)
}

export function fillGrid(grid: number[][]): boolean {
  return search(grid, masksOf(grid), 1, { count: 0 }, true)
}

export function countSolutions(grid: number[][], limit = 2): number {
  const copy = cloneGrid(grid)
  const found = { count: 0 }
  search(copy, masksOf(copy), limit, found, false)
  return found.count
}

export function fillDiagonalBoxes(grid: number[][]): void {
  for (let box = 0; box < SIZE; box += BOX + 1) {
    const nums = shuffle(DIGITS)
    let index = 0
    const br = Math.floor(box / BOX) * BOX
    const bc = (box % BOX) * BOX
    for (let r = 0; r < BOX; r += 1) {
      for (let c = 0; c < BOX; c += 1) {
        grid[br + r][bc + c] = nums[index]
        index += 1
      }
    }
  }
}

export function createSolvedGrid(): number[][] {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const grid = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
    fillDiagonalBoxes(grid)
    if (fillGrid(grid)) {
      return grid
    }
  }
  const fallback = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
  fillDiagonalBoxes(fallback)
  fillGrid(fallback)
  return fallback
}
