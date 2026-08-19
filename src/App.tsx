import { useState } from 'react'
import { FanoronaGame } from './components/FanoronaGame'
import { Home } from './components/Home'
import { MinesweeperGame } from './components/MinesweeperGame'
import { MorrisGame } from './components/MorrisGame'
import { SudokuGame } from './components/SudokuGame'
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

  return <TrucoGame onBack={() => setGame(null)} />
}
