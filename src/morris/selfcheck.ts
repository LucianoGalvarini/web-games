import { chooseAiTurn } from './ai'
import { applyMove, applyTurn, winnerOf } from './apply'
import { createInitialPosition } from './board'
import { formsMill } from './geometry'
import { legalMoves } from './moves'
import { VARIANTS } from './variants'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const nine = VARIANTS.nine
assert(nine.piecesPerPlayer === 9, 'El molino a 9 usa nueve piezas.')
assert(nine.points.length === 24, 'El tablero de 9 tiene 24 puntos.')
assert(VARIANTS.six.piecesPerPlayer === 6, 'El molino a 6 usa seis piezas.')
assert(VARIANTS.twelve.piecesPerPlayer === 12, 'El molino a 12 usa doce piezas.')

const start = createInitialPosition(nine)
assert(legalMoves(nine, start).length === 24, 'En la colocación se puede apoyar en cualquier punto.')
assert(winnerOf(nine, start) === null, 'La partida recién empieza.')

let mill = applyMove(nine, start, { kind: 'place', to: { x: 0, y: 0 } })
mill = applyMove(nine, mill, { kind: 'place', to: { x: 3, y: 1 } })
mill = applyMove(nine, mill, { kind: 'place', to: { x: 3, y: 0 } })
mill = applyMove(nine, mill, { kind: 'place', to: { x: 5, y: 1 } })
mill = applyMove(nine, mill, { kind: 'place', to: { x: 6, y: 0 } })
assert(mill.pendingRemoval, 'Tres blancas en la fila de arriba forman molino.')
assert(formsMill(nine, mill.board, { x: 3, y: 0 }, 'white'), 'El molino se detecta en el punto central.')
assert(legalMoves(nine, mill).every((move) => move.kind === 'remove'), 'Tras el molino hay que sacar una pieza.')

const turn = chooseAiTurn(nine, start, 'easy')
assert(turn.length === 1 && turn[0]?.kind === 'place', 'La CPU fácil coloca en la apertura.')
const after = applyTurn(nine, start, turn)
assert(after.current === 'black', 'Tras colocar juegan las negras.')

console.log('morris selfcheck ok')
