import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  chooseAiTurn,
  countPieces,
  createInitialPosition,
  DEFAULT_VARIANT,
  isPromotionRow,
  legalStepsAtTurnStart,
  pieceCaptureSteps,
  serializePosition,
  VARIANTS,
  winnerOf,
} from '../damas'
import type { DamasBoard, DamasMove, DamasPosition, DamasVariantId, PieceKind } from '../damas'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import { samePoint } from '../shared/point'
import type { Point } from '../shared/point'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'

const CAPTURE_ANIMATION_MS = 260

type Piece = {
  id: number
  point: Point
  player: Player
  kind: PieceKind
  capturing?: boolean
}

type ActiveChain = {
  from: Point
  kind: PieceKind
  dead: Set<string>
}

type Snapshot = {
  position: DamasPosition
  winner: Winner
  positions: string[]
  pieces: Piece[]
  activeChain: ActiveChain | null
}

function piecesFromBoard(board: DamasBoard, nextId: { current: number }): Piece[] {
  const pieces: Piece[] = []
  for (const key of Object.keys(board)) {
    const square = board[key]
    if (!square) {
      continue
    }
    const [x, y] = key.split(',').map(Number)
    pieces.push({ id: nextId.current, point: { x, y }, player: square.player, kind: square.kind })
    nextId.current += 1
  }
  return pieces
}

