import type { Player } from '../shared/types'

export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos'

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12

export type Card = {
  suit: Suit
  rank: Rank
}

export type EnvidoCall = 'envido' | 'real' | 'falta'

export type TrucoLevel = 1 | 2 | 3 | 4

export type TrickPlay = {
  player: Player
  card: Card
}

export type TrickResult = {
  lead: Player
  plays: TrickPlay[]
  winner: Player | 'parda'
}

export type LogEvent =
  | { kind: 'envido'; player: Player }
  | { kind: 'real'; player: Player }
  | { kind: 'falta'; player: Player }
  | { kind: 'truco'; player: Player; level: 2 | 3 | 4 }
  | { kind: 'quiero'; player: Player }
  | { kind: 'no-quiero'; player: Player }
  | { kind: 'mazo'; player: Player }
  | { kind: 'play'; player: Player; card: Card }
  | { kind: 'trick'; winner: Player | 'parda' }
  | { kind: 'envido-result'; winner: Player; points: number; accepted: boolean; values: { white: number; black: number } | null }
  | { kind: 'hand'; winner: Player; points: number }

export type TrucoAction =
  | { kind: 'play'; card: Card }
  | { kind: 'envido' }
  | { kind: 'real' }
  | { kind: 'falta' }
  | { kind: 'truco' }
  | { kind: 'quiero' }
  | { kind: 'no-quiero' }
  | { kind: 'mazo' }

export type TrucoState = {
  scores: { white: number; black: number }
  mano: Player
  hands: { white: Card[]; black: Card[] }
  dealt: { white: Card[]; black: Card[] }
  toPlay: Player
  tricks: TrickResult[]
  current: { lead: Player; plays: TrickPlay[] }
  trucoLevel: TrucoLevel
  trucoPending: { from: Player; to: Player; level: 2 | 3 | 4 } | null
  lastTrucoBy: Player | null
  envidoChain: EnvidoCall[]
  envidoPending: { from: Player; to: Player } | null
  envidoDone: boolean
  envidoReveal: { white: number; black: number; winner: Player; points: number } | null
  folded: Player | null
  handWinner: Player | null
  handPoints: number
  matchWinner: Player | null
  log: LogEvent[]
}
