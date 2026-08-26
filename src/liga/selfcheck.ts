import { applyAction, createGame } from './apply'
import { estimatedDamage, playTurn, startBattle } from './battle'
import { DIFFICULTIES, PRESETS, ROOM_COLS, ROOM_ROWS } from './constants'
import { isAKey, isBKey, isStartKey, isTurboKey, moveCursor } from './cursor'
import { FIELD_PARTY_COLS, rootCursorOf } from './fieldMenu'
import { SPECIES, moveOf, speciesOf } from './dex'
import { effectivenessLine } from './labels'
import { facingTrainer, tileAt, trainerPos, walkable } from './map'
import { makeSlot } from './team'
import { typeMatchup } from './typeChart'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(SPECIES.every((entry) => entry.id >= 1 && entry.id <= 386), 'Solo generaciones 1 a 3.')
assert(SPECIES.length >= 150, 'Hay un dex jugable.')
assert(speciesOf(36).types[0] === 'normal', 'Clefable es Normal en gen 3.')
assert(typeMatchup('fire', ['grass']) === 2, 'Fuego es 2× contra Planta.')
assert(typeMatchup('water', ['grass']) === 0.5, 'Agua es ½× contra Planta.')
assert(typeMatchup('ghost', ['normal']) === 0, 'Fantasma no afecta a Normal.')
assert(typeMatchup('dragon', ['steel']) === 0.5, 'Dragón es ½× contra Acero.')
assert(typeMatchup('ground', ['steel', 'rock']) === 4, 'Tierra es 4× contra Acero/Roca.')
assert(typeMatchup('fighting', ['psychic', 'flying']) === 0.25, 'Lucha es ¼× contra Psíquico/Volador.')
assert(typeMatchup('electric', ['water', 'ground']) === 0, 'Eléctrico no afecta si hay Tierra.')
assert(typeMatchup('ghost', ['steel']) === 0.5, 'Acero resiste Fantasma en gen 3.')
assert(typeMatchup('dark', ['steel']) === 0.5, 'Acero resiste Siniestro en gen 3.')
assert(typeMatchup('poison', ['steel']) === 0, 'Veneno no afecta a Acero.')
assert(typeMatchup('psychic', ['dark']) === 0, 'Psíquico no afecta a Siniestro.')
assert(typeMatchup('fighting', ['ghost']) === 0, 'Lucha no afecta a Fantasma.')
assert(moveOf(89).name === 'earthquake' && moveOf(89).type === 'ground', 'Terremoto es Tierra.')
assert(speciesOf(18).types.includes('flying'), 'Pidgeot es Volador.')
assert(speciesOf(6).types.includes('flying'), 'Charizard es Volador.')
assert(speciesOf(130).types.includes('flying'), 'Gyarados es Agua/Volador.')
assert(typeMatchup(moveOf(89).type, speciesOf(18).types) === 0, 'Terremoto no afecta a Pidgeot.')
assert(typeMatchup(moveOf(89).type, speciesOf(6).types) === 0, 'Terremoto no afecta a Charizard.')
assert(typeMatchup(moveOf(89).type, speciesOf(130).types) === 0, 'Terremoto no afecta a Gyarados.')
assert(speciesOf(184).types.join() === 'water', 'Azumarill es solo Agua en gen 3.')
assert(speciesOf(176).types.join() === 'normal', 'Togetic es Normal en gen 3.')
assert(speciesOf(282).types.join() === 'psychic', 'Gardevoir es solo Psíquico en gen 3.')
assert(speciesOf(303).types.join() === 'steel', 'Mawile es solo Acero en gen 3.')
assert(moveOf(85).power === 95, 'Rayo tiene 95 de poder en gen 3.')
assert(moveOf(86).accuracy === 100, 'Onda Trueno no falla en gen 3.')
assert(effectivenessLine(1) === 'Es eficaz.', 'El daño neutro anuncia eficacia.')
assert(effectivenessLine(4) === '¡Es muy eficaz!', 'El 4× también es muy eficaz.')
assert(effectivenessLine(0.25) === 'No es muy eficaz...', 'El ¼× no es muy eficaz.')
assert(effectivenessLine(0.5) === 'No es muy eficaz...', 'El ½× no es muy eficaz.')
assert(effectivenessLine(0, 'Groudon') === 'No afecta a Groudon...', 'El 0× no afecta.')
assert(!SPECIES.some((entry) => entry.types.includes('fairy' as never)), 'No hay tipo Hada.')
assert(
  SPECIES.every((entry) => entry.moves.length === 4 && new Set(entry.moves).size === 4),
  'Cada Pokémon tiene cuatro ataques distintos.',
)
assert(
  !speciesOf(6).moves.some((id) => moveOf(id).type === 'water'),
  'Charizard no tira ataques de Agua.',
)
assert(
  !speciesOf(9).moves.some((id) => moveOf(id).type === 'fire'),
  'Blastoise no tira ataques de Fuego.',
)
assert(
  speciesOf(6).moves.some((id) => moveOf(id).type === 'fire'),
  'Charizard lleva STAB de Fuego.',
)
assert(
  speciesOf(6).moves.some((id) => moveOf(id).type === 'flying'),
  'Charizard lleva STAB de Volador.',
)
assert(
  !speciesOf(282).moves.includes(89),
  'Gardevoir no usa Terremoto.',
)
assert(
  SPECIES.every(
    (entry) => !entry.types.includes('fire') || !entry.moves.some((id) => moveOf(id).type === 'water'),
  ),
  'Ningún tipo Fuego tira Agua.',
)
assert(
  SPECIES.every(
    (entry) => !entry.types.includes('water') || !entry.moves.some((id) => moveOf(id).type === 'fire'),
  ),
  'Ningún tipo Agua tira Fuego.',
)
assert(
  SPECIES.filter((entry) => entry.moves.includes(63) && !entry.types.includes('normal')).length === 0,
  'Hiperrayo queda para los tipo Normal.',
)

