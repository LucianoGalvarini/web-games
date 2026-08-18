import type { Difficulty } from './types'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  perfect: 'Perfecta',
}

export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTY_LABELS[difficulty]
}
