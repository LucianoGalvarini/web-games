import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DAILY_LOGIN_COINS,
  DAILY_LOGIN_STREAK_LENGTH,
  FREE_TRIVIA_DAILY_LIMIT,
  LEGENDARY_PACK_POOL,
  ROULETTE_SEGMENTS,
  PACK_COST,
  PACK_LEGENDARY_COST,
  PACK_RARE_COST,
  POKEMON,
  RARE_PACK_POOL,
  RECYCLE_COST,
  SHINY_ATTEMPT_COOLDOWN_MS,
  SHINY_CHALLENGE_DUPLICATES,
  SHINY_CHALLENGE_QUESTION_COUNT,
  SHINY_CHALLENGE_TIME_LIMITS_MS,
  SPIN_COOLDOWN_MS,
  STARTING_COINS,
  STAT_KEYS,
  STAT_LABEL,
  TRAINER_TRIVIA,
  TRIVIA_REWARD,
  TRIVIA_TIME_LIMIT_MS,
  TYPE_ES_BY_SLUG,
  applySticker,
  bestRarity,
  canAttemptShiny,
  consumeShinyAttempt,
  createInitialAlbum,
  creditDuplicate,
  decodeSave,
  encodeSave,
  evaluateNewAchievements,
  hasSignature,
  loadShinyQuestions,
  openPack,
  pickShinyChallengeQuestions,
  prettyLabel,
  progress,
  recycleDuplicates,
  rollSegmentAmount,
  sellAllDuplicates,
  sellDuplicate,
  shinySkipCostForPaidCount,
  signPayload,
  spinRoulette,
  unlockShiny,
  wasSignatureTampered,
} from '../pokealbum'
import type {
  Achievement,
  AchievementContext,
  AlbumState,
  PackResult,
  Rarity,
  RouletteSegment,
  ShinyQuestion,
  StatKey,
} from '../pokealbum'
import {
  consumeCheatWipeNotice,
  getCheatLockRemainingMs,
  startDevToolsWatch,
  triggerCheatLock,
  wipeAccountForCheating,
} from '../shared/anticheat'
import { playPackOpenSound, playPokemonCry, playSfx, stopPackOpenSound } from '../shared/sfx'

const SAVE_KEY = 'pokealbum-save'
const SIG_ACTIVE_KEY = 'pokealbum-sig-active'
const PAGE_SIZE = 9
export const PAGE_COUNT = Math.ceil(POKEMON.length / PAGE_SIZE)

const COMMON_MOVE_SLUGS = [
  'tackle',
  'scratch',
  'growl',
  'ember',
  'water-gun',
  'vine-whip',
  'thunder-shock',
  'gust',
  'bite',
  'quick-attack',
  'headbutt',
  'razor-leaf',
  'flamethrower',
  'hydro-pump',
  'solar-beam',
  'thunderbolt',
  'ice-beam',
  'psychic',
  'earthquake',
  'rock-slide',
  'dragon-rage',
  'shadow-ball',
  'sludge-bomb',
  'giga-drain',
  'stone-edge',
  'body-slam',
  'brick-break',
  'swords-dance',
  'recover',
  'toxic',
  'protect',
  'substitute',
  'double-team',
  'hyper-beam',
  'self-destruct',
  'explosion',
  'fire-blast',
  'blizzard',
  'thunder',
  'surf',
  'strength',
  'cut',
  'fly',
  'dig',
  'teleport',
  'confusion',
  'poison-sting',
  'peck',
  'wing-attack',
  'rage',
  'slam',
  'stomp',
  'hyper-fang',
  'sing',
  'supersonic',
  'disable',
  'agility',
  'take-down',
  'double-edge',
  'counter',
  'sand-attack',
]

export type PendingSticker = { id: number; isNew: boolean }
type RevealKind = 'pack' | 'recycle' | 'freePack' | 'rarePack' | 'legendaryPack'
export type RevealState =
  | { phase: 'closed' }
  | { phase: 'opening'; kind: RevealKind; rarity: Rarity }
  | { phase: 'revealed'; kind: RevealKind; items: PackResult }

export const OPENING_DURATION = 650
export const OPENING_DURATION_RARE = 1600
export const OPENING_DURATION_LEGENDARY = 2400
const PENDING_KEY = 'pokealbum-pending'
const REVEAL_STAGGER = 220

type TriviaSide = 'a' | 'b'
type StatComparator = 'more' | 'less'
export type TriviaMode = 'statPair' | 'trueFalse' | 'multipleChoice' | 'trainer'

type Facts = { stats: Record<StatKey, number>; types: string[]; moves: string[] }

export type TriviaState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready' | 'answered'
      mode: 'statPair'
      wager: number
      deadline: number
      aId: number
      bId: number
      statKey: StatKey
      comparator: StatComparator
      aValue?: number
      bValue?: number
      correct?: TriviaSide
      picked?: TriviaSide
      reward?: number
      timedOut?: boolean
    }
  | {
      status: 'ready' | 'answered'
      mode: 'trueFalse'
      wager: number
      deadline: number
      statement: string
      isTrue: boolean
      picked?: boolean
      reward?: number
      timedOut?: boolean
    }
  | {
      status: 'ready' | 'answered'
      mode: 'multipleChoice'
      wager: number
      deadline: number
      prompt: string
      options: string[]
      correctIndex: number
      picked?: number
      reward?: number
      timedOut?: boolean
    }
  | {
      status: 'ready' | 'answered'
      mode: 'trainer'
      wager: number
      deadline: number
      prompt: string
      options: string[]
      correctIndex: number
      picked?: number
      reward?: number
      timedOut?: boolean
    }

export type ShinyChallengeState =
  | { status: 'closed' }
  | { status: 'loading'; pokemonId: number }
  | { status: 'error'; pokemonId: number; message: string }
  | {
      status: 'ready' | 'answered'
      pokemonId: number
      questions: ShinyQuestion[]
      index: number
      deadline: number
      picked?: number
      correct?: boolean
      timedOut?: boolean
    }
  | { status: 'finished'; pokemonId: number; won: boolean }

function rarityOf(pokemonId: number): Rarity {
  return POKEMON.find((p) => p.id === pokemonId)?.rarity ?? 'common'
}

function shinyQuestionCountFor(pokemonId: number): number {
  return SHINY_CHALLENGE_QUESTION_COUNT[rarityOf(pokemonId)]
}

function shinyTimeLimitsFor(pokemonId: number): number[] {
  return SHINY_CHALLENGE_TIME_LIMITS_MS[rarityOf(pokemonId)]
}

function readSave(): AlbumState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const sigWasActive = localStorage.getItem(SIG_ACTIVE_KEY) === '1'
      const tampered = wasSignatureTampered(raw) || (sigWasActive && !hasSignature(raw))
      if (tampered) {
        wipeAccountForCheating()
        return createInitialAlbum(STARTING_COINS)
      }
      const decoded = decodeSave(raw)
      if (decoded) {
        return decoded
      }
    }
  } catch {
    /* privacy mode / quota, fall through to a fresh album */
  }
  return createInitialAlbum(STARTING_COINS)
}

function writeSave(state: AlbumState): void {
  try {
    localStorage.setItem(SAVE_KEY, encodeSave(state))
    localStorage.setItem(SIG_ACTIVE_KEY, '1')
  } catch {
    /* ignore quota */
  }
}

// Whether a save already existed before this session started — used to gate the one-time
// tie-bug compensation bonus to returning players only, not to brand-new saves created after
// the fix already shipped.
function hadExistingSaveAtLoad(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null
  } catch {
    return false
  }
}

const TIE_BUG_BONUS_KEY = 'pokealbum-tie-bug-bonus-claimed'
const TIE_BUG_BONUS_AMOUNT = 2000

function readTieBugBonusClaimed(): boolean {
  try {
    const raw = localStorage.getItem(TIE_BUG_BONUS_KEY)
    if (!raw) {
      return false
    }
    const parsed = JSON.parse(raw) as { claimed?: boolean; sig?: string }
    if (typeof parsed.claimed !== 'boolean') {
      return false
    }
    if (parsed.sig !== undefined && parsed.sig !== signPayload(`tieBugBonus|${parsed.claimed}`)) {
      // Tampered claim record (e.g. flipped back to false to re-claim) — treat as already
      // claimed so it can't be farmed, and wipe the account for the confirmed tamper attempt.
      wipeAccountForCheating()
      return true
    }
    return parsed.claimed
  } catch {
    return false
  }
}

function writeTieBugBonusClaimed(): void {
  try {
    localStorage.setItem(TIE_BUG_BONUS_KEY, JSON.stringify({ claimed: true, sig: signPayload('tieBugBonus|true') }))
  } catch {
    /* ignore quota */
  }
}

const TRIVIA_STATS_KEY = 'pokealbum-trivia-stats'

export type TriviaStatsState = {
  streak: number
  bestStreak: number
  correctTotal: number
  correctByMode: Record<TriviaMode, number>
  packsOpened: number
  recycleCount: number
  shinyWins: number
  unlocked: string[]
}

function initialTriviaStats(): TriviaStatsState {
  return {
    streak: 0,
    bestStreak: 0,
    correctTotal: 0,
    correctByMode: { statPair: 0, trueFalse: 0, multipleChoice: 0, trainer: 0 },
    packsOpened: 0,
    recycleCount: 0,
    shinyWins: 0,
    unlocked: [],
  }
}

