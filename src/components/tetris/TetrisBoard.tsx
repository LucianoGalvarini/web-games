import { COLS, ROWS, cellsOf, ghostY } from '../../tetris'
import type { TetrisState } from '../../tetris'
import { PIECE_CLASS } from './pieceClass'

type TetrisBoardProps = {
  state: TetrisState
  paused: boolean
}

export function TetrisBoard({ state, paused }: TetrisBoardProps) {
  const overlay = new Map<string, string>()
  if (state.active) {
    if (!paused) {
      const ghost = { ...state.active, y: ghostY(state.board, state.active) }
      for (const cell of cellsOf(ghost)) {
        overlay.set(`${cell.x}-${cell.y}`, `is-ghost ${PIECE_CLASS[state.active.id]}`)
      }
    }
    for (const cell of cellsOf(state.active)) {
      overlay.set(`${cell.x}-${cell.y}`, PIECE_CLASS[state.active.id])
    }
  }

  return (
    <div className={`tetris-field${paused ? ' is-paused' : ''}${state.status === 'lost' ? ' is-lost' : ''}`}>
      <div className="tetris-grid">
        {Array.from({ length: ROWS * COLS }, (_, index) => {
          const x = index % COLS
          const y = Math.floor(index / COLS)
          const locked = state.board[y]?.[x]
          const extra = overlay.get(`${x}-${y}`)
          const className = [
            'tetris-cell',
            locked ? PIECE_CLASS[locked] : '',
            extra ?? '',
          ]
            .filter(Boolean)
            .join(' ')
          return <span key={`${x}-${y}`} className={className} />
        })}
      </div>
      {paused ? <p className="tetris-pause-label">Pausa</p> : null}
    </div>
  )
}
