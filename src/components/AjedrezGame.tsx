import { useState } from 'react'
import { endReasonLabel, inCheck } from '../ajedrez'
import { ChessBoard } from './ajedrez/ChessBoard'
import { ChessLog } from './ajedrez/ChessLog'
import { ChessMaterial } from './ajedrez/ChessMaterial'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { useAjedrez } from '../hooks/useAjedrez'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { AJEDREZ_MANUAL } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'

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
  reason: string,
): string {
  if (winner === 'draw') {
    return reason || 'Tablas.'
  }
  if (winner) {
    return `Ganaron las ${playerLabel(winner).toLowerCase()}. ${reason}`.trim()
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

export function AjedrezGame({ onBack }: AjedrezGameProps) {
  const game = useAjedrez()
  const [rulesOpen, setRulesOpen] = useState(false)
  const checked = inCheck(game.position.squares, game.current)
  const reason = endReasonLabel(game.endReason, game.winner)

  return (
    <div className="app">
      <div className="shell ajedrez-shell">
        <GamePanel
          eyebrow="Tablero"
          title="Ajedrez"
          lede="Enroque, al paso y coronación. Las blancas empiezan."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.humanColor,
            game.thinking,
            checked,
            reason,
          )}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
          difficulties={['easy', 'medium', 'hard', 'perfect']}
          humanColor={game.humanColor}
          onHumanColor={game.changeHumanColor}
          winner={game.winner}
          canUndo={game.canUndo}
          counts={game.counts}
          countDetail={(player) => (
            <ChessMaterial player={player} kinds={game.captured[player]} advantage={game.advantage[player]} />
          )}
          statsExtra={<ChessLog log={game.log} onCopy={() => void game.copyPgn()} />}
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
            cursor={game.cursor}
            current={game.current}
            targets={game.targets}
            captures={game.captures}
            lastFrom={game.lastFrom}
            lastTo={game.lastTo}
            checkIndex={game.checkIndex}
            flipped={game.flipped}
            disabled={game.thinking || Boolean(game.winner)}
            promoting={game.promoting}
            announce={game.announce}
            onSelect={game.selectIndex}
            onPromote={game.promote}
            onCancelPromote={game.cancelPromote}
            onClear={game.clearSelection}
            onCursor={game.setCursor}
            onUndo={game.undo}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={AJEDREZ_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode, game.humanColor)}
        title={resultTitle(game.winner, game.mode, game.humanColor)}
        detail={reason}
        variant={resultVariant(game.winner, game.mode, game.humanColor)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
