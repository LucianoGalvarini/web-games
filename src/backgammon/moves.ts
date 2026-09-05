import type { Player } from '../shared/types'
import { applyMove } from './apply'
import { distanceToOff, entryIndex, homeRange, isHomePoint, step, POINT_COUNT } from './constants'
import type { BackgammonMove, BackgammonPosition, BackgammonTurn } from './types'

function isBlocked(position: BackgammonPosition, index: number, player: Player): boolean {
  const square = position.points[index]
  return Boolean(square && square.player !== player && square.count >= 2)
}

function allCheckersHome(position: BackgammonPosition, player: Player): boolean {
  if (position.bar[player] > 0) {
    return false
  }
  const [lo, hi] = homeRange(player)
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const square = position.points[index]
    if (square && square.player === player && (index < lo || index > hi)) {
      return false
    }
  }
  return true
}

function maxHomeDistance(position: BackgammonPosition, player: Player): number {
  let max = 0
  const [lo, hi] = homeRange(player)
  for (let index = lo; index <= hi; index += 1) {
    const square = position.points[index]
    if (square && square.player === player) {
      max = Math.max(max, distanceToOff(index, player))
    }
  }
  return max
}

export function legalSingleMoves(position: BackgammonPosition, player: Player, die: number): BackgammonMove[] {
  if (position.bar[player] > 0) {
    const to = entryIndex(player, die)
    if (to >= 0 && to < POINT_COUNT && !isBlocked(position, to, player)) {
      return [{ kind: 'enter', die, to }]
    }
    return []
  }

  const moves: BackgammonMove[] = []
  const canBearOff = allCheckersHome(position, player)
  const furthest = canBearOff ? maxHomeDistance(position, player) : 0

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const square = position.points[index]
    if (!square || square.player !== player) {
      continue
    }
    const to = index + step(player) * die
    if (to >= 0 && to < POINT_COUNT) {
      if (!isBlocked(position, to, player)) {
        moves.push({ kind: 'move', die, from: index, to })
      }
      continue
    }
    if (!canBearOff || !isHomePoint(index, player)) {
      continue
    }
    const distance = distanceToOff(index, player)
    if (distance === die || (distance < die && distance === furthest)) {
      moves.push({ kind: 'bearoff', die, from: index })
    }
  }

  return moves
}

function diceMultiset(dice: number[]): number[] {
  return dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [...dice]
}

function search(
  position: BackgammonPosition,
  player: Player,
  remaining: number[],
  path: BackgammonTurn,
  results: BackgammonTurn[],
): void {
  if (remaining.length === 0) {
    results.push(path)
    return
  }

  const tried = new Set<number>()
  let played = false

  for (const die of remaining) {
    if (tried.has(die)) {
      continue
    }
    tried.add(die)

    const options = legalSingleMoves(position, player, die)
    for (const move of options) {
      played = true
      const next = applyMove(position, move)
      const rest = [...remaining]
      rest.splice(rest.indexOf(die), 1)
      search(next, player, rest, [...path, move], results)
    }
  }

  if (!played) {
    results.push(path)
  }
}

export function generateTurns(position: BackgammonPosition, dice: number[]): BackgammonTurn[] {
  const player = position.current
  const results: BackgammonTurn[] = []
  search(position, player, diceMultiset(dice), [], results)

  const maxLen = results.reduce((max, turn) => Math.max(max, turn.length), 0)
  let maximal = results.filter((turn) => turn.length === maxLen)

  if (maxLen === 1 && dice[0] !== dice[1]) {
    const larger = Math.max(dice[0], dice[1])
    const usesLarger = maximal.filter((turn) => turn[0].die === larger)
    if (usesLarger.length > 0) {
      maximal = usesLarger
    }
  }

  const seen = new Set<string>()
  const unique: BackgammonTurn[] = []
  for (const turn of maximal) {
    const key = turn.map((move) => `${move.kind}:${'from' in move ? move.from : ''}:${move.die}:${'to' in move ? move.to : ''}`).join('|')
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(turn)
    }
  }

  return unique
}

export function hasLegalTurn(position: BackgammonPosition, dice: number[]): boolean {
  return generateTurns(position, dice).some((turn) => turn.length > 0)
}
