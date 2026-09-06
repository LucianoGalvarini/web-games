import { POKEMON } from './data'
import type { AlbumEntry, AlbumState, SaveData } from './types'

const VALID_IDS = new Set(POKEMON.map((p) => p.id))

export function encodeSave(state: AlbumState): string {
  const data: SaveData = { version: 1, coins: state.coins, entries: state.entries }
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

function isEntry(value: unknown): value is AlbumEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return typeof entry.owned === 'boolean' && typeof entry.duplicates === 'number' && entry.duplicates >= 0
}

export function decodeSave(code: string): AlbumState | null {
  try {
    const json = decodeURIComponent(atob(code.trim()))
    const data = JSON.parse(json) as Partial<SaveData>
    if (data.version !== 1) {
      return null
    }
    if (typeof data.coins !== 'number' || !Number.isFinite(data.coins) || data.coins < 0) {
      return null
    }
    if (typeof data.entries !== 'object' || data.entries === null) {
      return null
    }
    const entries: Record<number, AlbumEntry> = {}
    for (const p of POKEMON) {
      entries[p.id] = { owned: false, duplicates: 0 }
    }
    for (const [key, value] of Object.entries(data.entries)) {
      const id = Number(key)
      if (!VALID_IDS.has(id) || !isEntry(value)) {
        return null
      }
      entries[id] = { owned: value.owned, duplicates: value.duplicates }
    }
    return { coins: data.coins, entries }
  } catch {
    return null
  }
}
