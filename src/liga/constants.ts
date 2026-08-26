import type { Difficulty } from '../shared/types'
import type { LigaDir, LigaItemId, LigaRoomId, LigaTrainerId, LigaType } from './types'

export const TILE = 16
export const ROOM_COLS = 13
export const ROOM_ROWS = 11
export const WALK_MS = 260
export const PARTY_SIZE = 6
export const MOVE_SLOTS = 4
export const MAX_STAGE = 6
export const MIN_STAGE = -6

export const PHYSICAL_TYPES: ReadonlySet<LigaType> = new Set([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
])

export const ROOM_ORDER: LigaRoomId[] = ['sidney', 'phoebe', 'glacia', 'drake', 'steven', 'hall']

export const TRAINER_ORDER: LigaTrainerId[] = ['sidney', 'phoebe', 'glacia', 'drake', 'steven']

export type LigaPreset = {
  label: string
  playerLevel: number
  playerIv: number
  playerEv: number
  foeIv: number
  foeLevelDelta: number
  maxLegend: number
  bag: Partial<Record<LigaItemId, number>>
}

export const PRESETS: Record<Difficulty, LigaPreset> = {
  easy: {
    label: 'Fácil',
    playerLevel: 65,
    playerIv: 31,
    playerEv: 252,
    foeIv: 0,
    foeLevelDelta: -2,
    maxLegend: 2,
    bag: {
      'full-restore': 10,
      'max-revive': 6,
      'full-heal': 4,
      'x-attack': 4,
      'x-sp-atk': 4,
      'x-speed': 3,
    },
  },
  medium: {
    label: 'Media',
    playerLevel: 58,
    playerIv: 24,
    playerEv: 168,
    foeIv: 15,
    foeLevelDelta: 0,
    maxLegend: 2,
    bag: {
      'full-restore': 5,
      revive: 3,
      'hyper-potion': 4,
      'full-heal': 2,
      'x-attack': 2,
      'x-sp-atk': 2,
    },
  },
  hard: {
    label: 'Difícil',
    playerLevel: 52,
    playerIv: 16,
    playerEv: 80,
    foeIv: 24,
    foeLevelDelta: 2,
    maxLegend: 1,
    bag: {
      'hyper-potion': 4,
      'super-potion': 2,
      revive: 1,
      'full-heal': 1,
      'x-attack': 1,
    },
  },
  perfect: {
    label: 'Perfecta',
    playerLevel: 50,
    playerIv: 8,
    playerEv: 0,
    foeIv: 31,
    foeLevelDelta: 4,
    maxLegend: 1,
    bag: {
      'super-potion': 3,
      potion: 4,
    },
  },
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'perfect']

export const EMERALD_LEVELS: Record<LigaTrainerId, number[]> = {
  sidney: [46, 46, 48, 48, 48],
  phoebe: [48, 49, 50, 50, 51],
  glacia: [50, 50, 52, 52, 53],
  drake: [52, 54, 53, 54, 55],
  steven: [57, 55, 56, 56, 56, 58],
}

export const TRAINER_TYPES: Record<LigaTrainerId, LigaType[]> = {
  sidney: ['dark'],
  phoebe: ['ghost'],
  glacia: ['ice'],
  drake: ['dragon'],
  steven: ['steel', 'rock', 'psychic'],
}

export const ITEM_HEAL: Partial<Record<LigaItemId, number>> = {
  potion: 20,
  'super-potion': 50,
  'hyper-potion': 200,
  'full-restore': 9999,
}

export const ITEM_REVIVE: Partial<Record<LigaItemId, number>> = {
  revive: 0.5,
  'max-revive': 1,
}

export const DIRS: Record<LigaDir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const KEY_DIR: Record<string, LigaDir | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right',
}
