import type { Difficulty, Player } from '../shared/types'
import { CENTER } from './constants'
import { harmonyLinks, hasHarmonyRing, isBlooming } from './harmony'
import { applyMove, legalMoves } from './moves'
import type { PaiMove, PaiPosition } from './types'

function evaluate(position: PaiPosition, ai: Player): number {
  if (hasHarmonyRing(position.tiles, ai)) {
    return 12_000
  }
  const other: Player = ai === 'white' ? 'black' : 'white'
  if (hasHarmonyRing(position.tiles, other)) {
    return -12_000
  }
  let score = (harmonyLinks(position.tiles, ai).length - harmonyLinks(position.tiles, other).length) * 80
  for (const tile of position.tiles) {
    const dist = Math.abs(tile.x - CENTER) + Math.abs(tile.y - CENTER)
    const bloom = isBlooming(tile) ? 12 : 2
    const lotus = tile.kind === 'lotus' ? 18 : 0
    const value = bloom + lotus - dist
    score += tile.player === ai ? value : -value
  }
  return score
}

function ordered(moves: PaiMove[]): PaiMove[] {
  return [...moves].sort((a, b) => Number(b.kind === 'arrange') - Number(a.kind === 'arrange'))
}

function minimax(position: PaiPosition, ai: Player, depth: number, alpha: number, beta: number): number {
  const moves = ordered(legalMoves(position))
  if (moves.length === 0 || depth === 0) {
    return evaluate(position, ai)
  }
  const maximizing = position.current === ai
  let best = maximizing ? -Infinity : Infinity
  for (const move of moves) {
    const value = minimax(applyMove(position, move), ai, depth - 1, alpha, beta)
    if (maximizing) {
      best = Math.max(best, value)
      alpha = Math.max(alpha, best)
    } else {
      best = Math.min(best, value)
      beta = Math.min(beta, best)
    }
    if (beta <= alpha) {
      break
    }
  }
  return best
}

function pick(moves: PaiMove[], scores: number[], random: () => number): PaiMove {
  const best = Math.max(...scores)
  const top = moves.filter((_, index) => scores[index] === best)
  const choice = top[Math.floor(random() * top.length)] ?? moves[0]
  if (!choice) {
    throw new Error('La CPU no tiene jugadas.')
  }
  return choice
}

export function chooseAiMove(
  position: PaiPosition,
  difficulty: Difficulty,
  random = Math.random,
): PaiMove | null {
  const moves = legalMoves(position)
  if (moves.length === 0) {
    return null
  }
  const ai = position.current
  if (difficulty === 'easy') {
    const plants = moves.filter((move) => move.kind === 'plant')
    if (plants.length > 0 && random() < 0.55) {
      return plants[Math.floor(random() * plants.length)] ?? moves[0] ?? null
    }
    return moves[Math.floor(random() * moves.length)] ?? null
  }

  const maxDepth = difficulty === 'medium' ? 1 : difficulty === 'hard' ? 2 : 3
  const deadline = difficulty === 'perfect' ? Date.now() + 380 : 0
  let chosen = moves[0] ?? null
  const start = difficulty === 'perfect' ? 1 : maxDepth

  for (let depth = start; depth <= maxDepth; depth += 1) {
    if (deadline && Date.now() > deadline) {
      break
    }
    const scores = ordered(moves).map((move) =>
      minimax(applyMove(position, move), ai, depth - 1, -Infinity, Infinity),
    )
    chosen = pick(ordered(moves), scores, random)
  }
  return chosen
}
