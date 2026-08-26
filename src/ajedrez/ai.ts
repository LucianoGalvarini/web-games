import type { Difficulty, Player } from '../shared/types'
import { createInitialPosition, serializePosition } from './board'
import { PIECE_VALUE } from './constants'
import { applyMove, inCheck, legalMoves } from './moves'
import type { ChessMove, ChessPosition, PieceKind } from './types'

const PST: Record<PieceKind, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0,
    0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20,
    15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30,
    -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5,
    -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10,
    -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0,
    5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30,
    -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0,
    0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

const OPENING_LINES: Array<Array<[number, number]>> = [
  [
    [52, 36],
    [12, 28],
    [62, 45],
    [1, 18],
    [61, 25],
  ],
  [
    [52, 36],
    [12, 28],
    [62, 45],
    [1, 18],
    [61, 34],
  ],
  [
    [52, 36],
    [10, 26],
    [62, 45],
  ],
  [
    [51, 35],
    [11, 27],
    [50, 34],
  ],
  [
    [52, 36],
    [12, 28],
    [62, 45],
    [6, 21],
  ],
  [
    [62, 45],
    [11, 27],
  ],
  [
    [51, 35],
    [6, 21],
    [50, 34],
  ],
]

const Q_DEPTH = 4

type SearchLimit = {
  time: number
  expired: boolean
  nodes: number
}

type TtFlag = 'exact' | 'lower' | 'upper'

type TtEntry = {
  depth: number
  score: number
  flag: TtFlag
  best: ChessMove | null
}

function pst(kind: PieceKind, index: number, player: Player): number {
  const mapped = player === 'white' ? index : 63 - index
  return PST[kind][mapped] ?? 0
}

function evaluate(position: ChessPosition, ai: Player): number {
  let score = 0
  for (let index = 0; index < position.squares.length; index += 1) {
    const piece = position.squares[index]
    if (!piece) {
      continue
    }
    const value = (piece.kind === 'k' ? 0 : PIECE_VALUE[piece.kind]) + pst(piece.kind, index, piece.player)
    score += piece.player === ai ? value : -value
  }
  if (inCheck(position.squares, position.current)) {
    score += position.current === ai ? -45 : 45
  }
  return score
}

function captureValue(position: ChessPosition, move: ChessMove): number {
  if (move.promoteTo) {
    return PIECE_VALUE[move.promoteTo]
  }
  if (!move.capture) {
    return 0
  }
  if (move.enPassant) {
    return PIECE_VALUE.p
  }
  const captured = position.squares[move.to]
  return captured ? PIECE_VALUE[captured.kind] : 0
}

