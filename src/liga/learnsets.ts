import learnsetsJson from './data/learnsets.json'
import movesJson from './data/moves.json'
import { MOVE_SLOTS } from './constants'
import { shuffle } from './rng'

const LEARN = learnsetsJson as Record<string, number[]>
const KNOWN = new Set((movesJson as { id: number }[]).map((entry) => entry.id))

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function learnsetOf(speciesId: number): number[] {
  return (LEARN[String(speciesId)] ?? []).filter((id) => KNOWN.has(id))
}

export function canLearn(speciesId: number, moveId: number): boolean {
  return learnsetOf(speciesId).includes(moveId)
}

export function pickRandomMoves(speciesId: number, random: () => number, fallback: number[]): number[] {
  const pool = learnsetOf(speciesId)
  const source = pool.length >= MOVE_SLOTS ? pool : [...new Set([...pool, ...fallback])]
  const picked = shuffle(source, random).slice(0, MOVE_SLOTS)
  if (picked.length < MOVE_SLOTS) {
    for (const id of fallback) {
      if (!picked.includes(id)) {
        picked.push(id)
      }
      if (picked.length >= MOVE_SLOTS) {
        break
      }
    }
  }
  return picked.slice(0, MOVE_SLOTS)
}

export function searchLearnset(speciesId: number, query: string, labelOf: (id: number) => string): number[] {
  const needle = foldText(query)
  return learnsetOf(speciesId).filter((id) => !needle || foldText(labelOf(id)).includes(needle))
}
