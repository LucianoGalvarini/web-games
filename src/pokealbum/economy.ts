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
// (always the hardest available) gets the least time. Kept inside 10-15s: the questions and their
// options read long, and anything shorter didn't leave enough time to actually read them.
function rampMs(count: number, fromMs = 15000, toMs = 10000): number[] {
  if (count <= 1) {
    return [fromMs]
  }
  return Array.from({ length: count }, (_, i) => Math.round((fromMs + ((toMs - fromMs) * i) / (count - 1)) / 100) * 100)
}

export const SHINY_CHALLENGE_TIME_LIMITS_MS: Record<Rarity, number[]> = {
  common: rampMs(SHINY_CHALLENGE_QUESTION_COUNT.common),
  uncommon: rampMs(SHINY_CHALLENGE_QUESTION_COUNT.uncommon),
  rare: rampMs(SHINY_CHALLENGE_QUESTION_COUNT.rare),
  legendary: rampMs(SHINY_CHALLENGE_QUESTION_COUNT.legendary),
}

// Global cooldown between shiny attempts (any species) — without this, a player with a huge coin
// stockpile could buy their way to duplicates of every species and clear the whole shiny dex in
// one sitting. Paying a skip fee ignores the wait for that one attempt instead, without moving the
// cooldown's own end time: every skip paid inside the same 20-minute window doubles the price
// (100k, 200k, 400k...), so stacking skips back to back gets expensive fast. The window itself
// doesn't stretch — it still ends 20 minutes after whichever attempt opened it — and paying it
// forward never refunds/regenerates the duplicates a paid attempt consumes.
export const SHINY_ATTEMPT_COOLDOWN_MS = 20 * 60 * 1000
export const SHINY_ATTEMPT_SKIP_BASE_COST = 100000

// null means the price has grown past what can be represented/charged safely — treated as "no
// more skips available this window" rather than silently wrapping into a tiny or negative number.
export function shinySkipCostForPaidCount(paidSkipsInWindow: number): number | null {
  const cost = SHINY_ATTEMPT_SKIP_BASE_COST * 2 ** paidSkipsInWindow
  return Number.isSafeInteger(cost) ? cost : null
}

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
