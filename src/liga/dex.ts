import movesJson from './data/moves.json'
import speciesJson from './data/species.json'
import type { LigaMove, LigaSpecies, LigaType } from './types'

export const SPECIES: LigaSpecies[] = speciesJson as LigaSpecies[]
export const MOVES: LigaMove[] = movesJson as LigaMove[]

const speciesById = new Map(SPECIES.map((entry) => [entry.id, entry]))
const movesById = new Map(MOVES.map((entry) => [entry.id, entry]))

export function speciesOf(id: number): LigaSpecies {
  const found = speciesById.get(id)
  if (!found) {
    throw new Error(`Especie ${id} no está en el dex.`)
  }
  return found
}

export function moveOf(id: number): LigaMove {
  const found = movesById.get(id)
  if (!found) {
    throw new Error(`Movimiento ${id} no está en el dex.`)
  }
  return found
}

export function speciesOfTypes(types: LigaType[]): LigaSpecies[] {
  return SPECIES.filter((entry) => entry.types.some((type) => types.includes(type)))
}

export function spriteUrl(id: number, back = false): string {
  const file = back ? `back/${id}.png` : `${id}.png`
  return `${import.meta.env.BASE_URL}liga/sprites/${file}`
}
