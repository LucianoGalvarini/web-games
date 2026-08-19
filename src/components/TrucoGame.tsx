import { useState } from 'react'
import { useTruco } from '../hooks/useTruco'
import { difficultyLabel } from '../shared/difficulty'
import { resultEyebrow, resultTitle, resultVariant } from '../shared/result'
import { TRUCO_RULES } from '../shared/rules'
import { logText, MALAS_LIMIT, statusText, TARGET_SCORE } from '../truco'
import { ResultOverlay } from './ResultOverlay'
import { RulesModal } from './RulesModal'
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
        <aside className="panel panel-controls">
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
            <button type="button" className="btn btn-ghost" onClick={() => setRulesOpen(true)}>
              Cómo se juega
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table truco-table">
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

        <aside className="panel panel-stats">
          <div className="status-card">
            <p>{statusText(state, game.actor, game.nameOf, game.thinking)}</p>
          </div>

          <div className="scores">
            <div className={`score ${game.actor === 'white' && !state.matchWinner ? 'is-active' : ''}`}>
              <span className="swatch white" />
              <div>
                <strong>{game.nameOf('white')}</strong>
                <span>
                  {state.scores.white} — {state.scores.white < MALAS_LIMIT ? 'malas' : 'buenas'}
                </span>
              </div>
            </div>
            <div className={`score ${game.actor === 'black' && !state.matchWinner ? 'is-active' : ''}`}>
              <span className="swatch black" />
              <div>
                <strong>{game.nameOf('black')}</strong>
                <span>
                  {state.scores.black} — {state.scores.black < MALAS_LIMIT ? 'malas' : 'buenas'}
                </span>
              </div>
            </div>
          </div>

          <div className="truco-log">
            {recent.length === 0 ? (
              <p>Partida a {TARGET_SCORE}. Canta o jugá una carta.</p>
            ) : (
              recent.map((event, index) => (
                <p key={`${event.kind}-${index}`}>{logText(event, game.nameOf)}</p>
              ))
            )}
          </div>
        </aside>
      </div>

      <RulesModal open={rulesOpen} rules={TRUCO_RULES} onClose={() => setRulesOpen(false)} />
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
