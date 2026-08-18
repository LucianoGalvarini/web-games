import { useState } from 'react'
import { useMorris } from '../hooks/useMorris'
import { playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { MORRIS_RULES } from '../shared/rules'
import type { GameMode, Player, Winner } from '../shared/types'
import { GamePanel } from './GamePanel'
import { ResultOverlay } from './ResultOverlay'
import { RulesModal } from './RulesModal'
import { MorrisBoardView } from './morris/MorrisBoardView'

type MorrisGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
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
  if (mode === 'cpu' && current === 'black') {
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
      <div className="shell">
        <GamePanel
          eyebrow="Molino"
          title="Molino de nueve"
          lede="Formá molinos de tres y dejá al rival sin piezas o sin jugadas."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.thinking,
            game.placing,
            game.pendingRemoval,
            game.flying,
          )}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
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
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table morris-table">
          <MorrisBoardView
            board={game.board}
            selected={game.selected}
            targets={game.targets}
            movableFrom={game.movableFrom}
            lastPoint={game.lastPoint}
            pendingRemoval={game.pendingRemoval}
            disabled={game.thinking || Boolean(game.winner)}
            onSelect={game.selectPoint}
          />
        </main>
      </div>

      <RulesModal open={rulesOpen} rules={MORRIS_RULES} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(game.winner)}
        eyebrow={resultEyebrow(game.winner, game.mode)}
        title={resultTitle(game.winner, game.mode)}
        detail={resultDetail(game.winner, game.counts)}
        variant={resultVariant(game.winner, game.mode)}
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
