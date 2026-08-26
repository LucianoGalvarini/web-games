import type { Point } from '../shared/point'
import type { Difficulty } from '../shared/types'

export type LigaType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'

export type LigaEffect = 'none' | 'heal' | 'atk2' | 'spe2' | 'calm' | 'paralyze' | 'burn' | 'poison' | 'sleep'

export type LigaStatus = 'paralyze' | 'burn' | 'poison' | 'sleep'

export type LigaItemId =
  | 'potion'
  | 'super-potion'
  | 'hyper-potion'
  | 'full-restore'
  | 'revive'
  | 'max-revive'
  | 'full-heal'
  | 'x-attack'
  | 'x-sp-atk'
  | 'x-speed'

export type LigaDir = 'up' | 'down' | 'left' | 'right'

export type LigaRoomId = 'sidney' | 'phoebe' | 'glacia' | 'drake' | 'steven' | 'hall'

export type LigaPhase = 'walk' | 'dialog' | 'battle' | 'won' | 'lost'

export type LigaBattleMenu = 'root' | 'fight' | 'bag' | 'party'

export type LigaMove = {
  id: number
  name: string
  label: string
  type: LigaType
  power: number
  accuracy: number
  pp: number
  priority: number
  effect: LigaEffect
}

export type LigaSpecies = {
  id: number
  name: string
  label: string
  types: LigaType[]
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
  moves: number[]
  legendary: boolean
}

export type LigaSlot = {
  speciesId: number
  level: number
  hp: number
  maxHp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
  moves: { moveId: number; pp: number }[]
  status: LigaStatus | null
  sleep: number
}

export type LigaStages = {
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export type LigaTrainerId = 'sidney' | 'phoebe' | 'glacia' | 'drake' | 'steven'

export type LigaTrainer = {
  id: LigaTrainerId
  party: LigaSlot[]
  beaten: boolean
}

export type LigaFxKind = 'move' | 'faint' | 'send' | 'recall'

export type LigaFxStep = {
  kind: LigaFxKind
  side: 'player' | 'foe'
  moveId: number
  speciesId: number
  playerHp?: number
  foeHp?: number
}

export type LigaBattle = {
  trainerId: LigaTrainerId
  playerParty: LigaSlot[]
  foeParty: LigaSlot[]
  playerActive: number
  foeActive: number
  menu: LigaBattleMenu
  mustSwitch: boolean
  playerStages: LigaStages
  foeStages: LigaStages
  log: string[]
  lastFx: LigaFxStep[]
  outcome: 'ongoing' | 'win' | 'lose'
}

export type LigaState = {
  seed: number
  difficulty: Difficulty
  phase: LigaPhase
  room: LigaRoomId
  player: Point
  facing: LigaDir
  party: LigaSlot[]
  bag: Partial<Record<LigaItemId, number>>
  trainers: Record<LigaTrainerId, LigaTrainer>
  dialog: string | null
  battle: LigaBattle | null
  fxQueue: LigaFxStep[]
}

export type LigaAction =
  | { kind: 'step'; dir: LigaDir }
  | { kind: 'interact' }
  | { kind: 'open'; menu: LigaBattleMenu }
  | { kind: 'move'; index: number }
  | { kind: 'item'; itemId: LigaItemId; target: number }
  | { kind: 'switch'; index: number }
  | { kind: 'resolve' }
