import { opponent } from '../shared/player'
import { keyOf } from '../shared/point'
import {
  canFly,
  countPieces,
  emptyPoints,
  neighborsOf,
  piecesOf,
  removablePieces,
} from './geometry'
import type { MorrisMove, MorrisPosition } from './types'

export function legalMoves(position: MorrisPosition): MorrisMove[] {
  if (position.pendingRemoval) {
    return removablePieces(position.board, opponent(position.current)).map((at) => ({
      kind: 'remove' as const,
      at,
    }))
  }

  if (position.inHand.white > 0 || position.inHand.black > 0) {
    return emptyPoints(position.board).map((to) => ({ kind: 'place' as const, to }))
  }

  const flying = canFly(position.board, position.inHand, position.current)
  const destsFor = flying
    ? emptyPoints(position.board)
    : null
  const moves: MorrisMove[] = []

  for (const from of piecesOf(position.board, position.current)) {
    const destinations = destsFor ?? neighborsOf(from).filter((point) => position.board[keyOf(point)] === null)
    for (const to of destinations) {
      moves.push({ kind: 'slide', from, to })
    }
  }

  return moves
}

export function hasLegalMove(position: MorrisPosition): boolean {
  return legalMoves(position).length > 0
}

export function isUnderMinimum(position: MorrisPosition, player: MorrisPosition['current']): boolean {
  if (position.inHand.white > 0 || position.inHand.black > 0) {
    return false
  }
  return countPieces(position.board, player) < 3
}
