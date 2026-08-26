import { useState } from 'react'
import { useShogi } from '../hooks/useShogi'
import { inCheck } from '../shogi'
import { isCpuTurn, playerLabel } from '../shared/player'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { SHOGI_MANUAL } from '../shared/manuals'
import type { GameMode, Player, Winner } from '../shared/types'
import { ShogiBoard } from './shogi/ShogiBoard'
import { ShogiHand } from './shogi/ShogiHand'
import { GamePanel } from './GamePanel'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'

type ShogiGameProps = {
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
  if (checked) {
    return `Jaque. Juegan las ${playerLabel(current).toLowerCase()}.`
  }
  return `Turno de ${playerLabel(current).toLowerCase()}.`
}

function resultDetail(winner: Winner): string {
  if (winner === 'draw') {
    return 'La misma posición se repitió tres veces.'
  }
  return 'El rival se quedó sin jugadas legales.'
}

export function ShogiGame({ onBack }: ShogiGameProps) {
  const game = useShogi()
  const [rulesOpen, setRulesOpen] = useState(false)
  const checked = inCheck(game.position.board, game.current)

  return (
    <div className="app">
      <div className="shell shogi-shell">
        <GamePanel
          eyebrow="Japón"
          title="Shogi"
          lede="Ajedrez japonés: las piezas comidas vuelven a la mano y se pueden tirar."
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

        <main className="table shogi-table" data-manual="board">
          <ShogiHand
            player={game.flipped ? 'white' : 'black'}
            hand={game.position.hands[game.flipped ? 'white' : 'black']}
            selectedDrop={game.selectedDrop}
            droppable={game.droppable}
            active={game.current === (game.flipped ? 'white' : 'black')}
            disabled={game.thinking || Boolean(game.winner)}
            onSelect={game.selectHandPiece}
          />

          <ShogiBoard
            pieces={game.pieces}
            selected={game.selected}
            targets={game.targets}
            lastFrom={game.lastFrom}
            lastTo={game.lastTo}
            checkIndex={game.checkIndex}
            flipped={game.flipped}
            disabled={game.thinking || Boolean(game.winner)}
            pendingPromotion={game.pendingPromotion}
            onSelect={game.selectSquare}
            onConfirmPromotion={game.confirmPromotion}
          />

          <div data-manual="hand" style={{ width: '100%' }}>
            <ShogiHand
              player={game.flipped ? 'black' : 'white'}
              hand={game.position.hands[game.flipped ? 'black' : 'white']}
              selectedDrop={game.selectedDrop}
              droppable={game.droppable}
              active={game.current === (game.flipped ? 'black' : 'white')}
              disabled={game.thinking || Boolean(game.winner)}
              onSelect={game.selectHandPiece}
            />
          </div>
        </main>
      </div>

      <ManualTour open={rulesOpen} steps={SHOGI_MANUAL} onClose={() => setRulesOpen(false)} />
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
