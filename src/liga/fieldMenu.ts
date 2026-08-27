import type { Difficulty } from '../shared/types'

export type LigaFieldScreen = 'root' | 'party' | 'bag' | 'option' | 'actions' | 'moves'

export const FIELD_ROOT_COUNT = 4
export const FIELD_PARTY_COLS = 2
export const FIELD_ACTION_COUNT = 2

export function rootCursorOf(screen: LigaFieldScreen): number {
  if (screen === 'bag') {
    return 1
  }
  if (screen === 'option') {
    return 2
  }
  return 0
}

export function fieldOptionCount(difficulties: Difficulty[]): number {
  return difficulties.length + 2
}
