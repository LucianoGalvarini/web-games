import { useCallback, useRef, useState } from 'react'
import {
  PACK_COST,
  POKEMON,
  RECYCLE_COST,
  STARTING_COINS,
  STAT_KEYS,
  STAT_LABEL,
  TRIVIA_REWARD,
  TYPE_ES_BY_SLUG,
  applySticker,
  bestRarity,
  createInitialAlbum,
  decodeSave,
  encodeSave,
  openPack,
  prettyLabel,
  progress,
  recycleDuplicates,
  sellDuplicate,
} from '../pokealbum'
import type { AlbumState, PackResult, Rarity, StatKey } from '../pokealbum'
import { playSfx } from '../shared/sfx'

const SAVE_KEY = 'pokealbum-save'
const PAGE_SIZE = 9
export const PAGE_COUNT = Math.ceil(POKEMON.length / PAGE_SIZE)

export type PendingSticker = { id: number; isNew: boolean }
export type RevealState =
  | { phase: 'closed' }
  | { phase: 'opening'; kind: 'pack' | 'recycle'; rarity: Rarity }
  | { phase: 'revealed'; kind: 'pack' | 'recycle'; items: PackResult }

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
      aId: number
      bId: number
      statKey: StatKey
      aValue?: number
      bValue?: number
      correct?: TriviaSide
      picked?: TriviaSide
      reward?: number
    }
  | {
      status: 'ready' | 'answered'
      mode: 'trueFalse'
      wager: number
      statement: string
      isTrue: boolean
      picked?: boolean
      reward?: number
    }
  | {
      status: 'ready' | 'answered'
      mode: 'multipleChoice'
      wager: number
      prompt: string
      options: string[]
      correctIndex: number
      picked?: number
      reward?: number
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

export function usePokeAlbum() {
  const [album, setAlbum] = useState<AlbumState>(readSave)
  const [page, setPage] = useState(0)
  const [reveal, setReveal] = useState<RevealState>({ phase: 'closed' })
  const [pending, setPending] = useState<PendingSticker[]>(readPending)
  const [trivia, setTrivia] = useState<TriviaState>({ status: 'idle' })
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importCodeValue, setImportCodeValue] = useState('')
  const factsCache = useRef(new Map<number, Facts>())
  const triviaRequest = useRef(0)
  const albumRef = useRef(album)
  const triviaRef = useRef(trivia)
  const revealRef = useRef(reveal)
  const pendingRef = useRef(pending)
  albumRef.current = album
  triviaRef.current = trivia
  revealRef.current = reveal
  pendingRef.current = pending

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
        next = applySticker(next, item)
      }
    }
    return next
  }, [])

  const openBooster = useCallback(() => {
    const prev = albumRef.current
    if (prev.coins < PACK_COST) {
      return
    }
    const afterCost = { ...prev, coins: prev.coins - PACK_COST }
    const { result } = openPack(afterCost, Math.random)
    const withDuplicates = applyDuplicatesFrom(afterCost, result)
    writeSave(withDuplicates)
    setAlbum(withDuplicates)
    const rarity = bestRarity(result.map((item) => item.id))
    setReveal({ phase: 'opening', kind: 'pack', rarity })
    const duration =
      rarity === 'legendary' ? OPENING_DURATION_LEGENDARY : rarity === 'rare' ? OPENING_DURATION_RARE : OPENING_DURATION
    playSfx(rarity === 'legendary' ? 'packLegendary' : rarity === 'rare' ? 'packRare' : 'pack')
    window.setTimeout(() => {
      setReveal({ phase: 'revealed', kind: 'pack', items: result })
      playRevealSfx(result)
    }, duration)
  }, [applyDuplicatesFrom, playRevealSfx])

  const dismissReveal = useCallback(() => {
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
    const item = current[index]
    const nextAlbum = applySticker(albumRef.current, item)
    writeSave(nextAlbum)
    setAlbum(nextAlbum)
    const isLegendary = POKEMON.find((p) => p.id === id)?.rarity === 'legendary'
    playSfx(item.isNew && isLegendary ? 'legendary' : 'sticker')
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

  const sellDup = useCallback((id: number) => {
    const next = sellDuplicate(albumRef.current, id)
    if (!next) {
      return
    }
    writeSave(next)
    setAlbum(next)
    playSfx('coin')
  }, [])

  const recycleDup = useCallback(
    () => {
      const outcome = recycleDuplicates(albumRef.current, Math.random)
      if (!outcome) {
        return
      }
      const items: PackResult = [outcome.result]
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
    [applyDuplicatesFrom, playRevealSfx],
  )

  const startTrivia = useCallback(
    (wager: number) => {
      const coins = albumRef.current.coins
      if (!Number.isFinite(wager) || wager < 0 || wager > coins) {
        return
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
      const bId = randomId(aId)
      Promise.all([fetchFactsCached(aId), fetchFactsCached(bId)])
        .then(([a, b]) => {
          if (triviaRequest.current !== requestId) {
            return
          }
          const ownMoves = a.moves
          const foreignMoves = b.moves.filter((move) => !ownMoves.includes(move))
          if (ownMoves.length === 0 || foreignMoves.length < 3) {
            setTrivia({ status: 'error', message: 'Error: no se pudo conectar con la PokeAPI. Intenta de nuevo.' })
            return
          }
          const realMove = ownMoves[Math.floor(Math.random() * ownMoves.length)]
          const distractors = new Set<string>()
          while (distractors.size < 3) {
            distractors.add(foreignMoves[Math.floor(Math.random() * foreignMoves.length)])
          }
          const options = [realMove, ...distractors].sort(() => Math.random() - 0.5).map(prettyLabel)
          const correctIndex = options.indexOf(prettyLabel(realMove))
          const name = POKEMON.find((p) => p.id === aId)?.name ?? `#${aId}`
          setTrivia({
            status: 'ready',
            mode: 'multipleChoice',
            wager,
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
    },
    [fetchFactsCached],
  )

  const applyTriviaOutcome = useCallback((isCorrect: boolean, wager: number) => {
    const delta = wager > 0 ? (isCorrect ? wager : -wager) : isCorrect ? TRIVIA_REWARD : 0
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
    openBooster,
    dismissReveal,
    stickPending,
    goToNextPending,
    goToNextDuplicate,
    goToPage,
    sellDuplicate: sellDup,
    recycleDuplicates: recycleDup,
    startTrivia,
    resetTrivia,
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
