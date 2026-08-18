import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  canFly,
  chooseAiTurn,
  countPieces,
  createInitialPosition,
  isPlacing,
  legalMoves,
  serializePosition,
  winnerOf,
} from '../morris'
import type { MorrisMove, MorrisPosition } from '../morris'
import { samePoint } from '../shared/point'
import type { Point } from '../shared/point'
import type { Difficulty, GameMode, Winner } from '../shared/types'

type Snapshot = {
  position: MorrisPosition
  winner: Winner
  positions: string[]
}

function landingPoint(move: MorrisMove): Point | null {
  if (move.kind === 'place' || move.kind === 'slide') {
    return move.to
  }
  return move.at
}

export function useMorris() {
  const [position, setPosition] = useState<MorrisPosition>(createInitialPosition)
  const [selected, setSelected] = useState<Point | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [lastMove, setLastMove] = useState<MorrisMove | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [positions, setPositions] = useState<string[]>(() => [serializePosition(createInitialPosition())])

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const positionsRef = useRef(positions)
  const difficultyRef = useRef(difficulty)
  const playMoveRef = useRef<(move: MorrisMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  positionsRef.current = positions
  difficultyRef.current = difficulty

  const moves = useMemo(() => legalMoves(position), [position])
  const placing = isPlacing(position.inHand)
  const flying = canFly(position.board, position.inHand, position.current)

  const targets = useMemo(() => {
    if (position.pendingRemoval) {
      return moves.filter((move) => move.kind === 'remove').map((move) => move.at)
    }
    if (placing) {
      return moves.filter((move) => move.kind === 'place').map((move) => move.to)
    }
    if (!selected) {
      return []
    }
    return moves.flatMap((move) =>
      move.kind === 'slide' && samePoint(move.from, selected) ? [move.to] : [],
    )
  }, [moves, position.pendingRemoval, placing, selected])

  const movableFrom = useMemo(() => {
    if (placing || position.pendingRemoval) {
      return []
    }
    const points: Point[] = []
    for (const move of moves) {
      if (move.kind === 'slide' && !points.some((point) => samePoint(point, move.from))) {
        points.push(move.from)
      }
    }
    return points
  }, [moves, placing, position.pendingRemoval])

  const counts = useMemo(
    () => ({
      white: countPieces(position.board, 'white'),
      black: countPieces(position.board, 'black'),
    }),
    [position.board],
  )

  const finishIfNeeded = useCallback((next: MorrisPosition) => {
    const result = winnerOf(next)
    if (result) {
      setWinner(result)
      return
    }
    if (!next.pendingRemoval) {
      const key = serializePosition(next)
      const nextPositions = [...positionsRef.current, key]
      const repeats = nextPositions.filter((item) => item === key).length
      setPositions(nextPositions)
      if (repeats >= 3) {
        setWinner('draw')
      }
    }
  }, [])

  const playMove = useCallback(
    (move: MorrisMove) => {
      if (winnerRef.current) {
        return
      }

      setHistory((prev) => [
        ...prev,
        {
          position: positionRef.current,
          winner: winnerRef.current,
          positions: positionsRef.current,
        },
      ])

      const next = applyMove(positionRef.current, move)
      setPosition(next)
      setLastMove(move)
      setSelected(null)
      finishIfNeeded(next)
    },
    [finishIfNeeded],
  )

  playMoveRef.current = playMove

  const selectPoint = useCallback(
    (point: Point) => {
      if (winner || thinking) {
        return
      }
      if (mode === 'cpu' && position.current === 'black') {
        return
      }

      if (position.pendingRemoval) {
        const removal = moves.find((move) => move.kind === 'remove' && samePoint(move.at, point))
        if (removal) {
          playMove(removal)
        }
        return
      }

      if (placing) {
        const place = moves.find((move) => move.kind === 'place' && samePoint(move.to, point))
        if (place) {
          playMove(place)
        }
        return
      }

      if (selected) {
        const slide = moves.find(
          (move) => move.kind === 'slide' && samePoint(move.from, selected) && samePoint(move.to, point),
        )
        if (slide) {
          playMove(slide)
          return
        }
      }

      const pieceMoves = moves.filter((move) => move.kind === 'slide' && samePoint(move.from, point))
      if (pieceMoves.length > 0) {
        setSelected(point)
        return
      }

      setSelected(null)
    },
    [winner, thinking, mode, position, moves, placing, selected, playMove],
  )

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    const prev = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setPosition(prev.position)
    setWinner(prev.winner)
    setPositions(prev.positions)
    setSelected(null)
    setLastMove(null)
  }, [thinking, history])

  const resetGame = useCallback((nextMode = mode) => {
    const initial = createInitialPosition()
    setPosition(initial)
    setSelected(null)
    setWinner(null)
    setThinking(false)
    setLastMove(null)
    setHistory([])
    setPositions([serializePosition(initial)])
    setMode(nextMode)
  }, [mode])

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      resetGame(nextMode)
    },
    [resetGame],
  )

  const aiTurnActive = mode === 'cpu' && position.current === 'black' && !winner

  useEffect(() => {
    if (!aiTurnActive) {
      return
    }

    let cancelled = false
    const timers: number[] = []
    setThinking(true)

    timers.push(
      window.setTimeout(() => {
        if (cancelled) {
          return
        }

        const turn = chooseAiTurn(positionRef.current, difficultyRef.current)
        if (turn.length === 0) {
          setThinking(false)
          return
        }

        let index = 0
        const playNext = () => {
          if (cancelled) {
            return
          }
          playMoveRef.current(turn[index])
          index += 1
          if (index >= turn.length) {
            setThinking(false)
            return
          }
          timers.push(window.setTimeout(playNext, 420))
        }
        playNext()
      }, 380),
    )

    return () => {
      cancelled = true
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
      setThinking(false)
    }
  }, [aiTurnActive])

  return {
    board: position.board,
    current: position.current,
    inHand: position.inHand,
    pendingRemoval: position.pendingRemoval,
    selected,
    winner,
    mode,
    difficulty,
    thinking,
    lastMove,
    placing,
    flying,
    targets,
    movableFrom,
    counts,
    lastPoint: lastMove ? landingPoint(lastMove) : null,
    canUndo: history.length > 0 && !thinking,
    selectPoint,
    undo,
    resetGame,
    changeMode,
    setDifficulty,
  }
}
