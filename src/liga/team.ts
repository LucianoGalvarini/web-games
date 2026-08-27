import type { Difficulty } from '../shared/types'
import { EMERALD_LEVELS, PARTY_SIZE, PRESETS, TRAINER_ORDER, TRAINER_TYPES } from './constants'
import { SPECIES, moveOf, speciesOf, speciesOfTypes } from './dex'
import { pickRandomMoves } from './learnsets'
import { shuffle } from './rng'
import { hpStat, otherStat } from './stats'
import type { LigaSlot, LigaSpecies, LigaTrainer, LigaTrainerId } from './types'

function evSpread(species: LigaSpecies, ev: number): { hp: number; atk: number; spa: number; spe: number } {
  const attack = species.stats.atk >= species.stats.spa ? ev : 0
  const spa = species.stats.spa > species.stats.atk ? ev : 0
  const hp = ev
  const spe = Math.max(0, Math.min(252, 510 - hp - attack - spa))
  return { hp, atk: attack, spa, spe }
}

export function makeSlot(species: LigaSpecies, level: number, iv: number, ev: number, moveIds?: number[]): LigaSlot {
  const spread = evSpread(species, ev)
  const maxHp = hpStat(species.stats.hp, iv, spread.hp, level)
  const moves = moveIds ?? species.moves
  return {
    speciesId: species.id,
    level,
    hp: maxHp,
    maxHp,
    atk: otherStat(species.stats.atk, iv, spread.atk, level),
    def: otherStat(species.stats.def, iv, 0, level),
    spa: otherStat(species.stats.spa, iv, spread.spa, level),
    spd: otherStat(species.stats.spd, iv, 0, level),
    spe: otherStat(species.stats.spe, iv, spread.spe, level),
    moves: moves.map((moveId) => ({ moveId, pp: moveOf(moveId).pp })),
    status: null,
    sleep: 0,
  }
}

function takeUnique(pool: LigaSpecies[], count: number, used: Set<number>): LigaSpecies[] {
  const picked: LigaSpecies[] = []
  for (const entry of pool) {
    if (picked.length >= count) {
      break
    }
    if (used.has(entry.id)) {
      continue
    }
    used.add(entry.id)
    picked.push(entry)
  }
  return picked
}

export function pickPlayerParty(difficulty: Difficulty, random: () => number): LigaSlot[] {
  const preset = PRESETS[difficulty]
  const used = new Set<number>()
  const legends = takeUnique(shuffle(SPECIES.filter((entry) => entry.legendary), random), preset.maxLegend, used)
  const rest = takeUnique(shuffle(SPECIES.filter((entry) => !entry.legendary), random), PARTY_SIZE - legends.length, used)
  return [...legends, ...rest].map((entry) =>
    makeSlot(entry, preset.playerLevel, preset.playerIv, preset.playerEv, pickRandomMoves(entry.id, random, entry.moves)),
  )
}

function pickTrainerParty(id: LigaTrainerId, difficulty: Difficulty, random: () => number, used: Set<number>): LigaSlot[] {
  const preset = PRESETS[difficulty]
  const levels = EMERALD_LEVELS[id].map((level) => Math.max(1, level + preset.foeLevelDelta))
  const themed = shuffle(speciesOfTypes(TRAINER_TYPES[id]), random)
  const fill = shuffle(SPECIES, random)
  const picked = takeUnique([...themed, ...fill], levels.length, used)
  return picked.map((entry, index) => makeSlot(entry, levels[index] ?? 50, preset.foeIv, 0))
}

export function createTrainers(difficulty: Difficulty, random: () => number): Record<LigaTrainerId, LigaTrainer> {
  const used = new Set<number>()
  const trainers = {} as Record<LigaTrainerId, LigaTrainer>
  for (const id of TRAINER_ORDER) {
    trainers[id] = {
      id,
      party: pickTrainerParty(id, difficulty, random, used),
      beaten: false,
    }
  }
  return trainers
}

export function cloneSlot(slot: LigaSlot): LigaSlot {
  return { ...slot, moves: slot.moves.map((move) => ({ ...move })) }
}

export function cloneParty(party: LigaSlot[]): LigaSlot[] {
  return party.map(cloneSlot)
}

export function firstAlive(party: LigaSlot[]): number {
  return party.findIndex((slot) => slot.hp > 0)
}

export function partyFainted(party: LigaSlot[]): boolean {
  return party.every((slot) => slot.hp <= 0)
}

export function speciesLabel(slot: LigaSlot): string {
  return speciesOf(slot.speciesId).label
}