export function useDamas() {
  const [variant, setVariant] = useState<DamasVariantId>(DEFAULT_VARIANT)
  const [position, setPosition] = useState<DamasPosition>(() => createInitialPosition())
  const [selected, setSelected] = useState<Point | null>(null)
  const [activeChain, setActiveChain] = useState<ActiveChain | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [lastMove, setLastMove] = useState<DamasMove | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [positions, setPositions] = useState<string[]>(() => [serializePosition(createInitialPosition())])
  const [pieces, setPieces] = useState<Piece[]>(() => {
    const nextId = { current: 0 }
    return piecesFromBoard(createInitialPosition().board, nextId)
  })

  const resolvedVariant = VARIANTS[variant]

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const positionsRef = useRef(positions)
  const difficultyRef = useRef(difficulty)
  const variantRef = useRef(variant)
  const piecesRef = useRef(pieces)
  const activeChainRef = useRef(activeChain)
  const animationTimersRef = useRef<number[]>([])
  const playMoveRef = useRef<(move: DamasMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  positionsRef.current = positions
  difficultyRef.current = difficulty
  variantRef.current = variant
  piecesRef.current = pieces
  activeChainRef.current = activeChain

  const clearAnimationTimers = useCallback(() => {
    for (const timer of animationTimersRef.current) {
      window.clearTimeout(timer)
    }
    animationTimersRef.current = []
  }, [])

  const firstSteps = useMemo(
    () => (activeChain ? [] : legalStepsAtTurnStart(resolvedVariant, position)),
    [resolvedVariant, position, activeChain],
  )

  const chainSteps = useMemo(() => {
    if (!activeChain) {
      return []
    }
    return pieceCaptureSteps(
      resolvedVariant,
      position.board,
      activeChain.dead,
      activeChain.from,
      position.current,
      activeChain.kind,
    )
  }, [resolvedVariant, position, activeChain])

  const targets = useMemo(() => {
    if (activeChain) {
      return chainSteps.map((move) => move.to)
    }
    if (!selected) {
      return []
    }
    return firstSteps.filter((move) => samePoint(move.from, selected)).map((move) => move.to)
  }, [activeChain, chainSteps, firstSteps, selected])

  const movableFrom = useMemo(() => {
    if (activeChain) {
      return [activeChain.from]
    }
    const points: Point[] = []
    for (const move of firstSteps) {
      if (!points.some((point) => samePoint(point, move.from))) {
        points.push(move.from)
      }
    }
    return points
  }, [activeChain, firstSteps])

  const mustCapture = firstSteps.length > 0 && firstSteps[0].kind === 'jump'

  const counts = useMemo(
    () => ({
      white: countPieces(position.board, 'white'),
      black: countPieces(position.board, 'black'),
    }),
    [position.board],
  )

  const finishIfNeeded = useCallback(
    (next: DamasPosition) => {
      const result = winnerOf(resolvedVariant, next)
      if (result) {
        setWinner(result)
        return
      }
      const key = serializePosition(next)
      const nextPositions = [...positionsRef.current, key]
      const repeats = nextPositions.filter((item) => item === key).length
      setPositions(nextPositions)
      if (repeats >= 3) {
        setWinner('draw')
      }
    },
    [resolvedVariant],
  )

  const playMove = useCallback(
    (move: DamasMove) => {
      if (winnerRef.current) {
        return
      }

      setHistory((prev) => [
        ...prev,
        {
          position: positionRef.current,
          winner: winnerRef.current,
          positions: positionsRef.current,
          pieces: piecesRef.current,
          activeChain: activeChainRef.current,
        },
      ])

      const board = { ...positionRef.current.board }
      const player = positionRef.current.current
      const key = (point: Point) => `${point.x},${point.y}`
      const piece = board[key(move.from)]
      const kind: PieceKind = piece?.kind ?? 'man'

      board[key(move.from)] = null
      if (move.kind === 'jump') {
        board[key(move.captured)] = null
      }

      const promoted = kind === 'man' && isPromotionRow(player, move.to.y)
      const landedKind: PieceKind = promoted ? 'king' : kind
      board[key(move.to)] = { player, kind: landedKind }

      setPieces((prev) => {
        const withMoved = prev.map((entry) =>
          samePoint(entry.point, move.from) ? { ...entry, point: move.to, kind: landedKind } : entry,
        )
        if (move.kind !== 'jump') {
          return withMoved
        }
        return withMoved.map((entry) =>
          samePoint(entry.point, move.captured) ? { ...entry, capturing: true } : entry,
        )
      })

      if (move.kind === 'jump') {
        const capturedAt = move.captured
        const timer = window.setTimeout(() => {
          setPieces((prev) => prev.filter((entry) => !(entry.capturing && samePoint(entry.point, capturedAt))))
        }, CAPTURE_ANIMATION_MS)
        animationTimersRef.current.push(timer)
      }

      const priorDead = activeChainRef.current?.dead ?? new Set<string>()
      const nextDead = move.kind === 'jump' ? new Set([...priorDead, key(move.captured)]) : priorDead
      const continuation =
        move.kind === 'jump' && !promoted
          ? pieceCaptureSteps(resolvedVariant, board, nextDead, move.to, player, landedKind)
          : []

      const next: DamasPosition =
        continuation.length > 0
          ? { board, current: player }
          : { board, current: player === 'white' ? 'black' : 'white' }

      setPosition(next)
      setLastMove(move)
      setSelected(null)
      playSfx(move.kind === 'jump' ? 'capture' : 'slide')
      if (promoted) {
        playSfx('promote')
      }

      if (continuation.length > 0) {
        setActiveChain({ from: move.to, kind: landedKind, dead: nextDead })
      } else {
        setActiveChain(null)
        finishIfNeeded(next)
      }
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

      if (activeChain) {
        const step = chainSteps.find((move) => samePoint(move.to, point))
        if (step) {
          playMove(step)
        }
        return
      }

      if (selected) {
        const step = firstSteps.find(
          (move) => samePoint(move.from, selected) && samePoint(move.to, point),
        )
        if (step) {
          playMove(step)
          return
        }
      }

      const pieceSteps = firstSteps.filter((move) => samePoint(move.from, point))
      if (pieceSteps.length > 0) {
        setSelected(point)
        return
      }

      setSelected(null)
    },
    [winner, thinking, mode, humanColor, position, activeChain, chainSteps, selected, firstSteps, playMove],
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
    setPieces(prev.pieces)
    setActiveChain(prev.activeChain)
    setSelected(null)
    setLastMove(null)
  }, [thinking, history, clearAnimationTimers])

  const resetGame = useCallback(
    (nextMode = mode, nextVariant = variant, nextHumanColor = humanColor) => {
      clearAnimationTimers()
      const initial = createInitialPosition()
      const nextId = { current: 0 }
      setVariant(nextVariant)
      setPosition(initial)
      setSelected(null)
      setActiveChain(null)
      setWinner(null)
      setThinking(false)
      setLastMove(null)
      setHistory([])
      setPositions([serializePosition(initial)])
      setPieces(piecesFromBoard(initial.board, nextId))
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
    (nextVariant: DamasVariantId) => {
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
    selected,
    inChain: Boolean(activeChain),
    mustCapture,
    winner,
    mode,
    humanColor,
    difficulty,
    variant,
    variantConfig: resolvedVariant,
    thinking,
    lastMove,
    targets,
    movableFrom,
    counts,
    pieces,
    lastPoint: lastMove ? lastMove.to : null,
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
