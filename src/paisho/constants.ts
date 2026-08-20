import type { FlowerKind } from './types'

export const GRID = 11
export const CENTER = 5
export const RADIUS = 5

export const BASIC_FLOWERS: FlowerKind[] = ['r3', 'r4', 'r5', 'w3', 'w4', 'w5']
export const ALL_FLOWERS: FlowerKind[] = [...BASIC_FLOWERS, 'lotus']

export const MOVE_RANGE: Record<FlowerKind, number> = {
  r3: 3,
  r4: 4,
  r5: 5,
  w3: 3,
  w4: 4,
  w5: 5,
  lotus: 2,
}

export const ORTHO = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

export const GATES: { x: number; y: number }[] = [
  { x: 5, y: 0 },
  { x: 10, y: 5 },
  { x: 5, y: 10 },
  { x: 0, y: 5 },
]

export function keyOf(x: number, y: number): string {
  return `${x},${y}`
}

export function isPlayable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) {
    return false
  }
  const dx = x - CENTER
  const dy = y - CENTER
  return dx * dx + dy * dy <= RADIUS * RADIUS
}

export function isGate(x: number, y: number): boolean {
  return GATES.some((gate) => gate.x === x && gate.y === y)
}

export function gardenOf(x: number, y: number): 'gate' | 'red' | 'white' | 'neutral' {
  if (isGate(x, y)) {
    return 'gate'
  }
  const dx = x - CENTER
  const dy = y - CENTER
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 2) {
    return 'neutral'
  }
  const red = (dx >= 0 && dy < 0) || (dx < 0 && dy >= 0)
  return red ? 'red' : 'white'
}

export const PLAYABLE: { x: number; y: number }[] = []
for (let y = 0; y < GRID; y += 1) {
  for (let x = 0; x < GRID; x += 1) {
    if (isPlayable(x, y)) {
      PLAYABLE.push({ x, y })
    }
  }
}

export function emptyReserve(): Record<FlowerKind, number> {
  return {
    r3: 2,
    r4: 2,
    r5: 2,
    w3: 2,
    w4: 2,
    w5: 2,
    lotus: 1,
  }
}

export const HARMONY: Record<FlowerKind, FlowerKind[]> = {
  r3: ['r4', 'w5'],
  r4: ['r3', 'r5'],
  r5: ['r4', 'w3'],
  w3: ['r5', 'w4'],
  w4: ['w3', 'w5'],
  w5: ['w4', 'r3'],
  lotus: ['r3', 'r4', 'r5', 'w3', 'w4', 'w5'],
}

export const CLASH: Record<FlowerKind, FlowerKind | null> = {
  r3: 'w3',
  r4: 'w4',
  r5: 'w5',
  w3: 'r3',
  w4: 'r4',
  w5: 'r5',
  lotus: null,
}

export function isRedFlower(kind: FlowerKind): boolean {
  return kind === 'r3' || kind === 'r4' || kind === 'r5'
}

export function isWhiteFlower(kind: FlowerKind): boolean {
  return kind === 'w3' || kind === 'w4' || kind === 'w5'
}
