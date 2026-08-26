import type { Player } from '../shared/types'

export type PieceKind = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'

export type Piece = {
  player: Player
  kind: PieceKind
}

export type Castling = {
  whiteKing: boolean
  whiteQueen: boolean
  blackKing: boolean
  blackQueen: boolean
}

export type ChessMove = {
  from: number
  to: number
  capture: boolean
  castle?: 'king' | 'queen'
  enPassant?: boolean
  promoteTo?: PieceKind
}

export type ChessPosition = {
  squares: (Piece | null)[]
  current: Player
  castling: Castling
  ep: number | null
  halfmove: number
  fullmove: number
}

export type ChessOutcome = Player | 'draw' | null

export type ChessEndReason = 'checkmate' | 'stalemate' | 'repetition' | 'fifty' | 'material'

export type ChessResult = {
  winner: ChessOutcome
  reason: ChessEndReason | null
}
