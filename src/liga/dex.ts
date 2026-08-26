import movesJson from './data/moves.json'
import speciesJson from './data/species.json'
import type { LigaMove, LigaSpecies, LigaType } from './types'

const GEN3_MOVE_STATS: Record<string, Partial<Pick<LigaMove, 'power' | 'accuracy' | 'pp'>>> = {
  flamethrower: { power: 95 },
  surf: { power: 95 },
  'ice-beam': { power: 95 },
  blizzard: { power: 120 },
  'thunder-wave': { accuracy: 100 },
  thunderbolt: { power: 95 },
  thunder: { power: 120 },
  fly: { power: 70 },
  dig: { power: 60 },
  toxic: { accuracy: 85 },
  'fire-blast': { power: 120 },
  'high-jump-kick': { power: 85 },
  'leech-life': { power: 20, pp: 15 },
  crabhammer: { power: 90, accuracy: 85 },
  thief: { power: 40 },
  'petal-dance': { power: 70, pp: 20 },
  outrage: { power: 90 },
  'giga-drain': { power: 60, pp: 5 },
  'future-sight': { power: 80, accuracy: 90, pp: 15 },
  uproar: { power: 50 },
  'heat-wave': { power: 100 },
  'knock-off': { power: 20 },
  dive: { power: 60 },
  'luster-purge': { power: 70 },
  'mist-ball': { power: 70 },
  'meteor-mash': { power: 100, accuracy: 85 },
  overheat: { power: 140 },
  'rock-tomb': { power: 50, accuracy: 80 },
  'doom-desire': { power: 120, accuracy: 85 },
}

function withGen3Stats(move: LigaMove): LigaMove {
  const patch = GEN3_MOVE_STATS[move.name]
  return patch ? { ...move, ...patch } : move
}

export const SPECIES: LigaSpecies[] = speciesJson as LigaSpecies[]
export const MOVES: LigaMove[] = (movesJson as LigaMove[]).map(withGen3Stats)

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
