import { SHINY_CHALLENGE_DUPLICATES } from './economy'
import type { AlbumState } from './types'

// Whether this species has enough duplicates banked, is owned, and isn't already shiny —
// the three gates before the "Intentar Shiny" button even shows up.
export function canAttemptShiny(state: AlbumState, id: number): boolean {
  const entry = state.entries[id]
  return !!entry && entry.owned && !entry.shiny && entry.duplicates >= SHINY_CHALLENGE_DUPLICATES
}

// Spends the SHINY_CHALLENGE_DUPLICATES entry fee up front, win or lose the questions that
// follow — losing means literally starting over on those duplicates, by design.
export function consumeShinyAttempt(state: AlbumState, id: number): AlbumState | null {
  if (!canAttemptShiny(state, id)) {
    return null
  }
  const entry = state.entries[id]
  return {
    ...state,
    entries: { ...state.entries, [id]: { ...entry, duplicates: entry.duplicates - SHINY_CHALLENGE_DUPLICATES } },
  }
}

export function unlockShiny(state: AlbumState, id: number): AlbumState {
  const entry = state.entries[id]
  return { ...state, entries: { ...state.entries, [id]: { ...entry, shiny: true } } }
}
