import type { Difficulty, Player } from '../shared/types'
import { applyTurn, winnerOf } from './apply'
import { opponentOf } from './board'
import { distanceToOff, homeRange, POINT_COUNT } from './constants'
import { generateTurns } from './moves'
import type { BackgammonPosition, BackgammonTurn } from './types'

const SHOT_WEIGHT: Record<number, number> = {
  1: 11,
  2: 12,
  3: 14,
  4: 15,
  5: 15,
  6: 17,
  7: 6,
  8: 6,
  9: 5,
  10: 3,
  11: 2,
  12: 3,
}

function pipCount(position: BackgammonPosition, player: Player): number {
  let pips = position.bar[player] * (POINT_COUNT + 1)
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const square = position.points[index]
    if (square && square.player === player) {
      pips += square.count * distanceToOff(index, player)
    }
  }
  return pips
}

function madePoints(position: BackgammonPosition, player: Player): number {
  let made = 0
  const [lo, hi] = homeRange(player)
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const square = position.points[index]
    if (square && square.player === player && square.count >= 2) {
      made += index >= lo && index <= hi ? 2 : 1
    }
  }
  return made
}

function blotExposure(position: BackgammonPosition, player: Player): number {
  const enemy = opponentOf(player)
  let exposure = 0
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const square = position.points[index]
    if (!square || square.player !== player || square.count !== 1) {
      continue
    }
    let shooters = 0
    for (let enemyIndex = 0; enemyIndex < POINT_COUNT; enemyIndex += 1) {
      const enemySquare = position.points[enemyIndex]
      if (!enemySquare || enemySquare.player !== enemy) {
        continue
      }
      const distance = player === 'white' ? enemyIndex - index : index - enemyIndex
      if (distance > 0 && distance <= 12) {
        shooters += SHOT_WEIGHT[distance] ?? 0
      }
    }
    if (position.bar[enemy] > 0) {
      const entryDistance = player === 'white' ? 24 - index : index + 1
      if (entryDistance >= 1 && entryDistance <= 6) {
        shooters += SHOT_WEIGHT[entryDistance] ?? 0
      }
    }
    exposure += shooters
  }
  return exposure
}

export function evaluate(position: BackgammonPosition, forPlayer: Player): number {
  const result = winnerOf(position)
  if (result === forPlayer) {
    return 100_000
  }
  if (result) {
    return -100_000
  }

  const enemy = opponentOf(forPlayer)
  const pipDiff = pipCount(position, enemy) - pipCount(position, forPlayer)
  const offDiff = position.off[forPlayer] - position.off[enemy]
  const barDiff = position.bar[enemy] - position.bar[forPlayer]
  const madeDiff = madePoints(position, forPlayer) - madePoints(position, enemy)
  const exposureDiff = blotExposure(position, enemy) - blotExposure(position, forPlayer)

  return pipDiff * 2 + offDiff * 60 + barDiff * 45 + madeDiff * 9 + exposureDiff * 0.6
}

function pickWeighted(turns: BackgammonTurn[], position: BackgammonPosition): BackgammonTurn {
  const player = position.current
  let best = turns[0]
  let bestScore = -Infinity
  for (const turn of turns) {
    const hits = turn.filter((move) => {
      if (move.kind === 'bearoff') {
        return false
      }
      const target = position.points[move.to]
      return Boolean(target && target.player !== player && target.count === 1)
    }).length
    const progress = turn.reduce((sum, move) => sum + move.die, 0)
    const score = hits * 30 + progress + Math.random() * 8
    if (score > bestScore) {
      bestScore = score
      best = turn
    }
  }
  return best
}

const ALL_ROLLS: { dice: [number, number]; weight: number }[] = []
for (let a = 1; a <= 6; a += 1) {
  for (let b = a; b <= 6; b += 1) {
    ALL_ROLLS.push({ dice: [a, b], weight: a === b ? 1 / 36 : 2 / 36 })
  }
}

function bestReplyValue(position: BackgammonPosition, aiPlayer: Player, dice: number[]): number {
  const turns = generateTurns(position, dice)
  let best = Infinity
  for (const turn of turns) {
    const after = applyTurn(position, turn)
    const value = evaluate(after, aiPlayer)
    if (value < best) {
      best = value
    }
  }
  return best === Infinity ? evaluate(position, aiPlayer) : best
}

const TIME_BUDGET_MS = 900
const MAX_CANDIDATES = 8

function choosePerfectTurn(position: BackgammonPosition, dice: number[]): BackgammonTurn {
  const turns = generateTurns(position, dice)
  if (turns.length <= 1) {
    return turns[0] ?? []
  }

  const aiPlayer = position.current
  const ranked = turns
    .map((turn) => ({ turn, score: evaluate(applyTurn(position, turn), aiPlayer) }))
    .sort((a, b) => b.score - a.score)

  const deadline = performance.now() + TIME_BUDGET_MS
  let bestTurn = ranked[0].turn
  let bestValue = -Infinity

  for (let i = 0; i < Math.min(ranked.length, MAX_CANDIDATES); i += 1) {
    if (performance.now() > deadline) {
      break
    }
    const candidate = ranked[i].turn
    const afterOwn = applyTurn(position, candidate)
    let expected = 0
    for (const roll of ALL_ROLLS) {
      expected += roll.weight * bestReplyValue(afterOwn, aiPlayer, roll.dice)
    }
    if (expected > bestValue) {
      bestValue = expected
      bestTurn = candidate
    }
  }

  return bestTurn
}

export function chooseAiTurn(position: BackgammonPosition, dice: number[], difficulty: Difficulty): BackgammonTurn {
  const turns = generateTurns(position, dice)
  if (turns.length === 0) {
    return []
  }
  if (turns.length === 1) {
    return turns[0]
  }

  if (difficulty === 'easy') {
    return pickWeighted(turns, position)
  }

  if (difficulty === 'perfect') {
    return choosePerfectTurn(position, dice)
  }

  const aiPlayer = position.current
  const noise = difficulty === 'hard' ? 3 : 12
  let bestTurn = turns[0]
  let bestValue = -Infinity
  for (const turn of turns) {
    const value = evaluate(applyTurn(position, turn), aiPlayer) + (Math.random() - 0.5) * noise
    if (value > bestValue) {
      bestValue = value
      bestTurn = turn
    }
  }
  return bestTurn
}
