import type { Card, Color } from './types'

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue']
let idCounter = 0

function makeId(): string {
  idCounter += 1
  return `c${Date.now().toString(36)}${idCounter.toString(36)}`
}

export function createDeck(): Card[] {
  const deck: Card[] = []

  for (const color of COLORS) {
    deck.push({ id: makeId(), color, value: '0' })
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: makeId(), color, value: String(n) as Card['value'] })
      deck.push({ id: makeId(), color, value: String(n) as Card['value'] })
    }
    for (const action of ['skip', 'reverse', 'draw2'] as const) {
      deck.push({ id: makeId(), color, value: action })
      deck.push({ id: makeId(), color, value: action })
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: makeId(), color: 'wild', value: 'wild' })
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: makeId(), color: 'wild', value: 'wild4' })
  }

  return deck
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function isActionCard(card: Card): boolean {
  return card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2'
}

export function isWildCard(card: Card): boolean {
  return card.color === 'wild'
}
