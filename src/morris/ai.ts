import { opponent } from '../shared/player'
import type { Difficulty } from '../shared/types'
import { applyTurn, winnerOf } from './apply'
import { countPieces, millsAt, piecesOf } from './geometry'
import { keyOf } from '../shared/point'
import { legalMoves } from './moves'
import type { MorrisMove, MorrisPosition } from './types'

export type MorrisTurn = MorrisMove[]

export function generateTurns(position: MorrisPosition): MorrisTurn[] {
  const first = legalMoves(position)
  const turns: MorrisTurn[] = []

  for (const move of first) {
    const next = applyTurn(position, [move])
    if (next.pendingRemoval) {
      const removals = legalMoves(next)
      for (const removal of removals) {
        turns.push([move, removal])
      }
    } else {
      turns.push([move])
    }
  }

  return turns
}

function millCount(position: MorrisPosition, player: MorrisPosition['current']): number {
  let total = 0
  const seen = new Set<string>()
  for (const point of piecesOf(position.board, player)) {
    for (const mill of millsAt(position.board, point, player)) {
      const id = mill.map((item) => keyOf(item)).join('|')
      if (!seen.has(id)) {
        seen.add(id)
        total += 1
      }
    }
  }
  return total
}

function evaluate(position: MorrisPosition, ai: MorrisPosition['current']): number {
  const result = winnerOf(position)
  if (result === ai) {
    return 10_000
  }
  if (result && result !== 'draw') {
    return -10_000
  }

  const enemy = opponent(ai)
  const material =
    (countPieces(position.board, ai) + position.inHand[ai]) * 140 -
    (countPieces(position.board, enemy) + position.inHand[enemy]) * 140
  const mills = millCount(position, ai) * 55 - millCount(position, enemy) * 55
  const mobility =
    legalMoves({ ...position, current: ai, pendingRemoval: false }).length -
    legalMoves({ ...position, current: enemy, pendingRemoval: false }).length

  return material + mills + mobility * 2
}

function minimax(
  position: MorrisPosition,
  ai: MorrisPosition['current'],
  depth: number,
  alpha: number,
  beta: number,
): number {
  const outcome = winnerOf(position)
  if (outcome === ai) {
    return 10_000
  }
  if (outcome && outcome !== 'draw') {
    return -10_000
  }

  const turns = generateTurns(position)
  if (turns.length === 0) {
    return position.current === ai ? -9_000 : 9_000
  }
  if (depth === 0) {
    return evaluate(position, ai)
  }

  if (position.current === ai) {
    let best = -Infinity
    for (const turn of turns) {
      const value = minimax(applyTurn(position, turn), ai, depth - 1, alpha, beta)
      best = Math.max(best, value)
      alpha = Math.max(alpha, value)
      if (beta <= alpha) {
        break
      }
    }
    return best
  }

  let best = Infinity
  for (const turn of turns) {
    const value = minimax(applyTurn(position, turn), ai, depth - 1, alpha, beta)
    best = Math.min(best, value)
    beta = Math.min(beta, value)
    if (beta <= alpha) {
      break
    }
  }
  return best
}

export function chooseAiTurn(position: MorrisPosition, difficulty: Difficulty): MorrisTurn {
  const turns = generateTurns(position)
  if (turns.length === 0) {
    return []
  }

  if (difficulty === 'easy') {
    let bestTurn = turns[0]
    let bestScore = -Infinity
    for (const turn of turns) {
      const score = (turn.some((move) => move.kind === 'remove') ? 25 : 0) + Math.random()
      if (score > bestScore) {
        bestScore = score
        bestTurn = turn
      }
    }
    return bestTurn
  }

  const depth = difficulty === 'hard' ? 2 : 1
  let bestTurn = turns[0]
  let bestValue = -Infinity

  for (const turn of turns) {
    const value =
      minimax(applyTurn(position, turn), position.current, depth - 1, -Infinity, Infinity) +
      Math.random() * 0.05
    if (value > bestValue) {
      bestValue = value
      bestTurn = turn
    }
  }

  return bestTurn
}
