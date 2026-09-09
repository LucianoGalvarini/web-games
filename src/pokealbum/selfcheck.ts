import { ACHIEVEMENTS, evaluateNewAchievements } from './achievements'
import { POKEMON, RARITY_WEIGHT, TOTAL_POKEMON, bestRarity } from './data'
import { DUPLICATE_SELL_VALUE, RECYCLE_COST, SHINY_CHALLENGE_DUPLICATES } from './economy'
import {
  applySticker,
  createInitialAlbum,
  creditDuplicate,
  openPack,
  progress,
  recycleDuplicates,
  sellAllDuplicates,
  sellDuplicate,
  weightedPick,
} from './pack'
import { ROULETTE_SEGMENTS, rollSegmentAmount, spinRoulette } from './roulette'
import { decodeSave, encodeSave, wasSignatureTampered } from './save'
import { canAttemptShiny, consumeShinyAttempt, unlockShiny } from './shiny'
import { pickShinyChallengeQuestions } from './shinyQuestions'
import type { ShinyQuestion } from './shinyQuestions'
import { TRAINER_TRIVIA } from './trainerTrivia'
import type { AlbumState, Rarity } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(POKEMON.length === TOTAL_POKEMON, 'El dex de Kanto tiene 151 entradas.')

const ids = new Set(POKEMON.map((p) => p.id))
assert(ids.size === TOTAL_POKEMON, 'Los ids del dex son únicos.')
for (let id = 1; id <= TOTAL_POKEMON; id += 1) {
  assert(ids.has(id), `El id ${id} está presente en el dex.`)
}

const rarityCounts: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 }
for (const p of POKEMON) {
  rarityCounts[p.rarity] += 1
}
assert(rarityCounts.common === 52, 'Hay 52 Pokémon comunes.')
assert(rarityCounts.uncommon === 61, 'Hay 61 Pokémon poco comunes.')
assert(rarityCounts.rare === 33, 'Hay 33 Pokémon raros.')
assert(rarityCounts.legendary === 5, 'Hay 5 Pokémon legendarios.')

