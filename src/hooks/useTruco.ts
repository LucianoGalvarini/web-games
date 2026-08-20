import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isCpuTurn, opponent } from '../shared/player'
import type { Difficulty, GameMode, Player } from '../shared/types'
import {
  actorOf,
  applyAction,
  chooseAiAction,
  createMatch,
  legalActions,
  nextHand,
  seatLabel,
} from '../truco'
import type { Card, TrucoAction, TrucoState } from '../truco'

type Snapshot = {
  state: TrucoState
}

export function useTruco() {
  const [mode, setMode] = useState<GameMode>('cpu')
  const [humanColor, setHumanColor] = useState<Player>('white')
  const [humanStartsMano, setHumanStartsMano] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [state, setState] = useState<TrucoState>(() => createMatch(Math.random, 'white'))
  const [thinking, setThinking] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])

  const stateRef = useRef(state)
  const difficultyRef = useRef(difficulty)
  stateRef.current = state
  difficultyRef.current = difficulty

  const actor = actorOf(state)
  const viewing: Player = mode === 'cpu' ? humanColor : (actor ?? 'white')
  const cpuTurn =
    actor !== null && isCpuTurn(mode, actor, humanColor) && !state.matchWinner && !state.handWinner

  const actions = useMemo(() => {
    if (!actor || thinking || cpuTurn) {
      return []
    }
    if (mode === 'cpu' && actor !== humanColor) {
      return []
    }
    return legalActions(state, actor)
  }, [actor, thinking, cpuTurn, mode, humanColor, state])

  const play = useCallback((action: TrucoAction) => {
    const current = stateRef.current
    const who = actorOf(current)
    if (!who || current.handWinner || current.matchWinner) {
      return
    }
    setHistory((prev) => [...prev, { state: current }])
    setState(applyAction(current, who, action))
  }, [])

  const playCard = useCallback(
    (card: Card) => {
      play({ kind: 'play', card })
    },
    [play],
  )

  const resetGame = useCallback(
    (nextMode = mode, nextHuman = humanColor, startsMano = humanStartsMano) => {
      const mano = nextMode === 'cpu' && !startsMano ? opponent(nextHuman) : nextMode === 'cpu' ? nextHuman : 'white'
      setState(createMatch(Math.random, mano))
      setHistory([])
      setThinking(false)
      setMode(nextMode)
      setHumanColor(nextHuman)
      setHumanStartsMano(startsMano)
    },
    [mode, humanColor, humanStartsMano],
  )

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      resetGame(nextMode)
    },
    [resetGame],
  )

  const changeStartsMano = useCallback(
    (startsMano: boolean) => {
      resetGame(mode, humanColor, startsMano)
    },
    [resetGame, mode, humanColor],
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
    setState(prev.state)
  }, [thinking, history])

  useEffect(() => {
    if (!cpuTurn) {
      return
    }
    let cancelled = false
    const waitingCall = Boolean(stateRef.current.envidoPending || stateRef.current.trucoPending)
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }
      const current = stateRef.current
      const who = actorOf(current)
      if (!who) {
        setThinking(false)
        return
      }
      const action = chooseAiAction(current, who, difficultyRef.current)
      if (!action) {
        setThinking(false)
        return
      }
      setHistory((prev) => [...prev, { state: current }])
      setState(applyAction(current, who, action))
      setThinking(false)
    }, waitingCall ? 920 : 680)
    setThinking(true)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setThinking(false)
    }
  }, [cpuTurn, state.log.length])

  useEffect(() => {
    if (!state.handWinner || state.matchWinner) {
      return
    }
    const timer = window.setTimeout(() => {
      setState((current) => nextHand(current))
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [state.handWinner, state.matchWinner, state.mano, state.scores.white, state.scores.black])

  const nameOf = useCallback(
    (player: Player) => seatLabel(player, mode, humanColor),
    [mode, humanColor],
  )

  return {
    state,
    mode,
    humanColor,
    humanStartsMano,
    difficulty,
    thinking,
    actor,
    viewing,
    actions,
    nameOf,
    play,
    playCard,
    undo,
    resetGame,
    changeMode,
    changeStartsMano,
    setDifficulty,
    canUndo: history.length > 0 && !thinking,
    canAct: Boolean(actor) && !thinking && !cpuTurn && actions.length > 0,
  }
}
