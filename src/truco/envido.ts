import type { Player } from '../shared/types'
import { MALAS_LIMIT, TARGET_SCORE } from './constants'
import { envidoValue } from './ranking'
import type { Card, EnvidoCall } from './types'

export function envidoOf(hand: Card[]): number {
  const bySuit: Partial<Record<Card['suit'], number[]>> = {}
  for (const card of hand) {
    const list = bySuit[card.suit] ?? []
    list.push(envidoValue(card))
    bySuit[card.suit] = list
  }

  let best = 0
  for (const values of Object.values(bySuit)) {
    if (!values) {
      continue
    }
    const sorted = [...values].sort((a, b) => b - a)
    const top = sorted[0] ?? 0
    if (sorted.length >= 2) {
      const second = sorted[1] ?? 0
      best = Math.max(best, 20 + top + second)
    } else {
      best = Math.max(best, top)
    }
  }
  return best
}

export function faltaValue(scores: { white: number; black: number }): number {
  const lead = Math.max(scores.white, scores.black)
  const cap = lead < MALAS_LIMIT ? MALAS_LIMIT : TARGET_SCORE
  return Math.max(1, cap - lead)
}

export function acceptedEnvidoPoints(chain: EnvidoCall[], falta: number): number {
  if (chain.includes('falta')) {
    return falta
  }
  let points = 0
  for (const call of chain) {
    if (call === 'envido') {
      points += 2
    }
    if (call === 'real') {
      points += 3
    }
  }
  return points
}

export function rejectedEnvidoPoints(chain: EnvidoCall[], falta: number): number {
  if (chain.length <= 1) {
    return 1
  }
  return acceptedEnvidoPoints(chain.slice(0, -1), falta)
}

export function legalEnvidoRaises(chain: EnvidoCall[]): EnvidoCall[] {
  if (chain.includes('falta')) {
    return []
  }
  if (chain.includes('real')) {
    return ['falta']
  }
  const envidos = chain.filter((call) => call === 'envido').length
  const raises: EnvidoCall[] = []
  if (envidos < 2) {
    raises.push('envido')
  }
  raises.push('real', 'falta')
  return raises
}

export function envidoWinner(
  values: { white: number; black: number },
  mano: Player,
): Player {
  if (values.white === values.black) {
    return mano
  }
  return values.white > values.black ? 'white' : 'black'
}
