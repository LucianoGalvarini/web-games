export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type PokedexEntry = {
  id: number
  name: string
  type: string
  rarity: Rarity
}

export type AlbumEntry = {
  owned: boolean
  duplicates: number
  // Not covered by the save signature (see save.ts) — same trust tier as achievements/pending,
  // it's a cosmetic unlock rather than an economy value worth anti-cheat coverage.
  shiny?: boolean
}

export type AlbumState = {
  coins: number
  entries: Record<number, AlbumEntry>
}

export type PackResult = {
  id: number
  isNew: boolean
}[]

export type SaveData = {
  version: 1
  coins: number
  entries: Record<number, AlbumEntry>
  sig?: string
}