const quakeUser = { ...makeSlot(speciesOf(383), 50, 31, 0), spe: 200, moves: [{ moveId: 89, pp: 10 }] }
const flyer = { ...makeSlot(speciesOf(18), 50, 0, 0), spe: 1, moves: [{ moveId: 16, pp: 10 }] }
assert(estimatedDamage(quakeUser, flyer, 0) === 0, 'La IA no puntúa Terremoto contra Volador.')
const quakeBattle = playTurn(startBattle([quakeUser], [flyer], 'steven'), { kind: 'move', index: 0 }, 'easy', () => 0)
assert(quakeBattle.battle.foeParty[0]?.hp === flyer.hp, 'Terremoto no baja PS a Pidgeot.')
assert(quakeBattle.battle.lastFx[0]?.factor === 0, 'Terremoto contra Volador queda en 0×.')
assert(quakeBattle.battle.lastFx[0]?.note === 'No afecta a Pidgeot...', 'Terremoto anuncia que no afecta.')
assert(quakeBattle.battle.lastMoveIndex === 0, 'El combate guarda el último movimiento.')

const kickUser = { ...makeSlot(speciesOf(6), 50, 31, 0), spe: 200 }
assert((kickUser.moves.length ?? 0) >= 3, 'Charizard tiene varios ataques.')
const kickBattle = playTurn(startBattle([kickUser], [{ ...flyer, spe: 1 }], 'steven'), { kind: 'move', index: 2 }, 'easy', () => 0)
assert(kickBattle.battle.lastMoveIndex === 2, 'LUCHAR recuerda el último ataque usado.')

const wounded = { ...makeSlot(speciesOf(9), 50, 31, 0), hp: 25, maxHp: 200, spe: 200 }
const itemFoe = { ...makeSlot(speciesOf(20), 50, 0, 0), spe: 1 }
const potionTurn = playTurn(
  startBattle([wounded], [itemFoe], 'sidney'),
  { kind: 'item', itemId: 'hyper-potion', target: 0 },
  'easy',
  () => 0,
)
assert(potionTurn.battle.lastFx[0]?.kind === 'item', 'Usar un objeto anima el consumible primero.')
assert(potionTurn.battle.lastFx[0]?.itemId === 'hyper-potion', 'El FX guarda el objeto usado.')
assert(potionTurn.battle.lastFx[0]?.playerHp === 200, 'La poción llena los PS antes del golpe enemigo.')
assert(potionTurn.battle.lastFx[1]?.kind === 'move', 'El rival ataca después del objeto.')
assert(
  (potionTurn.battle.lastFx[1]?.playerHp ?? 200) < 200,
  'El golpe enemigo baja los PS después de curar.',
)

