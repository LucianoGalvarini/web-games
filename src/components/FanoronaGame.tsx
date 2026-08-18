import { useState } from 'react'
import { playerLabel } from '../game'
import type { GameMode, Player, Winner } from '../game'
import { useFanorona } from '../hooks/useFanorona'
import { FANORONA_RULES } from '../shared/rules'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { BoardView } from './Board/BoardView'
import { CaptureChoice } from './CaptureChoice'
import { GamePanel } from './GamePanel'
import { ResultOverlay } from './ResultOverlay'
import { RulesModal } from './RulesModal'

type FanoronaGameProps = {
  onBack: () => void
}

function statusText(
  winner: Winner,
  current: Player,
  mode: GameMode,
  thinking: boolean,
  mustCapture: boolean,
  canEndTurn: boolean,
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
  if (canEndTurn) {
    return 'Podés seguir capturando con la misma pieza o terminar el turno.'
  }
  if (mustCapture) {
    return `Turno de ${playerLabel(current).toLowerCase()}. La captura es obligatoria.`
  }
  if (mode === 'cpu' && current === 'black') {
    return 'Turno de la computadora.'
  }
  return `Turno de ${playerLabel(current).toLowerCase()}. Movimiento paika.`
}

function resultDetail(winner: Winner, counts: { white: number; black: number }): string {
  if (winner === 'draw') {
    return 'La misma posición se repitió tres veces.'
  }
  if (counts.white === 0 || counts.black === 0) {
    return 'Se capturaron todas las piezas del rival.'
  }
  return 'El rival se quedó sin jugadas legales.'
}

export function FanoronaGame({ onBack }: FanoronaGameProps) {
  const game = useFanorona()
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="app">
      <div className="shell">
        <GamePanel
          eyebrow="Madagascar"
          title="Fanorona"
          lede="Capturá todas las piezas rivales acercándote o alejándote en línea."
          status={statusText(
            game.winner,
            game.current,
            game.mode,
            game.thinking,
            game.mustCapture,
            game.canEndTurn,
          )}
          current={game.current}
          mode={game.mode}
          difficulty={game.difficulty}
          winner={game.winner}
          canEndTurn={game.canEndTurn}
          canUndo={game.canUndo}
          counts={game.counts}
          onEndTurn={game.endTurn}
          onUndo={game.undo}
          onReset={() => game.resetGame()}
          onMode={game.changeMode}
          onDifficulty={game.setDifficulty}
          onRules={() => setRulesOpen(true)}
          onBack={onBack}
        />

        <main className="table">
          {game.pendingChoice ? (
            <CaptureChoice
              options={game.pendingChoice}
              onChoose={game.chooseCapture}
              onCancel={game.cancelChoice}
              canCancel={!game.chain}
            />
          ) : null}

          <BoardView
            board={game.board}
            selected={game.selected}
            targets={game.targets}
            movableFrom={game.movableFrom}
            hoverCaptures={game.hoverCaptures}
            choiceCaptures={game.choiceCaptures}
            lastMove={game.lastMove}
            disabled={game.thinking || Boolean(game.winner)}
            onSelect={game.selectPoint}
            onHover={game.setHoverTarget}
          />
        </main>
      </div>

      <RulesModal open={rulesOpen} rules={FANORONA_RULES} onClose={() => setRulesOpen(false)} />
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
