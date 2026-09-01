export type Color = 'red' | 'yellow' | 'green' | 'blue'
export type CardColor = Color | 'wild'
export type Value =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4'

export type Card = {
  id: string
  color: CardColor
  value: Value
}

export type Player = {
  id: string
  token: string
  name: string
  hand: Card[]
  isHost: boolean
  connected: boolean
  saidUno: boolean
  lastSeen: number
}

export type LogEntry = {
  id: string
  text: string
  ts: number
}

export type GameStatus = 'lobby' | 'playing' | 'finished'

export type RoomState = {
  id: string
  createdAt: number
  status: GameStatus
  players: Player[]
  currentPlayerIndex: number
  direction: 1 | -1
  drawPile: Card[]
  discardPile: Card[]
  currentColor: Color
  winnerId: string | null
  log: LogEntry[]
  drawStreak: { playerId: string | null; pendingDraw: number }
}

export type PublicPlayer = {
  id: string
  name: string
  handCount: number
  isHost: boolean
  connected: boolean
  saidUno: boolean
}

export type PublicRoomState = {
  id: string
  status: GameStatus
  players: PublicPlayer[]
  currentPlayerIndex: number
  direction: 1 | -1
  drawPileCount: number
  topCard: Card | null
  currentColor: Color | null
  winnerId: string | null
  log: LogEntry[]
  you: {
    id: string
    hand: Card[]
  } | null
}

export type UnoSink = {
  send: (data: string) => void
  readyState: number
}

export const SINK_OPEN = 1
