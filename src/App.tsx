import { useState } from 'react'
import { AjedrezGame } from './components/AjedrezGame'
import { DamasGame } from './components/DamasGame'
import { FanoronaGame } from './components/FanoronaGame'
import { Home } from './components/Home'
import { MinesweeperGame } from './components/MinesweeperGame'
import { MorrisGame } from './components/MorrisGame'
import { ShogiGame } from './components/ShogiGame'
import { SudokuGame } from './components/SudokuGame'
import { TetrisGame } from './components/TetrisGame'
import { TrucoGame } from './components/TrucoGame'
import type { GameId } from './shared/types'

export default function App() {
  const [game, setGame] = useState<GameId | null>(null)

  if (!game) {
    return <Home onSelect={setGame} />
  }

  if (game === 'fanorona') {
    return <FanoronaGame onBack={() => setGame(null)} />
  }

  if (game === 'morris') {
    return <MorrisGame onBack={() => setGame(null)} />
  }

  if (game === 'minesweeper') {
    return <MinesweeperGame onBack={() => setGame(null)} />
  }

  if (game === 'sudoku') {
    return <SudokuGame onBack={() => setGame(null)} />
  }

  if (game === 'damas') {
    return <DamasGame onBack={() => setGame(null)} />
  }

  if (game === 'truco') {
    return <TrucoGame onBack={() => setGame(null)} />
  }

  if (game === 'tetris') {
    return <TetrisGame onBack={() => setGame(null)} />
  }

  if (game === 'ajedrez') {
    return <AjedrezGame onBack={() => setGame(null)} />
  }

  if (game === 'shogi') {
    return <ShogiGame onBack={() => setGame(null)} />
  }

  return null
}
