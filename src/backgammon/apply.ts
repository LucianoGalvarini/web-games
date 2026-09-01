import type { Winner } from '../shared/types'
import { clonePosition, opponentOf } from './board'
import type { BackgammonMove, BackgammonPosition, BackgammonTurn } from './types'

export function applyMove(position: BackgammonPosition, move: BackgammonMove): BackgammonPosition {
  const next = clonePosition(position)
  const player = position.current
  const enemy = opponentOf(player)

  function place(index: number): void {
    const square = next.points[index]
    if (square && square.player === enemy) {
      if (square.count === 1) {
        next.points[index] = { player, count: 1 }
        next.bar[enemy] += 1
        return
      }
    }
    if (square && square.player === player) {
      next.points[index] = { player, count: square.count + 1 }
      return
    }
    next.points[index] = { player, count: 1 }
  }

  function remove(index: number): void {
    const square = next.points[index]
    if (!square) {
      return
    }
    next.points[index] = square.count > 1 ? { player: square.player, count: square.count - 1 } : null
  }

  if (move.kind === 'enter') {
    next.bar[player] -= 1
    place(move.to)
  } else if (move.kind === 'move') {
    remove(move.from)
    place(move.to)
  } else {
    remove(move.from)
    next.off[player] += 1
  }

  return next
}

export function applyTurn(position: BackgammonPosition, turn: BackgammonTurn): BackgammonPosition {
  const applied = turn.reduce((current, move) => applyMove(current, move), position)
  return { ...applied, current: opponentOf(position.current) }
}

export function winnerOf(position: BackgammonPosition): Winner {
  if (position.off.white === 15) {
    return 'white'
  }
  if (position.off.black === 15) {
    return 'black'
  }
  return null
}
