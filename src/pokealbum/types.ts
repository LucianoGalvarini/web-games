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
