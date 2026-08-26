import { applyAction, createGame } from './apply'
import { DIFFICULTIES, PRESETS, ROOM_COLS, ROOM_ROWS } from './constants'
import { isAKey, isBKey, isTurboKey, moveCursor } from './cursor'
import { SPECIES, moveOf, speciesOf } from './dex'
import { facingTrainer, tileAt, trainerPos, walkable } from './map'
import { typeMatchup } from './typeChart'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(SPECIES.every((entry) => entry.id >= 1 && entry.id <= 386), 'Solo generaciones 1 a 3.')
assert(SPECIES.length >= 150, 'Hay un dex jugable.')
assert(speciesOf(36).types[0] === 'normal', 'Clefable es Normal en gen 3.')
assert(typeMatchup('fire', ['grass']) === 2, 'Fuego es fuerte contra Planta.')
assert(typeMatchup('ghost', ['normal']) === 0, 'Fantasma no afecta a Normal.')
assert(typeMatchup('dragon', ['steel']) === 0.5, 'Dragón es débil contra Acero.')
assert(!SPECIES.some((entry) => entry.types.includes('fairy' as never)), 'No hay tipo Hada.')

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

assert(isAKey('z') && isBKey('x') && isTurboKey(' '), 'Z confirma, X cancela y espacio acelera.')
assert(moveCursor(0, 4, 'right', 2) === 1, 'El cursor de combate se mueve en grilla.')
assert(moveCursor(0, 4, 'down', 2) === 2, 'Abajo en LUCHAR baja a POKÉMON.')
assert(moveCursor(0, 6, 'right', 2) === 1, 'En el equipo, derecha cambia de columna.')
assert(moveCursor(0, 6, 'down', 2) === 2, 'En el equipo, abajo baja de fila.')

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
