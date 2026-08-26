import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const csvBase = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'
const spriteBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const MAX_ID = 386
const VERSION_GROUPS = new Set(['5', '6', '7'])
const METHODS = new Set(['1', '4'])
const LANG_ES = '7'

const TYPE_BY_ID = {
  1: 'normal',
  2: 'fighting',
  3: 'flying',
  4: 'poison',
  5: 'ground',
  6: 'rock',
  7: 'bug',
  8: 'ghost',
  9: 'steel',
  10: 'fire',
  11: 'water',
  12: 'grass',
  13: 'electric',
  14: 'psychic',
  15: 'ice',
  16: 'dragon',
  17: 'dark',
}

const GEN3_TYPES = {
  35: ['normal'],
  36: ['normal'],
  39: ['normal'],
  40: ['normal'],
  122: ['psychic'],
  173: ['normal'],
  174: ['normal'],
  175: ['normal'],
  176: ['normal'],
  183: ['water'],
  184: ['water'],
  209: ['normal'],
  210: ['normal'],
  280: ['psychic'],
  281: ['psychic'],
  282: ['psychic'],
  298: ['normal'],
  303: ['steel'],
}

const SKIP_SPECIES = new Set([132, 201, 202, 235, 292, 360])
const SKIP_MOVES = new Set([
  'splash',
  'struggle',
  'sketch',
  'counter',
  'mirror-coat',
  'bide',
  'endeavor',
  'super-fang',
  'dragon-rage',
  'sonic-boom',
  'night-shade',
  'seismic-toss',
  'psywave',
  'fissure',
  'horn-drill',
  'guillotine',
  'sheer-cold',
])

const HEAL = new Set(['recover', 'soft-boiled', 'moonlight', 'morning-sun', 'synthesis', 'milk-drink', 'slack-off'])
const ATK2 = new Set(['swords-dance'])
const SPE2 = new Set(['agility'])
const CALM = new Set(['calm-mind'])
const PARA = new Set(['thunder-wave', 'stun-spore', 'glare'])
const BURN = new Set(['will-o-wisp'])
const POISON = new Set(['toxic', 'poison-powder', 'poison-gas'])
const SLEEP = new Set(['sleep-powder', 'spore', 'hypnosis', 'lovely-kiss', 'sing'])

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      quoted = !quoted
      continue
    }
    if (ch === ',' && !quoted) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  const headers = splitCsvLine(lines[0] ?? '')
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = cols[i] ?? ''
    }
    return row
  })
}

async function loadCsv(name) {
  const response = await fetch(`${csvBase}/${name}`)
  if (!response.ok) {
    throw new Error(`No se pudo bajar ${name}: ${response.status}`)
  }
  return parseCsv(await response.text())
}

function effectOf(identifier) {
  if (HEAL.has(identifier)) {
    return 'heal'
  }
  if (ATK2.has(identifier)) {
    return 'atk2'
  }
  if (SPE2.has(identifier)) {
    return 'spe2'
  }
  if (CALM.has(identifier)) {
    return 'calm'
  }
  if (PARA.has(identifier)) {
    return 'paralyze'
  }
  if (BURN.has(identifier)) {
    return 'burn'
  }
  if (POISON.has(identifier)) {
    return 'poison'
  }
  if (SLEEP.has(identifier)) {
    return 'sleep'
  }
  return 'none'
}

function scoreMove(move, types) {
  if (move.effect !== 'none' && move.power === 0) {
    return 35
  }
  if (move.power <= 0) {
    return 0
  }
  const accuracy = move.accuracy || 100
  let score = move.power * (accuracy / 100) + move.priority * 12
  if (types.includes(move.type)) {
    score *= 1.55
  }
  return score
}

function pickMoves(learned, moveById, types) {
  const unique = [...learned].map((id) => moveById.get(id)).filter((move) => move && !SKIP_MOVES.has(move.name))
  unique.sort((a, b) => scoreMove(b, types) - scoreMove(a, types))
  const picked = []
  const usedTypes = new Set()
  for (const move of unique) {
    if (picked.length >= 4) {
      break
    }
    if (move.power > 0 && usedTypes.has(move.type) && picked.length < 3) {
      continue
    }
    picked.push(move.id)
    if (move.power > 0) {
      usedTypes.add(move.type)
    }
  }
  for (const move of unique) {
    if (picked.length >= 4) {
      break
    }
    if (!picked.includes(move.id) && (move.power > 0 || move.effect !== 'none')) {
      picked.push(move.id)
    }
  }
  return picked.slice(0, 4)
}

async function downloadSprite(id, back, destDir) {
  const url = back ? `${spriteBase}/back/${id}.png` : `${spriteBase}/${id}.png`
  const response = await fetch(url)
  if (!response.ok) {
    return false
  }
  const buf = Buffer.from(await response.arrayBuffer())
  await writeFile(join(destDir, `${id}.png`), buf)
  return true
}

const csvs = Object.fromEntries(
  await Promise.all(
    [
      'pokemon_species.csv',
      'pokemon_species_names.csv',
      'pokemon_stats.csv',
      'pokemon_types.csv',
      'moves.csv',
      'move_names.csv',
      'pokemon_moves.csv',
    ].map(async (name) => [name, await loadCsv(name)]),
  ),
)

