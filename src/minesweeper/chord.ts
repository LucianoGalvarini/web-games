import { cloneBoard, neighbors } from './board'
import { floodReveal, isWon, revealMines } from './solve'
import type { MsBoard, MsPoint } from './types'

export type ChordResult =
  | { kind: 'error' }
  | { kind: 'noop'; board: MsBoard }
  | { kind: 'ok'; board: MsBoard; won: boolean }
  | { kind: 'hit'; board: MsBoard; exploded: MsPoint }

export function chord(board: MsBoard, x: number, y: number): ChordResult {
  const cell = board[y][x]
  if (!cell.revealed || cell.adjacent === 0) {
    return { kind: 'noop', board }
  }

  const around = neighbors(board, x, y)
  const flags = around.filter((point) => board[point.y][point.x].mark === 'flag').length
  if (flags !== cell.adjacent) {
    return { kind: 'error' }
  }

  let next = cloneBoard(board)
  let exploded: MsPoint | null = null

  for (const point of around) {
    const target = next[point.y][point.x]
    if (target.revealed || target.mark === 'flag') {
      continue
    }
    if (target.mine) {
      exploded = point
      break
    }
    next = floodReveal(next, point)
  }

  if (exploded) {
    next = revealMines(next)
    return { kind: 'hit', board: next, exploded }
  }

  return { kind: 'ok', board: next, won: isWon(next) }
}
