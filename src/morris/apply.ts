import { opponent } from '../shared/player'
import { keyOf } from '../shared/point'
import { cloneBoard, cloneHands } from './board'
import { formsMill } from './geometry'
import { hasLegalMove, isUnderMinimum } from './moves'
import type { Winner } from '../shared/types'
import type { MorrisMove, MorrisPosition } from './types'

export function applyMove(position: MorrisPosition, move: MorrisMove): MorrisPosition {
  const board = cloneBoard(position.board)
  const inHand = cloneHands(position.inHand)
  const player = position.current

  if (move.kind === 'place') {
    board[keyOf(move.to)] = player
    inHand[player] -= 1
    const mill = formsMill(board, move.to, player)
    return {
      board,
      inHand,
      current: mill ? player : opponent(player),
      pendingRemoval: mill,
    }
  }

  if (move.kind === 'slide') {
    board[keyOf(move.from)] = null
    board[keyOf(move.to)] = player
    const mill = formsMill(board, move.to, player)
    return {
      board,
      inHand,
      current: mill ? player : opponent(player),
      pendingRemoval: mill,
    }
  }

  board[keyOf(move.at)] = null
  return {
    board,
    inHand,
    current: opponent(player),
    pendingRemoval: false,
  }
}

export function applyTurn(position: MorrisPosition, turn: MorrisMove[]): MorrisPosition {
  return turn.reduce((current, move) => applyMove(current, move), position)
}

export function winnerOf(position: MorrisPosition): Winner {
  if (position.pendingRemoval) {
    return null
  }

  const toMove = position.current
  const idle = opponent(toMove)

  if (isUnderMinimum(position, toMove)) {
    return idle
  }
  if (isUnderMinimum(position, idle)) {
    return toMove
  }
  if (!hasLegalMove(position)) {
    return idle
  }
  return null
}
