import { useState } from 'react'
import { useBackgammon } from '../hooks/useBackgammon'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { BACKGAMMON_MANUAL } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { BackgammonBoard } from './backgammon/BackgammonBoard'
import { DiceTray } from './backgammon/DiceTray'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'

type BackgammonGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  humanColor: Player,
  thinking: boolean,
  dice: number[] | null,
  movesLeft: number,
): string {
  if (winner && winner !== 'draw') {
    return `Ganaron las ${playerLabel(winner).toLowerCase()}.`
  }
  if (thinking) {
    return 'La computadora está tirando y jugando…'
  }
  if (isCpuTurn(mode, current, humanColor)) {
    return 'Turno de la computadora.'
  }
  if (!dice) {
    return `Turno de ${playerLabel(current).toLowerCase()}. Tirá los dados.`
  }
  if (movesLeft === 0) {
    return 'No hay jugada posible con estos dados. Pasa el turno.'
  }
  return `Turno de ${playerLabel(current).toLowerCase()}. Elegí una ficha y un destino marcado.`
}

export function BackgammonGame({ onBack }: BackgammonGameProps) {
  const game = useBackgammon()
  const [rulesOpen, setRulesOpen] = useState(false)
  const flipped = game.mode === 'cpu' && game.humanColor === 'black'

  const handlePointClick = (point: number | 'bar') => {
    if (game.selected !== null && typeof point === 'number' && game.targets.includes(point)) {
      game.playTarget(point)
      return
    }
    game.selectPoint(point)
  }

  const handleBearOff = () => {
    if (game.selected !== null && game.targets.includes('off')) {
      game.playTarget('off')
    }
  }

  return (
    <div className="app">
      <div className="shell backgammon-shell">
        <GamePanel
          eyebrow="Tablero"
          title="Backgammon"
          lede="Recorré el tablero con los dados y sacá tus quince fichas antes que el rival."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.humanColor,
            game.thinking,
            game.dice,
            game.movesLeft,
          )}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
          difficulties={['easy', 'medium', 'hard', 'perfect']}
          humanColor={game.humanColor}
          onHumanColor={game.changeHumanColor}
          winner={game.winner}
          canUndo={game.canUndo}
          counts={{ white: game.position.off.white, black: game.position.off.black }}
          countDetail={(_player, onBoard) => `${onBoard}/15 afuera`}
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table backgammon-table" data-manual="board">
          <div data-manual="pad">
            <DiceTray
              dice={game.dice}
              diceTotal={game.diceTotal}
              movesLeft={game.movesLeft}
              canRoll={game.canRoll}
              player={game.current}
              onRoll={game.rollDice}
            />
          </div>

          <BackgammonBoard
            pieces={game.pieces}
            selected={game.selected}
            targets={game.targets}
            movableFrom={game.movableFrom}
            lastMove={game.lastMove}
            flipped={flipped}
            disabled={game.thinking || Boolean(game.winner)}
            onPointClick={handlePointClick}
            onBearOff={handleBearOff}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={BACKGAMMON_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode, game.humanColor)}
        title={resultTitle(game.winner, game.mode, game.humanColor)}
        detail="Ganó quien sacó del tablero sus quince fichas primero."
        variant={resultVariant(game.winner, game.mode, game.humanColor)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
