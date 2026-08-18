import type { Point } from '../shared/point'
import type { Player } from '../shared/types'

export type MorrisBoard = Record<string, Player | null>

export type Hands = {
  white: number
  black: number
}

export type MorrisPosition = {
  board: MorrisBoard
  current: Player
  inHand: Hands
  pendingRemoval: boolean
}

export type MorrisMove =
  | { kind: 'place'; to: Point }
  | { kind: 'slide'; from: Point; to: Point }
  | { kind: 'remove'; at: Point }
