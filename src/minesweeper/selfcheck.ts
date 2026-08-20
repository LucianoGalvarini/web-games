import { createEmptyBoard, neighborhood } from './board'
import { chord } from './chord'
import { PRESETS } from './constants'
import { placeMines } from './generate'
import { floodReveal, isWon } from './solve'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const beginner = PRESETS.beginner
assert(beginner.cols === 9 && beginner.rows === 9 && beginner.mines === 10, 'Principiante es 9×9 con 10 minas.')
assert(PRESETS.expert.mines === 99, 'Experto tiene 99 minas.')

const empty = createEmptyBoard(3, 3)
const opened = floodReveal(empty, { x: 0, y: 0 })
assert(
  opened.every((row) => row.every((cell) => cell.revealed)),
  'Sin minas, el vacío abre todo el tablero.',
)
assert(isWon(opened), 'Un tablero sin minas y abierto se gana.')

const field = createEmptyBoard(beginner.rows, beginner.cols)
const safe = neighborhood(field, 4, 4)
const mined = placeMines(field, beginner.mines, safe)
assert(mined.flat().filter((cell) => cell.mine).length === beginner.mines, 'Se colocan 10 minas.')
assert(
  safe.every((point) => !mined[point.y][point.x].mine),
  'El primer clic y su vecindad quedan libres.',
)

const numbered = createEmptyBoard(2, 2)
numbered[0][0].revealed = true
numbered[0][0].adjacent = 1
numbered[1][1].mine = true
numbered[1][1].mark = 'flag'
const chorded = chord(numbered, 0, 0)
assert(chorded.kind === 'ok', 'Con la bandera justa, el chording abre el resto.')

console.log('minesweeper selfcheck ok')
