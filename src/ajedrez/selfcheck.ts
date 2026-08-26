import { chooseAiMove } from './ai'
import { insufficientMaterial, resultOf, winnerOf } from './apply'
import { createInitialPosition, squareLabel } from './board'
import { BOARD_SIZE, SQUARE_COUNT, squareIndex } from './constants'
import { applyMove, inCheck, legalMoves, sameMove } from './moves'
import { moveSan } from './notation'
import { perft } from './perft'
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

function blank(): (Piece | null)[] {
  return Array.from({ length: SQUARE_COUNT }, () => null)
}

function pos(
  squares: (Piece | null)[],
  current: ChessPosition['current'] = 'white',
  extra: Partial<ChessPosition> = {},
): ChessPosition {
  return {
    squares,
    current,
    castling: extra.castling ?? { whiteKing: false, whiteQueen: false, blackKing: false, blackQueen: false },
    ep: extra.ep ?? null,
    halfmove: extra.halfmove ?? 0,
    fullmove: extra.fullmove ?? 1,
  }
}

const start = createInitialPosition()
assert(start.squares.length === SQUARE_COUNT, 'El tablero tiene 64 casillas.')
assert(legalMoves(start).length === 20, 'Las blancas tienen 20 jugadas iniciales.')
assert(!inCheck(start.squares, 'white'), 'La posición inicial no está en jaque.')
assert(squareLabel(52) === 'e2', 'e2 es el peón blanco de rey.')
assert(squareLabel(4) === 'e8', 'e8 es el rey negro.')
assert(perft(start, 1) === 20, 'Perft 1 de la inicial es 20.')
assert(perft(start, 2) === 400, 'Perft 2 de la inicial es 400.')
assert(perft(start, 3) === 8902, 'Perft 3 de la inicial es 8902.')
assert(perft(start, 4) === 197_281, 'Perft 4 de la inicial es 197281.')

const afterE4 = play(start, 52, 36)
assert(afterE4.current === 'black', 'Tras e4 juegan las negras.')
assert(afterE4.ep === 44, 'Tras e4 el al paso queda en e3.')
assert(legalMoves(afterE4).length === 20, 'Las negras también tienen 20 respuestas a e4.')

const scholarSteps: Array<[number, number]> = [
  [52, 36],
  [12, 28],
  [59, 31],
  [1, 18],
  [61, 34],
  [6, 21],
  [31, 13],
]
const scholarSans: string[] = []
let scholars = start
for (const [from, to] of scholarSteps) {
  const move = legalMoves(scholars).find((item) => item.from === from && item.to === to)
  assert(move, `Jugada ilegal en el pastor ${squareLabel(from)}${squareLabel(to)}`)
  scholarSans.push(moveSan(scholars, move, 'es'))
  scholars = applyMove(scholars, move)
}
assert(inCheck(scholars.squares, 'black'), 'Qxf7 da jaque.')
assert(legalMoves(scholars).length === 0, 'El mate del pastor deja a las negras sin jugadas.')
assert(winnerOf(scholars, 1) === 'white', 'El mate del pastor gana blancas.')
assert(resultOf(scholars, 1).reason === 'checkmate', 'El pastor termina por jaque mate.')
assert(scholarSans.join(' ') === 'e4 e5 Dh5 Cc6 Ac4 Cf6 Dxf7#', `SAN del pastor: ${scholarSans.join(' ')}`)

let castle = play(start, 52, 36)
castle = play(castle, 12, 28)
castle = play(castle, 62, 45)
castle = play(castle, 1, 18)
castle = play(castle, 61, 34)
castle = play(castle, 6, 21)
const castleMove = legalMoves(castle).find((move) => move.castle === 'king')
assert(castleMove, 'Las blancas pueden enrocar corto tras sacar caballo y alfil.')
assert(moveSan(castle, castleMove, 'es') === 'O-O', 'El enroque corto se escribe O-O.')
castle = applyMove(castle, castleMove)
assert(castle.squares[62]?.kind === 'k', 'El rey queda en g1.')
assert(castle.squares[61]?.kind === 'r', 'La torre queda en f1.')

const queenCastleBoard = blank()
queenCastleBoard[60] = { player: 'white', kind: 'k' }
queenCastleBoard[56] = { player: 'white', kind: 'r' }
queenCastleBoard[4] = { player: 'black', kind: 'k' }
const queenCastlePos = pos(queenCastleBoard, 'white', {
  castling: { whiteKing: false, whiteQueen: true, blackKing: false, blackQueen: false },
})
const queenCastleMove = legalMoves(queenCastlePos).find((move) => move.castle === 'queen')
assert(queenCastleMove, 'El enroque largo es legal con el camino libre.')
assert(moveSan(queenCastlePos, queenCastleMove, 'es') === 'O-O-O', 'El enroque largo se escribe O-O-O.')

const throughCheckBoard = queenCastleBoard.slice()
throughCheckBoard[3] = { player: 'black', kind: 'q' }
const throughCheckPos = pos(throughCheckBoard, 'white', {
  castling: { whiteKing: false, whiteQueen: true, blackKing: false, blackQueen: false },
})
assert(
  !legalMoves(throughCheckPos).some((move) => move.castle === 'queen'),
  'No se enroca largo si el rey pasa por jaque.',
)