const outgoing = { ...makeSlot(speciesOf(382), 50, 31, 0), spe: 1 }
const incoming = { ...makeSlot(speciesOf(332), 50, 31, 0), spe: 1 }
const switchFoe = { ...makeSlot(speciesOf(229), 50, 31, 0), spe: 200 }
const switchTurn = playTurn(
  startBattle([outgoing, incoming], [switchFoe], 'sidney'),
  { kind: 'switch', index: 1 },
  'easy',
  () => 0,
)
const sendFx = switchTurn.battle.lastFx.find((step) => step.kind === 'send')
const hitFx = switchTurn.battle.lastFx.find((step) => step.kind === 'move')
assert(switchTurn.battle.lastFx[0]?.kind === 'recall', 'Primero se retira el Pokémon activo.')
assert(sendFx?.speciesId === incoming.speciesId, 'Después entra el reemplazo.')
assert(sendFx?.playerHp === incoming.hp, 'El reemplazo entra con sus PS actuales, no con el daño posterior.')
assert(hitFx?.kind === 'move', 'El rival ataca después de que entra el reemplazo.')
assert((hitFx?.playerHp ?? incoming.hp) <= (sendFx?.playerHp ?? incoming.hp), 'El daño llega después de la entrada.')

const waveUser = { ...makeSlot(speciesOf(26), 50, 31, 0), spe: 200, moves: [{ moveId: 86, pp: 20 }] }
const grounded = { ...makeSlot(speciesOf(28), 50, 0, 0), spe: 1, moves: [{ moveId: 89, pp: 10 }] }
assert(estimatedDamage(waveUser, grounded, 0) === 0, 'Onda Trueno no puntúa contra Tierra.')
const waveBattle = playTurn(startBattle([waveUser], [grounded], 'steven'), { kind: 'move', index: 0 }, 'easy', () => 0)
assert(waveBattle.battle.foeParty[0]?.status === null, 'Onda Trueno no paraliza a Tierra.')
assert(waveBattle.battle.lastFx[0]?.factor === 0, 'Onda Trueno contra Tierra queda en 0×.')

const toxicUser = { ...makeSlot(speciesOf(82), 50, 31, 0), spe: 200, moves: [{ moveId: 92, pp: 10 }] }
const steel = { ...makeSlot(speciesOf(303), 50, 0, 0), spe: 1, moves: [{ moveId: 63, pp: 5 }] }
assert(estimatedDamage(toxicUser, steel, 0) === 0, 'Tóxico no puntúa contra Acero.')
const toxicBattle = playTurn(startBattle([toxicUser], [steel], 'steven'), { kind: 'move', index: 0 }, 'easy', () => 0)
assert(toxicBattle.battle.foeParty[0]?.status === null, 'Tóxico no envenena a Acero.')

assert(moveOf(53).statusChance === 10 && moveOf(53).effect === 'burn', 'Lanzallamas puede quemar.')
assert(moveOf(85).statusChance === 10 && moveOf(85).effect === 'paralyze', 'Rayo puede paralizar.')
assert(moveOf(58).statusChance === 10 && moveOf(58).effect === 'freeze', 'Rayo Hielo puede congelar.')
assert(moveOf(188).statusChance === 30 && moveOf(188).effect === 'poison', 'Bomba Lodo puede envenenar.')

