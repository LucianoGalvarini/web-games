import { takeNext } from './bag'
import { cloneBoard, collides, emptyBoard, ghostY, isGrounded, writePiece, clearLines } from './board'
import { LINE_SCORES, SPAWN_X, SPAWN_Y, levelFor } from './constants'
import { wallKicks } from './kicks'
import type { ActivePiece, PieceId, Rot, TetrisAction, TetrisState } from './types'

function copy(state: TetrisState): TetrisState {
  return {
    board: cloneBoard(state.board),
    active: state.active ? { ...state.active } : null,
    hold: state.hold,
    canHold: state.canHold,
    queue: [...state.queue],
    bag: [...state.bag],
    score: state.score,
    lines: state.lines,
    level: state.level,
    startLevel: state.startLevel,
    status: state.status,
    lastClear: state.lastClear,
  }
}

function spawnPiece(id: PieceId): ActivePiece {
  return { id, x: SPAWN_X, y: SPAWN_Y, rot: 0 }
}

function refill(state: TetrisState, random: () => number): void {
  const next = takeNext(state.queue, state.bag, random)
  state.queue = next.queue
  state.bag = next.bag
  const piece = spawnPiece(next.id)
  if (collides(state.board, piece)) {
    state.active = piece
    state.status = 'lost'
    return
  }
  state.active = piece
  state.canHold = true
}

function lock(state: TetrisState, random: () => number): void {
  if (!state.active) {
    return
  }
  state.board = writePiece(state.board, state.active)
  const result = clearLines(state.board)
  state.board = result.board
  const cleared = result.cleared as 0 | 1 | 2 | 3 | 4
  state.lastClear = cleared
  if (cleared > 0) {
    const bonus = LINE_SCORES[cleared] ?? 0
    state.score += bonus * state.level
    state.lines += cleared
    state.level = levelFor(state.startLevel, state.lines)
  }
  state.active = null
  refill(state, random)
}

function tryMove(state: TetrisState, dx: number, dy: number): boolean {
  if (!state.active || state.status !== 'playing') {
    return false
  }
  const moved = { ...state.active, x: state.active.x + dx, y: state.active.y + dy }
  if (collides(state.board, moved)) {
    return false
  }
  state.active = moved
  return true
}

function rotate(state: TetrisState, dir: 1 | -1): boolean {
  if (!state.active || state.status !== 'playing') {
    return false
  }
  const from = state.active.rot
  const to = ((from + dir + 4) % 4) as Rot
  for (const kick of wallKicks(state.active.id, from, to)) {
    const next: ActivePiece = {
      ...state.active,
      rot: to,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    }
    if (!collides(state.board, next)) {
      state.active = next
      return true
    }
  }
  return false
}

export function createGame(startLevel = 1, random = Math.random): TetrisState {
  const state: TetrisState = {
    board: emptyBoard(),
    active: null,
    hold: null,
    canHold: true,
    queue: [],
    bag: [],
    score: 0,
    lines: 0,
    level: startLevel,
    startLevel,
    status: 'playing',
    lastClear: 0,
  }
  refill(state, random)
  return state
}

export function applyAction(state: TetrisState, action: TetrisAction, random = Math.random): TetrisState {
  if (state.status !== 'playing' || !state.active) {
    return state
  }
  const next = copy(state)

  if (action.kind === 'left') {
    tryMove(next, -1, 0)
    return next
  }
  if (action.kind === 'right') {
    tryMove(next, 1, 0)
    return next
  }
  if (action.kind === 'soft') {
    if (tryMove(next, 0, 1)) {
      next.score += 1
    }
    return next
  }
  if (action.kind === 'hard') {
    if (!next.active) {
      return next
    }
    const drop = ghostY(next.board, next.active)
    const dist = drop - next.active.y
    next.active = { ...next.active, y: drop }
    next.score += dist * 2
    lock(next, random)
    return next
  }
  if (action.kind === 'cw') {
    rotate(next, 1)
    return next
  }
  if (action.kind === 'ccw') {
    rotate(next, -1)
    return next
  }
  if (action.kind === 'hold') {
    if (!next.canHold || !next.active) {
      return next
    }
    const swapping = next.active.id
    next.canHold = false
    if (next.hold) {
      next.active = spawnPiece(next.hold)
      next.hold = swapping
      if (collides(next.board, next.active)) {
        next.status = 'lost'
      }
      return next
    }
    next.hold = swapping
    next.active = null
    refill(next, random)
    next.canHold = false
    return next
  }

  if (!tryMove(next, 0, 1)) {
    lock(next, random)
  }
  return next
}

export function grounded(state: TetrisState): boolean {
  if (!state.active) {
    return false
  }
  return isGrounded(state.board, state.active)
}
