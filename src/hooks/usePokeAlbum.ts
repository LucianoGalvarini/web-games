import { useCallback, useRef, useState } from 'react'
import {
  DAILY_LOGIN_COINS,
  DAILY_LOGIN_STREAK_LENGTH,
  FREE_TRIVIA_DAILY_LIMIT,
  PACK_COST,
  POKEMON,
  RECYCLE_COST,
  SPIN_COOLDOWN_MS,
  STARTING_COINS,
  STAT_KEYS,
  STAT_LABEL,
  TRIVIA_REWARD,
  TRIVIA_TIME_LIMIT_MS,
  TYPE_ES_BY_SLUG,
  applySticker,
  bestRarity,
  createInitialAlbum,
  creditDuplicate,
  decodeSave,
  encodeSave,
  openPack,
  prettyLabel,
  progress,
  recycleDuplicates,
  rollSegmentAmount,
  sellAllDuplicates,
  sellDuplicate,
  spinRoulette,
} from '../pokealbum'
import type { AlbumState, PackResult, Rarity, RouletteSegment, StatKey } from '../pokealbum'
import { playPackOpenSound, playSfx, stopPackOpenSound } from '../shared/sfx'

const SAVE_KEY = 'pokealbum-save'
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
type RevealKind = 'pack' | 'recycle' | 'freePack'
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
export type TriviaMode = 'statPair' | 'trueFalse' | 'multipleChoice'

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

function readSave(): AlbumState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
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
  } catch {
    /* ignore quota */
  }
}

