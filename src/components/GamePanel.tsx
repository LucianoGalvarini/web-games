import type { ReactNode } from 'react'
import { difficultyLabel } from '../shared/difficulty'
import { isCpuTurn, playerLabel } from '../shared/player'
import type { Difficulty, GameMode, Player, Winner } from '../shared/types'
import { TableHud } from './TableHud'

type VariantOption = {
  id: string
  label: string
}

type GamePanelProps = {
  eyebrow: string
  title: string
  lede: string
  status: string
  current: Player
  mode: GameMode
  difficulty: Difficulty
  difficulties?: Difficulty[]
  humanColor?: Player
  onHumanColor?: (color: Player) => void
  winner: Winner
  canEndTurn?: boolean
  canUndo: boolean
  counts: { white: number; black: number }
  countDetail?: (player: Player, onBoard: number) => ReactNode
  statsExtra?: ReactNode
  variantOptions?: VariantOption[]
  variant?: string
  onVariant?: (id: string) => void
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
  difficulties = ['easy', 'medium', 'hard'],
  humanColor = 'white',
  onHumanColor,
  winner,
  canEndTurn = false,
  canUndo,
  counts,
  countDetail,
  statsExtra,
  variantOptions,
  variant,
  onVariant,
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

  const sideLabel = (color: Player) =>
    isCpuTurn(mode, color, humanColor) ? 'Computadora' : playerLabel(color)

  return (
    <>
      <TableHud onManual={onRules} />
      <aside className="panel panel-controls" data-manual="controls">
        <header className="panel-header">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </header>

        {variantOptions && onVariant ? (
          <div className="field">
            <span>Tablero</span>
            <div className="segmented">
              {variantOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={variant === option.id ? 'is-on' : ''}
                  onClick={() => onVariant(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

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

        {mode === 'cpu' && onHumanColor ? (
          <div className="field">
            <span>Jugás con</span>
            <div className="segmented">
              <button
                type="button"
                className={humanColor === 'white' ? 'is-on' : ''}
                onClick={() => onHumanColor('white')}
              >
                Blancas
              </button>
              <button
                type="button"
                className={humanColor === 'black' ? 'is-on' : ''}
                onClick={() => onHumanColor('black')}
              >
                Negras
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'cpu' ? (
          <div className="field">
            <span>Dificultad</span>
            <div className="segmented">
              {difficulties.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={difficulty === option ? 'is-on' : ''}
                  onClick={() => onDifficulty(option)}
                >
                  {difficultyLabel(option)}
                </button>
              ))}
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
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Elegir juego
          </button>
        </div>
      </aside>

      <aside className="panel panel-stats" data-manual="stats">
        <div className="status-card">
          <p>{status}</p>
        </div>

        <div className="scores">
          <div className={`score ${current === 'white' && !winner ? 'is-active' : ''}`}>
            <span className="swatch white" />
            <div>
              <strong>{sideLabel('white')}</strong>
              <div className="score-detail">{detail('white', counts.white)}</div>
            </div>
          </div>
          <div className={`score ${current === 'black' && !winner ? 'is-active' : ''}`}>
            <span className="swatch black" />
            <div>
              <strong>{sideLabel('black')}</strong>
              <div className="score-detail">{detail('black', counts.black)}</div>
            </div>
          </div>
        </div>
        {statsExtra}
      </aside>
    </>
  )
}
