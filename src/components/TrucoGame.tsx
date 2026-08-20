import { useState } from 'react'
import { useTruco } from '../hooks/useTruco'
import { difficultyLabel } from '../shared/difficulty'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { TRUCO_MANUAL } from '../shared/manuals'
import { logSide, logText, statusText, TARGET_SCORE } from '../truco'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { SoundToggle } from './SoundToggle'
import { TrucoAnotador } from './truco/TrucoAnotador'
import { TrucoTable } from './truco/TrucoTable'

type TrucoGameProps = {
  onBack: () => void
}

export function TrucoGame({ onBack }: TrucoGameProps) {
  const game = useTruco()
  const [rulesOpen, setRulesOpen] = useState(false)
  const { state } = game
  const recent = [...state.log].slice(-6).reverse()

  return (
    <div className="app">
      <div className="shell truco-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">Naipes</p>
            <h1>Truco</h1>
            <p className="lede">Mano a mano, sin flor, a 30. Envido, truco y las 40 cartas españolas.</p>
          </header>

          <div className="field">
            <span>Modo</span>
            <div className="segmented">
              <button
                type="button"
                className={game.mode === 'local' ? 'is-on' : ''}
                onClick={() => game.changeMode('local')}
              >
                Dos jugadores
              </button>
              <button
                type="button"
                className={game.mode === 'cpu' ? 'is-on' : ''}
                onClick={() => game.changeMode('cpu')}
              >
                Contra CPU
              </button>
            </div>
          </div>

          {game.mode === 'cpu' ? (
            <>
              <div className="field">
                <span>Salís</span>
                <div className="segmented">
                  <button
                    type="button"
                    className={game.humanStartsMano ? 'is-on' : ''}
                    onClick={() => game.changeStartsMano(true)}
                  >
                    De mano
                  </button>
                  <button
                    type="button"
                    className={!game.humanStartsMano ? 'is-on' : ''}
                    onClick={() => game.changeStartsMano(false)}
                  >
                    De pie
                  </button>
                </div>
              </div>
              <div className="field">
                <span>Dificultad</span>
                <div className="segmented">
                  {(['easy', 'medium', 'hard'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={game.difficulty === option ? 'is-on' : ''}
                      onClick={() => game.setDifficulty(option)}
                    >
                      {difficultyLabel(option)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <div className="actions">
            <button type="button" className="btn" onClick={game.undo} disabled={!game.canUndo}>
              Deshacer
            </button>
            <button type="button" className="btn" onClick={() => game.resetGame()}>
              Nueva partida
            </button>
            <SoundToggle />
            <button type="button" className="btn btn-ghost" onClick={() => setRulesOpen(true)}>
              Manual
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table truco-table" data-manual="hand">
          <TrucoTable
            state={state}
            viewing={game.viewing}
            actions={game.actions}
            canAct={game.canAct}
            nameOf={game.nameOf}
            onPlayCard={game.playCard}
            onAction={game.play}
          />
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="status-card">
            <p>{statusText(state, game.actor, game.nameOf, game.thinking)}</p>
          </div>

          <TrucoAnotador
            leftName={game.nameOf('white')}
            leftPoints={state.scores.white}
            rightName={game.nameOf('black')}
            rightPoints={state.scores.black}
          />

          <div className="truco-log" aria-label="Jugadas">
            {Array.from({ length: 6 }, (_, index) => {
              const event = recent[index]
              if (!event) {
                return (
                  <p key={`pad-${index}`} className="truco-log-row is-meta">
                    {index === 0 && recent.length === 0
                      ? `Partida a ${TARGET_SCORE}. Canta o jugá una carta.`
                      : '\u00a0'}
                  </p>
                )
              }
              return (
                <p
                  key={`${state.log.length - index}-${event.kind}`}
                  className={`truco-log-row is-${logSide(event, game.viewing)}`}
                >
                  {logText(event, game.nameOf)}
                </p>
              )
            })}
          </div>
        </aside>
      </div>

      <ManualTour open={rulesOpen} steps={TRUCO_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={Boolean(state.matchWinner)}
        eyebrow={resultEyebrow(state.matchWinner, game.mode, game.humanColor)}
        title={resultTitle(state.matchWinner, game.mode, game.humanColor)}
        detail={
          state.matchWinner
            ? `${game.nameOf(state.matchWinner)} llegó a ${TARGET_SCORE}. ${game.nameOf('white')} ${state.scores.white} — ${game.nameOf('black')} ${state.scores.black}.`
            : ''
        }
        variant={resultVariant(state.matchWinner, game.mode, game.humanColor)}
        rematchLabel="Nueva partida"
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
