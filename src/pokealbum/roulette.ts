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
  // Optional item-sprite icon shown instead of the emoji, when one fits the reward thematically.
  image?: string
  kind: RouletteRewardKind
  weight: number
  amount?: number
  min?: number
  max?: number
}

const ITEM_IMG = '/pokealbum/images/items/'
const SPRITE_IMG = '/pokealbum/images/pokemon/static/'

export const ROULETTE_SEGMENTS: RouletteSegment[] = [
  {
    id: 'coins10',
    label: 'Monedas',
    description: 'Ganás 10 monedas directas a tu saldo.',
    icon: '🪙',
    image: `${ITEM_IMG}nugget.png`,
    kind: 'coins',
    weight: 16,
    amount: 10,
  },
  {
    id: 'coins25',
    label: 'Monedas',
    description: 'Ganás 25 monedas directas a tu saldo.',
    icon: '💰',
    image: `${ITEM_IMG}big-nugget.png`,
    kind: 'coins',
    weight: 10,
    amount: 25,
  },
  {
    id: 'coins50',
    label: 'Monedón',
    description: 'Ganás 50 monedas directas a tu saldo.',
    icon: '💵',
    image: `${ITEM_IMG}coin-case.png`,
    kind: 'coins',
    weight: 5,
    amount: 50,
  },
  {
    id: 'pot',
    label: 'Bote variable',
    description: 'Un bote de monedas al azar, entre 20 y 150.',
    icon: '🎁',
    image: `${ITEM_IMG}rare-candy.png`,
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
    image: `${ITEM_IMG}poke-ball.png`,
    kind: 'freePack',
    weight: 10,
  },
  {
    id: 'freeQuestion',
    label: 'Pregunta de bonus',
    description: 'Una pregunta de trivia que no gasta tu límite diario.',
    icon: '❓',
    image: `${ITEM_IMG}exp-share.png`,
    kind: 'freeQuestion',
    weight: 15,
  },
  {
    id: 'allOrNothing',
    label: 'Todo o nada',
    description: 'Tu próxima apuesta acertada paga el doble.',
    icon: '🎯',
    image: `${ITEM_IMG}amulet-coin.png`,
    kind: 'wagerBoost',
    weight: 8,
  },
  {
    id: 'extraSpin',
    label: 'Giro extra',
    description: 'Girás la ruleta de nuevo, ahora mismo, sin esperar.',
    icon: '🔄',
    image: `${ITEM_IMG}premier-ball.png`,
    kind: 'extraSpin',
    weight: 6,
  },
  {
    id: 'snorlax',
    label: 'Snorlax',
    description: 'Snorlax se durmió en el medio de la ruleta. No pasa nada.',
    icon: '😴',
    image: `${SPRITE_IMG}143.png`,
    kind: 'nothing',
    weight: 12,
  },
  {
    id: 'voltorb',
    label: 'Voltorb',
    description: 'Voltorb explota y te hace perder 10 monedas.',
    icon: '💥',
    image: `${SPRITE_IMG}100.png`,
    kind: 'loseCoins',
    weight: 6,
    amount: 10,
  },
  {
    id: 'electrode',
    label: 'Electrode',
    description: 'Electrode explota fuerte: perdés 20 monedas.',
    icon: '⚡',
    image: `${SPRITE_IMG}101.png`,
    kind: 'loseCoins',
    weight: 3,
    amount: 20,
  },
  {
    id: 'jackpot',
    label: '¡Mewtwo!',
    description: 'El premio mayor: ganás 150 monedas de una.',
    icon: '🏆',
    image: `${ITEM_IMG}master-ball.png`,
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
