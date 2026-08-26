import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  capturedBy,
  chooseAiMove,
  countPieces,
  createInitialPosition,
  inCheck,
  kingIndex,
  legalMoves,
  moveSan,
  pawnAdvantage,
  pgnOf,
  resultOf,
  serializePosition,
} from '../ajedrez'
import type { ChessEndReason, ChessMove, ChessPosition, PieceKind } from '../ajedrez'
import { isCpuTurn, playerLabel } from '../shared/player'
import { playSfx } from '../shared/sfx'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'
import type { BoardPiece } from '../components/ajedrez/ChessBoard'

const CAPTURE_MS = 240

export type ChessLogEntry = {
  san: string
  sanEn: string
}

type Snapshot = {
  position: ChessPosition
  winner: Winner
  endReason: ChessEndReason | null
  keys: string[]
  pieces: BoardPiece[]
  lastFrom: number | null
  lastTo: number | null
  log: ChessLogEntry[]
  announce: string
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

function restoreSnapshot(snapshot: Snapshot, apply: {
  setPosition: (value: ChessPosition) => void
  setWinner: (value: Winner) => void
  setEndReason: (value: ChessEndReason | null) => void
  setKeys: (value: string[]) => void
  setPieces: (value: BoardPiece[]) => void
  setLastFrom: (value: number | null) => void
  setLastTo: (value: number | null) => void
  setLog: (value: ChessLogEntry[]) => void
  setAnnounce: (value: string) => void
}): void {
  apply.setPosition(snapshot.position)
  apply.setWinner(snapshot.winner)
  apply.setEndReason(snapshot.endReason)
  apply.setKeys(snapshot.keys)
  apply.setPieces(snapshot.pieces)
  apply.setLastFrom(snapshot.lastFrom)
  apply.setLastTo(snapshot.lastTo)
  apply.setLog(snapshot.log)
  apply.setAnnounce(snapshot.announce)
}

export function useAjedrez() {
  const [position, setPosition] = useState<ChessPosition>(() => createInitialPosition())
  const [selected, setSelected] = useState<number | null>(null)
  const [cursor, setCursor] = useState(52)
  const [winner, setWinner] = useState<Winner>(null)
  const [endReason, setEndReason] = useState<ChessEndReason | null>(null)
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
  const [log, setLog] = useState<ChessLogEntry[]>([])
  const [announce, setAnnounce] = useState('')

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const endReasonRef = useRef(endReason)
  const keysRef = useRef(keys)
  const piecesRef = useRef(pieces)
  const difficultyRef = useRef(difficulty)
  const lastFromRef = useRef(lastFrom)
  const lastToRef = useRef(lastTo)
  const logRef = useRef(log)
  const announceRef = useRef(announce)
  const animationTimers = useRef<number[]>([])
  const playRef = useRef<(move: ChessMove) => void>(() => {})
  const workerRef = useRef<Worker | null>(null)

  positionRef.current = position
  winnerRef.current = winner
  endReasonRef.current = endReason
  keysRef.current = keys
  piecesRef.current = pieces
  difficultyRef.current = difficulty
  lastFromRef.current = lastFrom
  lastToRef.current = lastTo
  logRef.current = log
  announceRef.current = announce

  const moves = useMemo(() => (winner ? [] : legalMoves(position)), [position, winner])
  const selectedMoves = useMemo(
    () => (selected === null ? [] : moves.filter((move) => move.from === selected)),
    [moves, selected],
  )
  const targets = useMemo(
    () => selectedMoves.filter((move) => !move.capture).map((move) => move.to),
    [selectedMoves],
  )
  const captures = useMemo(
    () => selectedMoves.filter((move) => move.capture).map((move) => move.to),
    [selectedMoves],
  )
  const checkIndex = inCheck(position.squares, position.current) ? kingIndex(position.squares, position.current) : null

  const counts = useMemo(
    () => ({
      white: countPieces(position, 'white'),
      black: countPieces(position, 'black'),
    }),
    [position],
  )

  const captured = useMemo(
    () => ({
      white: capturedBy(position, 'white'),
      black: capturedBy(position, 'black'),
    }),
    [position],
  )

  const advantage = useMemo(
    () => ({
      white: pawnAdvantage(position, 'white'),
      black: pawnAdvantage(position, 'black'),
    }),
    [position],
  )

  const pgn = useMemo(() => {
    const whiteName = mode === 'cpu' && humanColor === 'black' ? 'Computadora' : playerLabel('white')
    const blackName = mode === 'cpu' && humanColor === 'white' ? 'Computadora' : playerLabel('black')
    return pgnOf(
      log.map((entry) => entry.sanEn),
      winner,
      {
        Event: 'Partida informal',
        Site: 'web-games',
        White: whiteName,
        Black: blackName,
        Result: winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : winner === 'draw' ? '1/2-1/2' : '*',
      },
    )
  }, [log, winner, mode, humanColor])

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
    const result = resultOf(next, repeats)
    setEndReason(result.reason)
    if (result.winner) {
      setWinner(result.winner)
    }
  }, [])

  const playMove = useCallback(
    (move: ChessMove) => {
      if (winnerRef.current) {
        return
      }
      setHistory((prev) => [
        ...prev,
        {
          position: positionRef.current,
          winner: winnerRef.current,
          endReason: endReasonRef.current,
          keys: keysRef.current,
          pieces: piecesRef.current,
          lastFrom: lastFromRef.current,
          lastTo: lastToRef.current,
          log: logRef.current,
          announce: announceRef.current,
        },
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

      const san = moveSan(positionRef.current, move, 'es')
      const sanEn = moveSan(positionRef.current, move, 'en')
      const next = applyMove(positionRef.current, move)
      const checked = inCheck(next.squares, next.current)
      setLog((prev) => [...prev, { san, sanEn }])
      setAnnounce(checked ? `${san}. Jaque.` : san)
      setPosition(next)
      setSelected(null)
      setPromoting(null)
      setLastFrom(move.from)
      setLastTo(move.to)
      setCursor(move.to)
      if (move.castle) {
        playSfx('castle')
      } else if (move.promoteTo) {
        playSfx('promote')
      } else if (move.capture || move.enPassant) {
        playSfx('capture')
      } else {
        playSfx('piece')
      }
      if (checked) {
        window.setTimeout(() => playSfx('check'), 90)
      }
      finish(next)
    },
    [finish],
  )

  playRef.current = playMove

  const cancelPromote = useCallback(() => {
    setPromoting(null)
  }, [])

  const clearSelection = useCallback(() => {
    setPromoting(null)
    setSelected(null)
  }, [])

  const selectIndex = useCallback(
    (index: number) => {
      if (winner || thinking) {
        return
      }
      if (promoting) {
        if (index === promoting.from) {
          cancelPromote()
        }
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
        if (index === selected) {
          setSelected(null)
          setCursor(index)
          return
        }
      }
      const own = moves.some((move) => move.from === index)
      setSelected(own ? index : null)
      setCursor(index)
    },
    [winner, thinking, promoting, mode, humanColor, position, selected, moves, playMove, cancelPromote],
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
    const last = history[history.length - 1]
    if (!last) {
      return
    }
    const undoPair = mode === 'cpu' && isCpuTurn(mode, last.position.current, humanColor) && history.length >= 2
    const steps = undoPair ? 2 : 1
    const prev = history[history.length - steps]
    if (!prev) {
      return
    }
    setHistory((items) => items.slice(0, -steps))
    restoreSnapshot(prev, {
      setPosition,
      setWinner,
      setEndReason,
      setKeys,
      setPieces,
      setLastFrom,
      setLastTo,
      setLog,
      setAnnounce,
    })
    setSelected(null)
    setPromoting(null)
  }, [thinking, history, clearTimers, mode, humanColor])

  const resetGame = useCallback(
    (nextMode = mode, nextHuman = humanColor) => {
      clearTimers()
      const initial = createInitialPosition()
      setPosition(initial)
      setSelected(null)
      setCursor(nextMode === 'cpu' && nextHuman === 'black' ? 12 : 52)
      setWinner(null)
      setEndReason(null)
      setThinking(false)
      setHistory([])
      setKeys([serializePosition(initial)])
      setPieces(piecesFrom(initial, { current: 0 }))
      setLastFrom(null)
      setLastTo(null)
      setPromoting(null)
      setLog([])
      setAnnounce('')
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

  const copyPgn = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pgn)
    } catch {
      // ignore
    }
  }, [pgn])

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => {
    const worker = new Worker(new URL('../ajedrez/ai.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const cpuTurn = isCpuTurn(mode, position.current, humanColor) && !winner && !promoting

  useEffect(() => {
    if (!cpuTurn) {
      return
    }
    let cancelled = false
    const worker = workerRef.current
    const onMsg = (event: MessageEvent<ChessMove | null>) => {
      worker?.removeEventListener('message', onMsg)
      if (cancelled) {
        return
      }
      if (event.data) {
        playRef.current(event.data)
      }
      setThinking(false)
    }
    setThinking(true)
    const delay = difficultyRef.current === 'perfect' ? 80 : 380
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }
      const currentDifficulty = difficultyRef.current
      if (currentDifficulty === 'perfect' && worker) {
        worker.addEventListener('message', onMsg)
        worker.postMessage({ position: positionRef.current, difficulty: currentDifficulty })
        return
      }
      const action = chooseAiMove(positionRef.current, currentDifficulty)
      if (action) {
        playRef.current(action)
      }
      setThinking(false)
    }, delay)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      worker?.removeEventListener('message', onMsg)
      setThinking(false)
    }
  }, [cpuTurn, position.fullmove, position.current])

  return {
    position,
    current: position.current,
    selected,
    cursor,
    setCursor,
    targets,
    captures,
    pieces,
    lastFrom,
    lastTo,
    checkIndex,
    promoting,
    winner,
    endReason,
    mode,
    humanColor,
    difficulty,
    thinking,
    counts,
    captured,
    advantage,
    log,
    pgn,
    announce,
    flipped: mode === 'cpu' && humanColor === 'black',
    canUndo: history.length > 0 && !thinking,
    selectIndex,
    clearSelection,
    promote,
    cancelPromote,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
    copyPgn,
  }
}
