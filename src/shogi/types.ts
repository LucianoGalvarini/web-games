import type { Player } from '../shared/types'

export type PieceKind = 'k' | 'r' | 'b' | 'g' | 's' | 'n' | 'l' | 'p'

export type DroppableKind = Exclude<PieceKind, 'k'>

export type Piece = {
  player: Player
  kind: PieceKind
  promoted: boolean
}

export type Hand = Record<DroppableKind, number>

export type ShogiBoard = (Piece | null)[]

export type ShogiPosition = {
  board: ShogiBoard
  hands: Record<Player, Hand>
  current: Player
}

export type ShogiMove =
  | { kind: 'move'; from: number; to: number; capture: boolean; promote?: boolean }
  | { kind: 'drop'; to: number; piece: DroppableKind }

export type ShogiOutcome = Player | 'draw' | null
