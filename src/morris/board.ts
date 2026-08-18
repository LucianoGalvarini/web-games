import { keyOf } from '../shared/point'
import { PIECES_PER_PLAYER, POINTS } from './constants'
import type { Hands, MorrisBoard, MorrisPosition } from './types'

export function createEmptyBoard(): MorrisBoard {
  const board: MorrisBoard = {}
  for (const point of POINTS) {
    board[keyOf(point)] = null
  }
  return board
}

export function createInitialPosition(): MorrisPosition {
  return {
    board: createEmptyBoard(),
    current: 'white',
    inHand: { white: PIECES_PER_PLAYER, black: PIECES_PER_PLAYER },
    pendingRemoval: false,
  }
}

export function cloneBoard(board: MorrisBoard): MorrisBoard {
  return { ...board }
}

export function cloneHands(inHand: Hands): Hands {
  return { white: inHand.white, black: inHand.black }
}

export function serializePosition(position: MorrisPosition): string {
  const grid = POINTS.map((point) => {
    const cell = position.board[keyOf(point)]
    return cell === 'white' ? 'W' : cell === 'black' ? 'B' : '.'
  }).join('')
  return `${position.current}:${position.pendingRemoval ? 'R' : '-'}:${position.inHand.white}${position.inHand.black}:${grid}`
}