let seed = 1234567
function rng(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

const seenRarities = new Set<Rarity>()
for (let i = 0; i < 5000; i += 1) {
  const id = weightedPick(rng)
  const entry = POKEMON.find((p) => p.id === id)
  assert(entry, `weightedPick devuelve un id válido (${id}).`)
  seenRarities.add(entry.rarity)
}
assert(seenRarities.size === 4, 'Una muestra grande de weightedPick cubre las cuatro rarezas.')
assert(RARITY_WEIGHT.common > RARITY_WEIGHT.legendary, 'Los comunes pesan más que los legendarios en el sorteo.')

let album: AlbumState = createInitialAlbum(0)
const opened = openPack(album, rng)
album = opened.state
assert(opened.result.length === 5, 'Un sobre trae 5 figuritas.')
for (const item of opened.result) {
  assert(album.entries[item.id].owned, 'Toda figurita salida de un sobre queda marcada como obtenida.')
}

assert(weightedPick(() => 0) === POKEMON[0].id, 'weightedPick con rng()=0 siempre elige el primer Pokémon de la tabla.')

const totalWeight = POKEMON.reduce((sum, p) => sum + RARITY_WEIGHT[p.rarity], 0)
function rngForId(id: number): () => number {
  let cumulative = 0
  for (const p of POKEMON) {
    if (p.id === id) {
      cumulative += RARITY_WEIGHT[p.rarity] / 2
      break
    }
    cumulative += RARITY_WEIGHT[p.rarity]
  }
  const roll = cumulative / totalWeight
  return () => roll
}

const dupTarget = opened.result[0].id
const before = { ...album.entries[dupTarget] }
const second = openPack(album, rngForId(dupTarget))
assert(
  second.result.every((item) => item.id === dupTarget && !item.isNew),
  'Un rng fijo repite siempre el mismo Pokémon ya obtenido, marcado como repetida.',
)
assert(
  second.state.entries[dupTarget].duplicates === before.duplicates + second.result.length,
  'Cada figurita repetida suma un duplicado en vez de perderla.',
)

const dupEntry = POKEMON.find((p) => p.id === dupTarget)
assert(dupEntry, 'El Pokémon repetido en la prueba existe en el dex.')

const freshForDuplicates: AlbumState = createInitialAlbum(0)
assert(sellDuplicate(freshForDuplicates, dupTarget) === null, 'sellDuplicate devuelve null sin repetidas.')
assert(
  recycleDuplicates(freshForDuplicates, rng) === null,
  'recycleDuplicates devuelve null con menos de RECYCLE_COST repetidas en total.',
)

const sellValue = DUPLICATE_SELL_VALUE[dupEntry.rarity]
const sold = sellDuplicate(second.state, dupTarget)
assert(sold !== null, 'sellDuplicate vende una repetida existente.')
assert(sold.coins === second.state.coins + sellValue, 'Vender una repetida suma el valor según su rareza.')
assert(
  sold.entries[dupTarget].duplicates === second.state.entries[dupTarget].duplicates - 1,
  'Vender una repetida resta exactamente 1 al contador de duplicados.',
)

assert(
  second.state.entries[dupTarget].duplicates >= RECYCLE_COST,
  'El álbum de prueba tiene suficientes repetidas concentradas en un solo Pokémon para reciclar.',
)
const recycled = recycleDuplicates(second.state, () => 0)
assert(recycled !== null, 'recycleDuplicates funciona con al menos RECYCLE_COST repetidas en total.')
assert(
  recycled.state.entries[dupTarget].duplicates === second.state.entries[dupTarget].duplicates - RECYCLE_COST,
  'Reciclar resta exactamente RECYCLE_COST repetidas cuando están todas en un mismo Pokémon.',
)
assert(recycled.result.id === POKEMON[0].id, 'recycleDuplicates con rng()=0 saca siempre el primer Pokémon de la tabla.')
assert(
  recycled.result.isNew === !second.state.entries[POKEMON[0].id].owned,
  'El resultado del reciclaje marca nueva/repetida según lo que ya se tenía.',
)
assert(
  recycled.state.entries[POKEMON[0].id].owned === second.state.entries[POKEMON[0].id].owned,
  'recycleDuplicates no aplica la figurita al álbum: solo la devuelve para pegarla después.',
)

const spread: AlbumState = {
  coins: 0,
  entries: {
    ...freshForDuplicates.entries,
    [POKEMON[10].id]: { owned: true, duplicates: 3 },
    [POKEMON[20].id]: { owned: true, duplicates: 2 },
  },
}
assert(
  Object.values(spread.entries).reduce((sum, e) => sum + e.duplicates, 0) === RECYCLE_COST,
  'El álbum de prueba tiene exactamente RECYCLE_COST repetidas repartidas entre dos Pokémon distintos.',
)
const recycledSpread = recycleDuplicates(spread, () => 0)
assert(recycledSpread !== null, 'recycleDuplicates funciona con repetidas de Pokémon distintos, no solo del mismo.')
assert(
  recycledSpread.state.entries[POKEMON[10].id].duplicates === 0 && recycledSpread.state.entries[POKEMON[20].id].duplicates === 0,
  'Reciclar consume repetidas de cualquier Pokémon hasta completar RECYCLE_COST en total.',
)

assert(sellAllDuplicates(freshForDuplicates) === null, 'sellAllDuplicates devuelve null sin repetidas.')

const forSellAll: AlbumState = {
  coins: 0,
  entries: {
    ...freshForDuplicates.entries,
    [POKEMON[10].id]: { owned: true, duplicates: 3 },
    [POKEMON[20].id]: { owned: true, duplicates: 2 },
  },
}
const expectedTotal =
  3 * DUPLICATE_SELL_VALUE[POKEMON[10].rarity] + 2 * DUPLICATE_SELL_VALUE[POKEMON[20].rarity]
const sellAllOutcome = sellAllDuplicates(forSellAll)
assert(sellAllOutcome !== null, 'sellAllDuplicates vende cuando hay repetidas.')
assert(sellAllOutcome.total === expectedTotal, 'sellAllDuplicates suma el valor correcto según la rareza de cada una.')
assert(sellAllOutcome.state.coins === expectedTotal, 'sellAllDuplicates acredita el total vendido al saldo.')
assert(
  sellAllOutcome.state.entries[POKEMON[10].id].duplicates === 0 &&
    sellAllOutcome.state.entries[POKEMON[20].id].duplicates === 0,
  'sellAllDuplicates deja todas las repetidas en cero.',
)

const freshForSticker: AlbumState = createInitialAlbum(0)
const stuckNew = applySticker(freshForSticker, { id: dupTarget, isNew: true })
assert(stuckNew.entries[dupTarget].owned, 'applySticker marca la figurita como obtenida.')
assert(stuckNew.entries[dupTarget].duplicates === 0, 'Pegar una figurita nueva no suma duplicados.')
const stuckDup = applySticker(stuckNew, { id: dupTarget, isNew: false })
assert(stuckDup.entries[dupTarget].duplicates === 1, 'Pegar una repetida suma 1 al contador de duplicados.')

const beforeCredit = createInitialAlbum(0)
const credited = creditDuplicate(beforeCredit, dupTarget)
assert(!credited.entries[dupTarget].owned, 'creditDuplicate no marca la figurita como obtenida.')
assert(
  credited.entries[dupTarget].duplicates === beforeCredit.entries[dupTarget].duplicates + 1,
  'creditDuplicate suma 1 al contador de duplicados sin tocar owned.',
)

const stats = progress(album)
assert(stats.total === TOTAL_POKEMON, 'El progreso reporta el total correcto de figuritas.')
assert(stats.owned >= 1, 'El progreso cuenta al menos una figurita obtenida tras abrir un sobre.')

const withCoins: AlbumState = { ...album, coins: 340 }
const code = encodeSave(withCoins)
const decoded = decodeSave(code)
assert(decoded !== null, 'Un código de guardado válido se puede decodificar.')
assert(decoded.coins === 340, 'El roundtrip de guardado conserva el saldo de monedas.')
for (const p of POKEMON) {
  assert(
    decoded.entries[p.id].owned === withCoins.entries[p.id].owned &&
      decoded.entries[p.id].duplicates === withCoins.entries[p.id].duplicates,
    `El roundtrip de guardado conserva la entrada del Pokémon ${p.id}.`,
  )
}

assert(decodeSave('esto no es un código válido') === null, 'Un código corrupto no crashea, devuelve null.')
assert(decodeSave(btoa(JSON.stringify({ version: 2, coins: 0, entries: {} }))) === null, 'Una versión desconocida es rechazada.')
assert(
  decodeSave(btoa(JSON.stringify({ version: 1, coins: -5, entries: {} }))) === null,
  'Un saldo negativo es rechazado.',
)
assert(
  decodeSave(btoa(JSON.stringify({ version: 1, coins: 0, entries: { '9999': { owned: true, duplicates: 0 } } }))) === null,
  'Un id fuera de rango es rechazado.',
)

assert(wasSignatureTampered(code) === false, 'Un código de guardado recién generado no se marca como manipulado.')
const tamperedCode = btoa(
  encodeURIComponent(JSON.stringify({ ...JSON.parse(decodeURIComponent(atob(code))), coins: 999999 })),
)
assert(wasSignatureTampered(tamperedCode) === true, 'Cambiar las monedas de un código firmado sin recalcular la firma se detecta.')
assert(
  wasSignatureTampered(btoa(encodeURIComponent(JSON.stringify({ version: 1, coins: 50, entries: {} })))) === false,
  'Un código sin firma (guardado antiguo) no se marca como manipulado.',
)

assert(bestRarity([1]) === 'common', 'bestRarity de un solo común es común (Bulbasaur).')
assert(bestRarity([1, 2]) === 'uncommon', 'bestRarity elige la más alta entre común y poco común (Ivysaur).')
assert(bestRarity([1, 2, 3]) === 'rare', 'bestRarity elige rara sobre común/poco común (Venusaur).')
assert(bestRarity([1, 144]) === 'legendary', 'bestRarity elige legendaria sobre cualquier otra (Articuno).')
assert(bestRarity([]) === 'common', 'bestRarity de una lista vacía devuelve común por defecto.')

const negativeWeight = ROULETTE_SEGMENTS.filter((seg) => seg.kind === 'loseCoins').reduce((sum, seg) => sum + seg.weight, 0)
const rouletteTotalWeight = ROULETTE_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0)
assert(negativeWeight / rouletteTotalWeight <= 0.15, 'Los segmentos que quitan monedas pesan poco en la ruleta (máximo 15%).')
assert(spinRoulette(() => 0) === ROULETTE_SEGMENTS[0], 'spinRoulette con rng()=0 siempre elige el primer segmento.')
const jackpot = ROULETTE_SEGMENTS.find((seg) => seg.id === 'jackpot')
assert(jackpot !== undefined, 'Existe un segmento de jackpot en la ruleta.')
assert(spinRoulette(() => 0.9999) === ROULETTE_SEGMENTS[ROULETTE_SEGMENTS.length - 1], 'spinRoulette con rng()≈1 elige el último segmento.')
const potSegment = ROULETTE_SEGMENTS.find((seg) => seg.id === 'pot')
assert(potSegment !== undefined, 'Existe un segmento de bote variable en la ruleta.')
assert(rollSegmentAmount(potSegment, () => 0) === potSegment.min, 'rollSegmentAmount con rng()=0 devuelve el mínimo del bote.')
assert(
  rollSegmentAmount(potSegment, () => 0.999) === potSegment.max,
  'rollSegmentAmount con rng()≈1 devuelve el máximo del bote.',
)
assert(jackpot && rollSegmentAmount(jackpot, () => 0) === jackpot.amount, 'rollSegmentAmount de un monto fijo ignora el rng.')

