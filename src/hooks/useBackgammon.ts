import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  chooseAiTurn,
  createInitialPosition,
  generateTurns,
  opponentOf,
  winnerOf,
} from '../backgammon'
import type { BackgammonMove, BackgammonPosition, BackgammonTurn } from '../backgammon'
import { isCpuTurn } from '../shared/player'
import { playSfx } from '../shared/sfx'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'

export type PieceLocation = number | 'bar' | 'off'

export type BackgammonPiece = {
  id: number
  player: Player
  location: PieceLocation
}

type Snapshot = {
  position: BackgammonPosition
  dice: number[] | null
  optionsRemaining: BackgammonTurn[]
  pieces: BackgammonPiece[]
  winner: Winner
}

function initialPieces(position: BackgammonPosition): BackgammonPiece[] {
  const pieces: BackgammonPiece[] = []
  let id = 0
  position.points.forEach((square, index) => {
    if (!square) {
      return
    }
    for (let i = 0; i < square.count; i += 1) {
      pieces.push({ id: id++, player: square.player, location: index })
    }
  })
  return pieces
}

function movePiece(
  pieces: BackgammonPiece[],
  predicate: (piece: BackgammonPiece) => boolean,
  location: PieceLocation,
): BackgammonPiece[] {
  const index = pieces.findIndex(predicate)
  if (index === -1) {
    return pieces
  }
  const next = [...pieces]
  next[index] = { ...next[index], location }
  return next
}

function applyMoveToPieces(
  pieces: BackgammonPiece[],
  before: BackgammonPosition,
  move: BackgammonMove,
  player: Player,
  enemy: Player,
): BackgammonPiece[] {
  let result = pieces
  if (move.kind !== 'bearoff') {
    const destSquare = before.points[move.to]
    if (destSquare && destSquare.player === enemy && destSquare.count === 1) {
      result = movePiece(result, (p) => p.player === enemy && p.location === move.to, 'bar')
    }
  }
  if (move.kind === 'enter') {
    result = movePiece(result, (p) => p.player === player && p.location === 'bar', move.to)
  } else if (move.kind === 'move') {
    result = movePiece(result, (p) => p.player === player && p.location === move.from, move.to)
  } else {
    result = movePiece(result, (p) => p.player === player && p.location === move.from, 'off')
  }
  return result
}

function matchesFrom(move: BackgammonMove, point: number | 'bar'): boolean {
  return move.kind === 'enter' ? point === 'bar' : move.from === point
}

