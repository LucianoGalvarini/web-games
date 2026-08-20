import { keyOf } from '../shared/point'
import { chooseAiTurn } from './ai'
import { applyMove, applyTurn } from './apply'
import { createInitialPosition } from './board'
import { countPieces } from './geometry'
import { legalStepsAtTurnStart } from './moves'
import { VARIANTS } from './variants'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const english = VARIANTS.english
const criollas = VARIANTS.criollas
assert(!english.flyingKing, 'Las inglesas no tienen dama voladora.')
assert(criollas.flyingKing, 'Las criollas tienen dama voladora.')

const start = createInitialPosition()
assert(countPieces(start.board, 'white') === 12, 'Las blancas arrancan con 12.')
assert(countPieces(start.board, 'black') === 12, 'Las negras arrancan con 12.')

const quiet = legalStepsAtTurnStart(english, start)
assert(quiet.length > 0, 'Hay jugadas en la posición inicial.')
assert(
  quiet.every((move) => move.kind === 'slide'),
  'La apertura no tiene capturas.',
)

const capturePos = createInitialPosition()
capturePos.board[keyOf({ x: 3, y: 4 })] = { player: 'black', kind: 'man' }
const jumps = legalStepsAtTurnStart(english, capturePos)
assert(
  jumps.some((move) => move.kind === 'jump' && move.to.x === 4 && move.to.y === 3),
  'Si hay captura, es obligatoria y el peón salta.',
)
const jump = jumps.find((move) => move.kind === 'jump')
assert(jump, 'Hay al menos un salto.')
const blacks = countPieces(capturePos.board, 'black')
const afterJump = applyMove(capturePos, jump)
assert(countPieces(afterJump.board, 'black') === blacks - 1, 'El salto come una negra.')

const turn = chooseAiTurn(english, start, 'easy')
assert(turn.length > 0, 'La CPU fácil tiene turno.')
assert(
  turn.every((step) => quiet.some((move) => move.from.x === step.from.x && move.from.y === step.from.y)),
  'La CPU abre con un deslizamiento legal.',
)
const after = applyTurn(start, turn)
assert(after.current === 'black', 'Tras el turno juegan las negras.')

console.log('damas selfcheck ok')
