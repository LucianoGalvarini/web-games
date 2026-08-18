import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PRESETS,
  autoNotes,
  clearDigitInHouse,
  cloneGrid,
  conflictKeys,
  emptyGrid,
  emptyNotes,
  findHint,
  generatePuzzle,
  remainingOf,
  toggleNote,
} from '../sudoku'
import type {
  SudokuDifficulty,
  SudokuHint,
  SudokuPoint,
  SudokuPuzzle,
  SudokuSnapshot,
  SudokuStatus,
} from '../sudoku'

const BEST_KEY = 'sudoku-best'

type BestTimes = Record<SudokuDifficulty, number | null>

function readBest(): BestTimes {
  const empty: BestTimes = { easy: null, medium: null, hard: null, expert: null }
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

function gridsEqual(a: number[][], b: number[][]): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (a[row][col] !== b[row][col]) {
        return false
      }
    }
  }
  return true
}

export function useSudoku() {
  const [difficulty, setDifficultyState] = useState<SudokuDifficulty>('easy')
  const [givens, setGivens] = useState<number[][]>(emptyGrid)
  const [solution, setSolution] = useState<number[][]>(emptyGrid)
  const [values, setValues] = useState<number[][]>(emptyGrid)
  const [notes, setNotes] = useState<number[][]>(emptyNotes)
  const [selected, setSelected] = useState<SudokuPoint | null>(null)
  const [noteMode, setNoteMode] = useState(false)
  const [status, setStatus] = useState<SudokuStatus>('loading')
  const [seconds, setSeconds] = useState(0)
  const [hint, setHint] = useState<SudokuHint | null>(null)
  const [hintChecked, setHintChecked] = useState(false)
  const [history, setHistory] = useState<SudokuSnapshot[]>([])
  const [best, setBest] = useState<BestTimes>(readBest)
  const [hasPuzzle, setHasPuzzle] = useState(false)

  const requestRef = useRef(0)
  const valuesRef = useRef(values)
  const notesRef = useRef(notes)
  const solutionRef = useRef(solution)
  const statusRef = useRef(status)
  valuesRef.current = values
  notesRef.current = notes
  solutionRef.current = solution
  statusRef.current = status

  const preset = PRESETS[difficulty]
  const conflicts = useMemo(() => conflictKeys(values), [values])
  const remaining = useMemo(
    () => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => remainingOf(values, digit)),
    [values],
  )

  const applyPuzzle = useCallback((puzzle: SudokuPuzzle, nextDifficulty: SudokuDifficulty) => {
    setDifficultyState(nextDifficulty)
    setGivens(puzzle.givens)
    setSolution(puzzle.solution)
    setValues(cloneGrid(puzzle.givens))
    setNotes(emptyNotes())
    setSelected(null)
    setHint(null)
    setHintChecked(false)
    setHistory([])
    setSeconds(0)
    setHasPuzzle(true)
    setStatus('ready')
  }, [])

  const startGame = useCallback(
    (nextDifficulty: SudokuDifficulty) => {
      setDifficultyState(nextDifficulty)
      setStatus('loading')
      setSelected(null)
      setHint(null)
      setHintChecked(false)
      setHistory([])
      setSeconds(0)
      const request = requestRef.current + 1
      requestRef.current = request
      window.setTimeout(() => {
        if (request !== requestRef.current) {
          return
        }
        applyPuzzle(generatePuzzle(nextDifficulty), nextDifficulty)
      }, 0)
    },
    [applyPuzzle],
  )

  useEffect(() => {
    startGame('easy')
    return () => {
      requestRef.current += 1
    }
  }, [startGame])

  const beginPlay = useCallback(() => {
    if (statusRef.current === 'ready') {
      setStatus('playing')
    }
  }, [])

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev,
      {
        values: cloneGrid(valuesRef.current),
        notes: cloneGrid(notesRef.current),
      },
    ])
  }, [])

  const winIfDone = useCallback(
    (next: number[][], time: number, level: SudokuDifficulty) => {
      if (!gridsEqual(next, solutionRef.current)) {
        return false
      }
      setStatus('won')
      setHint(null)
      setSelected(null)
      setBest((prev) => {
        const currentBest = prev[level]
        if (currentBest !== null && time >= currentBest) {
          return prev
        }
        const updated = { ...prev, [level]: time }
        writeBest(updated)
        return updated
      })
      return true
    },
    [],
  )

  const enterDigit = useCallback(
    (digit: number) => {
      if ((statusRef.current !== 'ready' && statusRef.current !== 'playing') || !selected) {
        return
      }
      const { row, col } = selected
      if (givens[row][col] !== 0) {
        return
      }

      if (noteMode) {
        if (values[row][col] !== 0) {
          return
        }
        beginPlay()
        pushHistory()
        setNotes((current) => {
          const next = current.map((line) => line.slice())
          next[row][col] = toggleNote(next[row][col], digit)
          return next
        })
        setHint(null)
        setHintChecked(false)
        return
      }

      if (values[row][col] === digit) {
        return
      }

      beginPlay()
      pushHistory()
      const next = cloneGrid(values)
      next[row][col] = digit
      setValues(next)
      setNotes(clearDigitInHouse(notesRef.current, row, col, digit))
      setHint(null)
      setHintChecked(false)
      winIfDone(next, seconds, difficulty)
    },
    [selected, givens, noteMode, values, beginPlay, pushHistory, winIfDone, seconds, difficulty],
  )

  const eraseCell = useCallback(() => {
    if ((statusRef.current !== 'ready' && statusRef.current !== 'playing') || !selected) {
      return
    }
    const { row, col } = selected
    if (givens[row][col] !== 0) {
      return
    }
    if (values[row][col] === 0 && notes[row][col] === 0) {
      return
    }
    beginPlay()
    pushHistory()
    const next = cloneGrid(values)
    next[row][col] = 0
    setValues(next)
    setNotes((current) => {
      const copy = current.map((line) => line.slice())
      copy[row][col] = 0
      return copy
    })
    setHint(null)
    setHintChecked(false)
  }, [selected, givens, values, notes, beginPlay, pushHistory])

  const fillCell = useCallback(
    (row: number, col: number) => {
      if (givens[row][col] !== 0 || values[row][col] === solution[row][col]) {
        return false
      }
      beginPlay()
      pushHistory()
      const next = cloneGrid(values)
      const digit = solution[row][col]
      next[row][col] = digit
      setValues(next)
      setNotes(clearDigitInHouse(notesRef.current, row, col, digit))
      setSelected({ row, col })
      setHint(null)
      setHintChecked(false)
      winIfDone(next, seconds, difficulty)
      return true
    },
    [givens, values, solution, beginPlay, pushHistory, winIfDone, seconds, difficulty],
  )

  const showHint = useCallback(() => {
    if (statusRef.current !== 'ready' && statusRef.current !== 'playing') {
      return
    }
    beginPlay()
    if (hint) {
      fillCell(hint.row, hint.col)
      return
    }
    const found = findHint(values)
    setHint(found)
    setHintChecked(true)
    if (found) {
      setSelected({ row: found.row, col: found.col })
    }
  }, [hint, values, beginPlay, fillCell])

  const revealCell = useCallback(() => {
    if (statusRef.current !== 'ready' && statusRef.current !== 'playing') {
      return
    }
    beginPlay()
    if (selected && fillCell(selected.row, selected.col)) {
      return
    }
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (fillCell(row, col)) {
          return
        }
      }
    }
  }, [selected, beginPlay, fillCell])

  const fillNotes = useCallback(() => {
    if (statusRef.current !== 'ready' && statusRef.current !== 'playing') {
      return
    }
    beginPlay()
    pushHistory()
    setNotes(autoNotes(values))
    setHint(null)
    setHintChecked(false)
  }, [values, beginPlay, pushHistory])

  const undo = useCallback(() => {
    if (history.length === 0 || statusRef.current === 'loading') {
      return
    }
    const prev = history[history.length - 1]
    const remainingHistory = history.slice(0, -1)
    setHistory(remainingHistory)
    setValues(prev.values)
    setNotes(prev.notes)
    setHint(null)
    setHintChecked(false)
    if (remainingHistory.length === 0) {
      setStatus('ready')
      setSeconds(0)
      return
    }
    if (statusRef.current === 'won') {
      setStatus('playing')
    }
  }, [history])

  const retryPuzzle = useCallback(() => {
    if (!hasPuzzle) {
      startGame(difficulty)
      return
    }
    setValues(cloneGrid(givens))
    setNotes(emptyNotes())
    setSelected(null)
    setHint(null)
    setHintChecked(false)
    setHistory([])
    setSeconds(0)
    setStatus('ready')
  }, [hasPuzzle, difficulty, givens, startGame])

  const changeDifficulty = useCallback(
    (next: SudokuDifficulty) => {
      startGame(next)
    },
    [startGame],
  )

  useEffect(() => {
    if (status !== 'playing') {
      return
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const timeLabel = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return `${minutes}:${rest.toString().padStart(2, '0')}`
  }, [seconds])

  const emptyCount = useMemo(() => {
    let total = 0
    for (const row of values) {
      for (const value of row) {
        if (value === 0) {
          total += 1
        }
      }
    }
    return total
  }, [values])

  return {
    preset,
    difficulty,
    givens,
    values,
    notes,
    selected,
    noteMode,
    status,
    seconds,
    timeLabel,
    remaining,
    emptyCount,
    conflicts,
    hint,
    hintChecked,
    best,
    hasPuzzle,
    canUndo: history.length > 0 && status !== 'loading',
    disabled: status === 'loading' || status === 'won',
    setSelected,
    setNoteMode,
    enterDigit,
    eraseCell,
    showHint,
    revealCell,
    fillNotes,
    undo,
    retryPuzzle,
    startGame,
    changeDifficulty,
  }
}