function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function useBackgammon() {
  const [position, setPosition] = useState<BackgammonPosition>(() => createInitialPosition())
  const [dice, setDice] = useState<number[] | null>(null)
  const [optionsRemaining, setOptionsRemaining] = useState<BackgammonTurn[]>([])
  const [selected, setSelected] = useState<number | 'bar' | null>(null)
  const [lastMove, setLastMove] = useState<BackgammonMove | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [thinking, setThinking] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [pieces, setPieces] = useState<BackgammonPiece[]>(() => initialPieces(createInitialPosition()))

  const positionRef = useRef(position)
  const diceRef = useRef(dice)
  const optionsRef = useRef(optionsRemaining)
  const piecesRef = useRef(pieces)
  const winnerRef = useRef(winner)
  const difficultyRef = useRef(difficulty)
  const commitMoveRef = useRef<(move: BackgammonMove) => void>(() => {})

  positionRef.current = position
  diceRef.current = dice
  optionsRef.current = optionsRemaining
  piecesRef.current = pieces
  winnerRef.current = winner
  difficultyRef.current = difficulty

  const commitMove = useCallback((move: BackgammonMove) => {
    const before = positionRef.current
    const player = before.current
    const enemy = opponentOf(player)
    const hit =
      move.kind !== 'bearoff' &&
      (() => {
        const square = before.points[move.to]
        return Boolean(square && square.player === enemy && square.count === 1)
      })()

    const afterMove = applyMove(before, move)
    const newPieces = applyMoveToPieces(piecesRef.current, before, move, player, enemy)

    const remaining = optionsRef.current
      .filter((seq) => seq.length > 0 && matchesMove(seq[0], move))
      .map((seq) => seq.slice(1))
    const turnDone = remaining.every((seq) => seq.length === 0)
    const result = turnDone ? winnerOf(afterMove) : null
    const finalPosition = turnDone && !result ? { ...afterMove, current: opponentOf(afterMove.current) } : afterMove

    setHistory((prev) => [
      ...prev,
      {
        position: before,
        dice: diceRef.current,
        optionsRemaining: optionsRef.current,
        pieces: piecesRef.current,
        winner: winnerRef.current,
      },
    ])

    setPosition(finalPosition)
    setPieces(newPieces)
    setLastMove(move)
    setSelected(null)

    if (turnDone) {
      setOptionsRemaining([])
      setDice(null)
      if (result) {
        setWinner(result)
      }
    } else {
      setOptionsRemaining(remaining)
    }

    if (!result) {
      playSfx(hit ? 'capture' : move.kind === 'bearoff' ? 'promote' : 'click')
    }
  }, [])

  commitMoveRef.current = commitMove

  const rollDice = useCallback(() => {
    if (winnerRef.current || diceRef.current) {
      return
    }
    if (isCpuTurn(mode, positionRef.current.current, humanColor)) {
      return
    }
    const next = [rollDie(), rollDie()]
    const turns = generateTurns(positionRef.current, next)
    setDice(next)
    setOptionsRemaining(turns)
    setSelected(null)
    playSfx('dice')

    if (turns.every((turn) => turn.length === 0)) {
      window.setTimeout(() => {
        setPosition((prev) => ({ ...prev, current: opponentOf(prev.current) }))
        setDice(null)
        setOptionsRemaining([])
      }, 900)
    }
  }, [mode, humanColor])

  const selectPoint = useCallback(
    (point: number | 'bar') => {
      if (winner || thinking || !dice) {
        return
      }
      if (isCpuTurn(mode, position.current, humanColor)) {
        return
      }
      const matches = optionsRemaining.some((seq) => seq.length > 0 && matchesFrom(seq[0], point))
      setSelected(matches ? point : null)
    },
    [winner, thinking, dice, mode, position, humanColor, optionsRemaining],
  )

  const playTarget = useCallback(
    (to: number | 'off') => {
      if (selected === null) {
        return
      }
      const move = optionsRemaining
        .map((seq) => seq[0])
        .find(
          (candidate) =>
            candidate &&
            matchesFrom(candidate, selected) &&
            (candidate.kind === 'bearoff' ? to === 'off' : candidate.to === to),
        )
      if (move) {
        commitMove(move)
      }
    },
    [selected, optionsRemaining, commitMove],
  )

  const movableFrom = useMemo(() => {
    const points: (number | 'bar')[] = []
    for (const seq of optionsRemaining) {
      const first = seq[0]
      if (!first) {
        continue
      }
      const from = first.kind === 'enter' ? 'bar' : first.from
      if (!points.includes(from)) {
        points.push(from)
      }
    }
    return points
  }, [optionsRemaining])

  const targets = useMemo(() => {
    if (selected === null) {
      return [] as (number | 'off')[]
    }
    const set = new Set<number | 'off'>()
    for (const seq of optionsRemaining) {
      const first = seq[0]
      if (first && matchesFrom(first, selected)) {
        set.add(first.kind === 'bearoff' ? 'off' : first.to)
      }
    }
    return [...set]
  }, [optionsRemaining, selected])

  const undo = useCallback(() => {
    if (thinking || history.length === 0) {
      return
    }
    const prev = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setPosition(prev.position)
    setDice(prev.dice)
    setOptionsRemaining(prev.optionsRemaining)
    setPieces(prev.pieces)
    setWinner(prev.winner)
    setSelected(null)
    setLastMove(null)
  }, [thinking, history])

  const resetGame = useCallback(
    (nextMode = mode, nextHumanColor = humanColor) => {
      const initial = createInitialPosition()
      setPosition(initial)
      setPieces(initialPieces(initial))
      setDice(null)
      setOptionsRemaining([])
      setSelected(null)
      setLastMove(null)
      setWinner(null)
      setThinking(false)
      setHistory([])
      setMode(nextMode)
      setHumanColor(nextHumanColor)
    },
    [mode, humanColor],
  )

  const changeMode = useCallback((nextMode: GameMode) => resetGame(nextMode), [resetGame])
  const changeHumanColor = useCallback((color: Player) => resetGame(mode, color), [resetGame, mode])

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
        const roll = [rollDie(), rollDie()]
        const turns = generateTurns(positionRef.current, roll)
        setDice(roll)
        setOptionsRemaining(turns)
        playSfx('dice')

        const turn = chooseAiTurn(positionRef.current, roll, difficultyRef.current)
        if (turn.length === 0) {
          timers.push(
            window.setTimeout(() => {
              if (cancelled) {
                return
              }
              setPosition((prev) => ({ ...prev, current: opponentOf(prev.current) }))
              setDice(null)
              setOptionsRemaining([])
              setThinking(false)
            }, 700),
          )
          return
        }

        let index = 0
        const playNext = () => {
          if (cancelled) {
            return
          }
          commitMoveRef.current(turn[index])
          index += 1
          if (index >= turn.length) {
            setThinking(false)
            return
          }
          timers.push(window.setTimeout(playNext, 420))
        }
        timers.push(window.setTimeout(playNext, 380))
      }, 550),
    )

    return () => {
      cancelled = true
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
      setThinking(false)
    }
  }, [aiTurnActive])

  const diceTotal = dice ? (dice[0] === dice[1] ? 4 : 2) : 0
  const movesLeft = optionsRemaining.reduce((max, seq) => Math.max(max, seq.length), 0)

  return {
    position,
    current: position.current,
    dice,
    diceTotal,
    movesLeft,
    selected,
    targets,
    movableFrom,
    lastMove,
    winner,
    mode,
    humanColor,
    difficulty,
    thinking,
    pieces,
    canRoll: !dice && !winner && !thinking && !isCpuTurn(mode, position.current, humanColor),
    canUndo: history.length > 0 && !thinking,
    rollDice,
    selectPoint,
    playTarget,
    undo,
    resetGame,
    changeMode,
    changeHumanColor,
    setDifficulty,
  }
}

function matchesMove(a: BackgammonMove, b: BackgammonMove): boolean {
  if (a.kind !== b.kind || a.die !== b.die) {
    return false
  }
  if (a.kind === 'enter' && b.kind === 'enter') {
    return a.to === b.to
  }
  if (a.kind === 'move' && b.kind === 'move') {
    return a.from === b.from && a.to === b.to
  }
  if (a.kind === 'bearoff' && b.kind === 'bearoff') {
    return a.from === b.from
  }
  return false
}
