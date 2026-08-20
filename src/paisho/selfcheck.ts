import { chooseAiMove } from './ai'
import { winnerOf } from './apply'
import { createInitialPosition } from './board'
import { CENTER, GATES, gardenOf, isGate } from './constants'
import { hasClash, hasHarmonyRing } from './harmony'
import { applyMove, legalMoves, sameMove } from './moves'
import type { PaiMove, PaiPosition, PaiTile } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function withTiles(tiles: PaiTile[], current: PaiPosition['current'] = 'white'): PaiPosition {
  return {
    tiles,
    current,
    reserve: createInitialPosition().reserve,
    nextId: tiles.reduce((max, tile) => Math.max(max, tile.id), 0) + 1,
  }
}

function arrangeTo(moves: PaiMove[], x: number, y: number): boolean {
  return moves.some((move) => move.kind === 'arrange' && move.toX === x && move.toY === y)
}

const start = createInitialPosition()
assert(start.tiles.length === 0, 'El jardín arranca vacío.')
assert(legalMoves(start).length === GATES.length * 7, 'Se puede plantar cualquier flor en las cuatro puertas.')

const planted = applyMove(start, { kind: 'plant', tile: 'r3', x: 5, y: 0 })
assert(planted.current === 'black', 'Tras plantar juega el invitado.')
assert(planted.tiles[0]?.kind === 'r3', 'La rosa queda en la puerta norte.')
assert(planted.reserve.white.r3 === 1, 'Se gasta una rosa de la reserva.')
assert(
  !legalMoves(planted).some((move) => move.kind === 'plant' && move.x === 5 && move.y === 0),
  'No se planta en una puerta ocupada.',
)

const onGate = withTiles([{ id: 1, x: 5, y: 0, player: 'white', kind: 'r3' }])
const fromGate = legalMoves(onGate)
assert(
  fromGate.some((move) => move.kind === 'arrange'),
  'La flor de la puerta puede entrar al jardín.',
)
assert(
  !fromGate.some((move) => move.kind === 'arrange' && isGate(move.toX, move.toY)),
  'No se termina una flor en una puerta.',
)

const ringTiles: PaiTile[] = [
  { id: 1, x: 2, y: 2, player: 'white', kind: 'r3' },
  { id: 2, x: 8, y: 2, player: 'white', kind: 'r4' },
  { id: 3, x: 8, y: 8, player: 'white', kind: 'r5' },
  { id: 4, x: 2, y: 8, player: 'white', kind: 'r4' },
]
assert(hasHarmonyRing(ringTiles, 'white'), 'Cuatro flores en armonía alrededor del centro cierran el anillo.')
assert(!hasHarmonyRing(ringTiles, 'black'), 'El invitado no tiene anillo.')

const ringPos = withTiles(ringTiles, 'black')
assert(winnerOf(ringPos, 1) === 'white', 'El anillo de armonía gana.')
assert(winnerOf(start, 3) === 'draw', 'La misma posición tres veces es tablas.')

const rose = withTiles([{ id: 1, x: 5, y: 1, player: 'white', kind: 'r3' }])
const roseMoves = legalMoves(rose)
assert(arrangeTo(roseMoves, 5, 4), 'La rosa alcanza tres pasos.')
assert(!arrangeTo(roseMoves, 5, 5), 'La rosa no alcanza cuatro pasos.')
assert(
  !roseMoves.some((move) => move.kind === 'arrange' && gardenOf(move.toX, move.toY) === 'white'),
  'La rosa no termina en jardín blanco.',
)
assert(!arrangeTo(roseMoves, CENTER, CENTER), 'Solo el loto termina en el centro.')

const lotus = withTiles([{ id: 1, x: 5, y: 3, player: 'white', kind: 'lotus' }])
assert(arrangeTo(legalMoves(lotus), CENTER, CENTER), 'El loto llega al centro en dos pasos.')
assert(
  legalMoves(lotus).some((move) => move.kind === 'arrange' && gardenOf(move.toX, move.toY) === 'red'),
  'El loto entra al jardín rojo.',
)
assert(
  legalMoves(lotus).some((move) => move.kind === 'arrange' && gardenOf(move.toX, move.toY) === 'white'),
  'El loto entra al jardín blanco.',
)

const clashBoard = withTiles([
  { id: 1, x: 5, y: 2, player: 'white', kind: 'r3' },
  { id: 2, x: 5, y: 4, player: 'black', kind: 'w3' },
])
assert(hasClash(clashBoard.tiles), 'Rosa y jazmín alineadas chocan.')
const capture = legalMoves(clashBoard).find(
  (move) => move.kind === 'arrange' && move.toX === 5 && move.toY === 4,
)
assert(capture, 'Se puede comer la flor que choca.')
const afterCapture = applyMove(clashBoard, capture)
assert(afterCapture.tiles.length === 1, 'La captura saca la flor rival.')
assert(!hasClash(afterCapture.tiles), 'Tras comer ya no hay choque.')

const medium = chooseAiMove(start, 'medium', () => 0.2)
assert(medium, 'La CPU media planta en la apertura.')
assert(
  legalMoves(start).some((item) => sameMove(item, medium)),
  'La CPU media elige una plantación legal.',
)

let match = createInitialPosition()
let plies = 0
while (!winnerOf(match, 1) && plies < 24) {
  const action = chooseAiMove(match, 'easy', () => 0.41)
  assert(action, `Sin jugada de CPU en el ply ${plies}.`)
  assert(
    legalMoves(match).some((item) => sameMove(item, action)),
    `La CPU jugó ilegal en el ply ${plies}.`,
  )
  match = applyMove(match, action)
  plies += 1
}
assert(plies > 6, 'La partida de prueba avanzó varias jugadas.')

console.log('paisho selfcheck ok')
