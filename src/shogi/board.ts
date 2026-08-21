import type { Player } from '../shared/types'
import { BOARD_SIZE, DROPPABLE_KINDS, SQUARE_COUNT, squareIndex } from './constants'
import type { Hand, PieceKind, ShogiBoard, ShogiPosition } from './types'

const BACK_RANK: PieceKind[] = ['l', 'n', 's', 'g', 'k', 'g', 's', 'n', 'l']

function emptyHand(): Hand {
  const hand = {} as Hand
  for (const kind of DROPPABLE_KINDS) {
    hand[kind] = 0
  }
  return hand
}

export function createInitialBoard(): ShogiBoard {
  const board: ShogiBoard = Array.from({ length: SQUARE_COUNT }, () => null)

  for (let file = 0; file < BOARD_SIZE; file += 1) {
    const kind = BACK_RANK[file]
    if (kind) {
      board[squareIndex(file, 0)] = { player: 'black', kind, promoted: false }
      board[squareIndex(file, BOARD_SIZE - 1)] = { player: 'white', kind, promoted: false }
    }
    board[squareIndex(file, 2)] = { player: 'black', kind: 'p', promoted: false }
    board[squareIndex(file, BOARD_SIZE - 3)] = { player: 'white', kind: 'p', promoted: false }
  }

  board[squareIndex(1, 1)] = { player: 'black', kind: 'r', promoted: false }
  board[squareIndex(7, 1)] = { player: 'black', kind: 'b', promoted: false }
  board[squareIndex(1, BOARD_SIZE - 2)] = { player: 'white', kind: 'b', promoted: false }
  board[squareIndex(7, BOARD_SIZE - 2)] = { player: 'white', kind: 'r', promoted: false }

  return board
}

export function createInitialPosition(): ShogiPosition {
  return {
    board: createInitialBoard(),
    hands: { white: emptyHand(), black: emptyHand() },
    current: 'white',
  }
}

export function copyPosition(position: ShogiPosition): ShogiPosition {
  return {
    board: position.board.slice(),
    hands: { white: { ...position.hands.white }, black: { ...position.hands.black } },
    current: position.current,
  }
}

export function kingIndex(board: ShogiBoard, player: Player): number {
  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]
    if (piece?.player === player && piece.kind === 'k') {
      return index
    }
  }
  return -1
}

export function countPieces(position: ShogiPosition, player: Player): number {
  return position.board.reduce((total, piece) => total + (piece?.player === player ? 1 : 0), 0)
}

export function serializePosition(position: ShogiPosition): string {
  const board = position.board
    .map((piece) => (piece ? `${piece.player[0]}${piece.kind}${piece.promoted ? '+' : ''}` : '.'))
    .join('')
  const hand = (owner: Hand) => DROPPABLE_KINDS.map((kind) => `${kind}${owner[kind]}`).join('')
  return `${position.current}:${board}:${hand(position.hands.white)}:${hand(position.hands.black)}`
}

const FILES = '987654321'

export function squareLabel(index: number): string {
  const file = index % BOARD_SIZE
  const rank = Math.floor(index / BOARD_SIZE)
  return `${FILES[file] ?? '?'}${rank + 1}`
}