// Pre-"trainer mode" signature format, kept so save data signed before that field existed still
// verifies correctly instead of being flagged as tampered. writeTriviaStats() always writes the
// current (shiny-inclusive) format, so old saves self-heal on the next write.
function triviaStatsSigLegacy(state: TriviaStatsState): string {
  const unlockedCanonical = [...state.unlocked].sort().join(',')
  return signPayload(
    `${state.streak}|${state.bestStreak}|${state.correctTotal}|${state.correctByMode.statPair}|${state.correctByMode.trueFalse}|${state.correctByMode.multipleChoice}|${state.packsOpened}|${state.recycleCount}|${unlockedCanonical}`,
  )
}

// Pre-"shiny challenge" signature format (trainer mode included, shinyWins not yet tracked).
function triviaStatsSigPreShiny(state: TriviaStatsState): string {
  const unlockedCanonical = [...state.unlocked].sort().join(',')
  return signPayload(
    `${state.streak}|${state.bestStreak}|${state.correctTotal}|${state.correctByMode.statPair}|${state.correctByMode.trueFalse}|${state.correctByMode.multipleChoice}|${state.correctByMode.trainer}|${state.packsOpened}|${state.recycleCount}|${unlockedCanonical}`,
  )
}

function triviaStatsSig(state: TriviaStatsState): string {
  const unlockedCanonical = [...state.unlocked].sort().join(',')
  return signPayload(
    `${state.streak}|${state.bestStreak}|${state.correctTotal}|${state.correctByMode.statPair}|${state.correctByMode.trueFalse}|${state.correctByMode.multipleChoice}|${state.correctByMode.trainer}|${state.packsOpened}|${state.recycleCount}|${state.shinyWins}|${unlockedCanonical}`,
  )
}