const DAILY_TRIVIA_KEY = 'pokealbum-trivia-daily'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function readDailyFreeTrivia(): number {
  try {
    const raw = localStorage.getItem(DAILY_TRIVIA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { date?: string; count?: number }
      if (parsed.date === todayStr() && typeof parsed.count === 'number') {
        return parsed.count
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return 0
}

function writeDailyFreeTrivia(count: number): void {
  try {
    localStorage.setItem(DAILY_TRIVIA_KEY, JSON.stringify({ date: todayStr(), count }))
  } catch {
    /* ignore quota */
  }
}

const SPIN_KEY = 'pokealbum-roulette-last'
const BONUS_QUESTIONS_KEY = 'pokealbum-bonus-questions'
const WAGER_BOOST_KEY = 'pokealbum-wager-boost'
const DAILY_LOGIN_KEY = 'pokealbum-daily-login'

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      const value = Number(raw)
      if (Number.isFinite(value)) {
        return value
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return 0
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* ignore quota */
  }
}

function readLastSpinAt(): number | null {
  try {
    const raw = localStorage.getItem(SPIN_KEY)
    if (raw !== null) {
      const value = Number(raw)
      if (Number.isFinite(value)) {
        return value
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return null
}

function writeLastSpinAt(value: number | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(SPIN_KEY)
    } else {
      localStorage.setItem(SPIN_KEY, String(value))
    }
  } catch {
    /* ignore quota */
  }
}

type DailyLoginState = { lastClaimDate: string | null; streak: number }

function readDailyLogin(): DailyLoginState {
  try {
    const raw = localStorage.getItem(DAILY_LOGIN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyLoginState>
      if (typeof parsed.streak === 'number') {
        return { lastClaimDate: parsed.lastClaimDate ?? null, streak: parsed.streak }
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return { lastClaimDate: null, streak: 0 }
}

function writeDailyLogin(state: DailyLoginState): void {
  try {
    localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(state))
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

function readPending(): PendingSticker[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter(isPendingSticker)
      }
    }
  } catch {
    /* privacy mode / corrupt data, fall through */
  }
  return []
}

function writePending(items: PendingSticker[]): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota */
  }
}

function randomId(exclude?: number): number {
  let id = 1 + Math.floor(Math.random() * POKEMON.length)
  while (id === exclude) {
    id = 1 + Math.floor(Math.random() * POKEMON.length)
  }
  return id
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
  const [album, setAlbum] = useState<AlbumState>(readSave)
  const [page, setPage] = useState(0)
  const [reveal, setReveal] = useState<RevealState>({ phase: 'closed' })
  const [pending, setPending] = useState<PendingSticker[]>(readPending)
  const [trivia, setTrivia] = useState<TriviaState>({ status: 'idle' })
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importCodeValue, setImportCodeValue] = useState('')
  const [freeTriviaUsed, setFreeTriviaUsed] = useState(readDailyFreeTrivia)
  const [bonusQuestions, setBonusQuestions] = useState(() => readNumber(BONUS_QUESTIONS_KEY))
  const [wagerBoost, setWagerBoost] = useState(() => readNumber(WAGER_BOOST_KEY))
  const [lastSpinAt, setLastSpinAt] = useState<number | null>(readLastSpinAt)
  const [pendingSpin, setPendingSpin] = useState<{ segment: RouletteSegment; amount: number } | null>(null)
  const [lastSpinResult, setLastSpinResult] = useState<{ segment: RouletteSegment; amount: number } | null>(null)
  const [dailyLogin, setDailyLogin] = useState<DailyLoginState>(readDailyLogin)
  const factsCache = useRef(new Map<number, Facts>())
  const moveNameCache = useRef(new Map<string, string>())
  const triviaRequest = useRef(0)
  const albumRef = useRef(album)
  const triviaRef = useRef(trivia)
  const revealRef = useRef(reveal)
  const pendingRef = useRef(pending)
  const freeTriviaUsedRef = useRef(freeTriviaUsed)
  const bonusQuestionsRef = useRef(bonusQuestions)
  const wagerBoostRef = useRef(wagerBoost)
  const lastSpinAtRef = useRef(lastSpinAt)
  const pendingSpinRef = useRef(pendingSpin)
  const dailyLoginRef = useRef(dailyLogin)
  albumRef.current = album
  triviaRef.current = trivia
  revealRef.current = reveal
  pendingRef.current = pending
  freeTriviaUsedRef.current = freeTriviaUsed
  bonusQuestionsRef.current = bonusQuestions
  wagerBoostRef.current = wagerBoost
  lastSpinAtRef.current = lastSpinAt
  pendingSpinRef.current = pendingSpin
  dailyLoginRef.current = dailyLogin

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
    (afterCost: AlbumState, kind: RevealKind) => {
      const { result: rawResult } = openPack(afterCost, Math.random)
      const result = reclassifyAgainstPending(rawResult)
      const withDuplicates = applyDuplicatesFrom(afterCost, result)
      writeSave(withDuplicates)
      setAlbum(withDuplicates)
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
    [applyDuplicatesFrom, playRevealSfx, reclassifyAgainstPending],
  )

  const openBooster = useCallback(() => {
    const prev = albumRef.current
    if (prev.coins < PACK_COST) {
      return
    }
    const afterCost = { ...prev, coins: prev.coins - PACK_COST }
    runPackReveal(afterCost, 'pack')
  }, [runPackReveal])

  const openFreePack = useCallback(() => {
    runPackReveal(albumRef.current, 'freePack')
  }, [runPackReveal])

  const spin = useCallback(() => {
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
  }, [])

  const claimSpin = useCallback(() => {
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
    setLastSpinResult({ segment, amount })
  }, [openFreePack])

  const claimDailyLogin = useCallback(() => {
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
    const isLegendary = POKEMON.find((p) => p.id === id)?.rarity === 'legendary'
    playSfx(!wasOwned && isLegendary ? 'legendary' : 'sticker')
    const nextPending = current.filter((_, i) => i !== index)
    writePending(nextPending)
    setPending(nextPending)
    if (nextPending.length === 0) {
      window.setTimeout(() => playSfx('placeAll'), 150)
    }
  }, [])

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
    const next = sellDuplicate(albumRef.current, id)
    if (!next) {
      return
    }
    writeSave(next)
    setAlbum(next)
    playSfx('coin')
  }, [])

  const sellAllDup = useCallback(() => {
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
      const outcome = recycleDuplicates(albumRef.current, Math.random)
      if (!outcome) {
        return
      }
      const items: PackResult = reclassifyAgainstPending([outcome.result])
      const withDuplicate = applyDuplicatesFrom(outcome.state, items)
      writeSave(withDuplicate)
      setAlbum(withDuplicate)
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
    [applyDuplicatesFrom, playRevealSfx, reclassifyAgainstPending],
  )

  const startTrivia = useCallback(
    (wager: number) => {
      const coins = albumRef.current.coins
      if (!Number.isFinite(wager) || wager < 0 || wager > coins) {
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
      const requestId = triviaRequest.current + 1
      triviaRequest.current = requestId
      setTrivia({ status: 'loading' })

      const mode: TriviaMode = (['statPair', 'trueFalse', 'multipleChoice'] as const)[Math.floor(Math.random() * 3)]

      if (mode === 'statPair') {
        const aId = randomId()
        const bId = randomId(aId)
        const statKey = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]
        Promise.all([fetchFactsCached(aId), fetchFactsCached(bId)])
          .then(([a, b]) => {
            if (triviaRequest.current !== requestId) {
              return
            }
            const aValue = a.stats[statKey]
            const bValue = b.stats[statKey]
            setTrivia({
              status: 'ready',
              mode: 'statPair',
              wager,
              deadline: Date.now() + TRIVIA_TIME_LIMIT_MS,
              aId,
              bId,
              statKey,
              aValue,
              bValue,
              correct: aValue >= bValue ? 'a' : 'b',
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
              setTrivia({
                status: 'ready',
                mode: 'trueFalse',
                wager,
                deadline: Date.now() + TRIVIA_TIME_LIMIT_MS,
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
          const bId = randomId(aId)
          const statKey = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]
          Promise.all([fetchFactsCached(aId), fetchFactsCached(bId)])
            .then(([a, b]) => {
              if (triviaRequest.current !== requestId) {
                return
              }
              const aValue = a.stats[statKey]
              const bValue = b.stats[statKey]
              const claimMore = Math.random() < 0.5
              const nameA = POKEMON.find((p) => p.id === aId)?.name ?? `#${aId}`
              const nameB = POKEMON.find((p) => p.id === bId)?.name ?? `#${bId}`
              const label = STAT_LABEL[statKey]
              const actuallyMore = aValue >= bValue
              setTrivia({
                status: 'ready',
                mode: 'trueFalse',
                wager,
                deadline: Date.now() + TRIVIA_TIME_LIMIT_MS,
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
          const distractorPool = COMMON_MOVE_SLUGS.filter((slug) => !ownMoves.includes(slug))
          if (ownMoves.length === 0 || distractorPool.length < 3) {
            setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
            return
          }
          const realMove = ownMoves[Math.floor(Math.random() * ownMoves.length)]
          const distractors = new Set<string>()
          while (distractors.size < 3) {
            distractors.add(distractorPool[Math.floor(Math.random() * distractorPool.length)])
          }
          const slugs = [realMove, ...distractors].sort(() => Math.random() - 0.5)
          const correctIndex = slugs.indexOf(realMove)
          const name = POKEMON.find((p) => p.id === aId)?.name ?? `#${aId}`
          Promise.all(slugs.map(fetchMoveNameEsCached))
            .then((options) => {
              if (triviaRequest.current !== requestId) {
                return
              }
              setTrivia({
                status: 'ready',
                mode: 'multipleChoice',
                wager,
                deadline: Date.now() + TRIVIA_TIME_LIMIT_MS,
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

  const applyTriviaOutcome = useCallback((isCorrect: boolean, wager: number) => {
    let boosted = false
    if (wager > 0 && isCorrect && wagerBoostRef.current > 0) {
      boosted = true
      const nextBoost = wagerBoostRef.current - 1
      wagerBoostRef.current = nextBoost
      writeNumber(WAGER_BOOST_KEY, nextBoost)
      setWagerBoost(nextBoost)
    }
    const delta = wager > 0 ? (isCorrect ? wager * (boosted ? 2 : 1) : -wager) : isCorrect ? TRIVIA_REWARD : 0
    if (delta !== 0) {
      const next = { ...albumRef.current, coins: albumRef.current.coins + delta }
      writeSave(next)
      setAlbum(next)
    }
    if (wager > 0) {
      playSfx(isCorrect ? 'wagerWin' : 'wagerLose')
    } else {
      playSfx(isCorrect ? 'coin' : 'error')
    }
    return delta
  }, [])

  const expireTrivia = useCallback(() => {
    const prev = triviaRef.current
    if (prev.status !== 'ready') {
      return
    }
    const reward = applyTriviaOutcome(false, prev.wager)
    setTrivia({ ...prev, status: 'answered', reward, timedOut: true })
  }, [applyTriviaOutcome])

  const answerStatPair = useCallback(
    (picked: TriviaSide) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'statPair') {
        return
      }
      const isCorrect = picked === prev.correct
      const reward = applyTriviaOutcome(isCorrect, prev.wager)
      setTrivia({ ...prev, status: 'answered', picked, reward })
    },
    [applyTriviaOutcome],
  )

  const answerTrueFalse = useCallback(
    (picked: boolean) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'trueFalse') {
        return
      }
      const isCorrect = picked === prev.isTrue
      const reward = applyTriviaOutcome(isCorrect, prev.wager)
      setTrivia({ ...prev, status: 'answered', picked, reward })
    },
    [applyTriviaOutcome],
  )

  const answerMultipleChoice = useCallback(
    (picked: number) => {
      const prev = triviaRef.current
      if (prev.status !== 'ready' || prev.mode !== 'multipleChoice') {
        return
      }
      const isCorrect = picked === prev.correctIndex
      const reward = applyTriviaOutcome(isCorrect, prev.wager)
      setTrivia({ ...prev, status: 'answered', picked, reward })
    },
    [applyTriviaOutcome],
  )

  const resetTrivia = useCallback(() => setTrivia({ status: 'idle' }), [])

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
    setPage(0)
  }, [])

  const exportCode = useCallback(() => encodeSave(album), [album])

  const setImportCode = useCallback((value: string) => {
    setImportCodeValue(value)
    setImportError(null)
  }, [])

  const importCode = useCallback((): boolean => {
    const sanitized = importCodeValue.replace(/[\s-]/g, '')
    const decoded = decodeSave(sanitized)
    if (!decoded) {
      setImportError('Ese código no es válido. Revisá que esté completo y sin espacios de más.')
      playSfx('error')
      return false
    }
    setAlbum(decoded)
    writeSave(decoded)
    setImportError(null)
    setImportCodeValue('')
    setPage(0)
    playSfx('importOk')
    return true
  }, [importCodeValue])

  const stats = progress(album)
  const pendingCounts: Record<number, number> = {}
  for (const item of pending) {
    pendingCounts[item.id] = (pendingCounts[item.id] ?? 0) + 1
  }

  const spinReadyAt = lastSpinAt === null ? 0 : lastSpinAt + SPIN_COOLDOWN_MS
  const canSpin = Date.now() >= spinReadyAt

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
    confirmingReset,
    importError,
    importCodeValue,
    stats,
    canOpenPack: album.coins >= PACK_COST,
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
    requestReset,
    cancelReset,
    confirmReset,
    exportCode,
    setImportCode,
    importCode,
  }
}
