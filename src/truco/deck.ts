import { RANKS, SUITS } from './constants'
import type { Card } from './types'

export function fullDeck(): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank })
    }
  }
  return cards
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const left = next[i]
    const right = next[j]
    if (left === undefined || right === undefined) {
      continue
    }
    next[i] = right
    next[j] = left
  }
  return next
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`
}

export function removeCard(hand: Card[], card: Card): Card[] {
  const index = hand.findIndex((item) => sameCard(item, card))
  if (index < 0) {
    return hand
  }
  return [...hand.slice(0, index), ...hand.slice(index + 1)]
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
