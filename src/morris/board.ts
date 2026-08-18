import { keyOf } from '../shared/point'
import type { Hands, MorrisBoard, MorrisPosition } from './types'
import type { MorrisVariant } from './variants'

export function createEmptyBoard(variant: MorrisVariant): MorrisBoard {
  const board: MorrisBoard = {}
  for (const point of variant.points) {
    board[keyOf(point)] = null
  }
  return board
}

export function createInitialPosition(variant: MorrisVariant): MorrisPosition {
  return {
    board: createEmptyBoard(variant),
    current: 'white',
    inHand: { white: variant.piecesPerPlayer, black: variant.piecesPerPlayer },
    pendingRemoval: false,
  }
}

export function cloneBoard(board: MorrisBoard): MorrisBoard {
  return { ...board }
}

export function cloneHands(inHand: Hands): Hands {
  return { white: inHand.white, black: inHand.black }
}

export function serializePosition(variant: MorrisVariant, position: MorrisPosition): string {
  const grid = variant.points.map((point) => {
    const cell = position.board[keyOf(point)]
    return cell === 'white' ? 'W' : cell === 'black' ? 'B' : '.'
  }).join('')
  return `${variant.id}:${position.current}:${position.pendingRemoval ? 'R' : '-'}:${position.inHand.white}${position.inHand.black}:${grid}`
}
