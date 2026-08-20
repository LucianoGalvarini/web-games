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
} from '../ajedrez'
import type { ChessMove, ChessPosition, PieceKind } from '../ajedrez'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'
import type { BoardPiece } from '../components/ajedrez/ChessBoard'

const CAPTURE_MS = 240

type Snapshot = {
  position: ChessPosition
  winner: Winner
  keys: string[]
  pieces: BoardPiece[]
}

function piecesFrom(position: ChessPosition, nextId: { current: number }): BoardPiece[] {
  const pieces: BoardPiece[] = []
  for (let index = 0; index < position.squares.length; index += 1) {
    const square = position.squares[index]
    if (!square) {
      continue
    }
    pieces.push({ id: nextId.current, index, player: square.player, kind: square.kind })
    nextId.current += 1
  }
  return pieces
}

export function useAjedrez() {
  const [position, setPosition] = useState<ChessPosition>(() => createInitialPosition())
  const [selected, setSelected] = useState<number | null>(null)
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
  const [promoting, setPromoting] = useState<{ from: number; to: number; player: Player } | null>(null)

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const keysRef = useRef(keys)
  const piecesRef = useRef(pieces)
  const difficultyRef = useRef(difficulty)
  const animationTimers = useRef<number[]>([])
  const playRef = useRef<(move: ChessMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  keysRef.current = keys
  piecesRef.current = pieces
  difficultyRef.current = difficulty

  const moves = useMemo(() => (winner ? [] : legalMoves(position)), [position, winner])
  const targets = useMemo(
    () => (selected === null ? [] : moves.filter((move) => move.from === selected).map((move) => move.to)),
    [moves, selected],
  )
  const checkIndex = inCheck(position.squares, position.current) ? kingIndex(position.squares, position.current) : null

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

  const finish = useCallback((next: ChessPosition) => {
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
    (move: ChessMove) => {
      if (winnerRef.current) {
        return
      }
      setHistory((prev) => [
        ...prev,
        { position: positionRef.current, winner: winnerRef.current, keys: keysRef.current, pieces: piecesRef.current },
      ])

      const capturedAt = move.enPassant
        ? move.to + (positionRef.current.current === 'white' ? 8 : -8)
        : move.capture
          ? move.to
          : null
      const moverId = piecesRef.current.find((piece) => piece.index === move.from)?.id
      setPieces((prev) => {
        let next = prev.map((piece) =>
          piece.index === move.from ? { ...piece, index: move.to, kind: move.promoteTo ?? piece.kind } : piece,
        )
        if (move.castle === 'king') {
          const rookFrom = move.from === 60 ? 63 : 7
          const rookTo = move.from === 60 ? 61 : 5
          next = next.map((piece) => (piece.index === rookFrom ? { ...piece, index: rookTo } : piece))
        }
        if (move.castle === 'queen') {
          const rookFrom = move.from === 60 ? 56 : 0
          const rookTo = move.from === 60 ? 59 : 3
          next = next.map((piece) => (piece.index === rookFrom ? { ...piece, index: rookTo } : piece))
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
      setPromoting(null)
      setLastFrom(move.from)
      setLastTo(move.to)
      if (move.castle) {
        playSfx('castle')
      } else if (move.promoteTo) {
        playSfx('promote')
      } else if (move.capture || move.enPassant) {
        playSfx('capture')
      } else {
        playSfx('piece')
      }
      if (inCheck(next.squares, next.current)) {
        window.setTimeout(() => playSfx('check'), 90)
      }
      finish(next)
    },
    [finish],
  )

  playRef.current = playMove

  const selectIndex = useCallback(
    (index: number) => {
      if (winner || thinking || promoting) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
        return
      }
      if (selected !== null) {
        const options = moves.filter((move) => move.from === selected && move.to === index)
        if (options.length === 1 && options[0]) {
          playMove(options[0])
          return
        }
        if (options.length > 1) {
          setPromoting({ from: selected, to: index, player: position.current })
          return
        }
      }
      const own = moves.some((move) => move.from === index)
      setSelected(own ? index : null)
    },
    [winner, thinking, promoting, mode, humanColor, position, selected, moves, playMove],
  )

  const promote = useCallback(
    (kind: PieceKind) => {
      if (!promoting) {
        return
      }
      const move = moves.find((item) => item.from === promoting.from && item.to === promoting.to && item.promoteTo === kind)
      if (move) {
        playMove(move)
      }
    },
    [promoting, moves, playMove],
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
    setPromoting(null)
    setLastFrom(null)
    setLastTo(null)
  }, [thinking, history, clearTimers])

  const resetGame = useCallback(
    (nextMode = mode, nextHuman = humanColor) => {
      clearTimers()
      const initial = createInitialPosition()
      setPosition(initial)
      setSelected(null)
      setWinner(null)
      setThinking(false)
      setHistory([])
      setKeys([serializePosition(initial)])
      setPieces(piecesFrom(initial, { current: 0 }))
      setLastFrom(null)
      setLastTo(null)
      setPromoting(null)
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

  const cpuTurn = isCpuTurn(mode, position.current, humanColor) && !winner && !promoting

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
  }, [cpuTurn, position.fullmove, position.current])

  return {
    position,
    current: position.current,
    selected,
    targets,
    pieces,
    lastFrom,
    lastTo,
    checkIndex,
    promoting,
    winner,
    mode,
    humanColor,
    difficulty,
    thinking,
    counts,
    material,
    flipped: mode === 'cpu' && humanColor === 'black',
    canUndo: history.length > 0 && !thinking,
    selectIndex,
    promote,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
  }
}
