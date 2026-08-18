import { opponent } from '../shared/player'
import type { Difficulty } from '../shared/types'
import { applyTurn, winnerOf } from './apply'
import { countPieces, millsAt, piecesOf } from './geometry'
import { keyOf } from '../shared/point'
import { legalMoves } from './moves'
import type { MorrisMove, MorrisPosition } from './types'
import type { MorrisVariant } from './variants'

export type MorrisTurn = MorrisMove[]

export function generateTurns(variant: MorrisVariant, position: MorrisPosition): MorrisTurn[] {
  const first = legalMoves(variant, position)
  const turns: MorrisTurn[] = []

  for (const move of first) {
    const next = applyTurn(variant, position, [move])
    if (next.pendingRemoval) {
      const removals = legalMoves(variant, next)
      for (const removal of removals) {
        turns.push([move, removal])
      }
    } else {
      turns.push([move])
    }
  }

  return turns
}

function millCount(variant: MorrisVariant, position: MorrisPosition, player: MorrisPosition['current']): number {
  let total = 0
  const seen = new Set<string>()
  for (const point of piecesOf(variant, position.board, player)) {
    for (const mill of millsAt(variant, position.board, point, player)) {
      const id = mill.map((item) => keyOf(item)).join('|')
      if (!seen.has(id)) {
        seen.add(id)
        total += 1
      }
    }
  }
  return total
}

function evaluate(variant: MorrisVariant, position: MorrisPosition, ai: MorrisPosition['current']): number {
  const result = winnerOf(variant, position)
  if (result === ai) {
    return 10_000
  }
  if (result && result !== 'draw') {
    return -10_000
  }

  const enemy = opponent(ai)
  const material =
    (countPieces(variant, position.board, ai) + position.inHand[ai]) * 140 -
    (countPieces(variant, position.board, enemy) + position.inHand[enemy]) * 140
  const mills = millCount(variant, position, ai) * 55 - millCount(variant, position, enemy) * 55
  const mobility =
    legalMoves(variant, { ...position, current: ai, pendingRemoval: false }).length -
    legalMoves(variant, { ...position, current: enemy, pendingRemoval: false }).length

  return material + mills + mobility * 2
}

