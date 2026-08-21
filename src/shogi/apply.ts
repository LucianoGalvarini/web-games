import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import { pieceValue } from './constants'
import { legalMoves } from './moves'
import type { ShogiOutcome, ShogiPosition } from './types'

export function materialOf(position: ShogiPosition, player: Player): number {
  let total = 0
  for (const piece of position.board) {
    if (piece?.player === player && piece.kind !== 'k') {
      total += pieceValue(piece.kind, piece.promoted)
    }
  }
  for (const kind of Object.keys(position.hands[player]) as (keyof ShogiPosition['hands']['white'])[]) {
    total += pieceValue(kind, false) * position.hands[player][kind]
  }
  return total
}

export function winnerOf(position: ShogiPosition, repeats: number): ShogiOutcome {
  if (repeats >= 3) {
    return 'draw'
  }
  if (legalMoves(position).length > 0) {
    return null
  }
  return opponent(position.current)
}
