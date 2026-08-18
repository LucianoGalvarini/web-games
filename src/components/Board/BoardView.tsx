import { COLS, ROWS, samePoint } from '../../game'
import type { Board, Move, Point } from '../../game'
import { BoardLines } from './BoardLines'
import { BOARD_HEIGHT, BOARD_WIDTH, toSvg } from './geometry'
import { Stone, StoneDefs, pointLabel } from './Stone'
import { useStoneMotion } from './useStoneMotion'

type BoardViewProps = {
  board: Board
  selected: Point | null
  targets: Point[]
  movableFrom: Point[]
  hoverCaptures: Point[]
  choiceCaptures: Point[]
  lastMove: Move | null
  disabled: boolean
  onSelect: (point: Point) => void
  onHover: (point: Point | null) => void
}

function isListed(list: Point[], point: Point): boolean {
  return list.some((item) => samePoint(item, point))
}

export function BoardView({
  board,
  selected,
  targets,
  movableFrom,
  hoverCaptures,
  choiceCaptures,
  lastMove,
  disabled,
  onSelect,
  onHover,
}: BoardViewProps) {
  const stones = useStoneMotion(board, lastMove)
  const points: Point[] = []
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      points.push({ x, y })
    }
  }

  const paintedStones = [...stones].sort((a, b) => {
    if (a.departing !== b.departing) {
      return a.departing ? -1 : 1
    }
    if (a.moving !== b.moving) {
      return a.moving ? 1 : -1
    }
    if (a.point.y !== b.point.y) {
      return a.point.y - b.point.y
    }
    return a.point.x - b.point.x
  })

  return (
    <svg
      className={`board-svg ${disabled ? 'is-disabled' : ''}`}
      viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
      role="img"
      aria-label="Tablero de Fanorona"
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
        width={BOARD_WIDTH - 16}
        height={BOARD_HEIGHT - 16}
        rx="18"
        fill="url(#wood)"
        stroke="#5b3918"
        strokeWidth="10"
      />
      <rect
        x="22"
        y="22"
        width={BOARD_WIDTH - 44}
        height={BOARD_HEIGHT - 44}
        rx="12"
        fill="none"
        stroke="#e8c27a"
        strokeWidth="2"
        opacity="0.55"
      />

      <BoardLines />

      {points.map((point) => {
        const pos = toSvg(point)
        const targetHere = isListed(targets, point)
        const capturedHere = isListed(hoverCaptures, point) || isListed(choiceCaptures, point)

        return (
          <g
            key={`${point.x}-${point.y}`}
            transform={`translate(${pos.x}, ${pos.y})`}
            className="intersection"
          >
            <circle
              r={targetHere ? 14 : 7}
              className={`node ${targetHere ? 'is-target' : ''} ${capturedHere ? 'is-captured' : ''}`}
            />
            <circle
              r="28"
              className="hit"
              onClick={() => onSelect(point)}
              onMouseEnter={() => onHover(point)}
              onMouseLeave={() => onHover(null)}
            >
              <title>{pointLabel(point)}</title>
            </circle>
          </g>
        )
      })}

      {paintedStones.map((stone) => {
        const selectedHere = selected ? samePoint(selected, stone.point) : false
        const movable = !stone.departing && isListed(movableFrom, stone.point)
        const lastMoved = lastMove ? samePoint(lastMove.to, stone.point) : false

        return (
          <g
            key={stone.id}
            className="stone-actor"
            transform={`translate(${stone.x}, ${stone.y})`}
            opacity={stone.opacity}
          >
            <g className={`stone-bob ${selectedHere && !stone.moving ? 'is-selected' : ''}`}>
              <Stone
                player={stone.player}
                selected={selectedHere}
                movable={movable && !selectedHere}
                lastMoved={lastMoved}
                lift={stone.lift}
                tilt={stone.tilt}
                scale={stone.scale}
              />
            </g>
          </g>
        )
      })}
    </svg>
  )
}
