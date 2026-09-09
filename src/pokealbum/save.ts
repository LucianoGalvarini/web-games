import { signPayload } from './anticheat'
import { POKEMON } from './data'
import type { AlbumEntry, AlbumState, SaveData } from './types'

const VALID_IDS = new Set(POKEMON.map((p) => p.id))

function computeSig(version: number, coins: number, entries: Record<number, AlbumEntry>): string {
  const keys = Object.keys(entries)
    .map(Number)
    .sort((a, b) => a - b)
  const canonical = keys.map((id) => `${id}:${entries[id].owned ? 1 : 0}:${entries[id].duplicates}`).join(',')
  return signPayload(`${version}|${coins}|${canonical}`)
}

export function encodeSave(state: AlbumState): string {
  const sig = computeSig(1, state.coins, state.entries)
  const data: SaveData = { version: 1, coins: state.coins, entries: state.entries, sig }
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

// Checks whether a previously-signed save code was hand-edited (e.g. coins bumped up directly in
// localStorage from the console) without going through the app. A code with no signature at all
// (an older save from before this check existed, or a hand-typed import) is NOT flagged here —
// only a signature that's present and wrong, which only happens if someone modified signed data.
export function wasSignatureTampered(code: string): boolean {
  try {
    const json = decodeURIComponent(atob(code.trim()))
    const data = JSON.parse(json) as Partial<SaveData>
    if (typeof data.sig !== 'string') {
      return false
    }
    if (
      data.version !== 1 ||
      typeof data.coins !== 'number' ||
      typeof data.entries !== 'object' ||
      data.entries === null
    ) {
      return false
    }
    const expected = computeSig(1, data.coins, data.entries as Record<number, AlbumEntry>)
    return data.sig !== expected
  } catch {
    return false
  }
}

// Whether a save code carries a signature at all — used to catch someone stripping the `sig`
// field entirely to dodge wasSignatureTampered, once we know this save should already have one.
export function hasSignature(code: string): boolean {
  try {
    const json = decodeURIComponent(atob(code.trim()))
    const data = JSON.parse(json) as Partial<SaveData>
    return typeof data.sig === 'string' && data.sig.length > 0
  } catch {
    return false
  }
}

function isEntry(value: unknown): value is AlbumEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.owned === 'boolean' &&
    typeof entry.duplicates === 'number' &&
    Number.isSafeInteger(entry.duplicates) &&
    entry.duplicates >= 0 &&
    (entry.shiny === undefined || typeof entry.shiny === 'boolean')
  )
}

// Decoding and signature verification are the same decision now — there is no path left that
// accepts a structurally-valid but unsigned/mis-signed code, which is exactly how a coins-edited
// save used to get re-legitimized by the old "import" flow (decode first, check signature never).
export function decodeSave(code: string): AlbumState | null {
  try {
    const json = decodeURIComponent(atob(code.trim()))
    const data = JSON.parse(json) as Partial<SaveData>
    if (data.version !== 1) {
      return null
    }
    if (typeof data.coins !== 'number' || !Number.isSafeInteger(data.coins) || data.coins < 0) {
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
      entries[id] = { owned: value.owned, duplicates: value.duplicates, shiny: value.shiny === true }
    }
    if (typeof data.sig !== 'string' || data.sig !== computeSig(1, data.coins, entries)) {
      return null
    }
    return { coins: data.coins, entries }
  } catch {
    return null
  }
}
