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

export const FREE_TRIVIA_DAILY_LIMIT = 20
export const TRIVIA_TIME_LIMIT_MS = 15000

export const SPIN_COOLDOWN_MS = 4 * 60 * 60 * 1000

export const DAILY_LOGIN_COINS = [10, 15, 20, 25, 30, 40]
export const DAILY_LOGIN_STREAK_LENGTH = 7