const achievementIds = new Set(ACHIEVEMENTS.map((a) => a.id))
assert(achievementIds.size === ACHIEVEMENTS.length, 'Los ids de logros son únicos.')

const emptyCtx = {
  album: createInitialAlbum(0),
  triviaCorrectTotal: 0,
  triviaCorrectByMode: { statPair: 0, trueFalse: 0, multipleChoice: 0, trainer: 0 },
  bestTriviaStreak: 0,
  packsOpened: 0,
  recycleCount: 0,
}
assert(
  evaluateNewAchievements(emptyCtx, new Set()).length === 0,
  'Un contexto vacío no desbloquea ningún logro.',
)

const fullAlbum = createInitialAlbum(0)
for (const p of POKEMON) {
  fullAlbum.entries[p.id] = { owned: true, duplicates: 0 }
}
const fullCtx = {
  album: fullAlbum,
  triviaCorrectTotal: 999,
  triviaCorrectByMode: { statPair: 999, trueFalse: 999, multipleChoice: 999, trainer: 999 },
  bestTriviaStreak: 999,
  packsOpened: 999,
  recycleCount: 999,
}
assert(
  evaluateNewAchievements(fullCtx, new Set()).length === ACHIEVEMENTS.length,
  'Un contexto que cumple todo desbloquea todos los logros.',
)
assert(
  evaluateNewAchievements(fullCtx, achievementIds).length === 0,
  'Los logros ya desbloqueados no se vuelven a reportar como nuevos.',
)