function ordered(position: ChessPosition, moves: ChessMove[], preferred: ChessMove | null): ChessMove[] {
  return [...moves].sort((a, b) => {
    if (preferred && a.from === preferred.from && a.to === preferred.to && a.promoteTo === preferred.promoteTo) {
      return -1
    }
    if (preferred && b.from === preferred.from && b.to === preferred.to && b.promoteTo === preferred.promoteTo) {
      return 1
    }
    return captureValue(position, b) - captureValue(position, a) || Number(Boolean(b.castle)) - Number(Boolean(a.castle))
  })
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

function probe(
  tt: Map<string, TtEntry> | null,
  key: string,
  depth: number,
  alpha: number,
  beta: number,
): { score?: number; best: ChessMove | null } {
  const cached = tt?.get(key)
  if (!cached) {
    return { best: null }
  }
  if (cached.depth < depth) {
    return { best: cached.best }
  }
  if (cached.flag === 'exact') {
    return { score: cached.score, best: cached.best }
  }
  if (cached.flag === 'lower' && cached.score >= beta) {
    return { score: cached.score, best: cached.best }
  }
  if (cached.flag === 'upper' && cached.score <= alpha) {
    return { score: cached.score, best: cached.best }
  }
  return { best: cached.best }
}

function store(
  tt: Map<string, TtEntry> | null,
  key: string,
  depth: number,
  score: number,
  alpha: number,
  beta: number,
  best: ChessMove | null,
  expired: boolean,
): void {
  if (!tt || expired) {
    return
  }
  let flag: TtFlag = 'exact'
  if (score <= alpha) {
    flag = 'upper'
  } else if (score >= beta) {
    flag = 'lower'
  }
  tt.set(key, { depth, score, flag, best })
}

function mateScore(position: ChessPosition, ai: Player, depth: number): number {
  if (inCheck(position.squares, position.current)) {
    return position.current === ai ? -12_000 - depth : 12_000 + depth
  }
  return 0
}

function quiesce(
  position: ChessPosition,
  ai: Player,
  alpha: number,
  beta: number,
  remain: number,
  limit: SearchLimit | null,
): number {
  if (tick(limit) || remain < 0) {
    return evaluate(position, ai)
  }

  const checked = inCheck(position.squares, position.current)
  const maximizing = position.current === ai
  const stand = evaluate(position, ai)
  let localAlpha = alpha
  let localBeta = beta

  if (!checked) {
    if (maximizing) {
      if (stand >= localBeta) {
        return stand
      }
      if (stand > localAlpha) {
        localAlpha = stand
      }
    } else if (stand <= localAlpha) {
      return stand
    } else if (stand < localBeta) {
      localBeta = stand
    }
  }

  let moves = legalMoves(position)
  if (moves.length === 0) {
    return mateScore(position, ai, remain)
  }
  if (!checked) {
    moves = moves.filter((move) => move.capture || move.promoteTo)
    if (moves.length === 0) {
      return stand
    }
  }

  let best = maximizing ? (checked ? -Infinity : stand) : checked ? Infinity : stand
  for (const move of ordered(position, moves, null)) {
    const value = quiesce(applyMove(position, move), ai, localAlpha, localBeta, remain - 1, limit)
    if (maximizing) {
      if (value > best) {
        best = value
      }
      if (best > localAlpha) {
        localAlpha = best
      }
    } else {
      if (value < best) {
        best = value
      }
      if (best < localBeta) {
        localBeta = best
      }
    }
    if (localBeta <= localAlpha || limit?.expired) {
      break
    }
  }
  return best
}

function minimax(
  position: ChessPosition,
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
  const cached = probe(tt, key, depth, alpha, beta)
  if (cached.score !== undefined) {
    return cached.score
  }

  const moves = ordered(position, legalMoves(position), cached.best)
  if (moves.length === 0) {
    return mateScore(position, ai, depth)
  }
  if (depth === 0) {
    if (tt || limit) {
      return quiesce(position, ai, alpha, beta, Q_DEPTH, limit)
    }
    return evaluate(position, ai)
  }

  const maximizing = position.current === ai
  let best = maximizing ? -Infinity : Infinity
  let bestMove: ChessMove | null = moves[0] ?? null
  const originalAlpha = alpha
  const originalBeta = beta
  let localAlpha = alpha
  let localBeta = beta

  for (const move of moves) {
    const value = minimax(applyMove(position, move), ai, depth - 1, localAlpha, localBeta, tt, limit)
    if (maximizing) {
      if (value > best) {
        best = value
        bestMove = move
      }
      localAlpha = Math.max(localAlpha, best)
    } else {
      if (value < best) {
        best = value
        bestMove = move
      }
      localBeta = Math.min(localBeta, best)
    }
    if (localBeta <= localAlpha || limit?.expired) {
      break
    }
  }

  store(tt, key, depth, best, originalAlpha, originalBeta, bestMove, Boolean(limit?.expired))
  return best
}

function pick(moves: ChessMove[], scores: number[], random: () => number): ChessMove {
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
  position: ChessPosition,
  moves: ChessMove[],
  ai: Player,
  depth: number,
  random: () => number,
  tt: Map<string, TtEntry> | null,
  limit: SearchLimit | null,
): { move: ChessMove; scores: number[] } | null {
  const orderedMoves = ordered(position, moves, tt ? probe(tt, serializePosition(position), depth, -Infinity, Infinity).best : null)
  const scores = orderedMoves.map((move) =>
    minimax(applyMove(position, move), ai, depth - 1, -Infinity, Infinity, tt, limit),
  )
  if (limit?.expired) {
    return null
  }
  return { move: pick(orderedMoves, scores, random), scores }
}

function bookMove(position: ChessPosition, random: () => number): ChessMove | null {
  const key = serializePosition(position)
  const matches: ChessMove[] = []
  for (const line of OPENING_LINES) {
    let cursor = createInitialPosition()
    for (const [from, to] of line) {
      if (serializePosition(cursor) === key) {
        const legal = legalMoves(position).find((move) => move.from === from && move.to === to)
        if (legal) {
          matches.push(legal)
        }
        break
      }
      const step = legalMoves(cursor).find((move) => move.from === from && move.to === to)
      if (!step) {
        break
      }
      cursor = applyMove(cursor, step)
    }
  }
  if (matches.length === 0) {
    return null
  }
  return matches[Math.floor(random() * matches.length)] ?? null
}

export function chooseAiMove(
  position: ChessPosition,
  difficulty: Difficulty,
  random = Math.random,
): ChessMove | null {
  const moves = legalMoves(position)
  if (moves.length === 0) {
    return null
  }

  const ai = position.current
  if (difficulty === 'easy') {
    const captures = moves.filter((move) => move.capture)
    if (captures.length > 0 && random() < 0.45) {
      return captures[Math.floor(random() * captures.length)] ?? moves[0] ?? null
    }
    return moves[Math.floor(random() * moves.length)] ?? null
  }

  if (difficulty === 'hard' || difficulty === 'perfect') {
    const booked = bookMove(position, random)
    if (booked) {
      return booked
    }
  }

  if (difficulty === 'medium') {
    return searchRoot(position, moves, ai, 2, random, null, null)?.move ?? moves[0] ?? null
  }

  if (difficulty === 'hard') {
    return searchRoot(position, moves, ai, 3, random, new Map(), null)?.move ?? moves[0] ?? null
  }

  const limit: SearchLimit = { time: Date.now() + 420, expired: false, nodes: 0 }
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
