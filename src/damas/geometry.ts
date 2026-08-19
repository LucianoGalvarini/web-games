import { keyOf } from '../shared/point'
import type { Point } from '../shared/point'
import type { Player } from '../shared/types'
import type { DamasBoard, Square } from './types'

export const BOARD_SIZE = 8

export type Dir = { dx: number; dy: number }

export const DIAGONAL_DIRS: readonly Dir[] = [
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
]

export function forwardDirs(player: Player): readonly Dir[] {
  const dy = player === 'white' ? -1 : 1
  return [
    { dx: 1, dy },
    { dx: -1, dy },
  ]
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE
}

export function isDarkSquare(point: Point): boolean {
  return (point.x + point.y) % 2 === 1
}

export function isPromotionRow(player: Player, y: number): boolean {
  return player === 'white' ? y === 0 : y === BOARD_SIZE - 1
}

export const DARK_SQUARES: readonly Point[] = (() => {
  const points: Point[] = []
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (isDarkSquare({ x, y })) {
        points.push({ x, y })
      }
    }
  }
  return points
})()

export function pieceAt(board: DamasBoard, point: Point): Square {
  return board[keyOf(point)] ?? null
}

export function piecesOf(board: DamasBoard, player: Player): Point[] {
  return DARK_SQUARES.filter((point) => pieceAt(board, point)?.player === player)
}

export function countPieces(board: DamasBoard, player: Player): number {
  return piecesOf(board, player).length
}
