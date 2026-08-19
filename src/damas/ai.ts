import { opponent } from '../shared/player'
import { keyOf } from '../shared/point'
import type { Difficulty, Player } from '../shared/types'
import { applyTurn, winnerOf } from './apply'
import { serializePosition } from './board'
import { BOARD_SIZE, isPromotionRow, pieceAt, piecesOf } from './geometry'
import { legalStepsAtTurnStart, pieceCaptureSteps } from './moves'
import type { DamasBoard, DamasMove, DamasPosition, DamasTurn, PieceKind } from './types'
import type { DamasVariant, DamasVariantId } from './variants'

function continueChain(
  variant: DamasVariant,
  board: DamasBoard,
  player: Player,
  kind: PieceKind,
  lastStep: DamasMove,
  stepsSoFar: DamasTurn,
  dead: ReadonlySet<string>,
  turns: DamasTurn[],
): void {
  if (lastStep.kind !== 'jump') {
    turns.push(stepsSoFar)
    return
  }

  const nextDead = new Set(dead)
  nextDead.add(keyOf(lastStep.captured))

  const promoted = kind === 'man' && isPromotionRow(player, lastStep.to.y)
  if (promoted) {
    turns.push(stepsSoFar)
    return
  }

  const nextCaptures = pieceCaptureSteps(variant, board, nextDead, lastStep.to, player, kind)
  if (nextCaptures.length === 0) {
    turns.push(stepsSoFar)
    return
  }

  for (const next of nextCaptures) {
    continueChain(variant, board, player, kind, next, [...stepsSoFar, next], nextDead, turns)
  }
}

export function generateTurns(variant: DamasVariant, position: DamasPosition): DamasTurn[] {
  const firstSteps = legalStepsAtTurnStart(variant, position)
  if (firstSteps.length === 0) {
    return []
  }
  if (firstSteps[0].kind === 'slide') {
    return firstSteps.map((step) => [step])
  }

  const turns: DamasTurn[] = []
  for (const step of firstSteps) {
    const square = pieceAt(position.board, step.from)
    const kind = square?.kind ?? 'man'
    continueChain(variant, position.board, position.current, kind, step, [step], new Set(), turns)
  }
  return turns
}

function materialAndAdvancement(board: DamasBoard, player: Player): { material: number; advancement: number } {
  let material = 0
  let advancement = 0
  for (const point of piecesOf(board, player)) {
    const square = pieceAt(board, point)
    if (!square) {
      continue
    }
    if (square.kind === 'king') {
      material += 140
    } else {
      material += 100
      advancement += player === 'white' ? BOARD_SIZE - 1 - point.y : point.y
    }
  }
  return { material, advancement }
}

function evaluate(variant: DamasVariant, position: DamasPosition, ai: Player): number {
  const result = winnerOf(variant, position)
  if (result === ai) {
    return 10_000
  }
  if (result && result !== 'draw') {
    return -10_000
  }

  const enemy = opponent(ai)
  const aiStats = materialAndAdvancement(position.board, ai)
  const enemyStats = materialAndAdvancement(position.board, enemy)
  const mobility =
    generateTurns(variant, { ...position, current: ai }).length -
    generateTurns(variant, { ...position, current: enemy }).length

  return aiStats.material - enemyStats.material + (aiStats.advancement - enemyStats.advancement) * 3 + mobility * 2
}

function minimax(
  variant: DamasVariant,
  position: DamasPosition,
  ai: Player,
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
      const value = minimax(variant, applyTurn(position, turn), ai, depth - 1, alpha, beta)
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
    const value = minimax(variant, applyTurn(position, turn), ai, depth - 1, alpha, beta)
    best = Math.min(best, value)
    beta = Math.min(beta, value)
    if (beta <= alpha) {
      break
    }
  }
  return best
}

export function chooseAiTurn(variant: DamasVariant, position: DamasPosition, difficulty: Difficulty): DamasTurn {
  const turns = generateTurns(variant, position)
  if (turns.length === 0) {
    return []
  }

  if (difficulty === 'easy') {
    let bestTurn = turns[0]
    let bestScore = -Infinity
    for (const turn of turns) {
      const score = (turn.some((move) => move.kind === 'jump') ? 25 : 0) + Math.random()
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
      minimax(variant, applyTurn(position, turn), position.current, depth - 1, -Infinity, Infinity) +
      Math.random() * 0.05
    if (value > bestValue) {
      bestValue = value
      bestTurn = turn
    }
  }

  return bestTurn
}

const TIME_BUDGET_MS: Record<DamasVariantId, number> = {
  english: 900,
  criollas: 1300,
}

const MAX_DEPTH = 24

type TtFlag = 'exact' | 'lower' | 'upper'

type TtEntry = {
  depth: number
  score: number
  flag: TtFlag
  bestTurnIndex: number
}

function orderTurns(
  variant: DamasVariant,
  position: DamasPosition,
  turns: DamasTurn[],
  ai: Player,
  preferredIndex: number,
): number[] {
  const indices = turns.map((_, index) => index)
  const scored = indices.map((index) => ({
    index,
    score: evaluate(variant, applyTurn(position, turns[index]), ai),
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
  variant: DamasVariant,
  position: DamasPosition,
  ai: Player,
  depth: number,
  alpha: number,
  beta: number,
  tt: Map<string, TtEntry>,
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

  const key = serializePosition(position)
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
      applyTurn(position, turns[index]),
      ai,
      depth - 1,
      alpha,
      beta,
      tt,
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

function choosePerfectTurn(variant: DamasVariant, position: DamasPosition): DamasTurn {
  const turns = generateTurns(variant, position)
  if (turns.length === 0) {
    return []
  }
  if (turns.length === 1) {
    return turns[0]
  }

  const ai = position.current
  const deadline = { time: performance.now() + TIME_BUDGET_MS[variant.id], expired: false }
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
        applyTurn(position, turns[index]),
        ai,
        depth - 1,
        alpha,
        beta,
        tt,
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
