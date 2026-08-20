import { useState } from 'react'
import { useAjedrez } from '../hooks/useAjedrez'
import { inCheck } from '../ajedrez'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { AJEDREZ_MANUAL } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { ChessBoard } from './ajedrez/ChessBoard'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'

type AjedrezGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  humanColor: Player,
  thinking: boolean,
  checked: boolean,
): string {
  if (winner === 'draw') {
    return 'Tablas.'
  }
  if (winner) {
    return `Ganaron las ${playerLabel(winner).toLowerCase()}.`
  }
  if (thinking) {
    return 'La computadora está pensando…'
  }
  if (isCpuTurn(mode, current, humanColor)) {
    return 'Turno de la computadora.'
  }
  if (checked) {
    return `Jaque. Juegan las ${playerLabel(current).toLowerCase()}.`
  }
  return `Turno de ${playerLabel(current).toLowerCase()}.`
}

function resultDetail(winner: Winner): string {
  if (winner === 'draw') {
    return 'Ahogado, repetición, regla de 50 o material insuficiente.'
  }
  return 'Jaque mate.'
}

export function AjedrezGame({ onBack }: AjedrezGameProps) {
  const game = useAjedrez()
  const [rulesOpen, setRulesOpen] = useState(false)
  const checked = inCheck(game.position.squares, game.current)

  return (
    <div className="app">
      <div className="shell ajedrez-shell">
        <GamePanel
          eyebrow="Tablero"
          title="Ajedrez"
          lede="Enroque, al paso y coronación. Las blancas empiezan."
          status={statusText(game.winner, game.current, game.mode, game.humanColor, game.thinking, checked)}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
          difficulties={['easy', 'medium', 'hard', 'perfect']}
          humanColor={game.humanColor}
          onHumanColor={game.changeHumanColor}
          winner={game.winner}
          canUndo={game.canUndo}
          counts={game.counts}
          countDetail={(player, onBoard) => `${onBoard} piezas · ${game.material[player]}`}
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table ajedrez-table" data-manual="board">
          <ChessBoard
            pieces={game.pieces}
            selected={game.selected}
            targets={game.targets}
            lastFrom={game.lastFrom}
            lastTo={game.lastTo}
            checkIndex={game.checkIndex}
            flipped={game.flipped}
            disabled={game.thinking || Boolean(game.winner)}
            promoting={game.promoting}
            onSelect={game.selectIndex}
            onPromote={game.promote}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={AJEDREZ_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode, game.humanColor)}
        title={resultTitle(game.winner, game.mode, game.humanColor)}
        detail={resultDetail(game.winner)}
        variant={resultVariant(game.winner, game.mode, game.humanColor)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
