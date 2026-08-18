import type { MinesweeperDifficulty, MsPreset } from './types'

export const PRESETS: Record<MinesweeperDifficulty, MsPreset> = {
  beginner: { id: 'beginner', label: 'Principiante', cols: 9, rows: 9, mines: 10 },
  intermediate: { id: 'intermediate', label: 'Intermedio', cols: 16, rows: 16, mines: 40 },
  expert: { id: 'expert', label: 'Experto', cols: 30, rows: 16, mines: 99 },
}

export const DIFFICULTIES: MinesweeperDifficulty[] = ['beginner', 'intermediate', 'expert']
