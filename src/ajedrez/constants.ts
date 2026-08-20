import type { PieceKind } from './types'

export const BOARD_SIZE = 8
export const SQUARE_COUNT = 64

export const WHITE_KING = 60
export const BLACK_KING = 4
export const WHITE_ROOK_K = 63
export const WHITE_ROOK_Q = 56
export const BLACK_ROOK_K = 7
export const BLACK_ROOK_Q = 0

export const PIECE_VALUE: Record<PieceKind, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
}

export const KNIGHT_DELTA = [-17, -15, -10, -6, 6, 10, 15, 17]
export const KING_DELTA = [-9, -8, -7, -1, 1, 7, 8, 9]
export const BISHOP_DIR = [-9, -7, 7, 9]
export const ROOK_DIR = [-8, -1, 1, 8]

export function fileOf(index: number): number {
  return index & 7
}

export function rankOf(index: number): number {
  return index >> 3
}

export function squareIndex(file: number, rank: number): number {
  return rank * 8 + file
}

export function inBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8
}

export function pawnDir(player: 'white' | 'black'): number {
  return player === 'white' ? -8 : 8
}

export function startRank(player: 'white' | 'black'): number {
  return player === 'white' ? 6 : 1
}

export function promoRank(player: 'white' | 'black'): number {
  return player === 'white' ? 0 : 7
}
