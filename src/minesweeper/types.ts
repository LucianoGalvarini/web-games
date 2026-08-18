export type MinesweeperDifficulty = 'beginner' | 'intermediate' | 'expert'

export type MinesweeperStatus = 'ready' | 'playing' | 'won' | 'lost'

export type CellMark = 'none' | 'flag' | 'question'

export type MsPoint = {
  readonly x: number
  readonly y: number
}

export type MsCell = {
  mine: boolean
  revealed: boolean
  mark: CellMark
  adjacent: number
}

export type MsBoard = MsCell[][]

export type MsPreset = {
  id: MinesweeperDifficulty
  label: string
  cols: number
  rows: number
  mines: number
}

export type Hint = {
  point: MsPoint
  action: 'reveal' | 'flag'
}
