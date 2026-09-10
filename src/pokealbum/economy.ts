import type { Rarity } from './types'

export const PACK_COST = 150
export const PACK_RARE_COST = 10000
export const PACK_LEGENDARY_COST = 50000
export const PACK_SIZE = 5
export const STARTING_COINS = 0
export const TRIVIA_REWARD = 20

export const RECYCLE_COST = 5

// Duplicates of one specific species required to attempt its shiny challenge.
export const SHINY_CHALLENGE_DUPLICATES = 5
// Questions to answer, all correct, to unlock the shiny form — scales with rarity so common/
// uncommon species stay approachable while rare/legendary ones are a real gauntlet.
export const SHINY_CHALLENGE_QUESTION_COUNT: Record<Rarity, number> = {
  common: 5,
  uncommon: 7,
  rare: 10,
  legendary: 12,
}
// Response time budget per question, shrinking as the challenge escalates — the last question
// (always the hardest available) gets the least time. Never drops below 6s: several questions in
// the bank have long statements, and the point is a hard quiz, not an unreadable one.
export const SHINY_CHALLENGE_TIME_LIMITS_MS: Record<Rarity, number[]> = {
  common: [18000, 13000, 10000, 7000, 6000],
  uncommon: [18000, 14000, 11000, 9000, 8000, 7000, 6000],
  rare: [18000, 15000, 12000, 10500, 9000, 8000, 7500, 7000, 6500, 6000],
  legendary: [18000, 15000, 13000, 11500, 10500, 9500, 9000, 8500, 8000, 7500, 7000, 6000],
}

// Global cooldown between shiny attempts (any species) — without this, a player with a huge coin
// stockpile could buy their way to duplicates of every species and clear the whole shiny dex in
// one sitting. Paying SHINY_ATTEMPT_SKIP_COST skips the wait for that one attempt instead.
export const SHINY_ATTEMPT_COOLDOWN_MS = 20 * 60 * 1000
export const SHINY_ATTEMPT_SKIP_COST = 100000

export const DUPLICATE_SELL_VALUE: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  legendary: 150,
}

export const FREE_TRIVIA_DAILY_LIMIT = 20
export const TRIVIA_TIME_LIMIT_MS = 25000

export const SPIN_COOLDOWN_MS = 30 * 60 * 1000

export const DAILY_LOGIN_COINS = [10, 15, 20, 25, 30, 40]
export const DAILY_LOGIN_STREAK_LENGTH = 7
