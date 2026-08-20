import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  canFly,
  chooseAiTurn,
  countPieces,
  createInitialPosition,
  DEFAULT_VARIANT,
  isPlacing,
  legalMoves,
  millsAt,
  serializePosition,
  VARIANTS,
  winnerOf,
} from '../morris'
import type { MorrisMove, MorrisPosition, MorrisVariantId } from '../morris'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import { samePoint } from '../shared/point'
import type { Point } from '../shared/point'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'

const CAPTURE_ANIMATION_MS = 260
const MILL_GLOW_MS = 600

type Stone = {
  id: number
  point: Point
  player: Player
  capturing?: boolean
}

type Snapshot = {
  position: MorrisPosition
  winner: Winner
  positions: string[]
  stones: Stone[]
}

function landingPoint(move: MorrisMove): Point | null {
  if (move.kind === 'place' || move.kind === 'slide') {
    return move.to
  }
  return move.at
}

export function useMorris() {
  const [variant, setVariant] = useState<MorrisVariantId>(DEFAULT_VARIANT)
  const [position, setPosition] = useState<MorrisPosition>(() => createInitialPosition(VARIANTS[DEFAULT_VARIANT]))
  const [selected, setSelected] = useState<Point | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [lastMove, setLastMove] = useState<MorrisMove | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [positions, setPositions] = useState<string[]>(() => [
    serializePosition(VARIANTS[DEFAULT_VARIANT], createInitialPosition(VARIANTS[DEFAULT_VARIANT])),
  ])
  const [stones, setStones] = useState<Stone[]>([])
  const [millGlow, setMillGlow] = useState<Point[] | null>(null)

  const resolvedVariant = VARIANTS[variant]

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const positionsRef = useRef(positions)
  const difficultyRef = useRef(difficulty)
  const variantRef = useRef(variant)
  const stonesRef = useRef(stones)
  const nextStoneIdRef = useRef(0)
  const animationTimersRef = useRef<number[]>([])
  const playMoveRef = useRef<(move: MorrisMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  positionsRef.current = positions
  difficultyRef.current = difficulty
  variantRef.current = variant
  stonesRef.current = stones

  const clearAnimationTimers = useCallback(() => {
    for (const timer of animationTimersRef.current) {
      window.clearTimeout(timer)
    }
    animationTimersRef.current = []
  }, [])

  const moves = useMemo(() => legalMoves(resolvedVariant, position), [resolvedVariant, position])
  const placing = isPlacing(position.inHand)
  const flying = canFly(resolvedVariant, position.board, position.inHand, position.current)

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
      white: countPieces(resolvedVariant, position.board, 'white'),
      black: countPieces(resolvedVariant, position.board, 'black'),
    }),
    [resolvedVariant, position.board],
  )

  const finishIfNeeded = useCallback(
    (next: MorrisPosition) => {
      const result = winnerOf(resolvedVariant, next)
      if (result) {
        setWinner(result)
        return
      }
      if (!next.pendingRemoval) {
        const key = serializePosition(resolvedVariant, next)
        const nextPositions = [...positionsRef.current, key]
        const repeats = nextPositions.filter((item) => item === key).length
        setPositions(nextPositions)
        if (repeats >= 3) {
          setWinner('draw')
        }
      }
    },
    [resolvedVariant],
  )

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
          stones: stonesRef.current,
        },
      ])

      const prevPlayer = positionRef.current.current
      const next = applyMove(resolvedVariant, positionRef.current, move)

      if (move.kind === 'place') {
        const id = nextStoneIdRef.current
        nextStoneIdRef.current += 1
        setStones((prev) => [...prev, { id, point: move.to, player: prevPlayer }])
      } else if (move.kind === 'slide') {
        setStones((prev) =>
          prev.map((stone) => (samePoint(stone.point, move.from) ? { ...stone, point: move.to } : stone)),
        )
      } else {
        setStones((prev) =>
          prev.map((stone) => (samePoint(stone.point, move.at) ? { ...stone, capturing: true } : stone)),
        )
        const capturedAt = move.at
        const timer = window.setTimeout(() => {
          setStones((prev) => prev.filter((stone) => !(stone.capturing && samePoint(stone.point, capturedAt))))
        }, CAPTURE_ANIMATION_MS)
        animationTimersRef.current.push(timer)
      }

      if (next.pendingRemoval && move.kind !== 'remove') {
        const closedMills = millsAt(resolvedVariant, next.board, landingPoint(move) as Point, prevPlayer)
        const glowPoints: Point[] = []
        for (const mill of closedMills) {
          for (const point of mill) {
            if (!glowPoints.some((existing) => samePoint(existing, point))) {
              glowPoints.push(point)
            }
          }
        }
        setMillGlow(glowPoints)
        const timer = window.setTimeout(() => setMillGlow(null), MILL_GLOW_MS)
        animationTimersRef.current.push(timer)
      }

      setPosition(next)
      setLastMove(move)
      setSelected(null)
      if (move.kind === 'remove') {
        playSfx('capture')
      } else if (move.kind === 'place') {
        playSfx('stone')
      } else {
        playSfx('slide')
      }
      if (next.pendingRemoval && move.kind !== 'remove') {
        playSfx('mill')
      }
      finishIfNeeded(next)
    },
    [resolvedVariant, finishIfNeeded],
  )

  playMoveRef.current = playMove

  const selectPoint = useCallback(
    (point: Point) => {
      if (winner || thinking) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
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
    [winner, thinking, mode, humanColor, position, moves, placing, selected, playMove],
  )

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    clearAnimationTimers()
    const prev = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setPosition(prev.position)
    setWinner(prev.winner)
    setPositions(prev.positions)
    setStones(prev.stones)
    setMillGlow(null)
    setSelected(null)
    setLastMove(null)
  }, [thinking, history, clearAnimationTimers])

  const resetGame = useCallback(
    (nextMode = mode, nextVariant = variant, nextHumanColor = humanColor) => {
      clearAnimationTimers()
      const nextResolved = VARIANTS[nextVariant]
      const initial = createInitialPosition(nextResolved)
      setVariant(nextVariant)
      setPosition(initial)
      setSelected(null)
      setWinner(null)
      setThinking(false)
      setLastMove(null)
      setHistory([])
      setPositions([serializePosition(nextResolved, initial)])
      setStones([])
      setMillGlow(null)
      nextStoneIdRef.current = 0
      setMode(nextMode)
      setHumanColor(nextHumanColor)
    },
    [mode, variant, humanColor, clearAnimationTimers],
  )

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      resetGame(nextMode)
    },
    [resetGame],
  )

  const changeVariant = useCallback(
    (nextVariant: MorrisVariantId) => {
      resetGame(mode, nextVariant)
    },
    [resetGame, mode],
  )

  const changeHumanColor = useCallback(
    (nextHumanColor: Player) => {
      resetGame(mode, variant, nextHumanColor)
    },
    [resetGame, mode, variant],
  )

  useEffect(() => clearAnimationTimers, [clearAnimationTimers])

  const aiTurnActive = isCpuTurn(mode, position.current, humanColor) && !winner

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

        const turn = chooseAiTurn(VARIANTS[variantRef.current], positionRef.current, difficultyRef.current)
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
    humanColor,
    difficulty,
    variant,
    variantConfig: resolvedVariant,
    thinking,
    lastMove,
    placing,
    flying,
    targets,
    movableFrom,
    counts,
    stones,
    millGlow,
    lastPoint: lastMove ? landingPoint(lastMove) : null,
    canUndo: history.length > 0 && !thinking,
    selectPoint,
    undo,
    resetGame,
    changeMode,
    changeVariant,
    changeHumanColor,
    setDifficulty,
  }
}
