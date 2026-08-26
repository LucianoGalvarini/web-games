import { applyMove, legalMoves } from './moves'
import type { ChessPosition } from './types'

export function perft(position: ChessPosition, depth: number): number {
  if (depth <= 0) {
    return 1
  }
  const moves = legalMoves(position)
  if (depth === 1) {
    return moves.length
  }
  let nodes = 0
  for (const move of moves) {
    nodes += perft(applyMove(position, move), depth - 1)
  }
  return nodes
}
