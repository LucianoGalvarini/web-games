import { chooseAiMove } from './ai'
import { winnerOf } from './apply'
import { createInitialPosition, kingIndex } from './board'
import { SQUARE_COUNT, squareIndex } from './constants'
import { applyMove, inCheck, legalMoves, sameMove } from './moves'
import type { ShogiBoard, ShogiPosition } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function emptyBoard(): ShogiBoard {
  return Array.from({ length: SQUARE_COUNT }, () => null)
}

function emptyHand() {
  return { r: 0, b: 0, g: 0, s: 0, n: 0, l: 0, p: 0 }
}

// 1. Initial position
const start = createInitialPosition()
assert(start.board.length === SQUARE_COUNT, 'El tablero tiene 81 casillas.')
assert(!inCheck(start.board, 'white'), 'La posición inicial no está en jaque.')
assert(legalMoves(start).length === 30, `Las blancas tienen 30 jugadas de apertura (conté ${legalMoves(start).length}).`)

// 2. Capture fills the hand, in unpromoted form
{
  const board = emptyBoard()
  board[squareIndex(4, 4)] = { player: 'white', kind: 'r', promoted: false }
  board[squareIndex(4, 1)] = { player: 'black', kind: 'p', promoted: true }
  board[squareIndex(0, 8)] = { player: 'white', kind: 'k', promoted: false }
  board[squareIndex(8, 0)] = { player: 'black', kind: 'k', promoted: false }
  const position: ShogiPosition = { board, hands: { white: emptyHand(), black: emptyHand() }, current: 'white' }
  const captureMove = legalMoves(position).find(
    (m) => m.kind === 'move' && m.from === squareIndex(4, 4) && m.to === squareIndex(4, 1),
  )
  assert(captureMove, 'La torre puede comer el tokin en la columna 4.')
  const next = applyMove(position, captureMove!)
  assert(next.hands.white.p === 1, 'El tokin capturado vuelve a la mano como peón sin promover.')
}

// 3. Nifu: cannot drop a pawn on a file with an unpromoted pawn already there
{
  const board = emptyBoard()
  board[squareIndex(4, 5)] = { player: 'white', kind: 'p', promoted: false }
  board[squareIndex(0, 8)] = { player: 'white', kind: 'k', promoted: false }
  board[squareIndex(8, 0)] = { player: 'black', kind: 'k', promoted: false }
  const hands = { white: { ...emptyHand(), p: 1 }, black: emptyHand() }
  const position: ShogiPosition = { board, hands, current: 'white' }
  const drops = legalMoves(position).filter((m) => m.kind === 'drop' && m.piece === 'p')
  assert(
    drops.every((m) => m.kind === 'drop' && m.to % 9 !== 4),
    'Nifu: no se puede tirar un peón en la columna 4, que ya tiene uno propio.',
  )
}

// 4. Uchi-fu-zume vs. a legal mate with another piece, same cornered position
{
  const board = emptyBoard()
  board[squareIndex(8, 0)] = { player: 'black', kind: 'k', promoted: false }
  board[squareIndex(7, 2)] = { player: 'white', kind: 's', promoted: false }
  board[squareIndex(7, 1)] = { player: 'white', kind: 'l', promoted: false }
  board[squareIndex(0, 8)] = { player: 'white', kind: 'k', promoted: false }
  const dropSquare = squareIndex(8, 1)

  const pawnHand = { white: { ...emptyHand(), p: 1 }, black: emptyHand() }
  const pawnPos: ShogiPosition = { board, hands: pawnHand, current: 'white' }
  const pawnDrop = legalMoves(pawnPos).find((m) => m.kind === 'drop' && m.to === dropSquare && m.piece === 'p')
  assert(!pawnDrop, 'Uchi-fu-zume: no se puede tirar el peón porque da jaque mate inmediato.')

  const goldHand = { white: { ...emptyHand(), g: 1 }, black: emptyHand() }
  const goldPos: ShogiPosition = { board, hands: goldHand, current: 'white' }
  const goldDrop = legalMoves(goldPos).find((m) => m.kind === 'drop' && m.to === dropSquare && m.piece === 'g')
  assert(goldDrop, 'Tirar un oro en la misma casilla sí es legal (la restricción es solo del peón).')
  const mated = applyMove(goldPos, goldDrop!)
  assert(inCheck(mated.board, 'black'), 'El oro tirado da jaque.')
  assert(legalMoves(mated).length === 0, 'Las negras quedan sin jugadas.')
  assert(winnerOf(mated, 1) === 'white', 'Mate: ganan las blancas.')
}

// 5. Forced promotion: pawn reaching the last rank has no choice
{
  const board = emptyBoard()
  board[squareIndex(0, 1)] = { player: 'white', kind: 'p', promoted: false }
  board[squareIndex(8, 8)] = { player: 'white', kind: 'k', promoted: false }
  board[squareIndex(8, 0)] = { player: 'black', kind: 'k', promoted: false }
  const position: ShogiPosition = { board, hands: { white: emptyHand(), black: emptyHand() }, current: 'white' }
  const options = legalMoves(position).filter((m) => m.kind === 'move' && m.from === squareIndex(0, 1))
  assert(options.length === 1, `El peón en la última fila solo tiene una jugada legal (encontré ${options.length}).`)
  assert(options[0]?.kind === 'move' && options[0].promote === true, 'Esa jugada corona obligatoriamente.')
}

// 6. No legal moves and not in check still loses (no stalemate in shogi)
{
  const board = emptyBoard()
  board[squareIndex(0, 0)] = { player: 'black', kind: 'k', promoted: false }
  board[squareIndex(1, 1)] = { player: 'white', kind: 'r', promoted: false }
  board[squareIndex(3, 3)] = { player: 'white', kind: 'b', promoted: false }
  board[squareIndex(8, 8)] = { player: 'white', kind: 'k', promoted: false }
  const position: ShogiPosition = { board, hands: { white: emptyHand(), black: emptyHand() }, current: 'black' }
  assert(!inCheck(position.board, 'black'), 'El rey negro en la esquina no está en jaque.')
  assert(legalMoves(position).length === 0, 'El rey negro no tiene jugadas legales.')
  assert(winnerOf(position, 1) === 'white', 'Sin jugadas, aunque no haya jaque, pierden las negras.')
}

assert(kingIndex(start.board, 'white') >= 0, 'kingIndex encuentra al rey blanco.')

// 7. AI smoke test across difficulties, both sides, no crashes / no illegal moves
let plies = 0
let match = createInitialPosition()
while (!winnerOf(match, 1) && plies < 60) {
  const difficulty = (['easy', 'medium', 'hard', 'perfect'] as const)[plies % 4]
  const action = chooseAiMove(match, difficulty, () => 0.37)
  assert(action, `Sin jugada de CPU en el ply ${plies}.`)
  assert(
    legalMoves(match).some((item) => sameMove(item, action!)),
    `La CPU jugó ilegal en el ply ${plies}.`,
  )
  match = applyMove(match, action!)
  plies += 1
}
assert(plies > 8, 'La partida de prueba avanzó varias jugadas.')

console.log('shogi selfcheck ok')
