import type { TetrisDifficulty } from './types'

export const COLS = 10
export const ROWS = 20
export const NEXT_COUNT = 5
export const SPAWN_X = 3
export const SPAWN_Y = -1

export const PRESETS: Record<TetrisDifficulty, { label: string; startLevel: number }> = {
  easy: { label: 'Fácil', startLevel: 1 },
  medium: { label: 'Media', startLevel: 5 },
  hard: { label: 'Difícil', startLevel: 10 },
}

export const DIFFICULTIES: TetrisDifficulty[] = ['easy', 'medium', 'hard']

export const PIECE_IDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const

export const LINE_SCORES = [0, 100, 300, 500, 800] as const

export function gravityMs(level: number): number {
  const table = [800, 720, 630, 550, 470, 380, 300, 220, 140, 100, 80, 70, 60, 50, 40, 30]
  const index = Math.max(0, Math.min(level - 1, table.length - 1))
  return table[index] ?? 30
}

export function levelFor(startLevel: number, lines: number): number {
  return Math.min(15, startLevel + Math.floor(lines / 10))
}