function minimax(
  variant: MorrisVariant,
  position: MorrisPosition,
  ai: MorrisPosition['current'],
  depth: number,
  alpha: number,
  beta: number,
): number {
  const outcome = winnerOf(variant, position)
  if (outcome === ai) {
    return 10_000
  }
  if (outcome && outcome !== 'draw') {
    return -10_000
  }

  const turns = generateTurns(variant, position)
  if (turns.length === 0) {
    return position.current === ai ? -9_000 : 9_000
  }
  if (depth === 0) {
    return evaluate(variant, position, ai)
  }

  if (position.current === ai) {
    let best = -Infinity
    for (const turn of turns) {
      const value = minimax(variant, applyTurn(variant, position, turn), ai, depth - 1, alpha, beta)
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
    const value = minimax(variant, applyTurn(variant, position, turn), ai, depth - 1, alpha, beta)
    best = Math.min(best, value)
    beta = Math.min(beta, value)
    if (beta <= alpha) {
      break
    }
  }
  return best
}

export function chooseAiTurn(variant: MorrisVariant, position: MorrisPosition, difficulty: Difficulty): MorrisTurn {
  const turns = generateTurns(variant, position)
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

  if (difficulty === 'perfect') {
    return choosePerfectTurn(variant, position)
  }

  const depth = difficulty === 'hard' ? 2 : 1
  let bestTurn = turns[0]
  let bestValue = -Infinity

  for (const turn of turns) {
    const value =
      minimax(variant, applyTurn(variant, position, turn), position.current, depth - 1, -Infinity, Infinity) +
      Math.random() * 0.05
    if (value > bestValue) {
      bestValue = value
      bestTurn = turn
    }
  }

  return bestTurn
}

const TIME_BUDGET_MS: Record<MorrisVariant['id'], { placing: number; moving: number }> = {
  six: { placing: 450, moving: 450 },
  nine: { placing: 1000, moving: 900 },
  twelve: { placing: 1700, moving: 1000 },
}

const MAX_DEPTH = 24

type TtFlag = 'exact' | 'lower' | 'upper'

type TtEntry = {
  depth: number
  score: number
  flag: TtFlag
  bestTurnIndex: number
}

function timeBudgetFor(variant: MorrisVariant, position: MorrisPosition): number {
  const budgets = TIME_BUDGET_MS[variant.id]
  const placing = position.inHand.white > 0 || position.inHand.black > 0
  return placing ? budgets.placing : budgets.moving
}

function orderTurns(
  variant: MorrisVariant,
  position: MorrisPosition,
  turns: MorrisTurn[],
  ai: MorrisPosition['current'],
  preferredIndex: number,
): number[] {
  const indices = turns.map((_, index) => index)
  const scored = indices.map((index) => ({
    index,
    score: evaluate(variant, applyTurn(variant, position, turns[index]), ai),
  }))
  scored.sort((a, b) => b.score - a.score)
  const ordered = scored.map((item) => item.index)
  if (preferredIndex >= 0) {
    const at = ordered.indexOf(preferredIndex)
    if (at > 0) {
      ordered.splice(at, 1)
      ordered.unshift(preferredIndex)
    }
  }
  return ordered
}

function searchWithTt(
  variant: MorrisVariant,
  position: MorrisPosition,
  ai: MorrisPosition['current'],
  depth: number,
  alpha: number,
  beta: number,
  tt: Map<string, TtEntry>,
  serialize: (position: MorrisPosition) => string,
  deadline: { time: number; expired: boolean },
  nodeCounter: { count: number },
): number {
  nodeCounter.count += 1
  if ((nodeCounter.count & 1023) === 0) {
    if (performance.now() > deadline.time) {
      deadline.expired = true
    }
  }
  if (deadline.expired) {
    return evaluate(variant, position, ai)
  }

  const outcome = winnerOf(variant, position)
  if (outcome === ai) {
    return 10_000
  }
  if (outcome && outcome !== 'draw') {
    return -10_000
  }

  const turns = generateTurns(variant, position)
  if (turns.length === 0) {
    return position.current === ai ? -9_000 : 9_000
  }
  if (depth === 0) {
    return evaluate(variant, position, ai)
  }

  const key = serialize(position)
  const cached = tt.get(key)
  let preferredIndex = -1
  if (cached && cached.depth >= depth) {
    if (cached.flag === 'exact') {
      return cached.score
    }
    if (cached.flag === 'lower') {
      alpha = Math.max(alpha, cached.score)
    } else {
      beta = Math.min(beta, cached.score)
    }
    if (beta <= alpha) {
      return cached.score
    }
  }
  if (cached) {
    preferredIndex = cached.bestTurnIndex
  }

  const maximizing = position.current === ai
  const order = orderTurns(variant, position, turns, ai, preferredIndex)
  const originalAlpha = alpha
  const originalBeta = beta
  let best = maximizing ? -Infinity : Infinity
  let bestIndex = order[0]

  for (const index of order) {
    const value = searchWithTt(
      variant,
      applyTurn(variant, position, turns[index]),
      ai,
      depth - 1,
      alpha,
      beta,
      tt,
      serialize,
      deadline,
      nodeCounter,
    )
    if (maximizing) {
      if (value > best) {
        best = value
        bestIndex = index
      }
      alpha = Math.max(alpha, value)
    } else {
      if (value < best) {
        best = value
        bestIndex = index
      }
      beta = Math.min(beta, value)
    }
    if (beta <= alpha || deadline.expired) {
      break
    }
  }

  if (!deadline.expired) {
    const flag: TtFlag = best <= originalAlpha ? 'upper' : best >= originalBeta ? 'lower' : 'exact'
    tt.set(key, { depth, score: best, flag, bestTurnIndex: bestIndex })
  }

  return best
}

function choosePerfectTurn(variant: MorrisVariant, position: MorrisPosition): MorrisTurn {
  const turns = generateTurns(variant, position)
  if (turns.length === 0) {
    return []
  }
  if (turns.length === 1) {
    return turns[0]
  }

  const ai = position.current
  const serialize = (pos: MorrisPosition) => {
    const grid = variant.points
      .map((point) => {
        const cell = pos.board[keyOf(point)]
        return cell === 'white' ? 'W' : cell === 'black' ? 'B' : '.'
      })
      .join('')
    return `${pos.current}:${pos.pendingRemoval ? 'R' : '-'}:${pos.inHand.white}${pos.inHand.black}:${grid}`
  }

  const deadline = { time: performance.now() + timeBudgetFor(variant, position), expired: false }
  const tt = new Map<string, TtEntry>()

  let bestTurn = turns[0]
  let bestOrder = turns.map((_, index) => index)

  for (let depth = 1; depth <= MAX_DEPTH; depth += 1) {
    const nodeCounter = { count: 0 }
    const order = orderTurns(variant, position, turns, ai, bestOrder[0])
    let localBest = -Infinity
    let localBestIndex = order[0]
    let alpha = -Infinity
    const beta = Infinity
    let iterationExpired = false

    for (const index of order) {
      const value = searchWithTt(
        variant,
        applyTurn(variant, position, turns[index]),
        ai,
        depth - 1,
        alpha,
        beta,
        tt,
        serialize,
        deadline,
        nodeCounter,
      )
      if (deadline.expired) {
        iterationExpired = true
        break
      }
      if (value > localBest) {
        localBest = value
        localBestIndex = index
      }
      alpha = Math.max(alpha, value)
    }

    if (!iterationExpired) {
      bestTurn = turns[localBestIndex]
      bestOrder = [localBestIndex, ...order.filter((index) => index !== localBestIndex)]
      if (localBest >= 10_000 || localBest <= -10_000) {
        break
      }
    }

    if (deadline.expired || performance.now() > deadline.time) {
      break
    }
  }

  return bestTurn
}
