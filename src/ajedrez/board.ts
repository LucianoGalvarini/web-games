import type { Player } from '../shared/types'
import { BLACK_KING, BOARD_SIZE, SQUARE_COUNT, WHITE_KING, fileOf, rankOf, squareIndex } from './constants'
import type { ChessPosition, Piece, PieceKind } from './types'

const BACK: PieceKind[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']

function place(squares: (Piece | null)[], rank: number, player: Player, kinds: PieceKind[]): void {
  for (let file = 0; file < BOARD_SIZE; file += 1) {
    const kind = kinds[file]
    if (!kind) {
      continue
    }
    squares[squareIndex(file, rank)] = { player, kind }
  }
}

export function createInitialPosition(): ChessPosition {
  const squares: (Piece | null)[] = Array.from({ length: SQUARE_COUNT }, () => null)
  place(squares, 0, 'black', BACK)
  place(squares, 1, 'black', ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'])
  place(squares, 6, 'white', ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'])
  place(squares, 7, 'white', BACK)
  return {
    squares,
    current: 'white',
    castling: { whiteKing: true, whiteQueen: true, blackKing: true, blackQueen: true },
    ep: null,
    halfmove: 0,
    fullmove: 1,
  }
}

export function copyPosition(position: ChessPosition): ChessPosition {
  return {
    squares: position.squares.slice(),
    current: position.current,
    castling: { ...position.castling },
    ep: position.ep,
    halfmove: position.halfmove,
    fullmove: position.fullmove,
  }
}

export function kingIndex(squares: (Piece | null)[], player: Player): number {
  const expected = player === 'white' ? WHITE_KING : BLACK_KING
  const cached = squares[expected]
  if (cached?.player === player && cached.kind === 'k') {
    return expected
  }
  for (let index = 0; index < squares.length; index += 1) {
    const piece = squares[index]
    if (piece?.player === player && piece.kind === 'k') {
      return index
    }
  }
  return -1
}

export function serializePosition(position: ChessPosition): string {
  const pieces = position.squares
    .map((piece, index) => {
      if (!piece) {
        return ''
      }
      return `${index}${piece.player[0]}${piece.kind}`
    })
    .filter(Boolean)
    .join('')
  const c = position.castling
  return `${position.current}:${pieces}:${c.whiteKing ? 'K' : ''}${c.whiteQueen ? 'Q' : ''}${c.blackKing ? 'k' : ''}${c.blackQueen ? 'q' : ''}:${position.ep ?? '-'}`
}

export function squareLabel(index: number): string {
  const files = 'abcdefgh'
  const file = files[fileOf(index)] ?? '?'
  return `${file}${8 - rankOf(index)}`
}
