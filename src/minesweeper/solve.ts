import { allSafeRevealed, cloneBoard, neighbors } from './board'
import type { Hint, MsBoard, MsPoint } from './types'

export function floodReveal(board: MsBoard, origin: MsPoint): MsBoard {
  const next = cloneBoard(board)
  const stack: MsPoint[] = [origin]
  const seen = new Set<string>()

  while (stack.length > 0) {
    const point = stack.pop()
    if (!point) {
      break
    }
    const id = `${point.x},${point.y}`
    if (seen.has(id)) {
      continue
    }
    seen.add(id)

    const cell = next[point.y][point.x]
    if (cell.mark === 'flag' || cell.revealed) {
      continue
    }

    cell.revealed = true
    cell.mark = 'none'

    if (cell.adjacent === 0 && !cell.mine) {
      stack.push(...neighbors(next, point.x, point.y))
    }
  }

  return next
}

export function revealMines(board: MsBoard): MsBoard {
  const next = cloneBoard(board)
  for (const row of next) {
    for (const cell of row) {
      if (cell.mine) {
        cell.revealed = true
      }
    }
  }
  return next
}

export function flagRemainingMines(board: MsBoard): MsBoard {
  const next = cloneBoard(board)
  for (const row of next) {
    for (const cell of row) {
      if (cell.mine) {
        cell.mark = 'flag'
      }
    }
  }
  return next
}

export function isWon(board: MsBoard): boolean {
  return allSafeRevealed(board)
}

export function findHint(board: MsBoard): Hint | null {
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[0].length; x += 1) {
      const cell = board[y][x]
      if (!cell.revealed || cell.adjacent === 0) {
        continue
      }

      const around = neighbors(board, x, y)
      const hidden = around.filter((point) => !board[point.y][point.x].revealed && board[point.y][point.x].mark !== 'flag')
      const flags = around.filter((point) => board[point.y][point.x].mark === 'flag').length

      if (flags === cell.adjacent && hidden.length > 0) {
        return { point: hidden[0], action: 'reveal' }
      }
      if (hidden.length > 0 && flags + hidden.length === cell.adjacent) {
        return { point: hidden[0], action: 'flag' }
      }
    }
  }
  return null
}