const oneCorrectCtx = { ...emptyCtx, triviaCorrectTotal: 1 }
const firstCorrect = evaluateNewAchievements(oneCorrectCtx, new Set())
assert(
  firstCorrect.length === 1 && firstCorrect[0].id === 'trivia_first_correct',
  'Una sola respuesta correcta solo desbloquea el logro de primera correcta.',
)

assert(TRAINER_TRIVIA.length >= 10, 'Hay una cantidad razonable de preguntas de entrenadores.')
for (const item of TRAINER_TRIVIA) {
  assert(item.options.length === 4, `"${item.prompt}" tiene exactamente 4 opciones.`)
  assert(
    item.correctIndex >= 0 && item.correctIndex < item.options.length,
    `"${item.prompt}" tiene un índice de respuesta correcta válido.`,
  )
  assert(new Set(item.options).size === item.options.length, `"${item.prompt}" no repite ninguna opción.`)
}
const trainerPrompts = new Set(TRAINER_TRIVIA.map((item) => item.prompt))
assert(trainerPrompts.size === TRAINER_TRIVIA.length, 'Las preguntas de entrenadores no se repiten.')

const shinyTarget = POKEMON[5].id
const belowThreshold: AlbumState = {
  coins: 0,
  entries: { ...createInitialAlbum(0).entries, [shinyTarget]: { owned: true, duplicates: SHINY_CHALLENGE_DUPLICATES - 1 } },
}
assert(canAttemptShiny(belowThreshold, shinyTarget) === false, 'canAttemptShiny es falso por debajo del umbral de repetidas.')
assert(consumeShinyAttempt(belowThreshold, shinyTarget) === null, 'consumeShinyAttempt devuelve null por debajo del umbral.')