let ep = play(start, 52, 36)
ep = play(ep, 8, 16)
ep = play(ep, 36, 28)
ep = play(ep, 11, 27)
const epMove = legalMoves(ep).find((move) => move.enPassant)
assert(epMove, 'El peón de e5 come al paso en d6.')
ep = applyMove(ep, epMove)
assert(!ep.squares[27], 'El peón negro de d5 desaparece.')
assert(ep.squares[19]?.kind === 'p', 'El peón blanco queda en d6.')

const pinBoard = blank()
pinBoard[60] = { player: 'white', kind: 'k' }
pinBoard[36] = { player: 'white', kind: 'r' }
pinBoard[4] = { player: 'black', kind: 'q' }
const pinPos = pos(pinBoard)
const rookMoves = legalMoves(pinPos).filter((move) => move.from === 36)
assert(rookMoves.length > 0, 'La torre clavada puede moverse por la columna.')
assert(
  rookMoves.every((move) => move.to % 8 === 4),
  'La torre clavada no puede salir de la columna del rey.',
)

const illegalEpBoard = blank()
illegalEpBoard[24] = { player: 'white', kind: 'k' }
illegalEpBoard[27] = { player: 'white', kind: 'p' }
illegalEpBoard[28] = { player: 'black', kind: 'p' }
illegalEpBoard[31] = { player: 'black', kind: 'r' }
illegalEpBoard[4] = { player: 'black', kind: 'k' }
const illegalEpPos = pos(illegalEpBoard, 'white', { ep: squareIndex(4, 2) })
assert(
  !legalMoves(illegalEpPos).some((move) => move.enPassant),
  'El al paso es ilegal si deja al rey en jaque.',
)

assert(BOARD_SIZE === 8, 'Ajedrez es 8×8.')
assert(!insufficientMaterial(start), 'La posición inicial tiene material.')

const promoBoard = blank()
promoBoard[8] = { player: 'white', kind: 'p' }
promoBoard[60] = { player: 'white', kind: 'k' }
promoBoard[7] = { player: 'black', kind: 'k' }
const promoPos = pos(promoBoard)
const promotions = legalMoves(promoPos).filter((move) => move.from === 8 && move.to === 0)
assert(promotions.length === 4, 'El peón en a7 se corona a cuatro piezas.')
assert(
  promotions.every((move) => move.promoteTo),
  'Cada coronación declara la pieza.',
)

const promoCaptureBoard = blank()
promoCaptureBoard[8] = { player: 'white', kind: 'p' }
promoCaptureBoard[1] = { player: 'black', kind: 'n' }
promoCaptureBoard[60] = { player: 'white', kind: 'k' }
promoCaptureBoard[4] = { player: 'black', kind: 'k' }
const promoCapturePos = pos(promoCaptureBoard)
const promoCaptures = legalMoves(promoCapturePos).filter((move) => move.from === 8 && move.to === 1)
assert(promoCaptures.length === 4, 'El peón en a7 come en b8 y se corona a cuatro piezas.')
assert(
  promoCaptures.every((move) => move.capture && move.promoteTo),
  'La coronación con captura declara pieza y captura.',
)

const staleBoard = blank()
staleBoard[0] = { player: 'black', kind: 'k' }
staleBoard[8] = { player: 'white', kind: 'p' }
staleBoard[17] = { player: 'white', kind: 'k' }
const stalePos = pos(staleBoard, 'black', { halfmove: 12, fullmove: 40 })
assert(!inCheck(stalePos.squares, 'black'), 'El rey negro en a8 no está en jaque.')
assert(legalMoves(stalePos).length === 0, 'Rey en a8, peón en a7 y rey en b6 es ahogado.')
assert(winnerOf(stalePos, 1) === 'draw', 'El ahogado es tablas.')
assert(resultOf(stalePos, 1).reason === 'stalemate', 'El ahogado se etiqueta como stalemate.')

const bareBoard = blank()
bareBoard[60] = { player: 'white', kind: 'k' }
bareBoard[4] = { player: 'black', kind: 'k' }
const barePos = pos(bareBoard)
assert(insufficientMaterial(barePos), 'Rey contra rey es material insuficiente.')
assert(winnerOf(barePos, 1) === 'draw', 'Rey contra rey son tablas.')
assert(resultOf(barePos, 1).reason === 'material', 'Rey contra rey se etiqueta como material.')

const bishopKnightBoard = blank()
bishopKnightBoard[60] = { player: 'white', kind: 'k' }
bishopKnightBoard[58] = { player: 'white', kind: 'b' }
bishopKnightBoard[4] = { player: 'black', kind: 'k' }
bishopKnightBoard[1] = { player: 'black', kind: 'n' }
assert(!insufficientMaterial(pos(bishopKnightBoard)), 'Alfil contra caballo no es material insuficiente.')

const sameBishopBoard = blank()
sameBishopBoard[60] = { player: 'white', kind: 'k' }
sameBishopBoard[58] = { player: 'white', kind: 'b' }
sameBishopBoard[4] = { player: 'black', kind: 'k' }
sameBishopBoard[8] = { player: 'black', kind: 'b' }
assert(insufficientMaterial(pos(sameBishopBoard)), 'Alfiles del mismo color son material insuficiente.')

const oppBishopBoard = blank()
oppBishopBoard[60] = { player: 'white', kind: 'k' }
oppBishopBoard[58] = { player: 'white', kind: 'b' }
oppBishopBoard[4] = { player: 'black', kind: 'k' }
oppBishopBoard[0] = { player: 'black', kind: 'b' }
assert(!insufficientMaterial(pos(oppBishopBoard)), 'Alfiles de distinto color se pueden matear.')

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
