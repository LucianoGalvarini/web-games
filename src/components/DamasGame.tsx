import { useState } from 'react'
import { useDamas } from '../hooks/useDamas'
import { VARIANT_ORDER, VARIANTS } from '../damas'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { damasManual } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { DamasBoard } from './damas/DamasBoard'

const VARIANT_OPTIONS = VARIANT_ORDER.map((id) => ({ id, label: VARIANTS[id].label }))

type DamasGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  humanColor: Player,
  thinking: boolean,
  inChain: boolean,
  mustCapture: boolean,
): string {
  if (winner === 'draw') {
    return 'Tablas por repetición.'
  }
  if (winner) {
    return `Ganaron las ${playerLabel(winner).toLowerCase()}.`
  }
  if (thinking) {
    return 'La computadora está pensando…'
  }
  if (inChain) {
    return 'Captura múltiple: seguí comiendo con la misma pieza.'
  }
  if (isCpuTurn(mode, current, humanColor)) {
    return 'Turno de la computadora.'
  }
  if (mustCapture) {
    return `Turno de ${playerLabel(current).toLowerCase()}. Hay una captura obligatoria.`
  }
  return `Turno de ${playerLabel(current).toLowerCase()}. Mové una pieza en diagonal.`
}

function resultDetail(winner: Winner, counts: { white: number; black: number }): string {
  if (winner === 'draw') {
    return 'La misma posición se repitió tres veces.'
  }
  if (counts.white === 0 || counts.black === 0) {
    return 'El rival se quedó sin piezas.'
  }
  return 'El rival se quedó sin movimientos legales.'
}

export function DamasGame({ onBack }: DamasGameProps) {
  const game = useDamas()
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="app">
      <div className="shell">
        <GamePanel
          eyebrow="Damas"
          title={game.variantConfig.label}
          lede="Capturá saltando en diagonal y coroná tus damas al llegar al fondo."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.humanColor,
            game.thinking,
            game.inChain,
            game.mustCapture,
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
          variantOptions={VARIANT_OPTIONS}
          variant={game.variant}
          onVariant={(id) => game.changeVariant(id as (typeof VARIANT_ORDER)[number])}
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table damas-table" data-manual="board">
          <DamasBoard
            pieces={game.pieces}
            selected={game.selected}
            targets={game.targets}
            movableFrom={game.movableFrom}
            lastPoint={game.lastPoint}
            disabled={game.thinking || Boolean(game.winner)}
            onSelect={game.selectPoint}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={damasManual(game.variantConfig)} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode, game.humanColor)}
        title={resultTitle(game.winner, game.mode, game.humanColor)}
        detail={resultDetail(game.winner, game.counts)}
        variant={resultVariant(game.winner, game.mode, game.humanColor)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
