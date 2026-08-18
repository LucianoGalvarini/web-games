import { BOX, SIZE } from './constants'
import type { SudokuPoint } from './types'

export function emptyGrid(): number[][] {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
}

export function emptyNotes(): number[][] {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
}

export function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => row.slice())
}

export function boxOf(row: number, col: number): number {
  return Math.floor(row / BOX) * BOX + Math.floor(col / BOX)
}

export function keyOfCell(row: number, col: number): string {
  return `${row},${col}`
}

export function parseKey(key: string): SudokuPoint {
  const [row, col] = key.split(',').map(Number)
  return { row, col }
}

export function sameHouse(a: SudokuPoint, b: SudokuPoint): boolean {
  return a.row === b.row || a.col === b.col || boxOf(a.row, a.col) === boxOf(b.row, b.col)
}

export function countFilled(grid: number[][]): number {
  let total = 0
  for (const row of grid) {
    for (const value of row) {
      if (value !== 0) {
        total += 1
      }
    }
  }
  return total
}

export function isComplete(grid: number[][]): boolean {
  return countFilled(grid) === SIZE * SIZE
}

export function remainingOf(grid: number[][], digit: number): number {
  let used = 0
  for (const row of grid) {
    for (const value of row) {
      if (value === digit) {
        used += 1
      }
    }
  }
  return SIZE - used
}

export function conflictKeys(grid: number[][]): Set<string> {
  const keys = new Set<string>()
  const houses: SudokuPoint[][] = []

  for (let i = 0; i < SIZE; i += 1) {
    const row: SudokuPoint[] = []
    const col: SudokuPoint[] = []
    for (let j = 0; j < SIZE; j += 1) {
      row.push({ row: i, col: j })
      col.push({ row: j, col: i })
    }
    houses.push(row, col)
  }

  for (let box = 0; box < SIZE; box += 1) {
    const cells: SudokuPoint[] = []
    const br = Math.floor(box / BOX) * BOX
    const bc = (box % BOX) * BOX
    for (let r = 0; r < BOX; r += 1) {
      for (let c = 0; c < BOX; c += 1) {
        cells.push({ row: br + r, col: bc + c })
      }
    }
    houses.push(cells)
  }

  for (const house of houses) {
    const seen = new Map<number, SudokuPoint[]>()
    for (const cell of house) {
      const value = grid[cell.row][cell.col]
      if (value === 0) {
        continue
      }
      const list = seen.get(value) ?? []
      list.push(cell)
      seen.set(value, list)
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        for (const cell of list) {
          keys.add(keyOfCell(cell.row, cell.col))
        }
      }
    }
  }

  return keys
}
