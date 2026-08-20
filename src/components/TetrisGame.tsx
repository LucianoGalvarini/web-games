import { useState } from 'react'
import { useTetris } from '../hooks/useTetris'
import { TETRIS_MANUAL } from '../shared/manuals'
import { NEXT_COUNT, PRESETS } from '../tetris'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { SoundToggle } from './SoundToggle'
import { MiniPiece } from './tetris/MiniPiece'
import { TetrisBoard } from './tetris/TetrisBoard'

type TetrisGameProps = {
  onBack: () => void
}

function formatBest(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return value.toLocaleString('es-AR')
}

export function TetrisGame({ onBack }: TetrisGameProps) {
  const game = useTetris()
  const [rulesOpen, setRulesOpen] = useState(false)
  const { state } = game
  const next = state.queue.slice(0, NEXT_COUNT)

  return (
    <div className="app">
      <div className="shell tetris-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">Caída</p>
            <h1>Tetris</h1>
            <p className="lede">Siete piezas, bolsa de 7, giros SRS, reserva y fantasma.</p>
          </header>

          <div className="field">
            <span>Dificultad</span>
            <div className="segmented">
              {game.difficulties.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={game.difficulty === id ? 'is-on' : ''}
                  onClick={() => game.changeDifficulty(id)}
                >
                  {PRESETS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn btn-gold" onClick={() => game.resetGame()}>
              Nueva partida
            </button>
            <button
              type="button"
              className="btn"
              onClick={game.togglePause}
              disabled={state.status !== 'playing'}
            >
              {game.paused ? 'Seguir' : 'Pausa'}
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

        <main className="table tetris-table" data-manual="board">
          <TetrisBoard state={state} paused={game.paused} />
          <div className="tetris-pad" data-manual="pad">
            <button type="button" className="btn" onClick={() => game.play({ kind: 'left' })}>
              Izq
            </button>
            <button type="button" className="btn" onClick={() => game.play({ kind: 'ccw' })}>
              Girar
            </button>
            <button type="button" className="btn" onClick={() => game.play({ kind: 'cw' })}>
              Girar +
            </button>
            <button type="button" className="btn" onClick={() => game.play({ kind: 'right' })}>
              Der
            </button>
            <button type="button" className="btn" onClick={() => game.play({ kind: 'soft' })}>
              Bajar
            </button>
            <button type="button" className="btn btn-gold" onClick={() => game.play({ kind: 'hard' })}>
              Tirar
            </button>
            <button type="button" className="btn" onClick={() => game.play({ kind: 'hold' })}>
              Reserva
            </button>
          </div>
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="ms-readouts">
            <div className="ms-digit">{state.score.toLocaleString('es-AR')}</div>
            <div className="ms-digit">{String(state.level).padStart(2, '0')}</div>
          </div>

          <div className="status-card">
            <p>{game.statusText}</p>
          </div>

          <div className="tetris-side">
            <div>
              <span>Reserva</span>
              <MiniPiece id={state.hold} />
            </div>
            <div>
              <span>Siguiente</span>
              <div className="tetris-next">
                {next.map((id, index) => (
                  <MiniPiece key={`${id}-${index}`} id={id} />
                ))}
              </div>
            </div>
          </div>

          <div className="scores">
            <div className="score">
              <div>
                <strong>{state.lines} líneas</strong>
                <span>Nivel {state.level}, arranque {game.preset.startLevel}</span>
              </div>
            </div>
            <div className="score">
              <div>
                <strong>Mejor puntaje</strong>
                <span>{formatBest(game.best[game.difficulty])}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ManualTour open={rulesOpen} steps={TETRIS_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={state.status === 'lost'}
        eyebrow="Fin"
        title="Pozo lleno"
        detail={`${state.score.toLocaleString('es-AR')} puntos · ${state.lines} líneas · nivel ${state.level}.`}
        variant="loss"
        rematchLabel="Nueva partida"
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
