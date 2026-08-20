import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import { PIECE_VALUE } from './constants'
import { inCheck, legalMoves } from './moves'
import type { ChessOutcome, ChessPosition, PieceKind } from './types'

export function countPieces(position: ChessPosition, player: Player): number {
  return position.squares.reduce((total, piece) => total + (piece?.player === player ? 1 : 0), 0)
}

export function materialOf(position: ChessPosition, player: Player): number {
  let total = 0
  for (const piece of position.squares) {
    if (piece?.player === player && piece.kind !== 'k') {
      total += PIECE_VALUE[piece.kind]
    }
  }
  return total
}

function minorPieces(position: ChessPosition, player: Player): PieceKind[] {
  const kinds: PieceKind[] = []
  for (const piece of position.squares) {
    if (piece?.player === player && (piece.kind === 'n' || piece.kind === 'b')) {
      kinds.push(piece.kind)
    }
  }
  return kinds
}

export function insufficientMaterial(position: ChessPosition): boolean {
  const leftover = position.squares.filter((piece) => piece && piece.kind !== 'k')
  if (leftover.length === 0) {
    return true
  }
  if (leftover.length === 1) {
    const kind = leftover[0]?.kind
    return kind === 'n' || kind === 'b'
  }
  const extras = leftover.filter((piece) => piece && piece.kind !== 'n' && piece.kind !== 'b')
  if (extras.length > 0) {
    return false
  }
  return leftover.length <= 2 && minorPieces(position, 'white').length <= 1 && minorPieces(position, 'black').length <= 1
}

export function winnerOf(position: ChessPosition, repeats: number): ChessOutcome {
  if (repeats >= 3 || position.halfmove >= 100 || insufficientMaterial(position)) {
    return 'draw'
  }
  if (legalMoves(position).length > 0) {
    return null
  }
  return inCheck(position.squares, position.current) ? opponent(position.current) : 'draw'
}
