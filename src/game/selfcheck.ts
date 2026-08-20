import { chooseAiTurn } from './ai'
import { applyTurn } from './apply'
import { countPieces, createInitialBoard } from './board'
import { COLS, ROWS } from './constants'
import { isCaptureMove, legalMovesAtTurnStart } from './moves'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const start = createInitialBoard()
assert(start.length === ROWS && start[0]?.length === COLS, 'Fanorona es 9×5.')
assert(countPieces(start, 'white') === 22, 'Las blancas arrancan con 22 piezas.')
assert(countPieces(start, 'black') === 22, 'Las negras arrancan con 22 piezas.')

const openings = legalMovesAtTurnStart(start, 'white')
assert(openings.length === 5, 'Hay cinco capturas de apertura.')
assert(
  openings.every((move) => isCaptureMove(move)),
  'La apertura obliga a capturar.',
)

const after = applyTurn(start, [openings[0]!])
assert(countPieces(after, 'black') < 22, 'La apertura come al menos una pieza negra.')

const turn = chooseAiTurn(start, 'white', 'easy')
assert(turn.length > 0, 'La CPU fácil tiene un turno en la apertura.')
const played = applyTurn(start, turn)
assert(countPieces(played, 'white') === 22, 'La CPU no pierde piezas en el primer turno.')
assert(countPieces(played, 'black') < 22, 'La CPU come en la apertura.')

console.log('fanorona selfcheck ok')
