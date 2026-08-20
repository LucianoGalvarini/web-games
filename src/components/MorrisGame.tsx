import { useState } from 'react'
import { useMorris } from '../hooks/useMorris'
import { VARIANT_ORDER, VARIANTS } from '../morris'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { morrisManual } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { MorrisBoardView } from './morris/MorrisBoardView'

const VARIANT_OPTIONS = VARIANT_ORDER.map((id) => ({ id, label: VARIANTS[id].label }))

type MorrisGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  humanColor: Player,
  thinking: boolean,
  placing: boolean,
  pendingRemoval: boolean,
  flying: boolean,
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
  if (pendingRemoval) {
    return 'Molino. Sacá una pieza rival que no esté en molino.'
  }
  if (placing) {
    return `Turno de ${playerLabel(current).toLowerCase()}. Colocá una pieza.`
  }
  if (flying) {
    return `Turno de ${playerLabel(current).toLowerCase()}. Con 3 piezas podés volar a cualquier vacío.`
  }
  if (isCpuTurn(mode, current, humanColor)) {
    return 'Turno de la computadora.'
  }
  return `Turno de ${playerLabel(current).toLowerCase()}. Mové una pieza por las líneas.`
}

function resultDetail(winner: Winner, counts: { white: number; black: number }): string {
  if (winner === 'draw') {
    return 'La misma posición se repitió tres veces.'
  }
  if (counts.white < 3 || counts.black < 3) {
    return 'El rival quedó con menos de tres piezas.'
  }
  return 'El rival se quedó sin movimientos legales.'
}

export function MorrisGame({ onBack }: MorrisGameProps) {
  const game = useMorris()
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="app">
      <div className="shell morris-shell">
        <GamePanel
          eyebrow="Molino"
          title={game.variantConfig.label}
          lede="Formá molinos de tres y dejá al rival sin piezas o sin jugadas."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.humanColor,
            game.thinking,
            game.placing,
            game.pendingRemoval,
            game.flying,
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
          countDetail={(player, onBoard) => {
            const hand = game.inHand[player]
            if (hand > 0) {
              return `${onBoard} en tablero · ${hand} por colocar`
            }
            return `${onBoard} en tablero`
          }}
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

        <main className="table morris-table" data-manual="board">
          <MorrisBoardView
            variant={game.variantConfig}
            stones={game.stones}
            selected={game.selected}
            targets={game.targets}
            movableFrom={game.movableFrom}
            lastPoint={game.lastPoint}
            millGlow={game.millGlow}
            pendingRemoval={game.pendingRemoval}
            disabled={game.thinking || Boolean(game.winner)}
            onSelect={game.selectPoint}
          />
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={morrisManual(game.variantConfig)} onClose={() => setRulesOpen(false)} />
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
