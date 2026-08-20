import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  chooseAiMove,
  countOnBoard,
  countReserve,
  createInitialPosition,
  harmonyLinks,
  legalMoves,
  serializePosition,
  tileAt,
  winnerOf,
} from '../paisho'
import type { FlowerKind, PaiMove, PaiPosition } from '../paisho'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'

type Snapshot = {
  position: PaiPosition
  winner: Winner
  keys: string[]
}

export function usePaiSho() {
  const [position, setPosition] = useState<PaiPosition>(() => createInitialPosition())
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null)
  const [selectedKind, setSelectedKind] = useState<FlowerKind | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [keys, setKeys] = useState<string[]>(() => [serializePosition(createInitialPosition())])
  const [last, setLast] = useState<{ x: number; y: number } | null>(null)

  const positionRef = useRef(position)
  const winnerRef = useRef(winner)
  const keysRef = useRef(keys)
  const difficultyRef = useRef(difficulty)
  const playRef = useRef<(move: PaiMove) => void>(() => {})

  positionRef.current = position
  winnerRef.current = winner
  keysRef.current = keys
  difficultyRef.current = difficulty

  const moves = useMemo(() => (winner ? [] : legalMoves(position)), [position, winner])
  const links = useMemo(() => {
    const own = harmonyLinks(position.tiles, position.current === 'white' ? 'black' : 'white').concat(
      harmonyLinks(position.tiles, position.current),
    )
    return own.flatMap((link) => {
      const a = position.tiles.find((tile) => tile.id === link.a)
      const b = position.tiles.find((tile) => tile.id === link.b)
      if (!a || !b) {
        return []
      }
      return [{ ax: a.x, ay: a.y, bx: b.x, by: b.y }]
    })
  }, [position])

  const targets = useMemo(() => {
    if (selectedKind) {
      return moves
        .filter((move) => move.kind === 'plant' && move.tile === selectedKind)
        .map((move) => (move.kind === 'plant' ? { x: move.x, y: move.y } : { x: 0, y: 0 }))
    }
    if (!selectedPoint) {
      return []
    }
    return moves
      .filter(
        (move) => move.kind === 'arrange' && move.fromX === selectedPoint.x && move.fromY === selectedPoint.y,
      )
      .map((move) => (move.kind === 'arrange' ? { x: move.toX, y: move.toY } : { x: 0, y: 0 }))
  }, [moves, selectedKind, selectedPoint])

  const counts = useMemo(
    () => ({
      white: countOnBoard(position, 'white'),
      black: countOnBoard(position, 'black'),
    }),
    [position],
  )

  const reserves = useMemo(
    () => ({
      white: countReserve(position, 'white'),
      black: countReserve(position, 'black'),
    }),
    [position],
  )

  const finish = useCallback((next: PaiPosition) => {
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
    (move: PaiMove) => {
      if (winnerRef.current) {
        return
      }
      setHistory((prev) => [...prev, { position: positionRef.current, winner: winnerRef.current, keys: keysRef.current }])
      const before = harmonyLinks(positionRef.current.tiles, positionRef.current.current).length
      const next = applyMove(positionRef.current, move)
      if (move.kind === 'plant') {
        playSfx(move.tile === 'lotus' ? 'promote' : 'stone')
        setLast({ x: move.x, y: move.y })
      } else {
        const captured = tileAt(positionRef.current.tiles, move.toX, move.toY)
        playSfx(captured ? 'capture' : 'slide')
        setLast({ x: move.toX, y: move.toY })
      }
      const after = harmonyLinks(next.tiles, positionRef.current.current).length
      if (after > before) {
        window.setTimeout(() => playSfx('mill'), 80)
      }
      setPosition(next)
      setSelectedPoint(null)
      setSelectedKind(null)
      finish(next)
    },
    [finish],
  )

  playRef.current = playMove

  const selectPoint = useCallback(
    (x: number, y: number) => {
      if (winner || thinking) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
        return
      }
      if (selectedKind) {
        const move = moves.find((item) => item.kind === 'plant' && item.tile === selectedKind && item.x === x && item.y === y)
        if (move) {
          playMove(move)
          return
        }
      }
      if (selectedPoint) {
        const move = moves.find(
          (item) => item.kind === 'arrange' && item.fromX === selectedPoint.x && item.fromY === selectedPoint.y && item.toX === x && item.toY === y,
        )
        if (move) {
          playMove(move)
          return
        }
      }
      const own = moves.some((item) => item.kind === 'arrange' && item.fromX === x && item.fromY === y)
      setSelectedKind(null)
      setSelectedPoint(own ? { x, y } : null)
    },
    [winner, thinking, mode, humanColor, position, selectedKind, selectedPoint, moves, playMove],
  )

  const selectKind = useCallback(
    (kind: FlowerKind) => {
      if (winner || thinking || isCpuTurn(mode, position.current, humanColor)) {
        return
      }
      setSelectedPoint(null)
      setSelectedKind((current) => (current === kind ? null : kind))
    },
    [winner, thinking, mode, humanColor, position],
  )

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    const prev = history[history.length - 1]
    if (!prev) {
      return
    }
    setHistory((items) => items.slice(0, -1))
    setPosition(prev.position)
    setWinner(prev.winner)
    setKeys(prev.keys)
    setSelectedPoint(null)
    setSelectedKind(null)
    setLast(null)
  }, [thinking, history])

  const resetGame = useCallback(
    (nextMode = mode, nextHuman = humanColor) => {
      const initial = createInitialPosition()
      setPosition(initial)
      setSelectedPoint(null)
      setSelectedKind(null)
      setWinner(null)
      setThinking(false)
      setHistory([])
      setKeys([serializePosition(initial)])
      setLast(null)
      setMode(nextMode)
      setHumanColor(nextHuman)
    },
    [mode, humanColor],
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

  const cpuTurn = isCpuTurn(mode, position.current, humanColor) && !winner

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
  }, [cpuTurn, position.nextId, position.current])

  return {
    position,
    current: position.current,
    selectedPoint,
    selectedKind,
    targets,
    links,
    last,
    winner,
    mode,
    humanColor,
    difficulty,
    thinking,
    counts,
    reserves,
    canUndo: history.length > 0 && !thinking,
    selectPoint,
    selectKind,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
  }
}
