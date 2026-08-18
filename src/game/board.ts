import { COLS, ROWS } from './constants'
import type { Board, Cell, Player, Point } from './types'

const MIDDLE_ROW: Cell[] = [
  'black',
  'white',
  'black',
  'white',
  null,
  'white',
  'black',
  'white',
  'black',
]

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))

  for (let x = 0; x < COLS; x += 1) {
    board[0][x] = 'black'
    board[1][x] = 'black'
    board[2][x] = MIDDLE_ROW[x]
    board[3][x] = 'white'
    board[4][x] = 'white'
  }

  return board
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

export function getCell(board: Board, point: Point): Cell {
  return board[point.y][point.x]
}

export function setCell(board: Board, point: Point, cell: Cell): void {
  board[point.y][point.x] = cell
}

export function countPieces(board: Board, player: Player): number {
  let total = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell === player) {
        total += 1
      }
    }
  }
  return total
}

export function piecesOf(board: Board, player: Player): Point[] {
  const points: Point[] = []
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y][x] === player) {
        points.push({ x, y })
      }
    }
  }
  return points
}

export function serializePosition(board: Board, player: Player): string {
  const grid = board
    .map((row) => row.map((cell) => (cell === 'white' ? 'W' : cell === 'black' ? 'B' : '.')).join(''))
    .join('/')
  return `${player}:${grid}`
}
