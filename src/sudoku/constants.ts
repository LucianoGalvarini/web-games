import type { SudokuDifficulty, SudokuDigit, SudokuPreset } from './types'

export const SIZE = 9
export const BOX = 3
export const DIGITS: readonly SudokuDigit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const PRESETS: Record<SudokuDifficulty, SudokuPreset> = {
  easy: { id: 'easy', label: 'Fácil', clues: 40 },
  medium: { id: 'medium', label: 'Media', clues: 32 },
  hard: { id: 'hard', label: 'Difícil', clues: 27 },
  expert: { id: 'expert', label: 'Experta', clues: 23 },
}

export const DIFFICULTIES: SudokuDifficulty[] = ['easy', 'medium', 'hard', 'expert']
