import type { Card } from './types'

export function trucoPower(card: Card): number {
  if (card.rank === 1 && card.suit === 'espadas') {
    return 14
  }
  if (card.rank === 1 && card.suit === 'bastos') {
    return 13
  }
  if (card.rank === 7 && card.suit === 'espadas') {
    return 12
  }
  if (card.rank === 7 && card.suit === 'oros') {
    return 11
  }
  if (card.rank === 3) {
    return 10
  }
  if (card.rank === 2) {
    return 9
  }
  if (card.rank === 1) {
    return 8
  }
  if (card.rank === 12) {
    return 7
  }
  if (card.rank === 11) {
    return 6
  }
  if (card.rank === 10) {
    return 5
  }
  if (card.rank === 7) {
    return 4
  }
  if (card.rank === 6) {
    return 3
  }
  if (card.rank === 5) {
    return 2
  }
  return 1
}

export function compareTruco(a: Card, b: Card): number {
  return trucoPower(a) - trucoPower(b)
}

export function envidoValue(card: Card): number {
  return card.rank <= 7 ? card.rank : 0
}
