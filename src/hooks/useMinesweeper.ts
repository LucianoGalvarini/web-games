import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PRESETS,
  chord,
  cloneBoard,
  countFlags,
  createEmptyBoard,
  findHint,
  flagRemainingMines,
  floodReveal,
  isWon,
  neighborhood,
  placeMines,
  revealMines,
} from '../minesweeper'
import type { Hint, MinesweeperDifficulty, MinesweeperStatus, MsBoard, MsPoint } from '../minesweeper'

const BEST_KEY = 'minesweeper-best'

type BestTimes = Record<MinesweeperDifficulty, number | null>

function readBest(): BestTimes {
  const empty: BestTimes = { beginner: null, intermediate: null, expert: null }
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

function writeBest(best: BestTimes): void {
  localStorage.setItem(BEST_KEY, JSON.stringify(best))
}

function cycleMark(mark: 'none' | 'flag' | 'question', questions: boolean): 'none' | 'flag' | 'question' {
  if (mark === 'none') {
    return 'flag'
  }
  if (mark === 'flag') {
    return questions ? 'question' : 'none'
  }
  return 'none'
}

export function useMinesweeper() {
  const [difficulty, setDifficultyState] = useState<MinesweeperDifficulty>('beginner')
  const preset = PRESETS[difficulty]
  const [board, setBoard] = useState<MsBoard>(() => createEmptyBoard(preset.rows, preset.cols))
  const [status, setStatus] = useState<MinesweeperStatus>('ready')
  const [seconds, setSeconds] = useState(0)
  const [questions, setQuestions] = useState(false)
  const [exploded, setExploded] = useState<MsPoint | null>(null)
  const [hint, setHint] = useState<Hint | null>(null)
  const [hintChecked, setHintChecked] = useState(false)
  const [pressed, setPressed] = useState<MsPoint[]>([])
  const [best, setBest] = useState<BestTimes>(readBest)
  const [hasLayout, setHasLayout] = useState(false)

  const statusRef = useRef(status)
  const boardRef = useRef(board)
  const presetRef = useRef(preset)
  statusRef.current = status
  boardRef.current = board
  presetRef.current = preset

  const remaining = preset.mines - countFlags(board)

  const resetBoard = useCallback((nextDifficulty = difficulty) => {
    const next = PRESETS[nextDifficulty]
    setDifficultyState(nextDifficulty)
    setBoard(createEmptyBoard(next.rows, next.cols))
    setStatus('ready')
    setSeconds(0)
    setExploded(null)
    setHint(null)
    setHintChecked(false)
    setPressed([])
    setHasLayout(false)
  }, [difficulty])

  const retryLayout = useCallback(() => {
    if (!hasLayout) {
      resetBoard()
      return
    }
    setBoard((current) =>
      current.map((row) =>
        row.map((cell) => ({
          ...cell,
          revealed: false,
          mark: 'none' as const,
        })),
      ),
    )
    setStatus('playing')
    setSeconds(0)
    setExploded(null)
    setHint(null)
    setHintChecked(false)
    setPressed([])
  }, [hasLayout, resetBoard])

  const lose = useCallback((next: MsBoard, at: MsPoint) => {
    setBoard(revealMines(next))
    setExploded(at)
    setStatus('lost')
    setHint(null)
    setHintChecked(false)
  }, [])

  const win = useCallback((next: MsBoard, time: number, level: MinesweeperDifficulty) => {
    setBoard(flagRemainingMines(next))
    setStatus('won')
    setHint(null)
    setHintChecked(false)
    setBest((prev) => {
      const currentBest = prev[level]
      if (currentBest !== null && time >= currentBest) {
        return prev
      }
      const updated = { ...prev, [level]: time }
      writeBest(updated)
      return updated
    })
  }, [])

  const revealAt = useCallback(
    (x: number, y: number) => {
      if (statusRef.current === 'won' || statusRef.current === 'lost') {
        return
      }

      let current = cloneBoard(boardRef.current)
      const cell = current[y][x]
      if (cell.revealed || cell.mark === 'flag') {
        return
      }

      if (statusRef.current === 'ready') {
        current = placeMines(current, presetRef.current.mines, neighborhood(current, x, y))
        setHasLayout(true)
        setStatus('playing')
      }

      const target = current[y][x]
      if (target.mine) {
        lose(current, { x, y })
        return
      }

      current = floodReveal(current, { x, y })
      if (isWon(current)) {
        win(current, seconds, presetRef.current.id)
        return
      }
      setBoard(current)
      setHint(null)
      setHintChecked(false)
    },
    [lose, seconds, win],
  )

  const flagAt = useCallback((x: number, y: number) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') {
      return
    }
    setBoard((current) => {
      const next = cloneBoard(current)
      const cell = next[y][x]
      if (cell.revealed) {
        return current
      }
      cell.mark = cycleMark(cell.mark, questions)
      return next
    })
    setHint(null)
    setHintChecked(false)
  }, [questions])

  const chordAt = useCallback(
    (x: number, y: number) => {
      if (statusRef.current !== 'playing' && statusRef.current !== 'ready') {
        return
      }
      if (statusRef.current === 'ready') {
        return
      }

      const result = chord(boardRef.current, x, y)
      if (result.kind === 'error' || result.kind === 'noop') {
        return
      }
      if (result.kind === 'hit') {
        lose(result.board, result.exploded)
        return
      }
      if (result.won) {
        win(result.board, seconds, presetRef.current.id)
        return
      }
      setBoard(result.board)
      setHint(null)
      setHintChecked(false)
    },
    [lose, seconds, win],
  )

  const showHint = useCallback(() => {
    if (statusRef.current !== 'playing') {
      return
    }
    setHint(findHint(boardRef.current))
    setHintChecked(true)
  }, [])

  const changeDifficulty = useCallback(
    (next: MinesweeperDifficulty) => {
      resetBoard(next)
    },
    [resetBoard],
  )

  useEffect(() => {
    if (status !== 'playing') {
      return
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.min(999, value + 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const disabled = status === 'won' || status === 'lost'

  const mineCountLabel = useMemo(
    () => (remaining < 0 ? remaining.toString() : remaining.toString().padStart(3, '0')),
    [remaining],
  )
  const timeLabel = useMemo(() => seconds.toString().padStart(3, '0'), [seconds])

  return {
    board,
    preset,
    difficulty,
    status,
    seconds,
    timeLabel,
    remaining,
    mineCountLabel,
    questions,
    exploded,
    hint,
    hintChecked,
    pressed,
    best,
    hasLayout,
    disabled,
    setQuestions,
    setPressed,
    resetBoard,
    retryLayout,
    revealAt,
    flagAt,
    chordAt,
    showHint,
    changeDifficulty,
  }
}
