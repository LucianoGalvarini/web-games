import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import { PIECE_VALUE } from './constants'
import { inCheck, isLightSquare, legalMoves } from './moves'
import type { ChessEndReason, ChessOutcome, ChessPosition, ChessResult, PieceKind } from './types'

const START_COUNT: Record<Exclude<PieceKind, 'k'>, number> = {
  q: 1,
  r: 2,
  b: 2,
  n: 2,
  p: 8,
}

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

export function pawnAdvantage(position: ChessPosition, player: Player): number {
  return materialOf(position, player) - materialOf(position, opponent(player))
}

export function capturedBy(position: ChessPosition, player: Player): PieceKind[] {
  const foe = opponent(player)
  const counts: Record<PieceKind, number> = { k: 0, q: 0, r: 0, b: 0, n: 0, p: 0 }
  for (const piece of position.squares) {
    if (piece?.player === foe) {
      counts[piece.kind] += 1
    }
  }
  const extra =
    Math.max(0, counts.q - START_COUNT.q) +
    Math.max(0, counts.r - START_COUNT.r) +
    Math.max(0, counts.b - START_COUNT.b) +
    Math.max(0, counts.n - START_COUNT.n)
  const captured: PieceKind[] = []
  const order: Array<Exclude<PieceKind, 'k'>> = ['q', 'r', 'b', 'n', 'p']
  for (const kind of order) {
    if (kind === 'p') {
      const missingPawns = Math.max(0, START_COUNT.p - counts.p - extra)
      for (let index = 0; index < missingPawns; index += 1) {
        captured.push('p')
      }
      continue
    }
    const missing = Math.max(0, START_COUNT[kind] - counts[kind])
    for (let index = 0; index < missing; index += 1) {
      captured.push(kind)
    }
  }
  return captured
}

export function insufficientMaterial(position: ChessPosition): boolean {
  const leftovers: { kind: PieceKind; index: number }[] = []
  for (let index = 0; index < position.squares.length; index += 1) {
    const piece = position.squares[index]
    if (piece && piece.kind !== 'k') {
      leftovers.push({ kind: piece.kind, index })
    }
  }
  if (leftovers.some((item) => item.kind === 'p' || item.kind === 'r' || item.kind === 'q')) {
    return false
  }
  if (leftovers.length === 0) {
    return true
  }
  if (leftovers.length === 1) {
    const kind = leftovers[0]?.kind
    return kind === 'n' || kind === 'b'
  }
  if (leftovers.length === 2 && leftovers.every((item) => item.kind === 'b')) {
    const first = leftovers[0]
    const second = leftovers[1]
    if (!first || !second) {
      return false
    }
    return isLightSquare(first.index) === isLightSquare(second.index)
  }
  return false
}

export function resultOf(position: ChessPosition, repeats: number): ChessResult {
  if (repeats >= 3) {
    return { winner: 'draw', reason: 'repetition' }
  }
  if (position.halfmove >= 100) {
    return { winner: 'draw', reason: 'fifty' }
  }
  if (insufficientMaterial(position)) {
    return { winner: 'draw', reason: 'material' }
  }
  if (legalMoves(position).length > 0) {
    return { winner: null, reason: null }
  }
  if (inCheck(position.squares, position.current)) {
    return { winner: opponent(position.current), reason: 'checkmate' }
  }
  return { winner: 'draw', reason: 'stalemate' }
}

export function winnerOf(position: ChessPosition, repeats: number): ChessOutcome {
  return resultOf(position, repeats).winner
}

export function endReasonLabel(reason: ChessEndReason | null, winner: ChessOutcome): string {
  if (reason === 'checkmate') {
    return 'Jaque mate.'
  }
  if (reason === 'stalemate') {
    return 'Ahogado.'
  }
  if (reason === 'repetition') {
    return 'Triple repetición.'
  }
  if (reason === 'fifty') {
    return 'Regla de 50 jugadas.'
  }
  if (reason === 'material') {
    return 'Material insuficiente.'
  }
  if (winner === 'draw') {
    return 'Tablas.'
  }
  if (winner) {
    return 'Jaque mate.'
  }
  return ''
}
