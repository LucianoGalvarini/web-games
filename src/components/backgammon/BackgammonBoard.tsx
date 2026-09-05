import type { BackgammonMove } from '../../backgammon'
import type { BackgammonPiece } from '../../hooks/useBackgammon'
import type { Player } from '../../shared/types'

type Slot = { row: 'top' | 'bottom'; col: number }

const BASE_SLOTS: Slot[] = [
  { row: 'bottom', col: 12 },
  { row: 'bottom', col: 11 },
  { row: 'bottom', col: 10 },
  { row: 'bottom', col: 9 },
  { row: 'bottom', col: 8 },
  { row: 'bottom', col: 7 },
  { row: 'bottom', col: 5 },
  { row: 'bottom', col: 4 },
  { row: 'bottom', col: 3 },
  { row: 'bottom', col: 2 },
  { row: 'bottom', col: 1 },
  { row: 'bottom', col: 0 },
  { row: 'top', col: 0 },
  { row: 'top', col: 1 },
  { row: 'top', col: 2 },
  { row: 'top', col: 3 },
  { row: 'top', col: 4 },
  { row: 'top', col: 5 },
  { row: 'top', col: 7 },
  { row: 'top', col: 8 },
  { row: 'top', col: 9 },
  { row: 'top', col: 10 },
  { row: 'top', col: 11 },
  { row: 'top', col: 12 },
]

const TOTAL_COLS = 14
const OFF_COL = 13

function xPercent(col: number): number {
  return ((col + 0.5) / TOTAL_COLS) * 100
}

function gameIndexFor(baseIndex: number, flipped: boolean): number {
  return flipped ? 23 - baseIndex : baseIndex
}

type BackgammonBoardProps = {
  pieces: BackgammonPiece[]
  selected: number | 'bar' | null
  targets: (number | 'off')[]
  movableFrom: (number | 'bar')[]
  lastMove: BackgammonMove | null
  flipped: boolean
  disabled: boolean
  onPointClick: (point: number | 'bar') => void
  onBearOff: () => void
}

export function BackgammonBoard({
  pieces,
  selected,
  targets,
  movableFrom,
  lastMove,
  flipped,
  disabled,
  onPointClick,
  onBearOff,
}: BackgammonBoardProps) {
  const lastTo = lastMove && lastMove.kind !== 'bearoff' ? lastMove.to : null
  const lastFrom = lastMove && lastMove.kind !== 'enter' ? lastMove.from : null

  const piecesByPoint = new Map<number, BackgammonPiece[]>()
  const barPieces: Record<Player, BackgammonPiece[]> = { white: [], black: [] }
  const offPieces: Record<Player, BackgammonPiece[]> = { white: [], black: [] }

  for (const piece of pieces) {
    if (piece.location === 'bar') {
      barPieces[piece.player].push(piece)
    } else if (piece.location === 'off') {
      offPieces[piece.player].push(piece)
    } else {
      const list = piecesByPoint.get(piece.location) ?? []
      list.push(piece)
      piecesByPoint.set(piece.location, list)
    }
  }

  const bearOffTarget = targets.includes('off')

  return (
    <div className={`backgammon-field ${disabled ? 'is-disabled' : ''}`}>
      <div className="backgammon-board">
        {(['top', 'bottom'] as const).map((rowName) => (
          <div key={rowName} className={`backgammon-half is-${rowName}`}>
            {BASE_SLOTS.map((slot, baseIndex) => {
              if (slot.row !== rowName) {
                return null
              }
              const index = gameIndexFor(baseIndex, flipped)
              const stack = piecesByPoint.get(index) ?? []
              const movable = movableFrom.includes(index)
              const isTarget = targets.includes(index)
              const isSelected = selected === index

              return (
                <button
                  key={index}
                  type="button"
                  className={[
                    'backgammon-point',
                    `is-${rowName}`,
                    baseIndex % 2 === 0 ? 'is-tone-a' : 'is-tone-b',
                    movable ? 'is-movable' : '',
                    isTarget ? 'is-target' : '',
                    isSelected ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: `${xPercent(slot.col)}%` }}
                  disabled={disabled}
                  aria-label={`Punto ${index + 1}`}
                  onClick={() => onPointClick(index)}
                >
                  <span className="backgammon-triangle" />
                  <span className="backgammon-stack">
                    {stack.slice(0, 5).map((piece, stackIndex) => (
                      <span
                        key={piece.id}
                        className={[
                          'backgammon-checker',
                          `is-${piece.player}`,
                          isSelected ? 'is-selected' : '',
                          piece.location === lastTo || piece.location === lastFrom ? 'is-last' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {stackIndex === 4 && stack.length > 5 ? (
                          <span className="backgammon-overflow">+{stack.length - 4}</span>
                        ) : null}
                      </span>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        ))}

        <div className="backgammon-bar">
          <button
            type="button"
            className={`backgammon-bar-half is-top ${movableFrom.includes('bar') ? 'is-movable' : ''} ${
              selected === 'bar' ? 'is-selected' : ''
            }`}
            disabled={disabled || barPieces.black.length === 0}
            aria-label="Barra, negras"
            onClick={() => onPointClick('bar')}
          >
            {barPieces.black.map((piece) => (
              <span key={piece.id} className="backgammon-checker is-black" />
            ))}
          </button>
          <button
            type="button"
            className={`backgammon-bar-half is-bottom ${movableFrom.includes('bar') ? 'is-movable' : ''} ${
              selected === 'bar' ? 'is-selected' : ''
            }`}
            disabled={disabled || barPieces.white.length === 0}
            aria-label="Barra, blancas"
            onClick={() => onPointClick('bar')}
          >
            {barPieces.white.map((piece) => (
              <span key={piece.id} className="backgammon-checker is-white" />
            ))}
          </button>
        </div>

        <button
          type="button"
          className={`backgammon-off is-top ${bearOffTarget ? 'is-target' : ''}`}
          style={{ left: `${xPercent(OFF_COL)}%` }}
          disabled={disabled || !bearOffTarget}
          aria-label="Fichas afuera, negras"
          onClick={onBearOff}
        >
          <span className="backgammon-checker is-black" />
          <span className="backgammon-off-count">{offPieces.black.length}</span>
        </button>
        <button
          type="button"
          className={`backgammon-off is-bottom ${bearOffTarget ? 'is-target' : ''}`}
          style={{ left: `${xPercent(OFF_COL)}%` }}
          disabled={disabled || !bearOffTarget}
          aria-label="Fichas afuera, blancas"
          onClick={onBearOff}
        >
          <span className="backgammon-checker is-white" />
          <span className="backgammon-off-count">{offPieces.white.length}</span>
        </button>
      </div>
    </div>
  )
}
