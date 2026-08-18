import { applyChainStep, applyMove, applyTurn, startChain } from './apply'
import { countPieces } from './board'
import { opponent } from './geometry'
import { isCaptureMove, legalMovesAtTurnStart, legalMovesInChain } from './moves'
import type { Board, ChainState, Difficulty, Move, Player } from './types'

const MAX_CHAIN = 8

export type Turn = Move[]

export function generateTurns(board: Board, player: Player): Turn[] {
  const firstMoves = legalMovesAtTurnStart(board, player)
  if (firstMoves.length === 0) {
    return []
  }
  if (!isCaptureMove(firstMoves[0])) {
    return firstMoves.map((move) => [move])
  }

  const turns: Turn[] = []
  for (const move of firstMoves) {
    expandTurn(board, player, [move], startChain(move), turns)
  }
  return turns
}

function expandTurn(
  board: Board,
  player: Player,
  sequence: Move[],
  chain: ChainState,
  turns: Turn[],
): void {
  const lastMove = sequence[sequence.length - 1]
  const nextBoard = applyMove(board, lastMove)

  if (countPieces(nextBoard, opponent(player)) === 0) {
    turns.push(sequence)
    return
  }

  turns.push(sequence)

  if (sequence.length >= MAX_CHAIN) {
    return
  }

  const continuations = legalMovesInChain(nextBoard, chain, player)
  for (const move of continuations) {
    expandTurn(nextBoard, player, [...sequence, move], applyChainStep(chain, move), turns)
  }
}

function evaluate(board: Board, ai: Player): number {
  const mine = countPieces(board, ai)
  const theirs = countPieces(board, opponent(ai))
  if (theirs === 0) {
    return 10_000
  }
  if (mine === 0) {
    return -10_000
  }

  const myMoves = legalMovesAtTurnStart(board, ai).length
  const theirMoves = legalMovesAtTurnStart(board, opponent(ai)).length
  return (mine - theirs) * 120 + (myMoves - theirMoves) * 3
}

function minimax(
  board: Board,
  toMove: Player,
  ai: Player,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const enemy = opponent(toMove)
  if (countPieces(board, enemy) === 0) {
    return toMove === ai ? 10_000 : -10_000
  }
  if (countPieces(board, toMove) === 0) {
    return toMove === ai ? -10_000 : 10_000
  }

  const turns = generateTurns(board, toMove)
  if (turns.length === 0) {
    return toMove === ai ? -9_000 : 9_000
  }
  if (depth === 0) {
    return evaluate(board, ai)
  }

  if (toMove === ai) {
    let best = -Infinity
    for (const turn of turns) {
      const value = minimax(applyTurn(board, turn), enemy, ai, depth - 1, alpha, beta)
      best = Math.max(best, value)
      alpha = Math.max(alpha, value)
      if (beta <= alpha) {
        break
      }
    }
    return best
  }

  let best = Infinity
  for (const turn of turns) {
    const value = minimax(applyTurn(board, turn), enemy, ai, depth - 1, alpha, beta)
    best = Math.min(best, value)
    beta = Math.min(beta, value)
    if (beta <= alpha) {
      break
    }
  }
  return best
}

function capturedCount(turn: Turn): number {
  return turn.reduce((total, move) => total + move.captured.length, 0)
}

export function chooseAiTurn(board: Board, player: Player, difficulty: Difficulty): Turn {
  const turns = generateTurns(board, player)
  if (turns.length === 0) {
    return []
  }

  if (difficulty === 'easy') {
    let bestTurn = turns[0]
    let bestScore = -Infinity
    for (const turn of turns) {
      const score = capturedCount(turn) * 10 + turn.length + Math.random()
      if (score > bestScore) {
        bestScore = score
        bestTurn = turn
      }
    }
    return bestTurn
  }

  const depth = difficulty === 'hard' ? 2 : 1
  let bestTurn = turns[0]
  let bestValue = -Infinity

  for (const turn of turns) {
    const value =
      minimax(applyTurn(board, turn), opponent(player), player, depth - 1, -Infinity, Infinity) +
      Math.random() * 0.05
    if (value > bestValue) {
      bestValue = value
      bestTurn = turn
    }
  }

  return bestTurn
}
