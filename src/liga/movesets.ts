import { MOVE_SLOTS, PHYSICAL_TYPES } from './constants'
import type { LigaMove, LigaSpecies, LigaType } from './types'

const FORBIDDEN: Partial<Record<LigaType, LigaType[]>> = {
  fire: ['water'],
  water: ['fire'],
  grass: ['fire'],
  ice: ['fire'],
}

const WEAK: ReadonlySet<string> = new Set([
  'cut',
  'gust',
  'confusion',
  'bubble-beam',
  'leech-life',
  'thief',
  'feint-attack',
  'icy-wind',
  'knock-off',
  'secret-power',
  'hidden-power',
  'water-pulse',
  'shock-wave',
  'ancient-power',
  'silver-wind',
  'uproar',
  'take-down',
  'headbutt',
  'slash',
  'facade',
  'crush-claw',
  'quick-attack',
  'sludge',
  'psybeam',
  'razor-leaf',
  'rock-tomb',
])

const CHARGE: ReadonlySet<string> = new Set([
  'solar-beam',
  'sky-attack',
  'hyper-beam',
  'focus-punch',
  'explosion',
  'future-sight',
  'doom-desire',
  'dream-eater',
  'fly',
  'dig',
  'dive',
])

const DRILL_PECK_USERS = new Set([22, 85, 145, 227])

const SIGNATURE: Partial<Record<number, number[]>> = {
  3: [80, 188, 89, 58],
  6: [126, 332, 337, 89],
  9: [57, 89, 58, 85],
  26: [85, 87, 247, 58],
  59: [126, 89, 34, 231],
  65: [94, 85, 58, 7],
  68: [327, 89, 157, 7],
  94: [247, 188, 85, 7],
  105: [89, 280, 157, 126],
  121: [57, 94, 85, 58],
  130: [89, 332, 58, 57],
  143: [34, 89, 247, 280],
  144: [58, 59, 332, 94],
  145: [85, 87, 65, 58],
  146: [126, 257, 332, 337],
  149: [337, 332, 89, 53],
  150: [94, 58, 85, 247],
  151: [94, 89, 58, 85],
  157: [126, 89, 280, 157],
  160: [57, 89, 280, 157],
  196: [94, 85, 247, 7],
  197: [242, 247, 89, 34],
  208: [89, 231, 157, 242],
  212: [211, 332, 280, 185],
  214: [224, 327, 89, 157],
  227: [211, 65, 157, 280],
  229: [126, 242, 247, 85],
  230: [57, 58, 337, 127],
  243: [85, 87, 242, 58],
  244: [126, 89, 157, 34],
  245: [57, 58, 85, 94],
  248: [157, 89, 242, 280],
  249: [177, 94, 58, 85],
  250: [257, 202, 332, 89],
  251: [94, 202, 247, 58],
  254: [202, 89, 332, 280],
  257: [299, 327, 89, 157],
  260: [89, 57, 58, 157],
  282: [94, 85, 247, 7],
  286: [327, 89, 188, 202],
  308: [136, 94, 157, 7],
  323: [284, 89, 157, 188],
  324: [126, 89, 157, 188],
  330: [89, 337, 157, 53],
  350: [57, 58, 85, 94],
  373: [337, 332, 89, 126],
  376: [309, 89, 94, 157],
  380: [296, 337, 85, 58],
  381: [295, 337, 58, 85],
  382: [323, 57, 58, 87],
  383: [89, 284, 157, 280],
  384: [337, 332, 89, 126],
  385: [94, 309, 58, 85],
  386: [354, 85, 58, 247],
}

function bannedTypes(types: LigaType[]): Set<LigaType> {
  const out = new Set<LigaType>()
  for (const type of types) {
    for (const forbidden of FORBIDDEN[type] ?? []) {
      out.add(forbidden)
    }
  }
  return out
}

function legal(species: Pick<LigaSpecies, 'id' | 'types'>, move: LigaMove): boolean {
  if (bannedTypes(species.types).has(move.type)) {
    return false
  }
  if (move.name === 'hyper-beam' && !species.types.includes('normal')) {
    return false
  }
  if (move.name === 'explosion') {
    return false
  }
  if (CHARGE.has(move.name) && move.name !== 'hyper-beam') {
    return false
  }
  if (move.name === 'aeroblast' && species.id !== 249) {
    return false
  }
  if (move.name === 'luster-purge' && species.id !== 381) {
    return false
  }
  if (move.name === 'mist-ball' && species.id !== 380) {
    return false
  }
  if (move.name === 'psycho-boost' && species.id !== 386) {
    return false
  }
  if (move.name === 'doom-desire' && species.id !== 385) {
    return false
  }
  if ((move.name === 'water-spout' || move.name === 'eruption') && species.id !== 382 && species.id !== 383 && species.id !== 323) {
    return false
  }
  if (move.name === 'meteor-mash' && species.id !== 376 && species.id !== 385) {
    return false
  }
  if (move.name === 'blaze-kick' && species.id !== 257) {
    return false
  }
  return true
}

