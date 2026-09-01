import { useState } from 'react'
import { AjedrezGame } from './components/AjedrezGame'
import { BackgammonGame } from './components/BackgammonGame'
import { DamasGame } from './components/DamasGame'
import { DoomGame } from './components/DoomGame'
import { FanoronaGame } from './components/FanoronaGame'
import { Home } from './components/Home'
import { LigaGame } from './components/LigaGame'
import { MinesweeperGame } from './components/MinesweeperGame'
import { MorrisGame } from './components/MorrisGame'
import { PaiShoGame } from './components/PaiShoGame'
import { ShogiGame } from './components/ShogiGame'
import { SudokuGame } from './components/SudokuGame'
import { TetrisGame } from './components/TetrisGame'
import { TrucoGame } from './components/TrucoGame'
import { UnoGame } from './components/UnoGame'
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

  if (game === 'paisho') {
    return <PaiShoGame onBack={() => setGame(null)} />
  }

  if (game === 'doom') {
    return <DoomGame onBack={() => setGame(null)} />
  }

  if (game === 'shogi') {
    return <ShogiGame onBack={() => setGame(null)} />
  }

  if (game === 'liga') {
    return <LigaGame onBack={() => setGame(null)} />
  }

  if (game === 'uno') {
    return <UnoGame onBack={() => setGame(null)} />
  }

  if (game === 'backgammon') {
    return <BackgammonGame onBack={() => setGame(null)} />
  }

  return null
}
