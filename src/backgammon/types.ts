import type { Player } from '../shared/types'

export type PointSquare = { player: Player; count: number } | null

export type BackgammonPosition = {
  points: PointSquare[]
  bar: Record<Player, number>
  off: Record<Player, number>
  current: Player
}

export type BackgammonMove =
  | { kind: 'enter'; die: number; to: number }
  | { kind: 'move'; die: number; from: number; to: number }
  | { kind: 'bearoff'; die: number; from: number }

export type BackgammonTurn = BackgammonMove[]