const atThreshold: AlbumState = {
  coins: 0,
  entries: { ...createInitialAlbum(0).entries, [shinyTarget]: { owned: true, duplicates: SHINY_CHALLENGE_DUPLICATES + 2 } },
}
assert(canAttemptShiny(atThreshold, shinyTarget) === true, 'canAttemptShiny es verdadero con suficientes repetidas.')
const afterAttempt = consumeShinyAttempt(atThreshold, shinyTarget)
assert(afterAttempt !== null, 'consumeShinyAttempt funciona con suficientes repetidas.')
assert(
  afterAttempt.entries[shinyTarget].duplicates === 2,
  'consumeShinyAttempt resta exactamente SHINY_CHALLENGE_DUPLICATES repetidas.',
)
assert(afterAttempt.entries[shinyTarget].shiny !== true, 'consumeShinyAttempt no desbloquea shiny por sí solo.')

const unlocked = unlockShiny(afterAttempt, shinyTarget)
assert(unlocked.entries[shinyTarget].shiny === true, 'unlockShiny marca la especie como shiny.')
assert(canAttemptShiny(unlocked, shinyTarget) === false, 'Una especie ya shiny no puede volver a intentarse.')

const shinyEntryRoundtrip: AlbumState = { coins: 10, entries: { ...unlocked.entries } }
const shinyCode = encodeSave(shinyEntryRoundtrip)
const shinyDecoded = decodeSave(shinyCode)
assert(shinyDecoded !== null, 'Un guardado con una especie shiny se decodifica igual.')
assert(shinyDecoded.entries[shinyTarget].shiny === true, 'El roundtrip de guardado conserva el flag shiny.')
assert(
  wasSignatureTampered(shinyCode) === false,
  'Guardar el flag shiny no afecta la firma anti-trampa (no forma parte del canónico firmado).',
)

function mockShinyQuestion(difficulty: ShinyQuestion['difficulty'], n: number): ShinyQuestion {
  return {
    id: `${difficulty}_${n}`,
    category: 'tipo',
    difficulty,
    question: `pregunta ${difficulty} ${n}`,
    options: ['a', 'b', 'c', 'd'],
    answerIndex: 0,
    explanation: 'x',
  }
}
const mockPool: ShinyQuestion[] = [
  ...Array.from({ length: 2 }, (_, i) => mockShinyQuestion('fácil', i)),
  ...Array.from({ length: 6 }, (_, i) => mockShinyQuestion('media', i)),
  ...Array.from({ length: 4 }, (_, i) => mockShinyQuestion('difícil', i)),
]
const shinySelection = pickShinyChallengeQuestions(mockPool, rng)
assert(shinySelection.length === 5, 'Un desafío shiny selecciona exactamente 5 preguntas.')
assert(
  shinySelection.map((q) => q.difficulty).join(',') === 'fácil,media,media,difícil,difícil',
  'La selección va de fácil a difícil, terminando en dos preguntas difíciles.',
)
assert(
  new Set(shinySelection.map((q) => q.id)).size === 5,
  'Un desafío shiny no repite la misma pregunta dos veces.',
)
const shinySelection2 = pickShinyChallengeQuestions(mockPool, () => 0)
assert(
  shinySelection2.every((q) => mockPool.some((p) => p.id === q.id)),
  'La selección siempre viene del pool recibido.',
)

console.log('pokealbum selfcheck ok')
