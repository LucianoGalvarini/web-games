import { useEffect, useState } from 'react'
import { useSudoku } from '../hooks/useSudoku'
import { DIFFICULTIES, PRESETS } from '../sudoku'
import { SUDOKU_MANUAL } from '../shared/manuals'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { TableHud } from './TableHud'
import { SudokuBoard } from './sudoku/SudokuBoard'
import { SudokuPad } from './sudoku/SudokuPad'

type SudokuGameProps = {
  onBack: () => void
}

function formatBest(value: number | null): string {
  if (value === null) {
    return '—'
  }
  const minutes = Math.floor(value / 60)
  const rest = value % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

function hintText(
  status: 'loading' | 'ready' | 'playing' | 'won',
  hint: { kind: 'naked' | 'hidden' } | null,
  hintChecked: boolean,
  noteMode: boolean,
): string {
  if (status === 'loading') {
    return 'Armando un tablero con solución única…'
  }
  if (status === 'ready') {
    return 'El tiempo arranca cuando pongas un número o uses una ayuda.'
  }
  if (status === 'won') {
    return 'Tablero completo. Todos los números encajan.'
  }
  if (hint) {
    return hint.kind === 'naked'
      ? 'Pista: esa casilla solo admite un número. Tocá Pista de nuevo para llenarla.'
      : 'Pista: ese número solo entra en esa casilla de su fila, columna o bloque.'
  }
  if (hintChecked) {
    return 'Pista: no hay un único obvio. Probá anotaciones o revelá una casilla.'
  }
  if (noteMode) {
    return 'Modo anotaciones. Los números se marcan en lápiz en la casilla elegida.'
  }
  return 'Completá cada fila, columna y bloque de 3×3 con los números del 1 al 9.'
}

export function SudokuGame({ onBack }: SudokuGameProps) {
  const game = useSudoku()
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (game.disabled) {
        return
      }
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        game.setNoteMode((on) => !on)
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        event.preventDefault()
        game.eraseCell()
        return
      }
      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault()
        game.enterDigit(Number(event.key))
        return
      }
      if (!game.selected) {
        return
      }
      const moves: Record<string, { row: number; col: number }> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
      }
      const delta = moves[event.key]
      if (!delta) {
        return
      }
      event.preventDefault()
      game.setSelected({
        row: Math.min(8, Math.max(0, game.selected.row + delta.row)),
        col: Math.min(8, Math.max(0, game.selected.col + delta.col)),
      })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game])

  return (
    <div className="app">
      <TableHud onManual={() => setRulesOpen(true)} />
      <div className="shell sudoku-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">Números</p>
            <h1>Sudoku</h1>
            <p className="lede">Anotaciones, pistas lógicas y un tablero siempre con solución única.</p>
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

          <div className="actions">
            <button type="button" className="btn btn-gold" onClick={() => game.startGame(game.difficulty)}>
              Nueva partida
            </button>
            <button type="button" className="btn" onClick={game.retryPuzzle} disabled={!game.hasPuzzle}>
              Mismo tablero
            </button>
            <button type="button" className="btn" onClick={game.undo} disabled={!game.canUndo}>
              Deshacer
            </button>
            <button type="button" className="btn" onClick={game.showHint} disabled={game.disabled}>
              Pista
            </button>
            <button type="button" className="btn" onClick={game.fillNotes} disabled={game.disabled}>
              Autocompletar notas
            </button>
            <button type="button" className="btn" onClick={game.revealCell} disabled={game.disabled}>
              Revelar casilla
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className={`table sudoku-table ${game.status === 'loading' ? 'is-loading' : ''}`} data-manual="board">
          <SudokuBoard
            givens={game.givens}
            values={game.values}
            notes={game.notes}
            selected={game.selected}
            conflicts={game.conflicts}
            hint={game.hint}
            disabled={game.disabled}
            onSelect={game.setSelected}
          />
          <div data-manual="pad">
            <SudokuPad
              remaining={game.remaining}
              noteMode={game.noteMode}
              disabled={game.disabled}
              onDigit={game.enterDigit}
              onErase={game.eraseCell}
              onToggleNotes={() => game.setNoteMode((on) => !on)}
            />
          </div>
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="ms-readouts">
            <div className="ms-digit">{game.timeLabel}</div>
            <div className="ms-digit">{String(game.emptyCount).padStart(2, '0')}</div>
          </div>

          <div className="status-card">
            <p>{hintText(game.status, game.hint, game.hintChecked, game.noteMode)}</p>
          </div>

          <div className="scores">
            <div className="score">
              <div>
                <strong>{game.preset.clues} pistas</strong>
                <span>Casillas dadas al empezar</span>
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

      <ManualTour open={rulesOpen} steps={SUDOKU_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={game.status === 'won'}
        eyebrow="Victoria"
        title="Ganaste"
        detail={`Tablero completo en ${game.timeLabel}.`}
        variant="win"
        rematchLabel="Nueva partida"
        extraLabel={game.hasPuzzle ? 'Mismo tablero' : undefined}
        onRematch={() => game.startGame(game.difficulty)}
        onExtra={game.retryPuzzle}
        onMenu={onBack}
      />
    </div>
  )
}
