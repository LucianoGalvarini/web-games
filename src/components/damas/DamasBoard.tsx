import { BOARD_SIZE, isDarkSquare } from '../../damas'
import { samePoint } from '../../shared/point'
import type { Point } from '../../shared/point'
import type { Player } from '../../shared/types'

type BoardPiece = {
  id: number
  point: Point
  player: Player
  kind: 'man' | 'king'
  capturing?: boolean
}

type DamasBoardProps = {
  pieces: BoardPiece[]
  selected: Point | null
  targets: Point[]
  movableFrom: Point[]
  lastPoint: Point | null
  disabled: boolean
  onSelect: (point: Point) => void
}

function isListed(list: Point[], point: Point): boolean {
  return list.some((item) => samePoint(item, point))
}

const ROWS = Array.from({ length: BOARD_SIZE }, (_, y) => y)
const COLS = Array.from({ length: BOARD_SIZE }, (_, x) => x)

export function DamasBoard({
  pieces,
  selected,
  targets,
  movableFrom,
  lastPoint,
  disabled,
  onSelect,
}: DamasBoardProps) {
  return (
    <div className={`damas-field ${disabled ? 'is-disabled' : ''}`}>
      <div className="damas-cells">
        {ROWS.flatMap((y) =>
          COLS.map((x) => {
            const point = { x, y }
            const dark = isDarkSquare(point)
            if (!dark) {
              return <div key={`${x}-${y}`} className="damas-cell is-light" />
            }
            const targetHere = isListed(targets, point)
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                className={`damas-cell is-dark ${targetHere ? 'is-target' : ''}`}
                disabled={disabled}
                aria-label={`Casilla ${x + 1},${y + 1}`}
                onClick={() => onSelect(point)}
              />
            )
          }),
        )}
      </div>

      <div className="damas-pieces">
        {pieces.map((piece) => {
          const selectedHere = selected ? samePoint(selected, piece.point) : false
          const movable = isListed(movableFrom, piece.point)
          const lastMoved = lastPoint ? samePoint(lastPoint, piece.point) : false

          return (
            <div
              key={piece.id}
              className={[
                'damas-piece',
                `is-${piece.player}`,
                piece.kind === 'king' ? 'is-king' : '',
                selectedHere ? 'is-selected' : '',
                movable && !selectedHere ? 'is-movable' : '',
                lastMoved ? 'is-last' : '',
                piece.capturing ? 'is-capturing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${(piece.point.x / BOARD_SIZE) * 100}%`,
                top: `${(piece.point.y / BOARD_SIZE) * 100}%`,
              }}
              onClick={() => !disabled && onSelect(piece.point)}
            >
              <span className="damas-piece-face" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
