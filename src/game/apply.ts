import { cloneBoard, getCell, setCell } from './board'
import { directionBetween } from './geometry'
import type { Board, ChainState, Move } from './types'

export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board)
  const piece = getCell(next, move.from)
  setCell(next, move.from, null)
  setCell(next, move.to, piece)

  for (const point of move.captured) {
    setCell(next, point, null)
  }

  return next
}

export function startChain(move: Move): ChainState {
  return {
    origin: move.from,
    current: move.to,
    visited: [move.from, move.to],
    lastDir: directionBetween(move.from, move.to),
  }
}

export function applyChainStep(chain: ChainState, move: Move): ChainState {
  return {
    origin: chain.origin,
    current: move.to,
    visited: [...chain.visited, move.to],
    lastDir: directionBetween(move.from, move.to),
  }
}

export function applyTurn(board: Board, turn: Move[]): Board {
  return turn.reduce((current, move) => applyMove(current, move), board)
}
