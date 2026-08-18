import { playerLabel } from '../shared/player'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'

type GamePanelProps = {
  eyebrow: string
  title: string
  lede: string
  status: string
  current: Player
  mode: GameMode
  difficulty: Difficulty
  winner: Winner
  canEndTurn?: boolean
  canUndo: boolean
  counts: { white: number; black: number }
  countDetail?: (player: Player, onBoard: number) => string
  onEndTurn?: () => void
  onUndo: () => void
  onReset: () => void
  onMode: (mode: GameMode) => void
  onDifficulty: (difficulty: Difficulty) => void
  onRules: () => void
  onBack: () => void
}

export function GamePanel({
  eyebrow,
  title,
  lede,
  status,
  current,
  mode,
  difficulty,
  winner,
  canEndTurn = false,
  canUndo,
  counts,
  countDetail,
  onEndTurn,
  onUndo,
  onReset,
  onMode,
  onDifficulty,
  onRules,
  onBack,
}: GamePanelProps) {
  const detail = (player: Player, onBoard: number) =>
    countDetail ? countDetail(player, onBoard) : `${onBoard} piezas`

  return (
    <aside className="panel">
      <header className="panel-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </header>

      <div className="status-card">
        <p>{status}</p>
      </div>

      <div className="scores">
        <div className={`score ${current === 'white' && !winner ? 'is-active' : ''}`}>
          <span className="swatch white" />
          <div>
            <strong>Blancas</strong>
            <span>{detail('white', counts.white)}</span>
          </div>
        </div>
        <div className={`score ${current === 'black' && !winner ? 'is-active' : ''}`}>
          <span className="swatch black" />
          <div>
            <strong>{mode === 'cpu' ? 'Computadora' : playerLabel('black')}</strong>
            <span>{detail('black', counts.black)}</span>
          </div>
        </div>
      </div>

      <div className="field">
        <span>Modo</span>
        <div className="segmented">
          <button
            type="button"
            className={mode === 'local' ? 'is-on' : ''}
            onClick={() => onMode('local')}
          >
            Dos jugadores
          </button>
          <button
            type="button"
            className={mode === 'cpu' ? 'is-on' : ''}
            onClick={() => onMode('cpu')}
          >
            Contra CPU
          </button>
        </div>
      </div>

      {mode === 'cpu' ? (
        <div className="field">
          <span>Dificultad</span>
          <div className="segmented">
            <button
              type="button"
              className={difficulty === 'easy' ? 'is-on' : ''}
              onClick={() => onDifficulty('easy')}
            >
              Fácil
            </button>
            <button
              type="button"
              className={difficulty === 'medium' ? 'is-on' : ''}
              onClick={() => onDifficulty('medium')}
            >
              Media
            </button>
            <button
              type="button"
              className={difficulty === 'hard' ? 'is-on' : ''}
              onClick={() => onDifficulty('hard')}
            >
              Difícil
            </button>
          </div>
        </div>
      ) : null}

      <div className="actions">
        {canEndTurn && onEndTurn ? (
          <button type="button" className="btn btn-gold" onClick={onEndTurn}>
            Terminar turno
          </button>
        ) : null}
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
          Deshacer
        </button>
        <button type="button" className="btn" onClick={onReset}>
          Nueva partida
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRules}>
          Cómo se juega
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Elegir juego
        </button>
      </div>
    </aside>
  )
}
