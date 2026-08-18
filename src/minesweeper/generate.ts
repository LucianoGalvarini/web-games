import { cloneBoard, inBounds, neighbors } from './board'
import type { MsBoard, MsPoint } from './types'

function shuffle<T>(items: T[]): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }
  return next
}

function recount(board: MsBoard): void {
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[0].length; x += 1) {
      if (board[y][x].mine) {
        board[y][x].adjacent = 0
        continue
      }
      board[y][x].adjacent = neighbors(board, x, y).filter((point) => board[point.y][point.x].mine).length
    }
  }
}

export function placeMines(board: MsBoard, mines: number, safe: MsPoint[]): MsBoard {
  const next = cloneBoard(board)
  const forbidden = new Set(safe.filter((point) => inBounds(next, point.x, point.y)).map((point) => `${point.x},${point.y}`))
  const slots: MsPoint[] = []

  for (let y = 0; y < next.length; y += 1) {
    for (let x = 0; x < next[0].length; x += 1) {
      if (!forbidden.has(`${x},${y}`)) {
        slots.push({ x, y })
      }
    }
  }

  const chosen = shuffle(slots).slice(0, mines)
  for (const point of chosen) {
    next[point.y][point.x].mine = true
  }
  recount(next)
  return next
}
