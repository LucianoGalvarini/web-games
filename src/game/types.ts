import type { Player } from '../shared/types'
import type { Point } from '../shared/point'

export type { Difficulty, GameMode, Player, Winner } from '../shared/types'
export type { Point } from '../shared/point'

export type Cell = Player | null

export type Board = Cell[][]

export type Dir = {
  readonly dx: number
  readonly dy: number
}

export type CaptureKind = 'approach' | 'withdrawal'

export type MoveKind = CaptureKind | 'paika'

export type Move = {
  from: Point
  to: Point
  kind: MoveKind
  captured: Point[]
}

export type ChainState = {
  origin: Point
  current: Point
  visited: Point[]
  lastDir: Dir
}