function readTriviaStats(): TriviaStatsState {
  try {
    const raw = localStorage.getItem(TRIVIA_STATS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TriviaStatsState> & { sig?: string }
      if (
        typeof parsed.streak === 'number' &&
        typeof parsed.bestStreak === 'number' &&
        typeof parsed.correctTotal === 'number' &&
        typeof parsed.correctByMode === 'object' &&
        parsed.correctByMode !== null &&
        typeof parsed.packsOpened === 'number' &&
        typeof parsed.recycleCount === 'number' &&
        Array.isArray(parsed.unlocked)
      ) {
        const state: TriviaStatsState = {
          streak: parsed.streak,
          bestStreak: parsed.bestStreak,
          correctTotal: parsed.correctTotal,
          correctByMode: {
            statPair: parsed.correctByMode.statPair ?? 0,
            trueFalse: parsed.correctByMode.trueFalse ?? 0,
            multipleChoice: parsed.correctByMode.multipleChoice ?? 0,
            trainer: parsed.correctByMode.trainer ?? 0,
          },
          packsOpened: parsed.packsOpened,
          recycleCount: parsed.recycleCount,
          shinyWins: typeof parsed.shinyWins === 'number' ? parsed.shinyWins : 0,
          unlocked: parsed.unlocked.filter((id): id is string => typeof id === 'string'),
        }
        if (
          parsed.sig !== undefined &&
          parsed.sig !== triviaStatsSig(state) &&
          parsed.sig !== triviaStatsSigPreShiny(state) &&
          parsed.sig !== triviaStatsSigLegacy(state)
        ) {
          wipeAccountForCheating()
          return initialTriviaStats()
        }
        return state
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return initialTriviaStats()
}

function writeTriviaStats(state: TriviaStatsState): void {
  try {
    localStorage.setItem(TRIVIA_STATS_KEY, JSON.stringify({ ...state, sig: triviaStatsSig(state) }))
  } catch {
    /* ignore quota */
  }
}

// Small, stepped bonus on top of the normal trivia reward while a correct-answer streak is alive —
// it only ever adds coins on a correct answer, so it can't be farmed by answering wrong on purpose.
function streakBonus(streak: number): number {
  if (streak >= 20) {
    return 40
  }
  if (streak >= 10) {
    return 20
  }
  if (streak >= 5) {
    return 10
  }
  if (streak >= 3) {
    return 5
  }
  return 0
}

const DAILY_TRIVIA_KEY = 'pokealbum-trivia-daily'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function dailyTriviaSig(date: string, count: number): string {
  return signPayload(`dailyTrivia|${date}|${count}`)
}

function readDailyFreeTrivia(): number {
  try {
    const raw = localStorage.getItem(DAILY_TRIVIA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { date?: string; count?: number; sig?: string }
      if (parsed.date === todayStr() && typeof parsed.count === 'number' && Number.isSafeInteger(parsed.count)) {
        if (parsed.sig !== undefined && parsed.sig !== dailyTriviaSig(parsed.date, parsed.count)) {
          wipeAccountForCheating()
          return 0
        }
        return Math.max(0, parsed.count)
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return 0
}

function writeDailyFreeTrivia(count: number): void {
  try {
    const date = todayStr()
    localStorage.setItem(DAILY_TRIVIA_KEY, JSON.stringify({ date, count, sig: dailyTriviaSig(date, count) }))
  } catch {
    /* ignore quota */
  }
}

const SPIN_KEY = 'pokealbum-roulette-last'
const SHINY_LAST_ATTEMPT_KEY = 'pokealbum-shiny-last-attempt'
// Paid skips inside the current 20-minute cooldown window (see startShinyChallenge) — resets to 0
// the moment a normal (unpaid) attempt opens a fresh window, not on a fixed schedule.
const SHINY_SKIP_PAID_KEY = 'pokealbum-shiny-skip-paid'
const BONUS_QUESTIONS_KEY = 'pokealbum-bonus-questions'
const WAGER_BOOST_KEY = 'pokealbum-wager-boost'
const DAILY_LOGIN_KEY = 'pokealbum-daily-login'

// Signed replacement for what used to be a bare number/timestamp in localStorage (bonus
// questions, wager boost, roulette/shiny cooldown timestamps) — those were the exact kind of
// value a player could edit straight from DevTools with no detection at all. A legacy bare value
// (or anything not shaped like {value, sig}) is treated as absent, not as tampering — only a
// present-but-wrong signature counts as confirmed evidence and wipes the account.
function signedValueSig(key: string, value: number): string {
  return signPayload(`${key}|${value}`)
}

function readSignedValue(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as { value?: number; sig?: string }
      if (typeof parsed.value === 'number' && Number.isSafeInteger(parsed.value)) {
        if (parsed.sig !== signedValueSig(key, parsed.value)) {
          wipeAccountForCheating()
          return null
        }
        return parsed.value
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return null
}

function writeSignedValue(key: string, value: number | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify({ value, sig: signedValueSig(key, value) }))
    }
  } catch {
    /* ignore quota */
  }
}

function readNumber(key: string): number {
  return Math.max(0, readSignedValue(key) ?? 0)
}

function writeNumber(key: string, value: number): void {
  writeSignedValue(key, value)
}

function readLastSpinAt(): number | null {
  return readSignedValue(SPIN_KEY)
}

function writeLastSpinAt(value: number | null): void {
  writeSignedValue(SPIN_KEY, value)
}

function readLastShinyAttemptAt(): number | null {
  return readSignedValue(SHINY_LAST_ATTEMPT_KEY)
}

function writeLastShinyAttemptAt(value: number | null): void {
  writeSignedValue(SHINY_LAST_ATTEMPT_KEY, value)
}

const WAGER_RESTRICTED_MODES_KEY = 'pokealbum-wager-restricted-modes'

// Once the player wins their first wager (any mode), every wager after that is restricted to
// "quién tiene más/menos" and "qué movimientos puede aprender" only — no more trainer trivia or
// verdadero/falso for money. This flag persists forever once set: failing a bet, reloading, or
// answering free questions never un-sets it, so it can't be farmed back down to the easy pool.
function readWagerRestrictedModesUnlocked(): boolean {
  return readNumber(WAGER_RESTRICTED_MODES_KEY) > 0
}

function writeWagerRestrictedModesUnlocked(): void {
  writeNumber(WAGER_RESTRICTED_MODES_KEY, 1)
}

// A generic alias with a naked type parameter is what makes this distribute over TriviaState's
// union: each idle/loading/error member fails the `status` check and drops out to `never`, while
// each of the four trivia-mode members matches and comes through with `status` narrowed to the
// literal 'ready' (Extract can't do this directly, since every real member's status is the union
// 'ready' | 'answered', not the literal 'ready' alone).
type ReadyOf<T> = T extends { status: 'ready' | 'answered'; wager: number } ? Omit<T, 'status'> & { status: 'ready' } : never
type ReadyWagerTrivia = ReadyOf<TriviaState>
const PENDING_WAGER_TRIVIA_KEY = 'pokealbum-wager-trivia-pending'

// Signs over a canonical (key-sorted) JSON string, not the object's natural field order, so the
// signature doesn't depend on which order the fields happened to be written in.
function pendingWagerTriviaSig(state: ReadyWagerTrivia): string {
  return signPayload(`wagerTrivia|${JSON.stringify(state, Object.keys(state).sort())}`)
}

// Persists an in-progress wagered question (not free ones — those have nothing at risk) so that
// reloading the page mid-question recovers the exact same question instead of silently discarding
// it. The wager is charged the moment the question becomes visible (see reserveWager below), so
// discarding it on reload would otherwise be a free way to dodge a bet you regret making.
function readPendingWagerTrivia(): TriviaState | null {
  try {
    const raw = localStorage.getItem(PENDING_WAGER_TRIVIA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: ReadyWagerTrivia; sig?: string }
      if (parsed.state && typeof parsed.state === 'object' && parsed.state.status === 'ready') {
        if (parsed.sig !== pendingWagerTriviaSig(parsed.state)) {
          wipeAccountForCheating()
          return null
        }
        return parsed.state
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return null
}

function writePendingWagerTrivia(state: ReadyWagerTrivia | null): void {
  try {
    if (state === null) {
      localStorage.removeItem(PENDING_WAGER_TRIVIA_KEY)
    } else {
      localStorage.setItem(PENDING_WAGER_TRIVIA_KEY, JSON.stringify({ state, sig: pendingWagerTriviaSig(state) }))
    }
  } catch {
    /* ignore quota */
  }
}

// Deducts the wager immediately, before the question is ever shown to the player — reloading
// after seeing a question you don't like can no longer dodge a bet you already committed to.
// Returns the updated album, or null if the balance no longer covers it (re-checked here, not
// just trusted from the click that started the request).
function reserveWagerFrom(album: AlbumState, wager: number): AlbumState | null {
  if (wager <= 0) {
    return album
  }
  if (album.coins < wager) {
    return null
  }
  return { ...album, coins: album.coins - wager }
}

type PendingSpin = { segment: RouletteSegment; amount: number }
const PENDING_SPIN_KEY = 'pokealbum-roulette-pending'

function pendingSpinSig(segmentId: string, amount: number): string {
  return signPayload(`pendingSpin|${segmentId}|${amount}`)
}

// Used to live only in memory: reloading before hitting "Reclamar" made a bad result vanish and
// left the spin free to try again. Persisting it means a reload recovers the exact same result —
// you can still claim it, you just can't reroll a landing you don't like by refreshing the page.
function readPendingSpin(): PendingSpin | null {
  try {
    const raw = localStorage.getItem(PENDING_SPIN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { segmentId?: string; amount?: number; sig?: string }
      if (
        typeof parsed.segmentId === 'string' &&
        typeof parsed.amount === 'number' &&
        Number.isSafeInteger(parsed.amount)
      ) {
        if (parsed.sig !== pendingSpinSig(parsed.segmentId, parsed.amount)) {
          wipeAccountForCheating()
          return null
        }
        const segment = ROULETTE_SEGMENTS.find((seg) => seg.id === parsed.segmentId)
        return segment ? { segment, amount: parsed.amount } : null
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return null
}

function writePendingSpin(value: PendingSpin | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(PENDING_SPIN_KEY)
    } else {
      localStorage.setItem(
        PENDING_SPIN_KEY,
        JSON.stringify({ segmentId: value.segment.id, amount: value.amount, sig: pendingSpinSig(value.segment.id, value.amount) }),
      )
    }
  } catch {
    /* ignore quota */
  }
}

type DailyLoginState = { lastClaimDate: string | null; streak: number }

function dailyLoginSig(streak: number, lastClaimDate: string | null): string {
  return signPayload(`${streak}|${lastClaimDate ?? ''}`)
}

function readDailyLogin(): DailyLoginState {
  try {
    const raw = localStorage.getItem(DAILY_LOGIN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyLoginState> & { sig?: string }
      if (typeof parsed.streak === 'number') {
        const lastClaimDate = parsed.lastClaimDate ?? null
        if (parsed.sig !== undefined && parsed.sig !== dailyLoginSig(parsed.streak, lastClaimDate)) {
          wipeAccountForCheating()
          return { lastClaimDate: null, streak: 0 }
        }
        return { lastClaimDate, streak: parsed.streak }
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return { lastClaimDate: null, streak: 0 }
}

function writeDailyLogin(state: DailyLoginState): void {
  try {
    localStorage.setItem(
      DAILY_LOGIN_KEY,
      JSON.stringify({ ...state, sig: dailyLoginSig(state.streak, state.lastClaimDate) }),
    )
  } catch {
    /* ignore quota */
  }
}

function yesterdayStr(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

const VALID_IDS = new Set(POKEMON.map((p) => p.id))

function isPendingSticker(value: unknown): value is PendingSticker {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as Record<string, unknown>
  return typeof item.id === 'number' && VALID_IDS.has(item.id) && typeof item.isNew === 'boolean'
}

function pendingSig(items: PendingSticker[]): string {
  const canonical = items.map((item) => `${item.id}:${item.isNew ? 1 : 0}`).join(',')
  return signPayload(`pending|${canonical}`)
}

// This used to be a bare unsigned array — exactly the hole that let a fabricated "pending
// Mewtwo, isNew: true" entry be planted from DevTools and then legitimately stuck into the album.
// The new signed shape doesn't recognize that old bare-array format at all (rather than trusting
// it), so it's discarded on the one release that migrates — a small, one-time cost (a not-yet-
// stuck new species from right before the update) worth paying to close the hole for good.
function readPending(): PendingSticker[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { items?: unknown; sig?: string }
      if (Array.isArray(parsed.items)) {
        const items = (parsed.items as unknown[]).filter(isPendingSticker)
        if (parsed.sig !== pendingSig(items)) {
          wipeAccountForCheating()
          return []
        }
        return items
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return []
}

function writePending(items: PendingSticker[]): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ items, sig: pendingSig(items) }))
  } catch {
    /* ignore quota */
  }
}

// Real Fisher–Yates — `array.sort(() => Math.random() - 0.5)` is a biased shuffle (some
// permutations come out more often than others), which is exactly the kind of "predictable
// pattern" this is meant to eliminate from option ordering.
function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function randomId(exclude?: number): number {
  let id = 1 + Math.floor(Math.random() * POKEMON.length)
  while (id === exclude) {
    id = 1 + Math.floor(Math.random() * POKEMON.length)
  }
  return id
}

// A "who has more/less" question has no fair answer when the stat is tied — prefer the stat that
// was already picked, but fall back to any stat that actually differs between the two Pokémon so
// the question is never unwinnable by construction.
function pickNonTiedStat(a: Facts, b: Facts, preferredKey: StatKey): StatKey {
  if (a.stats[preferredKey] !== b.stats[preferredKey]) {
    return preferredKey
  }
  const shuffled = shuffleInPlace([...STAT_KEYS])
  return shuffled.find((key) => a.stats[key] !== b.stats[key]) ?? preferredKey
}

// Hidden difficulty for "doble o nada", on a 0-5 scale. Never shown to the player — no badge, no
// warning, just harder pairs and a tighter clock. It's the max of three independent signals (a
// bigger bet always pushes the level up, never down, at equal history):
//  - how much is being staked in absolute coins
//  - what fraction of the player's balance that represents
//  - once the "modalidades restringidas" mode has kicked in (see wagerRestrictedModesUnlocked),
//    a floor of 1 — the exigent mode never falls back to the easiest questions
// ...plus streak pressure (consecutive wager wins) added on top. A dedicated rolling "N bets in
// the last 10 minutes" counter is deliberately not tracked here (it would need its own persisted,
// signed timestamp log): streak pressure already captures the case that actually matters — a
// player repeatedly winning wagers back to back — without the extra state and attack surface.
const WAGER_LEVEL_MAX = 5

function amountLevel(wager: number): number {
  if (wager < 100) return 0
  if (wager < 500) return 1
  if (wager < 2000) return 2
  if (wager < 10000) return 3
  if (wager < 50000) return 4
  return 5
}

function proportionLevel(wager: number, coinsBeforeReserve: number): number {
  if (coinsBeforeReserve <= 0) return 0
  const pct = wager / coinsBeforeReserve
  if (pct < 0.1) return 0
  if (pct < 0.25) return 1
  if (pct < 0.5) return 2
  if (pct < 0.75) return 3
  return 4
}

function streakPressure(priorWagerStreak: number): number {
  if (priorWagerStreak <= 1) return 0
  if (priorWagerStreak <= 3) return 1
  if (priorWagerStreak <= 6) return 2
  return 3
}

function computeWagerLevel(
  priorWagerStreak: number,
  coinsBeforeReserve: number,
  wager: number,
  restrictedModesUnlocked: boolean,
): number {
  if (wager <= 0) {
    return 0
  }
  const base = Math.max(amountLevel(wager), proportionLevel(wager, coinsBeforeReserve), restrictedModesUnlocked ? 1 : 0)
  return Math.min(WAGER_LEVEL_MAX, base + streakPressure(priorWagerStreak))
}

function timeLimitForLevel(level: number): number {
  const factor = [1, 0.9, 0.8, 0.7, 0.62, 0.55][level] ?? 0.55
  return Math.max(12000, Math.round(TRIVIA_TIME_LIMIT_MS * factor))
}

// Easy: pit an iconic (rare/legendary) Pokémon against a common one, so the stat gap tends to be
// obvious. Hard: restrict both sides to common/uncommon Pokémon, so there's no "it's a legendary,
// it must be bigger" shortcut and the numbers alone decide it.
function pickPairForLevel(level: number): [number, number] {
  if (level <= 0) {
    const iconicPool = POKEMON.filter((p) => p.rarity === 'legendary' || p.rarity === 'rare')
    const commonPool = POKEMON.filter((p) => p.rarity === 'common')
    if (iconicPool.length > 0 && commonPool.length > 0) {
      const iconic = iconicPool[Math.floor(Math.random() * iconicPool.length)].id
      const common = commonPool[Math.floor(Math.random() * commonPool.length)].id
      return Math.random() < 0.5 ? [iconic, common] : [common, iconic]
    }
  } else if (level >= 3) {
    const pool = POKEMON.filter((p) => p.rarity === 'common' || p.rarity === 'uncommon')
    if (pool.length >= 2) {
      const a = pool[Math.floor(Math.random() * pool.length)]
      let b = pool[Math.floor(Math.random() * pool.length)]
      let guard = 0
      while (b.id === a.id && guard < 10) {
        b = pool[Math.floor(Math.random() * pool.length)]
        guard += 1
      }
      return [a.id, b.id]
    }
  }
  const aId = randomId()
  const bId = randomId(aId)
  return [aId, bId]
}

function fetchFacts(id: number): Promise<Facts> {
  return fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error('bad status')
      }
      return res.json() as Promise<{
        stats: { base_stat: number; stat: { name: string } }[]
        types: { type: { name: string } }[]
        moves: { move: { name: string } }[]
      }>
    })
    .then((data) => {
      const stats = {} as Record<StatKey, number>
      for (const entry of data.stats) {
        if ((STAT_KEYS as readonly string[]).includes(entry.stat.name)) {
          stats[entry.stat.name as StatKey] = entry.base_stat
        }
      }
      const types = data.types.map((entry) => entry.type.name)
      const moves = data.moves.map((entry) => entry.move.name)
      return { stats, types, moves }
    })
}

function fetchMoveNameEs(slug: string): Promise<string> {
  return fetch(`https://pokeapi.co/api/v2/move/${slug}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error('bad status')
      }
      return res.json() as Promise<{ names: { name: string; language: { name: string } }[] }>
    })
    .then((data) => data.names.find((entry) => entry.language.name === 'es')?.name ?? prettyLabel(slug))
    .catch(() => prettyLabel(slug))
}

export function usePokeAlbum() {
  const hadPriorSave = useRef(hadExistingSaveAtLoad())
  const [album, setAlbum] = useState<AlbumState>(readSave)
  const [page, setPage] = useState(0)
  const [reveal, setReveal] = useState<RevealState>({ phase: 'closed' })
  const [pending, setPending] = useState<PendingSticker[]>(readPending)
  const [trivia, setTrivia] = useState<TriviaState>(() => readPendingWagerTrivia() ?? { status: 'idle' })
  const [wagerRestrictedModesUnlocked, setWagerRestrictedModesUnlocked] = useState(readWagerRestrictedModesUnlocked)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [freeTriviaUsed, setFreeTriviaUsed] = useState(readDailyFreeTrivia)
  const [bonusQuestions, setBonusQuestions] = useState(() => readNumber(BONUS_QUESTIONS_KEY))
  const [wagerBoost, setWagerBoost] = useState(() => readNumber(WAGER_BOOST_KEY))
  const [lastSpinAt, setLastSpinAt] = useState<number | null>(readLastSpinAt)
  const [pendingSpin, setPendingSpin] = useState<PendingSpin | null>(readPendingSpin)
  const [lastSpinResult, setLastSpinResult] = useState<{ segment: RouletteSegment; amount: number } | null>(null)
  const [dailyLogin, setDailyLogin] = useState<DailyLoginState>(readDailyLogin)
  const [cheatLockRemainingMs, setCheatLockRemainingMs] = useState<number>(getCheatLockRemainingMs)
  const [triviaStats, setTriviaStats] = useState<TriviaStatsState>(readTriviaStats)
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([])
  const [tieBugBonusGranted, setTieBugBonusGranted] = useState(false)
  const [wagerStreak, setWagerStreak] = useState(0)
  const [shinyChallenge, setShinyChallenge] = useState<ShinyChallengeState>({ status: 'closed' })
  const [lastShinyAttemptAt, setLastShinyAttemptAt] = useState<number | null>(readLastShinyAttemptAt)
  const [shinySkipsPaid, setShinySkipsPaid] = useState(() => readNumber(SHINY_SKIP_PAID_KEY))
  // Placed after every read*() call above so this reflects a wipe triggered by any of them during
  // this same initial render — module-level flag set synchronously, read once here.
  const [cheatWiped, setCheatWiped] = useState<boolean>(consumeCheatWipeNotice)
  const factsCache = useRef(new Map<number, Facts>())
  const moveNameCache = useRef(new Map<string, string>())
  const triviaRequest = useRef(0)
  const shinyRequest = useRef(0)
  const albumRef = useRef(album)
  const shinyChallengeRef = useRef(shinyChallenge)
  const triviaRef = useRef(trivia)
  const revealRef = useRef(reveal)
  const pendingRef = useRef(pending)
  const freeTriviaUsedRef = useRef(freeTriviaUsed)
  const bonusQuestionsRef = useRef(bonusQuestions)
  const wagerBoostRef = useRef(wagerBoost)
  const lastSpinAtRef = useRef(lastSpinAt)
  const lastShinyAttemptAtRef = useRef(lastShinyAttemptAt)
  const shinySkipsPaidRef = useRef(shinySkipsPaid)
  const pendingSpinRef = useRef(pendingSpin)
  const dailyLoginRef = useRef(dailyLogin)
  const triviaStatsRef = useRef(triviaStats)
  const wagerStreakRef = useRef(wagerStreak)
  const wagerRestrictedModesUnlockedRef = useRef(wagerRestrictedModesUnlocked)
  const cheatLockedRef = useRef(false)
  albumRef.current = album
  shinyChallengeRef.current = shinyChallenge
  triviaRef.current = trivia
  revealRef.current = reveal
  pendingRef.current = pending
  freeTriviaUsedRef.current = freeTriviaUsed
  bonusQuestionsRef.current = bonusQuestions
  wagerBoostRef.current = wagerBoost
  lastSpinAtRef.current = lastSpinAt
  lastShinyAttemptAtRef.current = lastShinyAttemptAt
  shinySkipsPaidRef.current = shinySkipsPaid
  pendingSpinRef.current = pendingSpin
  dailyLoginRef.current = dailyLogin
  triviaStatsRef.current = triviaStats
  wagerStreakRef.current = wagerStreak
  wagerRestrictedModesUnlockedRef.current = wagerRestrictedModesUnlocked
  cheatLockedRef.current = cheatLockRemainingMs > 0 || cheatWiped

  useEffect(() => {
    const stopDevToolsWatch = startDevToolsWatch(() => {
      triggerCheatLock()
      setCheatLockRemainingMs(getCheatLockRemainingMs())
    })
    const intervalId = window.setInterval(() => {
      setCheatLockRemainingMs(getCheatLockRemainingMs())
    }, 1000)
    return () => {
      stopDevToolsWatch()
      window.clearInterval(intervalId)
    }
  }, [])

  // currentAlbum is threaded through explicitly (never read from albumRef here) because these can
  // run synchronously right after a setAlbum() call in the same event handler, before React has
  // re-rendered and refreshed albumRef.current — reading the ref here would see stale data.
  const applyAchievementRewards = useCallback((newlyUnlocked: Achievement[], currentAlbum: AlbumState) => {
    if (newlyUnlocked.length === 0) {
      return
    }
    let coinDelta = 0
    let bonusDelta = 0
    let wagerDelta = 0
    for (const achievement of newlyUnlocked) {
      coinDelta += achievement.reward.coins ?? 0
      bonusDelta += achievement.reward.bonusQuestions ?? 0
      wagerDelta += achievement.reward.wagerBoost ?? 0
    }
    if (coinDelta !== 0) {
      const next = { ...currentAlbum, coins: currentAlbum.coins + coinDelta }
      writeSave(next)
      setAlbum(next)
    }
    if (bonusDelta !== 0) {
      const next = bonusQuestionsRef.current + bonusDelta
      bonusQuestionsRef.current = next
      writeNumber(BONUS_QUESTIONS_KEY, next)
      setBonusQuestions(next)
    }
    if (wagerDelta !== 0) {
      const next = wagerBoostRef.current + wagerDelta
      wagerBoostRef.current = next
      writeNumber(WAGER_BOOST_KEY, next)
      setWagerBoost(next)
    }
    const nextUnlocked = [...triviaStatsRef.current.unlocked, ...newlyUnlocked.map((a) => a.id)]
    const nextStats = { ...triviaStatsRef.current, unlocked: nextUnlocked }
    triviaStatsRef.current = nextStats
    writeTriviaStats(nextStats)
    setTriviaStats(nextStats)
    setAchievementQueue((prev) => [...prev, ...newlyUnlocked])
    playSfx('legendary')
  }, [])

  const checkAchievements = useCallback(
    (currentAlbum: AlbumState) => {
      const ctx: AchievementContext = {
        album: currentAlbum,
        triviaCorrectTotal: triviaStatsRef.current.correctTotal,
        triviaCorrectByMode: triviaStatsRef.current.correctByMode,
        bestTriviaStreak: triviaStatsRef.current.bestStreak,
        packsOpened: triviaStatsRef.current.packsOpened,
        recycleCount: triviaStatsRef.current.recycleCount,
        shinyWins: triviaStatsRef.current.shinyWins,
      }
      const unlockedSet = new Set(triviaStatsRef.current.unlocked)
      const newlyUnlocked = evaluateNewAchievements(ctx, unlockedSet)
      applyAchievementRewards(newlyUnlocked, currentAlbum)
    },
    [applyAchievementRewards],
  )

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((prev) => prev.slice(1))
  }, [])

  useEffect(() => {
    // currentAlbum is threaded through (not re-read from albumRef) so the achievement check below
    // sees the bonus coins immediately, instead of the stale pre-bonus value.
    let currentAlbum = albumRef.current
    if (hadPriorSave.current && !readTieBugBonusClaimed()) {
      currentAlbum = { ...currentAlbum, coins: currentAlbum.coins + TIE_BUG_BONUS_AMOUNT }
      writeSave(currentAlbum)
      setAlbum(currentAlbum)
      writeTieBugBonusClaimed()
      setTieBugBonusGranted(true)
    }
    if (consumeCheatWipeNotice()) {
      // wipeAccountForCheating() already cleared every pokealbum-* localStorage key — mirror that
      // in the in-memory state too so the screen reflects the wipe immediately, not just after the
      // player's next reload.
      currentAlbum = createInitialAlbum(STARTING_COINS)
      setAlbum(currentAlbum)
      setPending([])
      setTrivia({ status: 'idle' })
      setPage(0)
      setFreeTriviaUsed(0)
      setBonusQuestions(0)
      setWagerBoost(0)
      setLastSpinAt(null)
      setPendingSpin(null)
      setLastSpinResult(null)
      setDailyLogin({ lastClaimDate: null, streak: 0 })
      setTriviaStats(initialTriviaStats())
      setShinyChallenge({ status: 'closed' })
      setLastShinyAttemptAt(null)
      setShinySkipsPaid(0)
      setWagerRestrictedModesUnlocked(false)
      setConfirmingReset(false)
      setCheatWiped(true)
    }
    // Covers save codes imported from elsewhere, or players updating into this feature with an
    // album/trivia history that already satisfies some achievements.
    checkAchievements(currentAlbum)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissTieBugBonus = useCallback(() => {
    setTieBugBonusGranted(false)
  }, [])

  const goToPokemonPage = useCallback((id: number) => {
    const index = POKEMON.findIndex((p) => p.id === id)
    if (index >= 0) {
      setPage(Math.floor(index / PAGE_SIZE))
    }
  }, [])

  const playRevealSfx = useCallback((items: PackResult) => {
    items.forEach((item, i) => {
      window.setTimeout(() => {
        if (!item.isNew) {
          playSfx('dupPull')
          return
        }
        const rarity = POKEMON.find((p) => p.id === item.id)?.rarity
        playSfx(rarity === 'legendary' ? 'legendary' : rarity === 'rare' ? 'rarePull' : 'promote')
        window.setTimeout(() => playPokemonCry(item.id, 0.7), 180)
      }, i * REVEAL_STAGGER)
    })
  }, [])

  const applyDuplicatesFrom = useCallback((state: AlbumState, items: PackResult): AlbumState => {
    let next = state
    for (const item of items) {
      if (!item.isNew) {
        next = creditDuplicate(next, item.id)
      }
    }
    return next
  }, [])

  // A species still sitting in the pending "to stick" tray isn't marked owned yet, so
  // openPack would call it "new" again if drawn twice before the player sticks it. Treat
  // anything already pending as not-new so a second pull auto-credits a duplicate instead.
  const reclassifyAgainstPending = useCallback((items: PackResult): PackResult => {
    const pendingIds = new Set(pendingRef.current.map((item) => item.id))
    return items.map((item) => (item.isNew && pendingIds.has(item.id) ? { id: item.id, isNew: false } : item))
  }, [])

  const runPackReveal = useCallback(
    (afterCost: AlbumState, kind: RevealKind, pool?: typeof POKEMON) => {
      const { result: rawResult } = openPack(afterCost, Math.random, pool)
      const result = reclassifyAgainstPending(rawResult)
      const withDuplicates = applyDuplicatesFrom(afterCost, result)
      writeSave(withDuplicates)
      setAlbum(withDuplicates)
      const nextStats = { ...triviaStatsRef.current, packsOpened: triviaStatsRef.current.packsOpened + 1 }
      triviaStatsRef.current = nextStats
      writeTriviaStats(nextStats)
      setTriviaStats(nextStats)
      checkAchievements(withDuplicates)
      const rarity = bestRarity(result.map((item) => item.id))
      setReveal({ phase: 'opening', kind, rarity })
      const duration =
        rarity === 'legendary' ? OPENING_DURATION_LEGENDARY : rarity === 'rare' ? OPENING_DURATION_RARE : OPENING_DURATION
      playPackOpenSound()
      window.setTimeout(() => {
        setReveal({ phase: 'revealed', kind, items: result })
        playRevealSfx(result)
      }, duration)
    },
    [applyDuplicatesFrom, checkAchievements, playRevealSfx, reclassifyAgainstPending],
  )

  const openBooster = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const prev = albumRef.current
    if (prev.coins < PACK_COST) {
      return
    }
    const afterCost = { ...prev, coins: prev.coins - PACK_COST }
    runPackReveal(afterCost, 'pack')
  }, [runPackReveal])

  const openRarePack = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const prev = albumRef.current
    if (prev.coins < PACK_RARE_COST) {
      return
    }
    const afterCost = { ...prev, coins: prev.coins - PACK_RARE_COST }
    runPackReveal(afterCost, 'rarePack', RARE_PACK_POOL)
  }, [runPackReveal])

  const openLegendaryPack = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const prev = albumRef.current
    if (prev.coins < PACK_LEGENDARY_COST) {
      return
    }
    const afterCost = { ...prev, coins: prev.coins - PACK_LEGENDARY_COST }
    runPackReveal(afterCost, 'legendaryPack', LEGENDARY_PACK_POOL)
  }, [runPackReveal])

  const openFreePack = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    runPackReveal(albumRef.current, 'freePack')
  }, [runPackReveal])

  const spin = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const now = Date.now()
    if (lastSpinAtRef.current !== null && now - lastSpinAtRef.current < SPIN_COOLDOWN_MS) {
      return
    }
    if (pendingSpinRef.current !== null) {
      return
    }
    const segment = spinRoulette(Math.random)
    const amount = rollSegmentAmount(segment, Math.random)
    setLastSpinResult(null)
    setPendingSpin({ segment, amount })
    pendingSpinRef.current = { segment, amount }
    writePendingSpin({ segment, amount })
  }, [])

  const claimSpin = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const landed = pendingSpinRef.current
    if (!landed) {
      return
    }
    const { segment, amount } = landed

    if (segment.kind === 'coins' || segment.kind === 'jackpot') {
      const next = { ...albumRef.current, coins: albumRef.current.coins + amount }
      writeSave(next)
      setAlbum(next)
      playSfx(segment.kind === 'jackpot' ? 'legendary' : 'coin')
    } else if (segment.kind === 'loseCoins') {
      const next = { ...albumRef.current, coins: Math.max(0, albumRef.current.coins - amount) }
      writeSave(next)
      setAlbum(next)
      playSfx('wagerLose')
    } else if (segment.kind === 'freePack') {
      openFreePack()
    } else if (segment.kind === 'freeQuestion') {
      const next = bonusQuestionsRef.current + 1
      bonusQuestionsRef.current = next
      writeNumber(BONUS_QUESTIONS_KEY, next)
      setBonusQuestions(next)
      playSfx('coin')
    } else if (segment.kind === 'wagerBoost') {
      const next = wagerBoostRef.current + 1
      wagerBoostRef.current = next
      writeNumber(WAGER_BOOST_KEY, next)
      setWagerBoost(next)
      playSfx('coin')
    } else if (segment.kind === 'extraSpin') {
      playSfx('coin')
    } else {
      playSfx('hover')
    }

    if (segment.kind !== 'extraSpin') {
      const now = Date.now()
      lastSpinAtRef.current = now
      writeLastSpinAt(now)
      setLastSpinAt(now)
    }
    pendingSpinRef.current = null
    setPendingSpin(null)
    writePendingSpin(null)
    setLastSpinResult({ segment, amount })
  }, [openFreePack])

  const claimDailyLogin = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const current = dailyLoginRef.current
    const today = todayStr()
    if (current.lastClaimDate === today) {
      return
    }
    const continuesStreak = current.lastClaimDate === yesterdayStr()
    const nextDay = continuesStreak ? (current.streak % DAILY_LOGIN_STREAK_LENGTH) + 1 : 1
    const next: DailyLoginState = { lastClaimDate: today, streak: nextDay }
    writeDailyLogin(next)
    setDailyLogin(next)
    if (nextDay === DAILY_LOGIN_STREAK_LENGTH) {
      openFreePack()
    } else {
      const reward = DAILY_LOGIN_COINS[nextDay - 1]
      const withCoins = { ...albumRef.current, coins: albumRef.current.coins + reward }
      writeSave(withCoins)
      setAlbum(withCoins)
      playSfx('coin')
    }
  }, [openFreePack])

  const dismissReveal = useCallback(() => {
    stopPackOpenSound()
    const current = revealRef.current
    if (current.phase === 'revealed') {
      const newOnes = current.items.filter((item) => item.isNew).map((item) => ({ id: item.id, isNew: true }))
      if (newOnes.length > 0) {
        const nextPending = [...pendingRef.current, ...newOnes]
        writePending(nextPending)
        setPending(nextPending)
        goToPokemonPage(newOnes[0].id)
      }
    }
    setReveal({ phase: 'closed' })
  }, [goToPokemonPage])

  const stickPending = useCallback((id: number) => {
    if (cheatLockedRef.current) {
      return
    }
    const current = pendingRef.current
    const index = current.findIndex((item) => item.id === id)
    if (index === -1) {
      return
    }
    // Recompute new-vs-duplicate at stick time (not from the stale pull-time flag): if a
    // second pending copy of the same species gets stuck after the first, it must count as
    // a duplicate now that the species is owned, instead of silently vanishing.
    const wasOwned = albumRef.current.entries[id].owned
    const nextAlbum = applySticker(albumRef.current, { id, isNew: !wasOwned })
    writeSave(nextAlbum)
    setAlbum(nextAlbum)
    checkAchievements(nextAlbum)
    const isLegendary = POKEMON.find((p) => p.id === id)?.rarity === 'legendary'
    playSfx(!wasOwned && isLegendary ? 'legendary' : 'sticker')
    const nextPending = current.filter((_, i) => i !== index)
    writePending(nextPending)
    setPending(nextPending)
    if (nextPending.length === 0) {
      window.setTimeout(() => playSfx('placeAll'), 150)
    }
  }, [checkAchievements])

  const goToNextPending = useCallback(() => {
    const first = pendingRef.current[0]
    if (first) {
      goToPokemonPage(first.id)
    }
  }, [goToPokemonPage])

  const goToNextDuplicate = useCallback(() => {
    const pagesWithDuplicates = new Set<number>()
    for (const p of POKEMON) {
      if (albumRef.current.entries[p.id].duplicates > 0) {
        pagesWithDuplicates.add(Math.floor((p.id - 1) / PAGE_SIZE))
      }
    }
    if (pagesWithDuplicates.size === 0) {
      return
    }
    const sorted = [...pagesWithDuplicates].sort((a, b) => a - b)
    const next = sorted.find((pg) => pg > page) ?? sorted[0]
    setPage(next)
  }, [page])

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(0, Math.min(PAGE_COUNT - 1, next)))
  }, [])

  const fetchFactsCached = useCallback(async (id: number): Promise<Facts> => {
    const cached = factsCache.current.get(id)
    if (cached) {
      return cached
    }
    const facts = await fetchFacts(id)
    factsCache.current.set(id, facts)
    return facts
  }, [])

  const fetchMoveNameEsCached = useCallback(async (slug: string): Promise<string> => {
    const cached = moveNameCache.current.get(slug)
    if (cached) {
      return cached
    }
    const name = await fetchMoveNameEs(slug)
    moveNameCache.current.set(slug, name)
    return name
  }, [])

  const sellDup = useCallback((id: number) => {
    if (cheatLockedRef.current) {
      return
    }
    const next = sellDuplicate(albumRef.current, id)
    if (!next) {
      return
    }
    writeSave(next)
    setAlbum(next)
    playSfx('coin')
  }, [])

  const sellAllDup = useCallback(() => {
    if (cheatLockedRef.current) {
      return
    }
    const outcome = sellAllDuplicates(albumRef.current)
    if (!outcome) {
      return
    }
    writeSave(outcome.state)
    setAlbum(outcome.state)
    playSfx('coin')
  }, [])

  const recycleDup = useCallback(
    () => {
      if (cheatLockedRef.current) {
        return
      }
      const outcome = recycleDuplicates(albumRef.current, Math.random)
      if (!outcome) {
        return
      }
      const items: PackResult = reclassifyAgainstPending([outcome.result])
      const withDuplicate = applyDuplicatesFrom(outcome.state, items)
      writeSave(withDuplicate)
      setAlbum(withDuplicate)
      const nextStats = { ...triviaStatsRef.current, recycleCount: triviaStatsRef.current.recycleCount + 1 }
      triviaStatsRef.current = nextStats
      writeTriviaStats(nextStats)
      setTriviaStats(nextStats)
      checkAchievements(withDuplicate)
      const rarity = bestRarity(items.map((item) => item.id))
      setReveal({ phase: 'opening', kind: 'recycle', rarity })
      const duration =
        rarity === 'legendary' ? OPENING_DURATION_LEGENDARY : rarity === 'rare' ? OPENING_DURATION_RARE : OPENING_DURATION
      playSfx(rarity === 'legendary' ? 'packLegendary' : rarity === 'rare' ? 'packRare' : 'recycle')
      window.setTimeout(() => {
        setReveal({ phase: 'revealed', kind: 'recycle', items })
        playRevealSfx(items)
      }, duration)
    },
    [applyDuplicatesFrom, checkAchievements, playRevealSfx, reclassifyAgainstPending],
  )

  const startTrivia = useCallback(
    (wager: number) => {
      if (cheatLockedRef.current) {
        return
      }
      const coinsBeforeReserve = albumRef.current.coins
      if (!Number.isSafeInteger(wager) || wager < 0 || wager > coinsBeforeReserve) {
        return
      }
      if (wager === 0) {
        if (bonusQuestionsRef.current > 0) {
          const nextBonus = bonusQuestionsRef.current - 1
          bonusQuestionsRef.current = nextBonus
          writeNumber(BONUS_QUESTIONS_KEY, nextBonus)
          setBonusQuestions(nextBonus)
        } else if (freeTriviaUsedRef.current >= FREE_TRIVIA_DAILY_LIMIT) {
          return
        } else {
          const nextUsed = freeTriviaUsedRef.current + 1
          freeTriviaUsedRef.current = nextUsed
          writeDailyFreeTrivia(nextUsed)
          setFreeTriviaUsed(nextUsed)
        }
      }
      const restricted = wager > 0 && wagerRestrictedModesUnlockedRef.current
      const level = computeWagerLevel(wagerStreakRef.current, coinsBeforeReserve, wager, restricted)
      const nextWagerStreak = wager > 0 ? wagerStreakRef.current + 1 : 0
      wagerStreakRef.current = nextWagerStreak
      setWagerStreak(nextWagerStreak)
      const timeLimit = timeLimitForLevel(level)

      const requestId = triviaRequest.current + 1
      triviaRequest.current = requestId
      setTrivia({ status: 'loading' })

      // Charges the wager (if any) the instant the question actually becomes visible, and — for a
      // wager — persists it so a reload recovers this exact question instead of letting the player
      // dodge a bet they've already seen. Returns false (and surfaces an error) if the balance no
      // longer covers it, which is re-checked here rather than trusted from the click.
      const commitReady = (state: ReadyWagerTrivia): boolean => {
        const reserved = reserveWagerFrom(albumRef.current, state.wager)
        if (!reserved) {
          setTrivia({ status: 'error', message: 'Ya no tenés suficientes monedas para esa apuesta.' })
          return false
        }
        if (state.wager > 0) {
          writeSave(reserved)
          setAlbum(reserved)
          writePendingWagerTrivia(state)
        }
        setTrivia(state)
        return true
      }

      const modePool: TriviaMode[] = restricted
        ? ['statPair', 'multipleChoice']
        : level >= 3
          ? ['statPair', 'trueFalse', 'multipleChoice', 'trainer']
          : ['statPair', 'trueFalse', 'multipleChoice']
      const mode: TriviaMode = modePool[Math.floor(Math.random() * modePool.length)]

      if (mode === 'trainer') {
        const item = TRAINER_TRIVIA[Math.floor(Math.random() * TRAINER_TRIVIA.length)]
        commitReady({
          status: 'ready',
          mode: 'trainer',
          wager,
          deadline: Date.now() + timeLimit,
          prompt: item.prompt,
          options: item.options,
          correctIndex: item.correctIndex,
        })
        return
      }

      if (mode === 'statPair') {
        const [aId, bId] = pickPairForLevel(level)
        const statKey = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]
        const comparator: StatComparator = Math.random() < 0.5 ? 'more' : 'less'
        Promise.all([fetchFactsCached(aId), fetchFactsCached(bId)])
          .then(([a, b]) => {
            if (triviaRequest.current !== requestId) {
              return
            }
            const resolvedStatKey = pickNonTiedStat(a, b, statKey)
            const aValue = a.stats[resolvedStatKey]
            const bValue = b.stats[resolvedStatKey]
            const aIsMore = aValue > bValue
            commitReady({
              status: 'ready',
              mode: 'statPair',
              wager,
              deadline: Date.now() + timeLimit,
              aId,
              bId,
              statKey: resolvedStatKey,
              comparator,
              aValue,
              bValue,
              correct: (comparator === 'more' ? aIsMore : !aIsMore) ? 'a' : 'b',
            })
          })
          .catch(() => {
            if (triviaRequest.current !== requestId) {
              return
            }
            setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
          })
        return
      }

      if (mode === 'trueFalse') {
        const aId = randomId()
        const useType = Math.random() < 0.5
        if (useType) {
          fetchFactsCached(aId)
            .then((a) => {
              if (triviaRequest.current !== requestId) {
                return
              }
              const realTypes = a.types
              const claimTrue = Math.random() < 0.5
              let claimedSlug: string
              if (claimTrue) {
                claimedSlug = realTypes[Math.floor(Math.random() * realTypes.length)]
              } else {
                const otherSlugs = Object.keys(TYPE_ES_BY_SLUG).filter((slug) => !realTypes.includes(slug))
                claimedSlug = otherSlugs[Math.floor(Math.random() * otherSlugs.length)] ?? realTypes[0]
              }
              const claimedLabel = TYPE_ES_BY_SLUG[claimedSlug] ?? claimedSlug
              const name = POKEMON.find((p) => p.id === aId)?.name ?? `#${aId}`
              commitReady({
                status: 'ready',
                mode: 'trueFalse',
                wager,
                deadline: Date.now() + timeLimit,
                statement: `${name} es de tipo ${claimedLabel}.`,
                isTrue: realTypes.includes(claimedSlug),
              })
            })
            .catch(() => {
              if (triviaRequest.current !== requestId) {
                return
              }
              setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
            })
        } else {
          const [aId2, bId] = pickPairForLevel(level)
          const statKey = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]
          Promise.all([fetchFactsCached(aId2), fetchFactsCached(bId)])
            .then(([a, b]) => {
              if (triviaRequest.current !== requestId) {
                return
              }
              const resolvedStatKey = pickNonTiedStat(a, b, statKey)
              const aValue = a.stats[resolvedStatKey]
              const bValue = b.stats[resolvedStatKey]
              const claimMore = Math.random() < 0.5
              const nameA = POKEMON.find((p) => p.id === aId2)?.name ?? `#${aId2}`
              const nameB = POKEMON.find((p) => p.id === bId)?.name ?? `#${bId}`
              const label = STAT_LABEL[resolvedStatKey]
              const actuallyMore = aValue > bValue
              commitReady({
                status: 'ready',
                mode: 'trueFalse',
                wager,
                deadline: Date.now() + timeLimit,
                statement: `${nameA} tiene ${claimMore ? 'más' : 'menos'} ${label} que ${nameB}.`,
                isTrue: claimMore ? actuallyMore : !actuallyMore,
              })
            })
            .catch(() => {
              if (triviaRequest.current !== requestId) {
                return
              }
              setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
            })
        }
        return
      }

      const aId = randomId()
      fetchFactsCached(aId)
        .then((a) => {
          if (triviaRequest.current !== requestId) {
            return
          }
          const ownMoves = a.moves
          const hardDistractors = level >= 3
          const buildOptions = (distractorPool: string[]) => {
            if (ownMoves.length === 0 || distractorPool.length < 3) {
              setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
              return
            }
            const realMove = ownMoves[Math.floor(Math.random() * ownMoves.length)]
            const distractors = new Set<string>()
            let guard = 0
            while (distractors.size < 3 && guard < 60) {
              distractors.add(distractorPool[Math.floor(Math.random() * distractorPool.length)])
              guard += 1
            }
            if (distractors.size < 3) {
              setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
              return
            }
            const slugs = shuffleInPlace([realMove, ...distractors])
            const correctIndex = slugs.indexOf(realMove)
            const name = POKEMON.find((p) => p.id === aId)?.name ?? `#${aId}`
            Promise.all(slugs.map(fetchMoveNameEsCached))
              .then((options) => {
                if (triviaRequest.current !== requestId) {
                  return
                }
                // Two different move slugs can occasionally translate to the same displayed
                // Spanish name — that would silently create a second "correct-looking" option, so
                // bail out to a retryable error instead of serving an ambiguous question.
                if (new Set(options).size !== options.length) {
                  setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
                  return
                }
                commitReady({
                  status: 'ready',
                  mode: 'multipleChoice',
                  wager,
                  deadline: Date.now() + timeLimit,
                  prompt: `¿Cuál de estos movimientos puede aprender ${name}?`,
                  options,
                  correctIndex,
                })
              })
              .catch(() => {
                if (triviaRequest.current !== requestId) {
                  return
                }
                setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
              })
          }
          if (hardDistractors) {
            // Distractors pulled from a real Pokémon's actual moves are far more plausible than
            // COMMON_MOVE_SLUGS' generic pool, since they're all genuinely learnable moves too.
            fetchFactsCached(randomId(aId))
              .then((decoy) => buildOptions(decoy.moves.filter((slug) => !ownMoves.includes(slug))))
              .catch(() => buildOptions(COMMON_MOVE_SLUGS.filter((slug) => !ownMoves.includes(slug))))
          } else {
            buildOptions(COMMON_MOVE_SLUGS.filter((slug) => !ownMoves.includes(slug)))
          }
        })
        .catch(() => {
          if (triviaRequest.current !== requestId) {
            return
          }
          setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
        })
    },
    [fetchFactsCached, fetchMoveNameEsCached],
  )

  const applyTriviaOutcome = useCallback(
    (isCorrect: boolean, wager: number, mode: TriviaMode) => {
      let boosted = false
      if (wager > 0 && isCorrect && wagerBoostRef.current > 0) {
        boosted = true
        const nextBoost = wagerBoostRef.current - 1
        wagerBoostRef.current = nextBoost
        writeNumber(WAGER_BOOST_KEY, nextBoost)
        setWagerBoost(nextBoost)
      }

      const prevStats = triviaStatsRef.current
      const nextStreak = isCorrect ? prevStats.streak + 1 : 0
      // The free-trivia streak bonus is a reward for playing free questions well — a wager already
      // pays out its own win/loss, so it shouldn't also collect this on top (that was double-dipping).
      const streakCoinBonus = wager === 0 && isCorrect ? streakBonus(nextStreak) : 0
      const nextStats: TriviaStatsState = {
        ...prevStats,
        streak: nextStreak,
        bestStreak: Math.max(prevStats.bestStreak, nextStreak),
        correctTotal: prevStats.correctTotal + (isCorrect ? 1 : 0),
        correctByMode: {
          ...prevStats.correctByMode,
          [mode]: prevStats.correctByMode[mode] + (isCorrect ? 1 : 0),
        },
      }
      triviaStatsRef.current = nextStats
      writeTriviaStats(nextStats)
      setTriviaStats(nextStats)

      // The wager (if any) was already deducted the moment the question became visible (see
      // commitReady in startTrivia), so a win now credits back the stake plus its profit — not
      // just the profit — and a loss credits back nothing (the stake is already gone). `reward`
      // is what the UI shows ("ganaste/perdiste N monedas") and stays the net win/loss either way;
      // `coinsDelta` is the actual adjustment applied on top of the already-reserved balance.
      const reward = wager > 0 ? (isCorrect ? wager * (boosted ? 2 : 1) : -wager) : isCorrect ? TRIVIA_REWARD : 0
      const coinsDelta =
        wager > 0 ? (isCorrect ? wager + wager * (boosted ? 2 : 1) : 0) : reward + streakCoinBonus
      const currentAlbum =
        coinsDelta !== 0 ? { ...albumRef.current, coins: albumRef.current.coins + coinsDelta } : albumRef.current
      if (coinsDelta !== 0) {
        writeSave(currentAlbum)
        setAlbum(currentAlbum)
      }
      if (wager > 0) {
        writePendingWagerTrivia(null)
        if (isCorrect && !wagerRestrictedModesUnlockedRef.current) {
          wagerRestrictedModesUnlockedRef.current = true
          writeWagerRestrictedModesUnlocked()
          setWagerRestrictedModesUnlocked(true)
        }
        playSfx(isCorrect ? 'wagerWin' : 'wagerLose')
      } else {
        playSfx(isCorrect ? 'coin' : 'error')
      }
      checkAchievements(currentAlbum)
      return reward + (wager === 0 ? streakCoinBonus : 0)
    },
    [checkAchievements],
  )

  const expireTrivia = useCallback(() => {
    const prev = triviaRef.current
    if (prev.status !== 'ready') {
      return
    }
    const reward = applyTriviaOutcome(false, prev.wager, prev.mode)
    setTrivia({ ...prev, status: 'answered', reward, timedOut: true })
  }, [applyTriviaOutcome])

  const answerStatPair = useCallback(
    (picked: TriviaSide) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'statPair') {
        return
      }
      // Re-checked here, not just trusted from the visual countdown — a paused tab or a deferred
      // click otherwise lets an answer land (and pay out) well past when it should have expired.
      const isLate = Date.now() > prev.deadline
      const isCorrect = !isLate && picked === prev.correct
      const reward = applyTriviaOutcome(isCorrect, prev.wager, prev.mode)
      setTrivia({ ...prev, status: 'answered', picked, reward, timedOut: isLate })
    },
    [applyTriviaOutcome],
  )

  const answerTrueFalse = useCallback(
    (picked: boolean) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'trueFalse') {
        return
      }
      const isLate = Date.now() > prev.deadline
      const isCorrect = !isLate && picked === prev.isTrue
      const reward = applyTriviaOutcome(isCorrect, prev.wager, prev.mode)
      setTrivia({ ...prev, status: 'answered', picked, reward, timedOut: isLate })
    },
    [applyTriviaOutcome],
  )

  const answerMultipleChoice = useCallback(
    (picked: number) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'multipleChoice') {
        return
      }
      const isLate = Date.now() > prev.deadline
      const isCorrect = !isLate && picked === prev.correctIndex
      const reward = applyTriviaOutcome(isCorrect, prev.wager, prev.mode)
      setTrivia({ ...prev, status: 'answered', picked, reward, timedOut: isLate })
    },
    [applyTriviaOutcome],
  )

  const answerTrainer = useCallback(
    (picked: number) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'trainer') {
        return
      }
      const isLate = Date.now() > prev.deadline
      const isCorrect = !isLate && picked === prev.correctIndex
      const reward = applyTriviaOutcome(isCorrect, prev.wager, prev.mode)
      setTrivia({ ...prev, status: 'answered', picked, reward, timedOut: isLate })
    },
    [applyTriviaOutcome],
  )

  const resetTrivia = useCallback(() => setTrivia({ status: 'idle' }), [])

  // Global cooldown across all species: without it, a stockpiled coin balance could buy enough
  // packs to farm duplicates of every species and clear the whole shiny dex in one sitting.
  // paySkip pays to ignore the cooldown for this one attempt without moving when the cooldown
  // itself ends — every skip paid inside that same window doubles the price (100k, 200k, 400k...).
  // The cheap initial check below is just a fast-path UI gate; the real charge/cooldown check runs
  // again right before spending anything, after the async question fetch, since the window can
  // expire (or another attempt can land) while that fetch is in flight.
  const startShinyChallenge = useCallback((pokemonId: number, paySkip: boolean = false) => {
    if (cheatLockedRef.current) {
      return
    }
    if (!canAttemptShiny(albumRef.current, pokemonId)) {
      return
    }
    const now = Date.now()
    const onCooldown =
      lastShinyAttemptAtRef.current !== null && now - lastShinyAttemptAtRef.current < SHINY_ATTEMPT_COOLDOWN_MS
    if (onCooldown && !paySkip) {
      return
    }
    const requestId = shinyRequest.current + 1
    shinyRequest.current = requestId
    setShinyChallenge({ status: 'loading', pokemonId })
    loadShinyQuestions()
      .then((dataset) => {
        if (shinyRequest.current !== requestId) {
          return
        }
        const pool = dataset.get(pokemonId)
        const questionCount = shinyQuestionCountFor(pokemonId)
        if (!pool || pool.length < questionCount) {
          setShinyChallenge({ status: 'error', pokemonId, message: 'No hay suficientes preguntas para este Pokémon.' })
          return
        }
        // Re-check cooldown/price against the latest state right before charging anything — the
        // fetch above is async, so the window may have ended (or another attempt may have already
        // run) since the check above.
        const chargeNow = Date.now()
        const stillOnCooldown =
          lastShinyAttemptAtRef.current !== null && chargeNow - lastShinyAttemptAtRef.current < SHINY_ATTEMPT_COOLDOWN_MS
        let withSkipFee = albumRef.current
        let nextSkipsPaid = shinySkipsPaidRef.current
        if (stillOnCooldown) {
          if (!paySkip) {
            setShinyChallenge({ status: 'error', pokemonId, message: 'Todavía estás en el tiempo de espera del desafío.' })
            return
          }
          const skipCost = shinySkipCostForPaidCount(shinySkipsPaidRef.current)
          if (skipCost === null) {
            setShinyChallenge({
              status: 'error',
              pokemonId,
              message: 'Ya no se puede pagar otro salto en esta ventana. Esperá a que termine el tiempo.',
            })
            return
          }
          if (albumRef.current.coins < skipCost) {
            setShinyChallenge({ status: 'error', pokemonId, message: 'Ya no tenés suficientes monedas para pagar el salto.' })
            return
          }
          withSkipFee = { ...albumRef.current, coins: albumRef.current.coins - skipCost }
          nextSkipsPaid = shinySkipsPaidRef.current + 1
        } else {
          nextSkipsPaid = 0
        }
        // Duplicates only, paid only once we know the questions actually loaded — a network
        // failure shouldn't burn the player's 5 duplicates (or the skip fee) for nothing.
        const afterCost = consumeShinyAttempt(withSkipFee, pokemonId)
        if (!afterCost) {
          setShinyChallenge({
            status: 'error',
            pokemonId,
            message: 'Ya no tenés suficientes repetidas para este desafío.',
          })
          return
        }
        writeSave(afterCost)
        setAlbum(afterCost)
        shinySkipsPaidRef.current = nextSkipsPaid
        writeNumber(SHINY_SKIP_PAID_KEY, nextSkipsPaid)
        setShinySkipsPaid(nextSkipsPaid)
        // Only a normal (unpaid) attempt opens/renews the 20-minute window — a paid skip rides out
        // the window that's already running, it doesn't restart the clock.
        if (!stillOnCooldown) {
          lastShinyAttemptAtRef.current = chargeNow
          writeLastShinyAttemptAt(chargeNow)
          setLastShinyAttemptAt(chargeNow)
        }
        const questions = pickShinyChallengeQuestions(pool, Math.random, questionCount)
        setShinyChallenge({
          status: 'ready',
          pokemonId,
          questions,
          index: 0,
          deadline: Date.now() + shinyTimeLimitsFor(pokemonId)[0],
        })
      })
      .catch(() => {
        if (shinyRequest.current !== requestId) {
          return
        }
        setShinyChallenge({ status: 'error', pokemonId, message: 'No se pudo cargar el desafío shiny. Probá de nuevo.' })
      })
  }, [])

  const finishShinyChallenge = useCallback(
    (pokemonId: number, won: boolean) => {
      if (won) {
        const next = unlockShiny(albumRef.current, pokemonId)
        writeSave(next)
        setAlbum(next)
        playSfx('legendary')
        const nextStats = { ...triviaStatsRef.current, shinyWins: triviaStatsRef.current.shinyWins + 1 }
        triviaStatsRef.current = nextStats
        writeTriviaStats(nextStats)
        setTriviaStats(nextStats)
        checkAchievements(next)
      }
      setShinyChallenge({ status: 'finished', pokemonId, won })
    },
    [checkAchievements],
  )

  const answerShinyQuestion = useCallback((picked: number) => {
    const prev = shinyChallengeRef.current
    if (prev.status !== 'ready') {
      return
    }
    const question = prev.questions[prev.index]
    const isLate = Date.now() > prev.deadline
    const correct = !isLate && picked === question.answerIndex
    playSfx(correct ? 'wagerWin' : 'wagerLose')
    setShinyChallenge({ ...prev, status: 'answered', picked, correct, timedOut: isLate })
  }, [])

  const expireShinyQuestion = useCallback(() => {
    const prev = shinyChallengeRef.current
    if (prev.status !== 'ready') {
      return
    }
    playSfx('wagerLose')
    setShinyChallenge({ ...prev, status: 'answered', correct: false, timedOut: true })
  }, [])

  const continueShinyChallenge = useCallback(() => {
    const prev = shinyChallengeRef.current
    if (prev.status !== 'answered') {
      return
    }
    if (!prev.correct) {
      finishShinyChallenge(prev.pokemonId, false)
      return
    }
    const nextIndex = prev.index + 1
    if (nextIndex >= prev.questions.length) {
      finishShinyChallenge(prev.pokemonId, true)
      return
    }
    setShinyChallenge({
      status: 'ready',
      pokemonId: prev.pokemonId,
      questions: prev.questions,
      index: nextIndex,
      deadline: Date.now() + shinyTimeLimitsFor(prev.pokemonId)[nextIndex],
    })
  }, [finishShinyChallenge])

  const closeShinyChallenge = useCallback(() => setShinyChallenge({ status: 'closed' }), [])

  const requestReset = useCallback(() => {
    setConfirmingReset(true)
    playSfx('resetWarn')
  }, [])
  const cancelReset = useCallback(() => setConfirmingReset(false), [])
  const confirmReset = useCallback(() => {
    const fresh = createInitialAlbum(STARTING_COINS)
    setAlbum(fresh)
    writeSave(fresh)
    setConfirmingReset(false)
    setReveal({ phase: 'closed' })
    setPending([])
    writePending([])
    setTrivia({ status: 'idle' })
    writePendingWagerTrivia(null)
    setPage(0)
  }, [])

  const exportCode = useCallback(() => encodeSave(album), [album])

  const stats = progress(album)
  const pendingCounts: Record<number, number> = {}
  for (const item of pending) {
    pendingCounts[item.id] = (pendingCounts[item.id] ?? 0) + 1
  }

  const spinReadyAt = lastSpinAt === null ? 0 : lastSpinAt + SPIN_COOLDOWN_MS
  const canSpin = Date.now() >= spinReadyAt

  const shinyAttemptReadyAt =
    lastShinyAttemptAt === null ? 0 : lastShinyAttemptAt + SHINY_ATTEMPT_COOLDOWN_MS

  const today = todayStr()
  const canClaimDailyLogin = dailyLogin.lastClaimDate !== today
  const dailyLoginNextDay = canClaimDailyLogin
    ? dailyLogin.lastClaimDate === yesterdayStr()
      ? (dailyLogin.streak % DAILY_LOGIN_STREAK_LENGTH) + 1
      : 1
    : null

  return {
    coins: album.coins,
    entries: album.entries,
    page,
    pageCount: PAGE_COUNT,
    pageSize: PAGE_SIZE,
    reveal,
    pending,
    pendingCounts,
    trivia,
    shinyChallenge,
    shinyChallengeDuplicates: SHINY_CHALLENGE_DUPLICATES,
    shinyAttemptReadyAt,
    shinySkipsPaid,
    confirmingReset,
    stats,
    canOpenPack: album.coins >= PACK_COST,
    canOpenRarePack: album.coins >= PACK_RARE_COST,
    canOpenLegendaryPack: album.coins >= PACK_LEGENDARY_COST,
    recycleCost: RECYCLE_COST,
    freeTriviaUsed,
    freeTriviaLimit: FREE_TRIVIA_DAILY_LIMIT,
    bonusQuestions,
    wagerBoost,
    canSpin,
    spinReadyAt,
    pendingSpin,
    lastSpinResult,
    dailyLoginStreak: dailyLogin.streak,
    canClaimDailyLogin,
    dailyLoginNextDay,
    dailyLoginRewards: DAILY_LOGIN_COINS,
    dailyLoginStreakLength: DAILY_LOGIN_STREAK_LENGTH,
    spin,
    claimSpin,
    claimDailyLogin,
    openBooster,
    openRarePack,
    openLegendaryPack,
    dismissReveal,
    stickPending,
    goToNextPending,
    goToNextDuplicate,
    goToPage,
    sellDuplicate: sellDup,
    sellAllDuplicates: sellAllDup,
    recycleDuplicates: recycleDup,
    startTrivia,
    resetTrivia,
    expireTrivia,
    answerStatPair,
    answerTrueFalse,
    answerMultipleChoice,
    answerTrainer,
    startShinyChallenge,
    answerShinyQuestion,
    expireShinyQuestion,
    continueShinyChallenge,
    closeShinyChallenge,
    wagerStreak,
    requestReset,
    cancelReset,
    confirmReset,
    exportCode,
    cheatLocked: cheatLockRemainingMs > 0,
    cheatLockRemainingMs,
    cheatWiped,
    dismissCheatWiped: () => setCheatWiped(false),
    triviaStreak: triviaStats.streak,
    bestTriviaStreak: triviaStats.bestStreak,
    unlockedAchievements: triviaStats.unlocked,
    achievementQueue,
    dismissAchievement,
    tieBugBonusGranted,
    tieBugBonusAmount: TIE_BUG_BONUS_AMOUNT,
    dismissTieBugBonus,
  }
}
