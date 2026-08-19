import { keyOf } from '../shared/point'
import { BOARD_SIZE, DARK_SQUARES, isDarkSquare } from './geometry'
import type { DamasBoard, DamasPosition } from './types'

export function createInitialBoard(): DamasBoard {
  const board: DamasBoard = {}
  for (const point of DARK_SQUARES) {
    board[keyOf(point)] = null
  }
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (isDarkSquare({ x, y })) {
        board[keyOf({ x, y })] = { player: 'black', kind: 'man' }
      }
    }
  }
  for (let y = BOARD_SIZE - 3; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (isDarkSquare({ x, y })) {
        board[keyOf({ x, y })] = { player: 'white', kind: 'man' }
      }
    }
  }
  return board
}

export function createInitialPosition(): DamasPosition {
  return {
    board: createInitialBoard(),
    current: 'white',
  }
}

export function cloneBoard(board: DamasBoard): DamasBoard {
  return { ...board }
}

export function serializePosition(position: DamasPosition): string {
  const grid = DARK_SQUARES.map((point) => {
    const square = position.board[keyOf(point)]
    if (!square) {
      return '.'
    }
    const letter = square.kind === 'king' ? 'K' : 'M'
    return square.player === 'white' ? letter : letter.toLowerCase()
  }).join('')
  return `${position.current}:${grid}`
}
