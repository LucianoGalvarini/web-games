import type { Point } from '../shared/point'
import type { Player } from '../shared/types'

export type PieceKind = 'man' | 'king'

export type Square = { player: Player; kind: PieceKind } | null

export type DamasBoard = Record<string, Square>

export type DamasPosition = {
  board: DamasBoard
  current: Player
}

export type DamasMove =
  | { kind: 'slide'; from: Point; to: Point }
  | { kind: 'jump'; from: Point; to: Point; captured: Point }

export type DamasTurn = DamasMove[]
