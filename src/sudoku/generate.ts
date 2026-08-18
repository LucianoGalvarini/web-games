import { PRESETS } from './constants'
import { cloneGrid, countFilled } from './board'
import { countSolutions, createSolvedGrid } from './solve'
import type { SudokuDifficulty, SudokuPuzzle } from './types'

function shuffledCells(): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      cells.push({ row, col })
    }
  }
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = cells[i]
    cells[i] = cells[j]
    cells[j] = current
  }
  return cells
}

export function generatePuzzle(difficulty: SudokuDifficulty): SudokuPuzzle {
  const solution = createSolvedGrid()
  const givens = cloneGrid(solution)
  const target = PRESETS[difficulty].clues
  const cells = shuffledCells()

  for (const cell of cells) {
    if (countFilled(givens) <= target) {
      break
    }
    const pair = { row: 8 - cell.row, col: 8 - cell.col }
    const backupA = givens[cell.row][cell.col]
    const backupB = givens[pair.row][pair.col]
    if (backupA === 0) {
      continue
    }
    givens[cell.row][cell.col] = 0
    const symmetric = !(cell.row === pair.row && cell.col === pair.col)
    if (symmetric) {
      givens[pair.row][pair.col] = 0
    }
    if (countSolutions(givens, 2) !== 1) {
      givens[cell.row][cell.col] = backupA
      if (symmetric) {
        givens[pair.row][pair.col] = backupB
      }
    }
  }

  return { givens, solution }
}
