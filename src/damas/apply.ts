import { opponent } from '../shared/player'
import { keyOf } from '../shared/point'
import { isPromotionRow } from './geometry'
import { hasLegalTurn } from './moves'
import type { Winner } from '../shared/types'
import type { DamasMove, DamasPosition, DamasTurn } from './types'
import { cloneBoard } from './board'
import type { DamasVariant } from './variants'

export function applyMove(position: DamasPosition, move: DamasMove): DamasPosition {
  const board = cloneBoard(position.board)
  const piece = board[keyOf(move.from)]
  if (!piece) {
    return { board, current: position.current }
  }

  board[keyOf(move.from)] = null
  if (move.kind === 'jump') {
    board[keyOf(move.captured)] = null
  }

  const promoted = piece.kind === 'man' && isPromotionRow(piece.player, move.to.y)
  board[keyOf(move.to)] = promoted ? { player: piece.player, kind: 'king' } : piece

  return { board, current: position.current }
}

export function applyTurn(position: DamasPosition, turn: DamasTurn): DamasPosition {
  const applied = turn.reduce((current, move) => applyMove(current, move), position)
  return { board: applied.board, current: opponent(position.current) }
}

export function winnerOf(variant: DamasVariant, position: DamasPosition): Winner {
  if (!hasLegalTurn(variant, position)) {
    return opponent(position.current)
  }
  return null
}
