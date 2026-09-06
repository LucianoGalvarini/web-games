import type { Rarity } from './types'

export const PACK_COST = 150
export const PACK_SIZE = 5
export const STARTING_COINS = 0
export const TRIVIA_REWARD = 20

export const RECYCLE_COST = 5

export const DUPLICATE_SELL_VALUE: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  legendary: 150,
}
