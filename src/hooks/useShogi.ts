import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  chooseAiMove,
  countPieces,
  createInitialPosition,
  inCheck,
  kingIndex,
  legalMoves,
  materialOf,
  serializePosition,
  winnerOf,
} from '../shogi'
import type { DroppableKind, ShogiMove, ShogiPosition } from '../shogi'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'
import type { BoardPiece } from '../components/shogi/ShogiBoard'

const CAPTURE_MS = 240

type Snapshot = {
  position: ShogiPosition
  winner: Winner
  keys: string[]
  pieces: BoardPiece[]
}

type PendingPromotion = { from: number; to: number }

function piecesFrom(position: ShogiPosition, nextId: { current: number }): BoardPiece[] {
  const pieces: BoardPiece[] = []
  for (let index = 0; index < position.board.length; index += 1) {
    const square = position.board[index]
    if (!square) {
      continue
    }
    pieces.push({
      id: nextId.current,
      index,
      player: square.player,
      kind: square.kind,
      promoted: square.promoted,
    })
    nextId.current += 1
  }
  return pieces
}

export function useShogi() {
  const [position, setPosition] = useState<ShogiPosition>(() => createInitialPosition())
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedDrop, setSelectedDrop] = useState<DroppableKind | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [keys, setKeys] = useState<string[]>(() => [serializePosition(createInitialPosition())])
  const [pieces, setPieces] = useState<BoardPiece[]>(() => piecesFrom(createInitialPosition(), { current: 0 }))
  const [lastFrom, setLastFrom] = useState<number | null>(null)
  const [lastTo, setLastTo] = useState<number | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const keysRef = useRef(keys)
  const piecesRef = useRef(pieces)
  const difficultyRef = useRef(difficulty)
  const animationTimers = useRef<number[]>([])
  const nextIdRef = useRef(pieces.length)
  const playRef = useRef<(move: ShogiMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  keysRef.current = keys
  piecesRef.current = pieces
  difficultyRef.current = difficulty

  const moves = useMemo(() => (winner ? [] : legalMoves(position)), [position, winner])

  const boardTargets = useMemo(() => {
    if (selected === null) {
      return []
    }
    return moves.filter((move) => move.kind === 'move' && move.from === selected).map((move) => move.to)
  }, [moves, selected])

  const dropTargets = useMemo(() => {
    if (!selectedDrop) {
      return []
    }
    return moves.filter((move) => move.kind === 'drop' && move.piece === selectedDrop).map((move) => move.to)
  }, [moves, selectedDrop])

  const targets = selected !== null ? boardTargets : dropTargets

  const droppable = useMemo(() => {
    const kinds = new Set<DroppableKind>()
    for (const move of moves) {
      if (move.kind === 'drop') {
        kinds.add(move.piece)
      }
    }
    return kinds
  }, [moves])

  const checkIndex = inCheck(position.board, position.current) ? kingIndex(position.board, position.current) : null

  const counts = useMemo(
    () => ({
      white: countPieces(position, 'white'),
      black: countPieces(position, 'black'),
    }),
    [position],
  )

  const material = useMemo(
    () => ({
      white: materialOf(position, 'white'),
      black: materialOf(position, 'black'),
    }),
    [position],
  )

  const clearTimers = useCallback(() => {
    for (const timer of animationTimers.current) {
      window.clearTimeout(timer)
    }
    animationTimers.current = []
  }, [])

  const finish = useCallback((next: ShogiPosition) => {
    const key = serializePosition(next)
    const nextKeys = [...keysRef.current, key]
    const repeats = nextKeys.filter((item) => item === key).length
    setKeys(nextKeys)
    const result = winnerOf(next, repeats)
    if (result) {
      setWinner(result)
    }
  }, [])

  const playMove = useCallback(
    (move: ShogiMove) => {
      if (winnerRef.current) {
        return
      }
      setHistory((prev) => [
        ...prev,
        { position: positionRef.current, winner: winnerRef.current, keys: keysRef.current, pieces: piecesRef.current },
      ])

      const player = positionRef.current.current
      const capturedAt = move.kind === 'move' && move.capture ? move.to : null
      const moverId =
        move.kind === 'move' ? piecesRef.current.find((piece) => piece.index === move.from)?.id : undefined

      setPieces((prev) => {
        let next: BoardPiece[]
        if (move.kind === 'drop') {
          const id = nextIdRef.current
          nextIdRef.current += 1
          next = [...prev, { id, index: move.to, player, kind: move.piece, promoted: false }]
        } else {
          next = prev.map((piece) =>
            piece.index === move.from
              ? { ...piece, index: move.to, promoted: move.promote ? true : piece.promoted }
              : piece,
          )
        }
        if (capturedAt === null) {
          return next
        }
        return next.map((piece) =>
          piece.index === capturedAt && piece.id !== moverId ? { ...piece, capturing: true } : piece,
        )
      })

      if (capturedAt !== null) {
        const timer = window.setTimeout(() => {
          setPieces((prev) => prev.filter((piece) => !piece.capturing))
        }, CAPTURE_MS)
        animationTimers.current.push(timer)
      }

      const next = applyMove(positionRef.current, move)
      setPosition(next)
      setSelected(null)
      setSelectedDrop(null)
      setPendingPromotion(null)
      setLastFrom(move.kind === 'move' ? move.from : null)
      setLastTo(move.to)

      if (move.kind === 'move' && move.promote) {
        playSfx('promote')
      } else if (move.kind === 'move' && move.capture) {
        playSfx('kiru')
      } else {
        playSfx('koma')
      }
      if (inCheck(next.board, next.current)) {
        window.setTimeout(() => playSfx('kane'), 110)
      }
      finish(next)
    },
    [finish],
  )

  playRef.current = playMove

  const selectSquare = useCallback(
    (index: number) => {
      if (winner || thinking || pendingPromotion) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
        return
      }

      if (selectedDrop) {
        const drop = moves.find((move) => move.kind === 'drop' && move.piece === selectedDrop && move.to === index)
        if (drop) {
          playMove(drop)
          return
        }
        setSelectedDrop(null)
      }

      if (selected !== null) {
        const options = moves.filter((move) => move.kind === 'move' && move.from === selected && move.to === index)
        if (options.length === 1 && options[0]) {
          playMove(options[0])
          return
        }
        if (options.length > 1) {
          setPendingPromotion({ from: selected, to: index })
          return
        }
      }

      const own = moves.some((move) => move.kind === 'move' && move.from === index)
      setSelected(own ? index : null)
    },
    [winner, thinking, pendingPromotion, mode, humanColor, position, selectedDrop, selected, moves, playMove],
  )

  const selectHandPiece = useCallback(
    (kind: DroppableKind) => {
      if (winner || thinking || pendingPromotion) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
        return
      }
      if (!droppable.has(kind)) {
        return
      }
      setSelected(null)
      setSelectedDrop((prev) => (prev === kind ? null : kind))
    },
    [winner, thinking, pendingPromotion, mode, humanColor, position, droppable],
  )

  const confirmPromotion = useCallback(
    (yes: boolean) => {
      if (!pendingPromotion) {
        return
      }
      const move = moves.find(
        (item) =>
          item.kind === 'move' &&
          item.from === pendingPromotion.from &&
          item.to === pendingPromotion.to &&
          Boolean(item.promote) === yes,
      )
      if (move) {
        playMove(move)
      }
    },
    [pendingPromotion, moves, playMove],
  )

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    clearTimers()
    const prev = history[history.length - 1]
    if (!prev) {
      return
    }
    setHistory((items) => items.slice(0, -1))
    setPosition(prev.position)
    setWinner(prev.winner)
    setKeys(prev.keys)
    setPieces(prev.pieces)
    setSelected(null)
    setSelectedDrop(null)
    setPendingPromotion(null)
    setLastFrom(null)
    setLastTo(null)
  }, [thinking, history, clearTimers])

  const resetGame = useCallback(
    (nextMode = mode, nextHuman = humanColor) => {
      clearTimers()
      const initial = createInitialPosition()
      const nextId = { current: 0 }
      setPosition(initial)
      setSelected(null)
      setSelectedDrop(null)
      setWinner(null)
      setThinking(false)
      setHistory([])
      setKeys([serializePosition(initial)])
      setPieces(piecesFrom(initial, nextId))
      nextIdRef.current = nextId.current
      setLastFrom(null)
      setLastTo(null)
      setPendingPromotion(null)
      setMode(nextMode)
      setHumanColor(nextHuman)
    },
    [mode, humanColor, clearTimers],
  )

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      resetGame(nextMode)
    },
    [resetGame],
  )

  const changeHumanColor = useCallback(
    (nextHuman: Player) => {
      resetGame(mode, nextHuman)
    },
    [resetGame, mode],
  )

  useEffect(() => clearTimers, [clearTimers])

  const cpuTurn = isCpuTurn(mode, position.current, humanColor) && !winner && !pendingPromotion

  useEffect(() => {
    if (!cpuTurn) {
      return
    }
    let cancelled = false
    setThinking(true)
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }
      const action = chooseAiMove(positionRef.current, difficultyRef.current)
      if (action) {
        playRef.current(action)
      }
      setThinking(false)
    }, 380)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setThinking(false)
    }
  }, [cpuTurn, position.current])

  return {
    position,
    current: position.current,
    selected,
    selectedDrop,
    targets,
    droppable,
    pieces,
    lastFrom,
    lastTo,
    checkIndex,
    pendingPromotion,
    winner,
    mode,
    humanColor,
    difficulty,
    thinking,
    counts,
    material,
    flipped: mode === 'cpu' && humanColor === 'black',
    canUndo: history.length > 0 && !thinking,
    selectSquare,
    selectHandPiece,
    confirmPromotion,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
  }
}
