export type SudokuDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type SudokuStatus = 'loading' | 'ready' | 'playing' | 'won'

export type SudokuPoint = {
  readonly row: number
  readonly col: number
}

export type SudokuPreset = {
  id: SudokuDifficulty
  label: string
  clues: number
}

export type SudokuPuzzle = {
  givens: number[][]
  solution: number[][]
}

export type SudokuHint = {
  row: number
  col: number
  digit: SudokuDigit
  kind: 'naked' | 'hidden'
}

export type SudokuSnapshot = {
  values: number[][]
  notes: number[][]
}
