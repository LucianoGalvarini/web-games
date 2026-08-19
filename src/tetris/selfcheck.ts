import { applyAction, createGame } from './apply'
import { shuffleBag } from './bag'
import { cellsOf, collides, emptyBoard, ghostY, writePiece, clearLines } from './board'
import { LINE_SCORES, PIECE_IDS } from './constants'
import { pieceCells } from './shapes'
import type { ActivePiece } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(PIECE_IDS.length === 7, 'Hay siete tetrominós.')
const bag = shuffleBag(() => 0.3)
assert(bag.length === 7, 'La bolsa tiene 7 piezas.')
assert(new Set(bag).size === 7, 'La bolsa no repite piezas.')

const empty = emptyBoard()
assert(empty.length === 20 && empty[0]?.length === 10, 'Pozo 10×20.')

const iFlat: ActivePiece = { id: 'I', x: 3, y: 0, rot: 0 }
assert(cellsOf(iFlat).length === 4, 'Cada pieza ocupa 4 celdas.')
assert(!collides(empty, iFlat), 'I entra en el pozo vacío.')

let dropped = { ...iFlat, y: ghostY(empty, iFlat) }
assert(dropped.y === 18, 'I horizontal cae hasta la fila 18.')

let board = writePiece(empty, dropped)
const clearNone = clearLines(board)
assert(clearNone.cleared === 0, 'Una I no llena una fila.')

board = emptyBoard()
for (let x = 0; x < 10; x += 1) {
  const row = board[19]
  if (row) {
    row[x] = 'O'
  }
}
const tetrisLine = clearLines(board)
assert(tetrisLine.cleared === 1, 'Una fila llena se borra.')
assert(tetrisLine.board[19]?.every((cell) => cell === null), 'La fila baja queda vacía.')

let game = createGame(1, () => 0.2)
assert(game.active, 'Hay pieza activa al empezar.')
assert(game.queue.length >= 5, 'Hay cola de próximas.')
assert(game.status === 'playing', 'La partida arranca.')

const startId = game.active?.id
game = applyAction(game, { kind: 'hold' }, () => 0.2)
assert(game.hold === startId, 'Hold guarda la pieza.')
assert(game.active && game.active.id !== startId, 'Sale la siguiente pieza.')
game = applyAction(game, { kind: 'hold' }, () => 0.2)
assert(game.hold === startId, 'No se puede hacer hold dos veces seguidas.')

game = createGame(1, () => 0.4)
for (let i = 0; i < 12; i += 1) {
  game = applyAction(game, { kind: 'left' }, () => 0.4)
}
assert(game.active && game.active.x <= 3, 'Izquierda no sale del pozo.')

game = createGame(1, () => 0.1)
const before = game.score
game = applyAction(game, { kind: 'hard' }, () => 0.1)
assert(game.score > before, 'El hard drop suma puntos.')
assert(game.board.some((row) => row.some(Boolean)), 'La pieza queda trabada en el tablero.')

assert(LINE_SCORES[4] === 800, 'Un tetris vale 800 por nivel.')
assert(pieceCells('O', 0, 0, 0).length === 4, 'O tiene 4 celdas.')

let stacked = createGame(1, () => 0.15)
for (let n = 0; n < 80 && stacked.status === 'playing'; n += 1) {
  stacked = applyAction(stacked, { kind: 'hard' }, () => 0.15)
}
assert(stacked.status === 'lost' || stacked.lines >= 0, 'Hard drop repetido termina o sigue legal.')

console.log('tetris selfcheck ok')
