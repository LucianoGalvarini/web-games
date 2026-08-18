import { GRID_SIZE } from '../../morris'
import type { MorrisVariant } from '../../morris'
import { keyOf, samePoint } from '../../shared/point'
import type { Point } from '../../shared/point'
import type { Player } from '../../shared/types'
import { Stone, StoneDefs } from '../Board/Stone'

const PAD = 56
const GAP = 78
const SIZE = PAD * 2 + GAP * (GRID_SIZE - 1)

type BoardStone = {
  id: number
  point: Point
  player: Player
  capturing?: boolean
}

function toSvg(point: Point): { x: number; y: number } {
  return {
    x: PAD + point.x * GAP,
    y: PAD + point.y * GAP,
  }
}

type MorrisBoardViewProps = {
  variant: MorrisVariant
  stones: BoardStone[]
  selected: Point | null
  targets: Point[]
  movableFrom: Point[]
  lastPoint: Point | null
  millGlow: Point[] | null
  pendingRemoval: boolean
  disabled: boolean
  onSelect: (point: Point) => void
}

function isListed(list: Point[], point: Point): boolean {
  return list.some((item) => samePoint(item, point))
}

export function MorrisBoardView({
  variant,
  stones,
  selected,
  targets,
  movableFrom,
  lastPoint,
  millGlow,
  pendingRemoval,
  disabled,
  onSelect,
}: MorrisBoardViewProps) {
  const lines: Array<readonly [Point, Point]> = [
    ...variant.mills.map((mill) => [mill[0], mill[2]] as const),
    ...(variant.extraAdjacency ?? []),
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
        {lines.map(([from, to]) => {
          const a = toSvg(from)
          const b = toSvg(to)
          return <line key={`${keyOf(from)}-${keyOf(to)}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      <g className="node-layer">
        {variant.points.map((point) => {
          const pos = toSvg(point)
          const targetHere = isListed(targets, point)
          const glowHere = millGlow ? isListed(millGlow, point) : false

          return (
            <g key={keyOf(point)} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={targetHere ? 14 : 7}
                className={`node ${targetHere ? (pendingRemoval ? 'is-captured' : 'is-target') : ''} ${glowHere ? 'is-mill-glow' : ''}`}
              />
            </g>
          )
        })}
      </g>

      <g className="piece-layer">
        {stones.map((stone) => {
          const pos = toSvg(stone.point)
          const selectedHere = selected ? samePoint(selected, stone.point) : false
          const movable = isListed(movableFrom, stone.point)
          const lastMoved = lastPoint ? samePoint(lastPoint, stone.point) : false
          const glowHere = millGlow ? isListed(millGlow, stone.point) : false

          return (
            <g key={stone.id} className="stone-wrap" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
              <g className={`stone-anim ${stone.capturing ? 'is-capturing' : ''} ${glowHere ? 'is-mill-glow' : ''}`}>
                <Stone
                  player={stone.player}
                  selected={selectedHere}
                  movable={movable && !selectedHere}
                  lastMoved={lastMoved}
                />
              </g>
            </g>
          )
        })}
      </g>

      <g className="hit-layer">
        {variant.points.map((point) => {
          const pos = toSvg(point)
          return (
            <g key={keyOf(point)} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="28" className="hit" onClick={() => onSelect(point)}>
                <title>{`${point.x},${point.y}`}</title>
              </circle>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
