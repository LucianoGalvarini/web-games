import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DIFFICULTIES,
  PRESETS,
  applyAction,
  createGame,
  gravityMs,
  grounded,
} from '../tetris'
import type { TetrisAction, TetrisDifficulty, TetrisState } from '../tetris'
import { playSfx } from '../shared/sfx'

const BEST_KEY = 'tetris-best'
const LOCK_MS = 520
const DAS_MS = 170
const ARR_MS = 40

type BestScores = Record<TetrisDifficulty, number | null>

function readBest(): BestScores {
  const empty: BestScores = { easy: null, medium: null, hard: null }
  try {
    const raw = localStorage.getItem(BEST_KEY)
    if (!raw) {
      return empty
    }
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

function writeBest(best: BestScores): void {
  localStorage.setItem(BEST_KEY, JSON.stringify(best))
}

function cueTetris(current: TetrisState, next: TetrisState, action: TetrisAction): void {
  if (next.lines - current.lines >= 4) {
    playSfx('tetris')
    return
  }
  if (next.lines > current.lines) {
    playSfx('line')
    return
  }
  if (action.kind === 'hard') {
    playSfx('drop')
    return
  }
  if ((action.kind === 'cw' || action.kind === 'ccw') && next.active && current.active && next.active.rot !== current.active.rot) {
    playSfx('rotate')
    return
  }
  if (action.kind === 'hold' && next.hold !== current.hold) {
    playSfx('slide')
    return
  }
  if (action.kind === 'tick' && current.active && next.active && next.active.y < current.active.y) {
    playSfx('lock')
  }
}

export function useTetris() {
  const [difficulty, setDifficulty] = useState<TetrisDifficulty>('easy')
  const [state, setState] = useState<TetrisState>(() => createGame(PRESETS.easy.startLevel))
  const [paused, setPaused] = useState(false)
  const [best, setBest] = useState<BestScores>(readBest)

  const stateRef = useRef(state)
  const pausedRef = useRef(paused)
  const difficultyRef = useRef(difficulty)
  stateRef.current = state
  pausedRef.current = paused
  difficultyRef.current = difficulty

  const play = useCallback((action: TetrisAction) => {
    const current = stateRef.current
    if (current.status !== 'playing' || pausedRef.current) {
      return
    }
    const next = applyAction(current, action)
    cueTetris(current, next, action)
    setState(next)
  }, [])

  const resetGame = useCallback((nextDifficulty = difficultyRef.current) => {
    setDifficulty(nextDifficulty)
    setState(createGame(PRESETS[nextDifficulty].startLevel))
    setPaused(false)
  }, [])

  const changeDifficulty = useCallback((next: TetrisDifficulty) => {
    resetGame(next)
  }, [resetGame])

  const togglePause = useCallback(() => {
    if (stateRef.current.status !== 'playing') {
      return
    }
    setPaused((on) => !on)
  }, [])

  useEffect(() => {
    if (state.status !== 'lost') {
      return
    }
    const currentBest = best[difficulty]
    if (currentBest !== null && state.score <= currentBest) {
      return
    }
    const next = { ...best, [difficulty]: state.score }
    setBest(next)
    writeBest(next)
  }, [state.status, state.score, difficulty, best])

  useEffect(() => {
    if (state.status !== 'playing' || paused) {
      return
    }

    let raf = 0
    let last = performance.now()
    let fallAcc = 0
    let lockAcc = 0
    let lockKey = ''

    const loop = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const current = stateRef.current
      if (current.status !== 'playing' || pausedRef.current) {
        raf = requestAnimationFrame(loop)
        return
      }

      if (grounded(current) && current.active) {
        const key = `${current.active.id}-${current.active.x}-${current.active.y}-${current.active.rot}`
        if (key !== lockKey) {
          lockKey = key
          lockAcc = 0
        }
        lockAcc += dt
        fallAcc = 0
        if (lockAcc >= LOCK_MS) {
          lockAcc = 0
          lockKey = ''
          const next = applyAction(current, { kind: 'tick' })
          cueTetris(current, next, { kind: 'tick' })
          setState(next)
        }
      } else {
        lockKey = ''
        lockAcc = 0
        fallAcc += dt
        const interval = gravityMs(current.level)
        if (fallAcc >= interval) {
          fallAcc -= interval
          const next = applyAction(current, { kind: 'tick' })
          cueTetris(current, next, { kind: 'tick' })
          setState(next)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state.status, paused, state.level])

  useEffect(() => {
    const held = { left: false, right: false, soft: false }
    let dasTimer = 0
    let arrTimer = 0
    let direction: 'left' | 'right' | null = null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }
      const key = event.key
      if (key === 'p' || key === 'P' || key === 'Escape') {
        event.preventDefault()
        togglePause()
        return
      }
      if (pausedRef.current || stateRef.current.status !== 'playing') {
        return
      }
      if (key === 'ArrowLeft') {
        event.preventDefault()
        held.left = true
        direction = 'left'
        dasTimer = 0
        arrTimer = 0
        play({ kind: 'left' })
        return
      }
      if (key === 'ArrowRight') {
        event.preventDefault()
        held.right = true
        direction = 'right'
        dasTimer = 0
        arrTimer = 0
        play({ kind: 'right' })
        return
      }
      if (key === 'ArrowDown') {
        event.preventDefault()
        held.soft = true
        play({ kind: 'soft' })
        return
      }
      if (key === 'ArrowUp' || key === 'x' || key === 'X') {
        event.preventDefault()
        play({ kind: 'cw' })
        return
      }
      if (key === 'z' || key === 'Z' || key === 'Control') {
        event.preventDefault()
        play({ kind: 'ccw' })
        return
      }
      if (key === ' ') {
        event.preventDefault()
        play({ kind: 'hard' })
        return
      }
      if (key === 'c' || key === 'C' || key === 'Shift') {
        event.preventDefault()
        play({ kind: 'hold' })
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        held.left = false
        if (direction === 'left') {
          direction = held.right ? 'right' : null
          dasTimer = 0
        }
      }
      if (event.key === 'ArrowRight') {
        held.right = false
        if (direction === 'right') {
          direction = held.left ? 'left' : null
          dasTimer = 0
        }
      }
      if (event.key === 'ArrowDown') {
        held.soft = false
      }
    }

    let raf = 0
    let last = performance.now()
    let softAcc = 0
    const loop = (now: number) => {
      const dt = now - last
      last = now
      if (!pausedRef.current && stateRef.current.status === 'playing') {
        if (direction) {
          dasTimer += dt
          if (dasTimer >= DAS_MS) {
            arrTimer += dt
            if (arrTimer >= ARR_MS) {
              arrTimer = 0
              play({ kind: direction })
            }
          }
        }
        if (held.soft) {
          softAcc += dt
          if (softAcc >= ARR_MS) {
            softAcc = 0
            play({ kind: 'soft' })
          }
        } else {
          softAcc = 0
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [play, togglePause])

  const playing = state.status === 'playing' && !paused

  const statusText = useMemo(() => {
    if (state.status === 'lost') {
      return 'El pozo se llenó. Fin de la partida.'
    }
    if (paused) {
      return 'Pausa. Tocá Pausa o Esc para seguir.'
    }
    if (state.lastClear === 4) {
      return 'Tetris. Cuatro líneas de una.'
    }
    if (state.lastClear === 3) {
      return 'Triple. Tres líneas.'
    }
    if (state.lastClear === 2) {
      return 'Doble. Dos líneas.'
    }
    return 'Izquierda y derecha mueven. Arriba gira. Abajo baja. Espacio tira. C reserva.'
  }, [state.status, state.lastClear, paused])

  return {
    state,
    difficulty,
    paused,
    playing,
    best,
    preset: PRESETS[difficulty],
    difficulties: DIFFICULTIES,
    statusText,
    play,
    resetGame,
    changeDifficulty,
    togglePause,
  }
}