const evolvesInto = new Set()
for (const row of csvs['pokemon_species.csv']) {
  const from = Number(row.evolves_from_species_id)
  const generation = Number(row.generation_id)
  if (from > 0 && from <= MAX_ID && generation <= 3) {
    evolvesInto.add(from)
  }
}

const namesEs = new Map()
for (const row of csvs['pokemon_species_names.csv']) {
  if (row.local_language_id === LANG_ES) {
    namesEs.set(Number(row.pokemon_species_id), row.name)
  }
}

const statsById = new Map()
for (const row of csvs['pokemon_stats.csv']) {
  const id = Number(row.pokemon_id)
  if (id < 1 || id > MAX_ID) {
    continue
  }
  const current = statsById.get(id) ?? { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  const value = Number(row.base_stat)
  if (row.stat_id === '1') current.hp = value
  if (row.stat_id === '2') current.atk = value
  if (row.stat_id === '3') current.def = value
  if (row.stat_id === '4') current.spa = value
  if (row.stat_id === '5') current.spd = value
  if (row.stat_id === '6') current.spe = value
  statsById.set(id, current)
}

const typesById = new Map()
for (const row of csvs['pokemon_types.csv']) {
  const id = Number(row.pokemon_id)
  if (id < 1 || id > MAX_ID) {
    continue
  }
  const type = TYPE_BY_ID[Number(row.type_id)]
  if (!type) {
    continue
  }
  const list = typesById.get(id) ?? []
  list.push(type)
  typesById.set(id, list)
}

const moveNamesEs = new Map()
for (const row of csvs['move_names.csv']) {
  if (row.local_language_id === LANG_ES) {
    moveNamesEs.set(Number(row.move_id), row.name)
  }
}

const moveById = new Map()
for (const row of csvs['moves.csv']) {
  const id = Number(row.id)
  const generation = Number(row.generation_id)
  if (generation > 3) {
    continue
  }
  let type = TYPE_BY_ID[Number(row.type_id)] ?? 'normal'
  const identifier = row.identifier
  const power = row.power === '' ? 0 : Number(row.power)
  const accuracy = row.accuracy === '' ? 100 : Number(row.accuracy)
  const pp = row.pp === '' ? 20 : Number(row.pp)
  const priority = row.priority === '' ? 0 : Number(row.priority)
  const effect = power > 0 ? 'none' : effectOf(identifier)
  if (power <= 0 && effect === 'none') {
    continue
  }
  moveById.set(id, {
    id,
    name: identifier,
    label: moveNamesEs.get(id) ?? identifier,
    type,
    power,
    accuracy,
    pp,
    priority,
    effect,
  })
}

const learnedByPokemon = new Map()
for (const row of csvs['pokemon_moves.csv']) {
  const pokemonId = Number(row.pokemon_id)
  if (pokemonId < 1 || pokemonId > MAX_ID) {
    continue
  }
  if (!VERSION_GROUPS.has(row.version_group_id) || !METHODS.has(row.pokemon_move_method_id)) {
    continue
  }
  const moveId = Number(row.move_id)
  if (!moveById.has(moveId)) {
    continue
  }
  const set = learnedByPokemon.get(pokemonId) ?? new Set()
  set.add(moveId)
  learnedByPokemon.set(pokemonId, set)
}

const species = []
const usedMoveIds = new Set()
for (const row of csvs['pokemon_species.csv']) {
  const id = Number(row.id)
  if (id < 1 || id > MAX_ID || SKIP_SPECIES.has(id) || evolvesInto.has(id)) {
    continue
  }
  const types = GEN3_TYPES[id] ?? typesById.get(id) ?? ['normal']
  const stats = statsById.get(id)
  const learned = learnedByPokemon.get(id) ?? new Set()
  const moves = pickMoves(learned, moveById, types)
  const damaging = moves.some((moveId) => (moveById.get(moveId)?.power ?? 0) > 0)
  if (!stats || !damaging) {
    continue
  }
  for (const moveId of moves) {
    usedMoveIds.add(moveId)
  }
  species.push({
    id,
    name: row.identifier,
    label: namesEs.get(id) ?? row.identifier,
    types,
    stats,
    moves,
    legendary: row.is_legendary === '1' || row.is_mythical === '1',
  })
}

species.sort((a, b) => a.id - b.id)
const moves = [...usedMoveIds]
  .sort((a, b) => a - b)
  .map((id) => moveById.get(id))
  .filter(Boolean)

const dataDir = join(root, 'src', 'liga', 'data')
const spriteDir = join(root, 'public', 'liga', 'sprites')
const backDir = join(spriteDir, 'back')
await mkdir(dataDir, { recursive: true })
await mkdir(backDir, { recursive: true })
await writeFile(join(dataDir, 'species.json'), `${JSON.stringify(species)}\n`)
await writeFile(join(dataDir, 'moves.json'), `${JSON.stringify(moves)}\n`)

let sprites = 0
for (let i = 0; i < species.length; i += 8) {
  const batch = species.slice(i, i + 8)
  const results = await Promise.all(
    batch.flatMap((entry) => [
      downloadSprite(entry.id, false, spriteDir),
      downloadSprite(entry.id, true, backDir),
    ]),
  )
  sprites += results.filter(Boolean).length
}

console.log(`liga dex: ${species.length} especies, ${moves.length} movimientos, ${sprites} sprites`)
