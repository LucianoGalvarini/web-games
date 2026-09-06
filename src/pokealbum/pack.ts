import { POKEMON, RARITY_WEIGHT } from './data'
import { DUPLICATE_SELL_VALUE, PACK_SIZE, RECYCLE_COST } from './economy'
import type { AlbumEntry, AlbumState, PackResult } from './types'

export function createInitialAlbum(coins: number): AlbumState {
  const entries: Record<number, AlbumEntry> = {}
  for (const p of POKEMON) {
    entries[p.id] = { owned: false, duplicates: 0 }
  }
  return { coins, entries }
}

const TOTAL_WEIGHT = POKEMON.reduce((sum, p) => sum + RARITY_WEIGHT[p.rarity], 0)

export function weightedPick(rng: () => number): number {
  let roll = rng() * TOTAL_WEIGHT
  for (const p of POKEMON) {
    roll -= RARITY_WEIGHT[p.rarity]
    if (roll <= 0) {
      return p.id
    }
  }
  return POKEMON[POKEMON.length - 1].id
}

export function applySticker(state: AlbumState, item: { id: number; isNew: boolean }): AlbumState {
  const prev = state.entries[item.id]
  const next: AlbumEntry = item.isNew
    ? { owned: true, duplicates: prev.duplicates }
    : { owned: true, duplicates: prev.duplicates + 1 }
  return { ...state, entries: { ...state.entries, [item.id]: next } }
}

export function openPack(state: AlbumState, rng: () => number): { state: AlbumState; result: PackResult } {
  let entries = state.entries
  const result: PackResult = []
  for (let i = 0; i < PACK_SIZE; i += 1) {
    const id = weightedPick(rng)
    const isNew = !entries[id].owned
    const withItem = applySticker({ coins: state.coins, entries }, { id, isNew })
    entries = withItem.entries
    result.push({ id, isNew })
  }
  return { state: { ...state, entries }, result }
}

export function sellDuplicate(state: AlbumState, id: number): AlbumState | null {
  const entry = state.entries[id]
  if (!entry || entry.duplicates <= 0) {
    return null
  }
  const p = POKEMON.find((item) => item.id === id)
  if (!p) {
    return null
  }
  const value = DUPLICATE_SELL_VALUE[p.rarity]
  return {
    coins: state.coins + value,
    entries: { ...state.entries, [id]: { ...entry, duplicates: entry.duplicates - 1 } },
  }
}

export function recycleDuplicates(
  state: AlbumState,
  rng: () => number,
): { state: AlbumState; result: { id: number; isNew: boolean } } | null {
  const totalDuplicates = Object.values(state.entries).reduce((sum, entry) => sum + entry.duplicates, 0)
  if (totalDuplicates < RECYCLE_COST) {
    return null
  }
  let remaining = RECYCLE_COST
  const entries = { ...state.entries }
  for (const p of POKEMON) {
    if (remaining <= 0) {
      break
    }
    const entry = entries[p.id]
    if (entry.duplicates > 0) {
      const take = Math.min(entry.duplicates, remaining)
      entries[p.id] = { ...entry, duplicates: entry.duplicates - take }
      remaining -= take
    }
  }
  const drawnId = weightedPick(rng)
  const isNew = !entries[drawnId].owned
  return { state: { ...state, entries }, result: { id: drawnId, isNew } }
}

export function progress(state: AlbumState): { owned: number; total: number; duplicates: number } {
  let owned = 0
  let duplicates = 0
  for (const entry of Object.values(state.entries)) {
    if (entry.owned) {
      owned += 1
    }
    duplicates += entry.duplicates
  }
  return { owned, total: POKEMON.length, duplicates }
}
