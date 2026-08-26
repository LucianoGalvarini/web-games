import type { Difficulty, Player } from '../shared/types'
import { serializePosition } from './board'
import { pieceValue } from './constants'
import { applyMove, inCheck, legalMoves } from './moves'
import type { DroppableKind, ShogiMove, ShogiPosition } from './types'

type SearchLimit = {
  time: number
  expired: boolean
  nodes: number
}

type TtEntry = {
  depth: number
  score: number
  best: ShogiMove | null
}

function materialFor(position: ShogiPosition, ai: Player): number {
  const enemy: Player = ai === 'white' ? 'black' : 'white'
  let score = 0
  for (const piece of position.board) {
    if (!piece || piece.kind === 'k') {
      continue
    }
    const value = pieceValue(piece.kind, piece.promoted)
    score += piece.player === ai ? value : -value
  }
  for (const kind of Object.keys(position.hands.white) as DroppableKind[]) {
    score += pieceValue(kind, false) * position.hands[ai][kind]
    score -= pieceValue(kind, false) * position.hands[enemy][kind]
  }
  return score
}

function evaluate(position: ShogiPosition, ai: Player): number {
  let score = materialFor(position, ai)
  if (inCheck(position.board, position.current)) {
    score += position.current === ai ? -45 : 45
  }
  return score
}

function moveValue(position: ShogiPosition, move: ShogiMove): number {
  if (move.kind === 'drop') {
    return 0
  }
  if (move.promote) {
    return 60
  }
  if (!move.capture) {
    return 0
  }
  const captured = position.board[move.to]
  return captured ? pieceValue(captured.kind, captured.promoted) : 0
}

function ordered(position: ShogiPosition, moves: ShogiMove[], preferred: ShogiMove | null): ShogiMove[] {
  return [...moves].sort((a, b) => {
    if (preferred && sameKey(a) === sameKey(preferred)) {
      return -1
    }
    if (preferred && sameKey(b) === sameKey(preferred)) {
      return 1
    }
    return moveValue(position, b) - moveValue(position, a)
  })
}

function sameKey(move: ShogiMove): string {
  return move.kind === 'drop' ? `d${move.to}${move.piece}` : `m${move.from}${move.to}${move.promote ? 1 : 0}`
}

function tick(limit: SearchLimit | null): boolean {
  if (!limit) {
    return false
  }
  limit.nodes += 1
  if ((limit.nodes & 255) === 0 && Date.now() > limit.time) {
    limit.expired = true
  }
  return limit.expired
}

function minimax(
  position: ShogiPosition,
  ai: Player,
  depth: number,
  alpha: number,
  beta: number,
  tt: Map<string, TtEntry> | null,
  limit: SearchLimit | null,
): number {
  if (tick(limit)) {
    return evaluate(position, ai)
  }

  const key = tt ? serializePosition(position) : ''
  const cached = tt?.get(key)
  if (cached && cached.depth >= depth) {
    return cached.score
  }

  const moves = ordered(position, legalMoves(position), cached?.best ?? null)
  if (moves.length === 0) {
    return position.current === ai ? -12_000 - depth : 12_000 + depth
  }
  if (depth === 0) {
    return evaluate(position, ai)
  }

  const maximizing = position.current === ai
  let best = maximizing ? -Infinity : Infinity
  let bestMove: ShogiMove | null = moves[0] ?? null

  for (const move of moves) {
    const value = minimax(applyMove(position, move), ai, depth - 1, alpha, beta, tt, limit)
    if (maximizing) {
      if (value > best) {
        best = value
        bestMove = move
      }
      alpha = Math.max(alpha, best)
    } else {
      if (value < best) {
        best = value
        bestMove = move
      }
      beta = Math.min(beta, best)
    }
    if (beta <= alpha || limit?.expired) {
      break
    }
  }

  if (tt && !limit?.expired) {
    tt.set(key, { depth, score: best, best: bestMove })
  }

  return best
}

function pick(moves: ShogiMove[], scores: number[], random: () => number): ShogiMove {
  const finite = scores.map((score) => (Number.isFinite(score) ? score : -1_000_000))
  const best = Math.max(...finite)
  const top = moves.filter((_, index) => finite[index] === best)
  const choice = top[Math.floor(random() * top.length)] ?? moves[0]
  if (!choice) {
    throw new Error('La CPU no tiene jugadas.')
  }
  return choice
}

function searchRoot(
  position: ShogiPosition,
  moves: ShogiMove[],
  ai: Player,
  depth: number,
  random: () => number,
  tt: Map<string, TtEntry> | null,
  limit: SearchLimit | null,
): { move: ShogiMove; scores: number[] } | null {
  const orderedMoves = ordered(position, moves, tt?.get(serializePosition(position))?.best ?? null)
  const scores = orderedMoves.map((move) =>
    minimax(applyMove(position, move), ai, depth - 1, -Infinity, Infinity, tt, limit),
  )
  if (limit?.expired) {
    return null
  }
  return { move: pick(orderedMoves, scores, random), scores }
}

export function chooseAiMove(position: ShogiPosition, difficulty: Difficulty, random = Math.random): ShogiMove | null {
  const moves = legalMoves(position)
  if (moves.length === 0) {
    return null
  }

  const ai = position.current
  if (difficulty === 'easy') {
    const captures = moves.filter((move) => move.kind === 'move' && move.capture)
    if (captures.length > 0 && random() < 0.45) {
      return captures[Math.floor(random() * captures.length)] ?? moves[0] ?? null
    }
    return moves[Math.floor(random() * moves.length)] ?? null
  }

  if (difficulty === 'medium') {
    return searchRoot(position, moves, ai, 2, random, null, null)?.move ?? moves[0] ?? null
  }

  if (difficulty === 'hard') {
    return searchRoot(position, moves, ai, 3, random, new Map(), null)?.move ?? moves[0] ?? null
  }

  const limit: SearchLimit = { time: Date.now() + 900, expired: false, nodes: 0 }
  const tt = new Map<string, TtEntry>()
  let chosen = moves[0] ?? null

  for (let depth = 1; depth <= 4; depth += 1) {
    if (Date.now() > limit.time) {
      break
    }
    limit.expired = false
    const found = searchRoot(position, moves, ai, depth, random, tt, limit)
    if (found) {
      chosen = found.move
    } else {
      break
    }
  }

  return chosen
}
