import { useState } from 'react'
import { usePaiSho } from '../hooks/usePaiSho'
import { hasHarmonyRing } from '../paisho'
import type { PaiTile } from '../paisho'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { PAISHO_MANUAL } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { PaiShoBoard } from './paisho/PaiShoBoard'
import { PaiShoReserve } from './paisho/PaiShoReserve'

type PaiShoGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  humanColor: Player,
  thinking: boolean,
  planting: boolean,
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
  if (isCpuTurn(mode, current, humanColor)) {
    return 'Turno de la computadora.'
  }
  if (planting) {
    return 'Elegí una puerta vacía para plantar.'
  }
  return `Turno de ${playerLabel(current).toLowerCase()}. Plantá en una puerta o arreglá una flor del jardín.`
}

function resultDetail(winner: Winner, tiles: PaiTile[]): string {
  if (winner === 'draw') {
    return 'La misma posición se repitió tres veces.'
  }
  if (winner && hasHarmonyRing(tiles, winner)) {
    return 'Anillo de armonía alrededor del centro.'
  }
  return 'El rival se quedó sin jugadas.'
}

export function PaiShoGame({ onBack }: PaiShoGameProps) {
  const game = usePaiSho()
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="app">
      <div className="shell paisho-shell">
        <GamePanel
          eyebrow="Jardín"
          title="Pai Sho"
          lede="Plantá flores, formá armonías y cerrá un anillo alrededor del centro."
          status={statusText(game.winner, game.current, game.mode, game.humanColor, game.thinking, Boolean(game.selectedKind))}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
          difficulties={['easy', 'medium', 'hard', 'perfect']}
          humanColor={game.humanColor}
          onHumanColor={game.changeHumanColor}
          winner={game.winner}
          canUndo={game.canUndo}
          counts={game.counts}
          countDetail={(player, onBoard) => `${onBoard} en el jardín · ${game.reserves[player]} en reserva`}
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table paisho-table">
          <div className="paisho-stage" data-manual="board">
            <PaiShoBoard
              tiles={game.position.tiles}
              selected={game.selectedPoint}
              targets={game.targets}
              last={game.last}
              links={game.links}
              disabled={game.thinking || Boolean(game.winner)}
              onSelect={game.selectPoint}
            />
          </div>
          <PaiShoReserve
            reserve={game.position.reserve[game.current]}
            player={game.current}
            selected={game.selectedKind}
            disabled={game.thinking || Boolean(game.winner) || isCpuTurn(game.mode, game.current, game.humanColor)}
            onSelect={game.selectKind}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={PAISHO_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode, game.humanColor)}
        title={resultTitle(game.winner, game.mode, game.humanColor)}
        detail={resultDetail(game.winner, game.position.tiles)}
        variant={resultVariant(game.winner, game.mode, game.humanColor)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
