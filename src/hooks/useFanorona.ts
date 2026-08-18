import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyChainStep,
  applyMove,
  chooseAiTurn,
  countPieces,
  createInitialBoard,
  isCaptureMove,
  legalMoves,
  opponent,
  samePoint,
  serializePosition,
  startChain,
} from '../game'
import type { Board, ChainState, Difficulty, GameMode, Move, Player, Point, Winner } from '../game'
import { isCpuTurn } from '../shared/player'

type Snapshot = {
  board: Board
  current: Player
  chain: ChainState | null
  winner: Winner
  positions: string[]
}

export function useFanorona() {
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [current, setCurrent] = useState<Player>('white')
  const [chain, setChain] = useState<ChainState | null>(null)
  const [selected, setSelected] = useState<Point | null>(null)
  const [pendingChoice, setPendingChoice] = useState<Move[] | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [hoverTarget, setHoverTarget] = useState<Point | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [positions, setPositions] = useState<string[]>(() => [
    serializePosition(createInitialBoard(), 'white'),
  ])

  const boardRef = useRef(board)
  const currentRef = useRef(current)
  const chainRef = useRef(chain)
  const winnerRef = useRef(winner)
  const positionsRef = useRef(positions)
  const difficultyRef = useRef(difficulty)
  const playMoveRef = useRef<(move: Move, options?: { endTurn?: boolean }) => void>(() => {})

  boardRef.current = board
  currentRef.current = current
  chainRef.current = chain
  winnerRef.current = winner
  positionsRef.current = positions
  difficultyRef.current = difficulty

  const moves = useMemo(() => legalMoves(board, current, chain), [board, current, chain])
  const mustCapture = useMemo(() => moves.some(isCaptureMove), [moves])

  const selectedMoves = useMemo(() => {
    if (pendingChoice) {
      return pendingChoice
    }
    if (!selected) {
      return []
    }
    return moves.filter((move) => samePoint(move.from, selected))
  }, [moves, selected, pendingChoice])

  const targets = useMemo(() => {
    const unique: Point[] = []
    for (const move of selectedMoves) {
      if (!unique.some((point) => samePoint(point, move.to))) {
        unique.push(move.to)
      }
    }
    return unique
  }, [selectedMoves])

  const hoverCaptures = useMemo(() => {
    if (!hoverTarget) {
      return []
    }
    return selectedMoves
      .filter((move) => samePoint(move.to, hoverTarget))
      .flatMap((move) => move.captured)
  }, [hoverTarget, selectedMoves])

  const choiceCaptures = useMemo(() => {
    if (!pendingChoice) {
      return []
    }
    return pendingChoice.flatMap((move) => move.captured)
  }, [pendingChoice])

  const counts = useMemo(
    () => ({
      white: countPieces(board, 'white'),
      black: countPieces(board, 'black'),
    }),
    [board],
  )

  const movableFrom = useMemo(() => {
    const points: Point[] = []
    for (const move of moves) {
      if (!points.some((point) => samePoint(point, move.from))) {
        points.push(move.from)
      }
    }
    return points
  }, [moves])

  const finishTurn = useCallback((nextBoard: Board, player: Player) => {
    const enemy = opponent(player)
    if (countPieces(nextBoard, enemy) === 0) {
      setWinner(player)
      setChain(null)
      setSelected(null)
      return
    }

    const nextPlayer = enemy
    const nextMoves = legalMoves(nextBoard, nextPlayer, null)
    if (nextMoves.length === 0) {
      setWinner(player)
      setChain(null)
      setSelected(null)
      return
    }

    const key = serializePosition(nextBoard, nextPlayer)
    const nextPositions = [...positionsRef.current, key]
    const repeats = nextPositions.filter((item) => item === key).length
    setPositions(nextPositions)
    if (repeats >= 3) {
      setWinner('draw')
    }

    setChain(null)
    setSelected(null)
    setCurrent(nextPlayer)
  }, [])

  const playMove = useCallback((move: Move, options?: { endTurn?: boolean }) => {
    if (winnerRef.current) {
      return
    }

    setHistory((prev) => [
      ...prev,
      {
        board: boardRef.current,
        current: currentRef.current,
        chain: chainRef.current,
        winner: winnerRef.current,
        positions: positionsRef.current,
      },
    ])

    const nextBoard = applyMove(boardRef.current, move)
    setBoard(nextBoard)
    setLastMove(move)
    setPendingChoice(null)
    setHoverTarget(null)

    const player = currentRef.current
    const enemy = opponent(player)
    if (countPieces(nextBoard, enemy) === 0) {
      setWinner(player)
      setChain(null)
      setSelected(null)
      return
    }

    if (!isCaptureMove(move) || options?.endTurn) {
      finishTurn(nextBoard, player)
      return
    }

    const nextChain = chainRef.current ? applyChainStep(chainRef.current, move) : startChain(move)
    const continuations = legalMoves(nextBoard, player, nextChain)

    if (continuations.length === 0) {
      finishTurn(nextBoard, player)
      return
    }

    setChain(nextChain)
    setSelected(nextChain.current)
  }, [finishTurn])

  playMoveRef.current = playMove

  const selectPoint = useCallback(
    (point: Point) => {
      if (winner || thinking) {
        return
      }
      if (isCpuTurn(mode, current, humanColor)) {
        return
      }
      if (pendingChoice) {
        return
      }

      if (selected) {
        const toMoves = selectedMoves.filter((move) => samePoint(move.to, point))
        if (toMoves.length === 1) {
          playMove(toMoves[0])
          return
        }
        if (toMoves.length > 1) {
          setPendingChoice(toMoves)
          return
        }
      }

      if (chain) {
        return
      }

      const pieceMoves = moves.filter((move) => samePoint(move.from, point))
      if (pieceMoves.length > 0) {
        setSelected(point)
        return
      }

      setSelected(null)
    },
    [winner, thinking, mode, current, humanColor, pendingChoice, selected, selectedMoves, chain, moves, playMove],
  )

  const chooseCapture = useCallback(
    (move: Move) => {
      playMove(move)
    },
    [playMove],
  )

  const cancelChoice = useCallback(() => {
    if (chain) {
      return
    }
    setPendingChoice(null)
  }, [chain])

  const endTurn = useCallback(() => {
    if (!chain || thinking || winner) {
      return
    }
    setHistory((prev) => [
      ...prev,
      {
        board: boardRef.current,
        current: currentRef.current,
        chain: chainRef.current,
        winner: winnerRef.current,
        positions: positionsRef.current,
      },
    ])
    finishTurn(board, current)
    setLastMove(null)
  }, [chain, thinking, winner, finishTurn, board, current])

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    const prev = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setBoard(prev.board)
    setCurrent(prev.current)
    setChain(prev.chain)
    setWinner(prev.winner)
    setPositions(prev.positions)
    setSelected(prev.chain ? prev.chain.current : null)
    setPendingChoice(null)
    setLastMove(null)
    setHoverTarget(null)
  }, [thinking, history])

  const resetGame = useCallback((nextMode = mode, nextHumanColor = humanColor) => {
    const initial = createInitialBoard()
    setBoard(initial)
    setCurrent('white')
    setChain(null)
    setSelected(null)
    setPendingChoice(null)
    setWinner(null)
    setThinking(false)
    setHoverTarget(null)
    setLastMove(null)
    setHistory([])
    setPositions([serializePosition(initial, 'white')])
    setMode(nextMode)
    setHumanColor(nextHumanColor)
  }, [mode, humanColor])

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      resetGame(nextMode)
    },
    [resetGame],
  )

  const changeHumanColor = useCallback(
    (nextHumanColor: Player) => {
      resetGame(mode, nextHumanColor)
    },
    [resetGame, mode],
  )

  const aiTurnActive = isCpuTurn(mode, current, humanColor) && !winner

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

        const turn = chooseAiTurn(boardRef.current, currentRef.current, difficultyRef.current)
        if (turn.length === 0) {
          setThinking(false)
          return
        }

        let index = 0
        const playNext = () => {
          if (cancelled) {
            return
          }
          playMoveRef.current(turn[index], { endTurn: index === turn.length - 1 })
          index += 1
          if (index >= turn.length) {
            setThinking(false)
            return
          }
          timers.push(window.setTimeout(playNext, 460))
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
    board,
    current,
    chain,
    selected,
    pendingChoice,
    winner,
    mode,
    humanColor,
    difficulty,
    thinking,
    hoverTarget,
    lastMove,
    moves,
    mustCapture,
    targets,
    hoverCaptures,
    choiceCaptures,
    counts,
    movableFrom,
    canEndTurn: Boolean(chain) && !thinking && !winner,
    canUndo: history.length > 0 && !thinking,
    selectPoint,
    chooseCapture,
    cancelChoice,
    endTurn,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
    setHoverTarget,
  }
}