const burner = { ...makeSlot(speciesOf(6), 50, 31, 0), spe: 200, moves: [{ moveId: 53, pp: 15 }] }
const wet = { ...makeSlot(speciesOf(9), 50, 0, 0), spe: 1, moves: [{ moveId: 57, pp: 15 }] }
const burnTurn = playTurn(startBattle([burner], [wet], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(burnTurn.battle.foeParty[0]?.status === 'burn', 'Lanzallamas quema si entra el secundario.')
assert(burnTurn.battle.lastFx[0]?.statusNote?.includes('quemó'), 'El combate anuncia la quemadura.')

const fireFoe = { ...makeSlot(speciesOf(6), 50, 0, 0), spe: 1, moves: [{ moveId: 53, pp: 15 }] }
const noBurn = playTurn(startBattle([burner], [fireFoe], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(noBurn.battle.foeParty[0]?.status === null, 'Un tipo Fuego no se quema.')

const zapper = { ...makeSlot(speciesOf(26), 50, 31, 0), spe: 200, moves: [{ moveId: 85, pp: 15 }] }
const paraTurn = playTurn(startBattle([zapper], [wet], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(paraTurn.battle.foeParty[0]?.status === 'paralyze', 'Rayo deja paralizado si entra el secundario.')

const freezer = { ...makeSlot(speciesOf(87), 50, 31, 0), spe: 1, moves: [{ moveId: 58, pp: 10 }] }
const freezeTurn = playTurn(startBattle([freezer], [{ ...wet, spe: 200 }], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(freezeTurn.battle.foeParty[0]?.status === 'freeze', 'Rayo Hielo congela si el rival ya atacó.')

const iceFoe = { ...makeSlot(speciesOf(87), 50, 0, 0), spe: 1, moves: [{ moveId: 58, pp: 10 }] }
const noFreeze = playTurn(startBattle([freezer], [iceFoe], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(noFreeze.battle.foeParty[0]?.status === null, 'Un tipo Hielo no se congela.')

const poisoner = { ...makeSlot(speciesOf(89), 50, 31, 0), spe: 200, moves: [{ moveId: 188, pp: 10 }] }
const poisonTurn = playTurn(startBattle([poisoner], [wet], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.08)
assert(poisonTurn.battle.foeParty[0]?.status === 'poison', 'Bomba Lodo puede envenenar.')

const misser = { ...makeSlot(speciesOf(6), 50, 31, 0), spe: 200, moves: [{ moveId: 126, pp: 5 }] }
const missTurn = playTurn(startBattle([misser], [wet], 'sidney'), { kind: 'move', index: 0 }, 'easy', () => 0.9)
assert(missTurn.battle.lastFx[0]?.miss, 'Llamarada puede fallar.')
assert(Boolean(missTurn.battle.lastFx[0]?.note?.includes('falló')), 'El fallo queda en pantalla hasta confirmar.')
assert(missTurn.battle.foeParty[0]?.hp === wet.hp, 'Si el ataque falla, no baja PS.')

const game = createGame('medium', 7)
assert(game.party.length === 6, 'El equipo tiene 6 Pokémon.')
assert(new Set(game.party.map((slot) => slot.speciesId)).size === 6, 'El equipo no repite especies.')
assert(game.party.every((slot) => slot.level === PRESETS.medium.playerLevel), 'El nivel sigue la dificultad.')
assert(game.trainers.sidney.party.length === 5, 'Sixto tiene 5 Pokémon.')
assert(game.trainers.steven.party.length === 6, 'Máximo tiene 6 Pokémon.')
assert(listedBagHasItems(game), 'Hay objetos precargados.')

const same = createGame('medium', 7)
assert(
  same.party.every((slot, index) => slot.speciesId === game.party[index]?.speciesId),
  'La misma semilla da el mismo equipo.',
)

const other = createGame('medium', 99)
assert(
  other.party.some((slot, index) => slot.speciesId !== game.party[index]?.speciesId),
  'Otra semilla cambia el equipo.',
)

assert(game.player.x >= 0 && game.player.x < ROOM_COLS, 'El jugador nace en la sala.')
assert(game.player.y >= 0 && game.player.y < ROOM_ROWS, 'El jugador nace en la sala.')
assert(tileAt(game.room, 0, 0) === 'wall', 'Las esquinas son pared.')
assert(!walkable(game, 0, 0), 'No se camina sobre paredes.')
assert(!walkable(game, 1, 6), 'No se camina sobre las plantas.')
assert(!walkable(game, 1, 4), 'No se camina sobre las estatuas.')
assert(!walkable(game, 2, 2), 'No se camina sobre las columnas.')
assert(!walkable(game, 2, 3), 'La columna ocupa dos casillas.')

let walked = applyAction(game, { kind: 'step', dir: 'left' }, () => 0)
assert(walked.facing === 'left', 'Girar actualiza la mirada.')

const south = applyAction({ ...game, player: { x: 6, y: 9 }, facing: 'down' }, { kind: 'step', dir: 'down' }, () => 0)
assert(south.player.y === 9 && south.room === 'sidney', 'El sur de Sixto está cerrado.')

const trainer = trainerPos(game, 'sidney')
assert(trainer, 'Sixto está en la sala.')
assert(!walkable(game, trainer.x, trainer.y), 'El entrenador bloquea el paso.')
assert(!walkable(game, 6, 0), 'La puerta norte está cerrada hasta ganar.')

let atTrainer = game
for (let i = 0; i < 12 && !facingTrainer(atTrainer); i += 1) {
  atTrainer = applyAction(atTrainer, { kind: 'step', dir: 'up' }, () => 0)
}
assert(facingTrainer(atTrainer) === 'sidney', 'Se puede mirar a Sixto.')
atTrainer = applyAction(atTrainer, { kind: 'interact' }, () => 0)
assert(atTrainer.phase === 'dialog' && atTrainer.dialog, 'Hablar abre el diálogo.')
atTrainer = applyAction(atTrainer, { kind: 'interact' }, () => 0)
assert(atTrainer.phase === 'battle' && atTrainer.battle, 'El diálogo entra en combate.')
assert(atTrainer.battle?.trainerId === 'sidney', 'El combate es contra Sixto.')

assert(isAKey('z') && !isAKey('Enter') && isStartKey('Enter') && isBKey('x') && isTurboKey(' '), 'Z confirma, Enter abre el menú y X cancela.')
assert(rootCursorOf('bag') === 1, 'Volver de la mochila deja el cursor en MOCHILA.')
assert(rootCursorOf('option') === 2, 'Volver de opción deja el cursor en OPCIÓN.')
assert(rootCursorOf('party') === 0, 'Volver del equipo deja el cursor en POKÉMON.')

const swapped = applyAction(game, { kind: 'reorder', from: 0, to: 1 }, () => 0)
assert(swapped.party[0]?.speciesId === game.party[1]?.speciesId, 'El menú puede cambiar quién sale primero.')
assert(swapped.party[1]?.speciesId === game.party[0]?.speciesId, 'El intercambio de equipo es simétrico.')
assert(moveCursor(0, 4, 'right', 2) === 1, 'El cursor de combate se mueve en grilla.')
assert(moveCursor(0, 4, 'down', 2) === 2, 'Abajo en LUCHAR baja a POKÉMON.')
assert(moveCursor(0, 6, 'right', FIELD_PARTY_COLS) === 1, 'En el equipo, derecha cambia de columna.')
assert(moveCursor(0, 6, 'down', FIELD_PARTY_COLS) === 2, 'En el equipo, abajo baja de fila.')
assert(moveCursor(0, 6, 'left', FIELD_PARTY_COLS) === 1, 'En el equipo, izquierda va a la otra columna.')
assert(moveCursor(1, 6, 'down', FIELD_PARTY_COLS) === 3, 'Abajo en la columna derecha baja un puesto.')

let fight = atTrainer
for (let n = 0; n < 500 && fight.phase === 'battle'; n += 1) {
  const battle = fight.battle
  if (!battle) {
    break
  }
  if (battle.outcome === 'win' || battle.outcome === 'lose') {
    fight = applyAction(fight, { kind: 'resolve' }, () => 0.5)
    continue
  }
  if (battle.mustSwitch) {
    const next = battle.playerParty.findIndex((slot, index) => slot.hp > 0 && index !== battle.playerActive)
    fight = applyAction(fight, { kind: 'switch', index: Math.max(0, next) }, () => 0.5)
    continue
  }
  fight = applyAction(fight, { kind: 'move', index: 0 }, () => 0.5)
  if (n === 0) {
    assert(fight.battle?.lastFx[0]?.kind === 'move', 'El turno anima el ataque primero.')
    assert(typeof fight.battle?.lastFx[0]?.playerHp === 'number', 'El FX guarda los PS del golpe.')
  }
}
assert(fight.phase === 'dialog' || fight.phase === 'lost', 'El combate termina al resolver.')
if (fight.phase === 'dialog') {
  assert(fight.trainers.sidney.beaten, 'Ganar abre la puerta de Sixto.')
  assert(walkable(fight, 6, 0), 'La puerta norte queda transitable.')
}

const move = moveOf(atTrainer.party[0]?.moves[0]?.moveId ?? 63)
assert(move.pp > 0, 'Los movimientos tienen PP.')

assert(DIFFICULTIES.length === 4, 'Hay cuatro dificultades.')
assert(PRESETS.easy.playerLevel > PRESETS.perfect.playerLevel, 'Fácil da más nivel que Perfecta.')
assert((PRESETS.easy.bag['full-restore'] ?? 0) > (PRESETS.perfect.bag.potion ?? 0), 'Fácil trae más curas.')

console.log('liga selfcheck ok')

function listedBagHasItems(state: ReturnType<typeof createGame>): boolean {
  return Object.values(state.bag).some((count) => (count ?? 0) > 0)
}
