import { useState } from 'react'
import { useMinesweeper } from '../hooks/useMinesweeper'
import { DIFFICULTIES, PRESETS } from '../minesweeper'
import { MINESWEEPER_RULES } from '../shared/rules'
import { MinesweeperBoard } from './minesweeper/MinesweeperBoard'
import { ResultOverlay } from './ResultOverlay'
import { RulesModal } from './RulesModal'

type MinesweeperGameProps = {
  onBack: () => void
}

function formatBest(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return `${value}s`
}

export function MinesweeperGame({ onBack }: MinesweeperGameProps) {
  const game = useMinesweeper()
  const [rulesOpen, setRulesOpen] = useState(false)
  const hintText = game.status === 'ready'
    ? 'Abrí una casilla para empezar. El primer clic siempre es un vacío, como en Windows 7.'
    : game.hint
      ? game.hint.action === 'flag'
        ? 'Pista: esa casilla es una mina. Poné una bandera.'
        : 'Pista: esa casilla es segura. Abrile.'
      : game.hintChecked
        ? 'Pista: no hay una jugada obvia ahora.'
        : game.status === 'playing'
          ? 'Marcá las minas y abrí todas las casillas libres.'
          : game.status === 'won'
            ? 'Tablero completo.'
            : 'Mina explotada.'

  return (
    <div className="app">
      <div className="shell minesweeper-shell">
        <aside className="panel panel-controls">
          <header className="panel-header">
            <p className="eyebrow">Clásico</p>
            <h1>Buscaminas</h1>
            <p className="lede">Primer clic vacío, chording y pista. Misma mesa de madera que Fanorona y Molino.</p>
          </header>

          <div className="field">
            <span>Dificultad</span>
            <div className="segmented ms-diff">
              {DIFFICULTIES.map((id) => (
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

          <label className="ms-check">
            <input
              type="checkbox"
              checked={game.questions}
              onChange={(event) => game.setQuestions(event.target.checked)}
            />
            Usar signos de pregunta
          </label>

          <div className="actions">
            <button type="button" className="btn btn-gold" onClick={() => game.resetBoard()}>
              Nueva partida
            </button>
            <button type="button" className="btn" onClick={game.retryLayout} disabled={!game.hasLayout}>
              Mismo tablero
            </button>
            <button type="button" className="btn" onClick={game.showHint} disabled={game.status !== 'playing'}>
              Pista
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setRulesOpen(true)}>
              Cómo se juega
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table ms-table">
          <MinesweeperBoard
            board={game.board}
            exploded={game.exploded}
            hint={game.hint}
            pressed={game.pressed}
            disabled={game.disabled}
            onReveal={game.revealAt}
            onFlag={game.flagAt}
            onChord={game.chordAt}
            onPress={game.setPressed}
          />
        </main>

        <aside className="panel panel-stats">
          <div className="ms-readouts">
            <div className="ms-digit">{game.mineCountLabel}</div>
            <div className="ms-digit">{game.timeLabel}</div>
          </div>

          <div className="status-card">
            <p>{hintText}</p>
          </div>

          <div className="scores">
            <div className="score">
              <div>
                <strong>{game.preset.cols}×{game.preset.rows}</strong>
                <span>{game.preset.mines} minas</span>
              </div>
            </div>
            <div className="score">
              <div>
                <strong>Mejor tiempo</strong>
                <span>{formatBest(game.best[game.difficulty])}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <RulesModal open={rulesOpen} rules={MINESWEEPER_RULES} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={game.status === 'won' || game.status === 'lost'}
        eyebrow={game.status === 'won' ? 'Victoria' : 'Derrota'}
        title={game.status === 'won' ? 'Ganaste' : 'Pisaste una mina'}
        detail={
          game.status === 'won'
            ? `Tablero limpio en ${game.seconds} segundos.`
            : 'Las minas quedaron al descubierto. Podés repetir la misma disposición, como en Windows 7.'
        }
        variant={game.status === 'won' ? 'win' : 'loss'}
        rematchLabel="Nueva partida"
        extraLabel={game.hasLayout ? 'Mismo tablero' : undefined}
        onRematch={() => game.resetBoard()}
        onExtra={game.retryLayout}
        onMenu={onBack}
      />
    </div>
  )
}
