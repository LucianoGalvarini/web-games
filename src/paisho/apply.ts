import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import { hasHarmonyRing } from './harmony'
import { legalMoves } from './moves'
import type { PaiPosition } from './types'

export function winnerOf(position: PaiPosition, repeats: number): Player | 'draw' | null {
  if (repeats >= 3) {
    return 'draw'
  }
  const previous = opponent(position.current)
  if (hasHarmonyRing(position.tiles, previous)) {
    return previous
  }
  if (legalMoves(position).length === 0) {
    if (hasHarmonyRing(position.tiles, position.current)) {
      return position.current
    }
    return previous
  }
  return null
}
