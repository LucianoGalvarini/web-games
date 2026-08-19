export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type Rot = 0 | 1 | 2 | 3

export type Cell = {
  x: number
  y: number
}

export type ActivePiece = {
  id: PieceId
  x: number
  y: number
  rot: Rot
}

export type TetrisStatus = 'playing' | 'lost'

export type TetrisAction =
  | { kind: 'left' }
  | { kind: 'right' }
  | { kind: 'soft' }
  | { kind: 'hard' }
  | { kind: 'cw' }
  | { kind: 'ccw' }
  | { kind: 'hold' }
  | { kind: 'tick' }

export type TetrisState = {
  board: (PieceId | null)[][]
  active: ActivePiece | null
  hold: PieceId | null
  canHold: boolean
  queue: PieceId[]
  bag: PieceId[]
  score: number
  lines: number
  level: number
  startLevel: number
  status: TetrisStatus
  lastClear: 0 | 1 | 2 | 3 | 4
}

export type TetrisDifficulty = 'easy' | 'medium' | 'hard'