function score(species: Pick<LigaSpecies, 'id' | 'types' | 'stats'>, move: LigaMove, taken: LigaType[]): number {
  const prefersPhysical = species.stats.atk >= species.stats.spa
  const physical = PHYSICAL_TYPES.has(move.type)
  let value = move.power * 0.45 + move.accuracy * 0.12
  if (species.types.includes(move.type)) {
    value += 140
  }
  if (physical === prefersPhysical) {
    value += 36
  }
  if (move.power <= 0) {
    value = species.types.includes(move.type) ? 48 : -20
  }
  if (WEAK.has(move.name)) {
    value -= 55
  }
  if (move.name === 'overheat' || move.name === 'superpower' || move.name === 'outrage') {
    value -= 28
  }
  if (move.name === 'hyper-beam') {
    value -= 80
  }
  if (move.name === 'drill-peck' && !DRILL_PECK_USERS.has(species.id)) {
    value -= 40
  }
  if (taken.filter((type) => type === move.type).length >= 2) {
    value -= 70
  }
  if (move.accuracy < 85) {
    value -= 12
  }
  return value
}

function countType(taken: LigaType[], type: LigaType): number {
  return taken.filter((entry) => entry === type).length
}

function coverageOk(species: Pick<LigaSpecies, 'types' | 'stats'>, move: LigaMove): boolean {
  if (species.types.includes(move.type)) {
    return true
  }
  const physical = PHYSICAL_TYPES.has(move.type)
  const prefersPhysical = species.stats.atk >= species.stats.spa
  if (physical === prefersPhysical) {
    return true
  }
  if (!physical && species.stats.spa >= 70) {
    return true
  }
  if (physical && species.stats.atk >= 90) {
    return true
  }
  return false
}

function bestOfType(
  species: Pick<LigaSpecies, 'id' | 'types' | 'stats'>,
  catalog: LigaMove[],
  type: LigaType,
  taken: LigaType[],
): LigaMove | undefined {
  return catalog
    .filter((move) => move.type === type && legal(species, move) && move.power > 0 && countType(taken, type) < 2)
    .sort((a, b) => score(species, b, taken) - score(species, a, taken))[0]
}

export function assignMoves(species: Pick<LigaSpecies, 'id' | 'types' | 'stats'>, catalog: LigaMove[]): number[] {
  const byId = new Map(catalog.map((move) => [move.id, move]))
  const picked: number[] = []
  const taken: LigaType[] = []
  const prefersPhysical = species.stats.atk >= species.stats.spa
  const push = (id: number, asCoverage = false) => {
    const move = byId.get(id)
    if (!move || picked.includes(id) || !legal(species, move) || picked.length >= MOVE_SLOTS) {
      return
    }
    if (move.power > 0 && countType(taken, move.type) >= 2) {
      return
    }
    if (asCoverage && !coverageOk(species, move)) {
      return
    }
    picked.push(id)
    taken.push(move.type)
  }
  for (const id of SIGNATURE[species.id] ?? []) {
    push(id)
  }
  for (const type of species.types) {
    const move = bestOfType(species, catalog, type, taken)
    if (move) {
      push(move.id)
    }
  }
  const physicalCover = [89, 280, 332, 337, 157, 242, 231, 34, 7, 327]
  const specialCover = [58, 85, 53, 57, 94, 188, 247, 126, 202, 87]
  const coverage = prefersPhysical ? [...physicalCover, ...specialCover] : [...specialCover, ...physicalCover]
  for (const id of coverage) {
    push(id, true)
  }
  const rest = catalog
    .filter((move) => legal(species, move) && move.power > 0 && coverageOk(species, move))
    .sort((a, b) => score(species, b, taken) - score(species, a, taken))
  for (const move of rest) {
    push(move.id, true)
    if (picked.length >= MOVE_SLOTS) {
      break
    }
  }
  if (picked.length < MOVE_SLOTS) {
    for (const move of catalog) {
      push(move.id)
      if (picked.length >= MOVE_SLOTS) {
        break
      }
    }
  }
  return picked.slice(0, MOVE_SLOTS)
}
