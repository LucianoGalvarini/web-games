import type { MsBoard, MsCell, MsPoint } from './types'

export function keyOf(point: MsPoint): string {
  return `${point.x},${point.y}`
}

export function inBounds(board: MsBoard, x: number, y: number): boolean {
  return y >= 0 && y < board.length && x >= 0 && x < board[0].length
}

export function neighbors(board: MsBoard, x: number, y: number): MsPoint[] {
  const points: MsPoint[] = []
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue
      }
      const nx = x + dx
      const ny = y + dy
      if (inBounds(board, nx, ny)) {
        points.push({ x: nx, y: ny })
      }
    }
  }
  return points
}

export function neighborhood(board: MsBoard, x: number, y: number): MsPoint[] {
  return [{ x, y }, ...neighbors(board, x, y)]
}

export function cloneBoard(board: MsBoard): MsBoard {
  return board.map((row) => row.map((cell) => ({ ...cell })))
}

export function createEmptyCell(): MsCell {
  return {
    mine: false,
    revealed: false,
    mark: 'none',
    adjacent: 0,
  }
}

export function createEmptyBoard(rows: number, cols: number): MsBoard {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => createEmptyCell()))
}

export function countFlags(board: MsBoard): number {
  let total = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell.mark === 'flag') {
        total += 1
      }
    }
  }
  return total
}

export function allSafeRevealed(board: MsBoard): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) {
        return false
      }
    }
  }
  return true
}
