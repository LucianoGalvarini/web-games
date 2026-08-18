import { GRID_SIZE, POINTS } from '../../morris'
import type { MorrisBoard } from '../../morris'
import { keyOf, samePoint } from '../../shared/point'
import type { Point } from '../../shared/point'
import { Stone, StoneDefs } from '../Board/Stone'

const PAD = 56
const GAP = 78
const SIZE = PAD * 2 + GAP * (GRID_SIZE - 1)

function toSvg(point: Point): { x: number; y: number } {
  return {
    x: PAD + point.x * GAP,
    y: PAD + point.y * GAP,
  }
}

type MorrisBoardViewProps = {
  board: MorrisBoard
  selected: Point | null
  targets: Point[]
  movableFrom: Point[]
  lastPoint: Point | null
  pendingRemoval: boolean
  disabled: boolean
  onSelect: (point: Point) => void
}

function isListed(list: Point[], point: Point): boolean {
  return list.some((item) => samePoint(item, point))
}

export function MorrisBoardView({
  board,
  selected,
  targets,
  movableFrom,
  lastPoint,
  pendingRemoval,
  disabled,
  onSelect,
}: MorrisBoardViewProps) {
  const squares: Array<[Point, Point, Point, Point]> = [
    [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 6 },
      { x: 0, y: 6 },
    ],
    [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 5 },
      { x: 1, y: 5 },
    ],
    [
      { x: 2, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 4 },
      { x: 2, y: 4 },
    ],
  ]

  const spokes: Array<[Point, Point]> = [
    [
      { x: 3, y: 0 },
      { x: 3, y: 2 },
    ],
    [
      { x: 3, y: 4 },
      { x: 3, y: 6 },
    ],
    [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
    ],
    [
      { x: 4, y: 3 },
      { x: 6, y: 3 },
    ],
  ]

  return (
    <svg
      className={`board-svg morris-board ${disabled ? 'is-disabled' : ''}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Tablero de molino"
    >
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b8894d" />
          <stop offset="45%" stopColor="#c9a066" />
          <stop offset="100%" stopColor="#8f5e32" />
        </linearGradient>
        <StoneDefs />
      </defs>

      <rect
        x="8"
        y="8"
        width={SIZE - 16}
        height={SIZE - 16}
        rx="18"
        fill="url(#wood)"
        stroke="#5b3918"
        strokeWidth="10"
      />
      <rect
        x="22"
        y="22"
        width={SIZE - 44}
        height={SIZE - 44}
        rx="12"
        fill="none"
        stroke="#e8c27a"
        strokeWidth="2"
        opacity="0.55"
      />

      <g className="board-lines">
        {squares.map((square, index) => {
          const path = [...square, square[0]].map((point, i) => {
            const pos = toSvg(point)
            return `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`
          })
          return <path key={index} d={`${path.join(' ')} Z`} fill="none" />
        })}
        {spokes.map(([from, to]) => {
          const a = toSvg(from)
          const b = toSvg(to)
          return <line key={`${from.x}-${from.y}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      {POINTS.map((point) => {
        const pos = toSvg(point)
        const occupant = board[keyOf(point)] ?? null
        const selectedHere = selected ? samePoint(selected, point) : false
        const targetHere = isListed(targets, point)
        const movable = occupant !== null && isListed(movableFrom, point)
        const lastMoved = lastPoint ? samePoint(lastPoint, point) : false

        return (
          <g key={keyOf(point)} transform={`translate(${pos.x}, ${pos.y})`} className="intersection">
            <circle
              r={targetHere ? 14 : 7}
              className={`node ${targetHere ? (pendingRemoval ? 'is-captured' : 'is-target') : ''}`}
            />
            {occupant ? (
              <Stone
                player={occupant}
                selected={selectedHere}
                movable={movable && !selectedHere}
                lastMoved={lastMoved}
              />
            ) : null}
            <circle r="28" className="hit" onClick={() => onSelect(point)}>
              <title>{`${point.x},${point.y}`}</title>
            </circle>
          </g>
        )
      })}
    </svg>
  )
}
