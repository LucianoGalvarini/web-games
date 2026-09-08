export type RouletteRewardKind =
  | 'coins'
  | 'freePack'
  | 'freeQuestion'
  | 'wagerBoost'
  | 'extraSpin'
  | 'nothing'
  | 'loseCoins'
  | 'jackpot'

export type RouletteSegment = {
  id: string
  label: string
  description: string
  icon: string
  kind: RouletteRewardKind
  weight: number
  amount?: number
  min?: number
  max?: number
}

export const ROULETTE_SEGMENTS: RouletteSegment[] = [
  {
    id: 'coins10',
    label: 'Monedas',
    description: 'Ganás 10 monedas directas a tu saldo.',
    icon: '🪙',
    kind: 'coins',
    weight: 16,
    amount: 10,
  },
  {
    id: 'coins25',
    label: 'Monedas',
    description: 'Ganás 25 monedas directas a tu saldo.',
    icon: '💰',
    kind: 'coins',
    weight: 10,
    amount: 25,
  },
  {
    id: 'coins50',
    label: 'Monedón',
    description: 'Ganás 50 monedas directas a tu saldo.',
    icon: '💵',
    kind: 'coins',
    weight: 5,
    amount: 50,
  },
  {
    id: 'pot',
    label: 'Bote variable',
    description: 'Un bote de monedas al azar, entre 20 y 150.',
    icon: '🎁',
    kind: 'coins',
    weight: 8,
    min: 20,
    max: 150,
  },
  {
    id: 'freePack',
    label: 'Sobre gratis',
    description: 'Un sobre de 5 figuritas, sin gastar monedas.',
    icon: '📦',
    kind: 'freePack',
    weight: 10,
  },
  {
    id: 'freeQuestion',
    label: 'Pregunta de bonus',
    description: 'Una pregunta de trivia que no gasta tu límite diario.',
    icon: '❓',
    kind: 'freeQuestion',
    weight: 15,
  },
  {
    id: 'allOrNothing',
    label: 'Todo o nada',
    description: 'Tu próxima apuesta acertada paga el doble.',
    icon: '🎯',
    kind: 'wagerBoost',
    weight: 8,
  },
  {
    id: 'extraSpin',
    label: 'Giro extra',
    description: 'Girás la ruleta de nuevo, ahora mismo, sin esperar.',
    icon: '🔄',
    kind: 'extraSpin',
    weight: 6,
  },
  {
    id: 'snorlax',
    label: 'Snorlax',
    description: 'Snorlax se durmió en el medio de la ruleta. No pasa nada.',
    icon: '😴',
    kind: 'nothing',
    weight: 12,
  },
  {
    id: 'voltorb',
    label: 'Voltorb',
    description: 'Voltorb explota y te hace perder 10 monedas.',
    icon: '💥',
    kind: 'loseCoins',
    weight: 6,
    amount: 10,
  },
  {
    id: 'electrode',
    label: 'Electrode',
    description: 'Electrode explota fuerte: perdés 20 monedas.',
    icon: '⚡',
    kind: 'loseCoins',
    weight: 3,
    amount: 20,
  },
  {
    id: 'jackpot',
    label: '¡Mewtwo!',
    description: 'El premio mayor: ganás 150 monedas de una.',
    icon: '🏆',
    kind: 'jackpot',
    weight: 1,
    amount: 150,
  },
]

const TOTAL_WEIGHT = ROULETTE_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0)

export function spinRoulette(rng: () => number): RouletteSegment {
  let roll = rng() * TOTAL_WEIGHT
  for (const seg of ROULETTE_SEGMENTS) {
    roll -= seg.weight
    if (roll <= 0) {
      return seg
    }
  }
  return ROULETTE_SEGMENTS[ROULETTE_SEGMENTS.length - 1]
}

export function rollSegmentAmount(segment: RouletteSegment, rng: () => number): number {
  if (segment.min !== undefined && segment.max !== undefined) {
    return segment.min + Math.floor(rng() * (segment.max - segment.min + 1))
  }
  return segment.amount ?? 0
}
