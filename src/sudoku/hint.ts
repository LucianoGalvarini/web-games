import { BOX, DIGITS, SIZE } from './constants'
import { candidateDigits, candidatesAt } from './solve'
import type { SudokuDigit, SudokuHint } from './types'

function houses(): Array<Array<{ row: number; col: number }>> {
  const list: Array<Array<{ row: number; col: number }>> = []
  for (let i = 0; i < SIZE; i += 1) {
    const row: Array<{ row: number; col: number }> = []
    const col: Array<{ row: number; col: number }> = []
    for (let j = 0; j < SIZE; j += 1) {
      row.push({ row: i, col: j })
      col.push({ row: j, col: i })
    }
    list.push(row, col)
  }
  for (let box = 0; box < SIZE; box += 1) {
    const cells: Array<{ row: number; col: number }> = []
    const br = Math.floor(box / BOX) * BOX
    const bc = (box % BOX) * BOX
    for (let r = 0; r < BOX; r += 1) {
      for (let c = 0; c < BOX; c += 1) {
        cells.push({ row: br + r, col: bc + c })
      }
    }
    list.push(cells)
  }
  return list
}

export function findHint(grid: number[][]): SudokuHint | null {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (grid[row][col] !== 0) {
        continue
      }
      const digits = candidateDigits(grid, row, col)
      if (digits.length === 1) {
        return { row, col, digit: digits[0] as SudokuDigit, kind: 'naked' }
      }
    }
  }

  for (const house of houses()) {
    for (const digit of DIGITS) {
      const spots: Array<{ row: number; col: number }> = []
      for (const cell of house) {
        if (grid[cell.row][cell.col] !== 0) {
          continue
        }
        if (candidatesAt(grid, cell.row, cell.col) & (1 << digit)) {
          spots.push(cell)
        }
      }
      if (spots.length === 1) {
        return { row: spots[0].row, col: spots[0].col, digit, kind: 'hidden' }
      }
    }
  }

  return null
}

export function autoNotes(grid: number[][]): number[][] {
  const notes = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (grid[row][col] === 0) {
        notes[row][col] = candidatesAt(grid, row, col)
      }
    }
  }
  return notes
}
