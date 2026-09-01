import { chooseAiTurn } from './ai'
import { applyMove, applyTurn, winnerOf } from './apply'
import { checkersOf, clonePosition, createInitialPosition } from './board'
import { generateTurns, hasLegalTurn, legalSingleMoves } from './moves'
import type { BackgammonPosition } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const start = createInitialPosition()
assert(checkersOf(start, 'white') === 15, 'Las blancas arrancan con 15 fichas.')
assert(checkersOf(start, 'black') === 15, 'Las negras arrancan con 15 fichas.')

const openingTurns = generateTurns(start, [3, 5])
assert(openingTurns.length > 0, 'La apertura tiene jugadas legales.')
assert(
  openingTurns.every((turn) => turn.length === 2),
  'Con 3-5 en la apertura siempre se pueden jugar los dos dados.',
)

const doubles = generateTurns(start, [6, 6])
assert(
  doubles.every((turn) => turn.length <= 4),
  'Un doble no puede jugar más de cuatro fichas.',
)
assert(
  doubles.some((turn) => turn.length === 4),
  'Con dobles 6 la apertura permite jugar los cuatro.',
)

// Hit a blot.
const hitPos: BackgammonPosition = clonePosition(start)
hitPos.points[18] = { player: 'black', count: 1 }
hitPos.points[23] = { player: 'white', count: 1 }
hitPos.points[12] = null
const hitMoves = legalSingleMoves(hitPos, 'white', 5)
const hitMove = hitMoves.find((move) => move.kind === 'move' && move.to === 18)
assert(hitMove, 'Blanca puede pegarle al blot negro en el 19 con un 5 desde el 24.')
const afterHit = applyMove(hitPos, hitMove!)
assert(afterHit.bar.black === 1, 'El blot negro comido va a la barra.')
assert(afterHit.points[18]?.player === 'white', 'La blanca ocupa el punto tras comer.')

// Bar entry is mandatory before any other move.
const barPos: BackgammonPosition = clonePosition(start)
barPos.bar.white = 1
barPos.points[23] = null
const barTurns = generateTurns(barPos, [2, 4])
assert(
  barTurns.every((turn) => turn[0]?.kind === 'enter'),
  'Con una ficha en la barra, la primera jugada siempre es entrar.',
)

// Blocked entry: black owns all six entry points for white with 2+.
const blockedPos: BackgammonPosition = clonePosition(start)
blockedPos.bar.white = 1
for (let index = 18; index <= 23; index += 1) {
  blockedPos.points[index] = { player: 'black', count: 2 }
}
assert(!hasLegalTurn(blockedPos, [1, 2]), 'Si el rival cierra su cuadro, la ficha en la barra no puede entrar.')

// Bearing off: white has all checkers in the home board.
const bearPos: BackgammonPosition = clonePosition(start)
bearPos.points = new Array(24).fill(null)
bearPos.points[0] = { player: 'white', count: 2 }
bearPos.points[2] = { player: 'white', count: 3 }
bearPos.points[5] = { player: 'white', count: 10 }
bearPos.points[18] = { player: 'black', count: 15 }
const exactBearOff = legalSingleMoves(bearPos, 'white', 1)
assert(
  exactBearOff.some((move) => move.kind === 'bearoff' && move.from === 0),
  'Con un 1 se retira la ficha del punto 1 (índice 0).',
)
const excessPos: BackgammonPosition = clonePosition(start)
excessPos.points = new Array(24).fill(null)
excessPos.points[0] = { player: 'white', count: 2 }
excessPos.points[2] = { player: 'white', count: 3 }
excessPos.points[3] = { player: 'white', count: 10 }
excessPos.points[18] = { player: 'black', count: 15 }
const excessBearOff = legalSingleMoves(excessPos, 'white', 6)
assert(
  excessBearOff.some((move) => move.kind === 'bearoff' && move.from === 3),
  'Con un 6 y nada en los puntos 5 o 6, sale la ficha más atrasada (punto 4).',
)
const cannotExcessPos: BackgammonPosition = clonePosition(start)
cannotExcessPos.points = new Array(24).fill(null)
cannotExcessPos.points[0] = { player: 'white', count: 2 }
cannotExcessPos.points[3] = { player: 'white', count: 3 }
cannotExcessPos.points[5] = { player: 'white', count: 10 }
cannotExcessPos.points[18] = { player: 'black', count: 15 }
const cannotExcess = legalSingleMoves(cannotExcessPos, 'white', 5)
assert(
  cannotExcess.every((move) => move.kind !== 'bearoff'),
  'Con un 5 y fichas más atrasadas en el punto 6, el 5 no puede retirar la del punto 4: hay que mover.',
)

// Winner detection.
const wonPos = clonePosition(start)
wonPos.off.white = 15
assert(winnerOf(wonPos) === 'white', 'Quince fichas afuera es la victoria.')
assert(winnerOf(start) === null, 'La posición inicial no tiene ganador.')

// AI smoke test across difficulties.
for (const difficulty of ['easy', 'medium', 'hard', 'perfect'] as const) {
  let position = createInitialPosition()
  for (let round = 0; round < 6; round += 1) {
    const dice: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]
    const turn = chooseAiTurn(position, dice, difficulty)
    position = applyTurn(position, turn)
    if (winnerOf(position)) {
      break
    }
  }
  assert(checkersOf(position, 'white') === 15, `(${difficulty}) las blancas conservan sus 15 fichas en juego.`)
  assert(checkersOf(position, 'black') === 15, `(${difficulty}) las negras conservan sus 15 fichas en juego.`)
}

console.log('backgammon selfcheck ok')
