import { chooseAiMove } from './ai'
import { insufficientMaterial, winnerOf } from './apply'
import { createInitialPosition, squareLabel } from './board'
import { BOARD_SIZE, SQUARE_COUNT } from './constants'
import { applyMove, inCheck, legalMoves, sameMove } from './moves'
import type { ChessMove, ChessPosition, Piece } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function play(position: ChessPosition, from: number, to: number, promoteTo?: ChessMove['promoteTo']): ChessPosition {
  const move = legalMoves(position).find(
    (item) => item.from === from && item.to === to && item.promoteTo === promoteTo,
  )
  assert(move, `Jugada ilegal ${squareLabel(from)}${squareLabel(to)}`)
  return applyMove(position, move)
}

const start = createInitialPosition()
assert(start.squares.length === SQUARE_COUNT, 'El tablero tiene 64 casillas.')
assert(legalMoves(start).length === 20, 'Las blancas tienen 20 jugadas iniciales.')
assert(!inCheck(start.squares, 'white'), 'La posición inicial no está en jaque.')
assert(squareLabel(52) === 'e2', 'e2 es el peón blanco de rey.')
assert(squareLabel(4) === 'e8', 'e8 es el rey negro.')

const afterE4 = play(start, 52, 36)
assert(afterE4.current === 'black', 'Tras e4 juegan las negras.')
assert(afterE4.ep === 44, 'Tras e4 el al paso queda en e3.')
assert(legalMoves(afterE4).length === 20, 'Las negras también tienen 20 respuestas a e4.')

let scholars = play(start, 52, 36)
scholars = play(scholars, 12, 28)
scholars = play(scholars, 59, 31)
scholars = play(scholars, 1, 18)
scholars = play(scholars, 61, 34)
scholars = play(scholars, 6, 21)
scholars = play(scholars, 31, 13)
assert(inCheck(scholars.squares, 'black'), 'Qxf7 da jaque.')
assert(legalMoves(scholars).length === 0, 'El mate del pastor deja a las negras sin jugadas.')
assert(winnerOf(scholars, 1) === 'white', 'El mate del pastor gana blancas.')

let castle = play(start, 52, 36)
castle = play(castle, 12, 28)
castle = play(castle, 62, 45)
castle = play(castle, 1, 18)
castle = play(castle, 61, 34)
castle = play(castle, 6, 21)
const castleMove = legalMoves(castle).find((move) => move.castle === 'king')
assert(castleMove, 'Las blancas pueden enrocar corto tras sacar caballo y alfil.')
castle = applyMove(castle, castleMove)
assert(castle.squares[62]?.kind === 'k', 'El rey queda en g1.')
assert(castle.squares[61]?.kind === 'r', 'La torre queda en f1.')

let ep = play(start, 52, 36)
ep = play(ep, 8, 16)
ep = play(ep, 36, 28)
ep = play(ep, 11, 27)
const epMove = legalMoves(ep).find((move) => move.enPassant)
assert(epMove, 'El peón de e5 come al paso en d6.')
ep = applyMove(ep, epMove)
assert(!ep.squares[27], 'El peón negro de d5 desaparece.')
assert(ep.squares[19]?.kind === 'p', 'El peón blanco queda en d6.')

assert(BOARD_SIZE === 8, 'Ajedrez es 8×8.')
assert(!insufficientMaterial(start), 'La posición inicial tiene material.')

const empty: (Piece | null)[] = Array.from({ length: SQUARE_COUNT }, () => null)
const promoBoard = empty.slice()
promoBoard[8] = { player: 'white', kind: 'p' }
promoBoard[60] = { player: 'white', kind: 'k' }
promoBoard[7] = { player: 'black', kind: 'k' }
const promoPos = {
  squares: promoBoard,
  current: 'white' as const,
  castling: { whiteKing: false, whiteQueen: false, blackKing: false, blackQueen: false },
  ep: null,
  halfmove: 0,
  fullmove: 1,
}
const promotions = legalMoves(promoPos).filter((move) => move.from === 8 && move.to === 0)
assert(promotions.length === 4, 'El peón en a7 se corona a cuatro piezas.')
assert(
  promotions.every((move) => move.promoteTo),
  'Cada coronación declara la pieza.',
)

const staleBoard = empty.slice()
staleBoard[0] = { player: 'black', kind: 'k' }
staleBoard[8] = { player: 'white', kind: 'p' }
staleBoard[17] = { player: 'white', kind: 'k' }
const stalePos = {
  squares: staleBoard,
  current: 'black' as const,
  castling: { whiteKing: false, whiteQueen: false, blackKing: false, blackQueen: false },
  ep: null,
  halfmove: 12,
  fullmove: 40,
}
assert(!inCheck(stalePos.squares, 'black'), 'El rey negro en a8 no está en jaque.')
assert(legalMoves(stalePos).length === 0, 'Rey en a8, peón en a7 y rey en b6 es ahogado.')
assert(winnerOf(stalePos, 1) === 'draw', 'El ahogado es tablas.')

const bareBoard = empty.slice()
bareBoard[60] = { player: 'white', kind: 'k' }
bareBoard[4] = { player: 'black', kind: 'k' }
const barePos = {
  squares: bareBoard,
  current: 'white' as const,
  castling: { whiteKing: false, whiteQueen: false, blackKing: false, blackQueen: false },
  ep: null,
  halfmove: 0,
  fullmove: 1,
}
assert(insufficientMaterial(barePos), 'Rey contra rey es material insuficiente.')
assert(winnerOf(barePos, 1) === 'draw', 'Rey contra rey son tablas.')

const hardOpen = chooseAiMove(start, 'hard', () => 0.2)
assert(hardOpen, 'La CPU difícil tiene jugada en la apertura.')
assert(
  legalMoves(start).some((item) => sameMove(item, hardOpen)),
  'La CPU difícil abre con una jugada legal.',
)

let plies = 0
let match = createInitialPosition()
while (!winnerOf(match, 1) && plies < 80) {
  const action = chooseAiMove(match, plies % 2 === 0 ? 'easy' : 'medium', () => 0.37)
  assert(action, `Sin jugada de CPU en el ply ${plies}.`)
  assert(
    legalMoves(match).some((item) => sameMove(item, action)),
    `La CPU jugó ilegal en el ply ${plies}.`,
  )
  match = applyMove(match, action)
  plies += 1
}
assert(plies > 8, 'La partida de prueba avanzó varias jugadas.')

console.log('ajedrez selfcheck ok')
