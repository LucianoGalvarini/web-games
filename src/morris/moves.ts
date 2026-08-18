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
import type { MorrisVariant } from './variants'

export function legalMoves(variant: MorrisVariant, position: MorrisPosition): MorrisMove[] {
  if (position.pendingRemoval) {
    return removablePieces(variant, position.board, opponent(position.current)).map((at) => ({
      kind: 'remove' as const,
      at,
    }))
  }

  if (position.inHand.white > 0 || position.inHand.black > 0) {
    return emptyPoints(variant, position.board).map((to) => ({ kind: 'place' as const, to }))
  }

  const flying = canFly(variant, position.board, position.inHand, position.current)
  const destsFor = flying
    ? emptyPoints(variant, position.board)
    : null
  const moves: MorrisMove[] = []

  for (const from of piecesOf(variant, position.board, position.current)) {
    const destinations =
      destsFor ?? neighborsOf(variant, from).filter((point) => position.board[keyOf(point)] === null)
    for (const to of destinations) {
      moves.push({ kind: 'slide', from, to })
    }
  }

  return moves
}

export function hasLegalMove(variant: MorrisVariant, position: MorrisPosition): boolean {
  return legalMoves(variant, position).length > 0
}

export function isUnderMinimum(
  variant: MorrisVariant,
  position: MorrisPosition,
  player: MorrisPosition['current'],
): boolean {
  if (position.inHand.white > 0 || position.inHand.black > 0) {
    return false
  }
  return countPieces(variant, position.board, player) < 3
}
