import type { Point } from '../../game'

type StoneProps = {
  player: 'white' | 'black'
  selected: boolean
  movable: boolean
  lastMoved: boolean
  lift?: number
  tilt?: number
  scale?: number
}

export function StoneDefs() {
  return (
    <>
      <radialGradient id="stoneWhite" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#fff8ea" />
        <stop offset="70%" stopColor="#e6d3b1" />
        <stop offset="100%" stopColor="#c8ae86" />
      </radialGradient>
      <radialGradient id="stoneBlack" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#4a382c" />
        <stop offset="55%" stopColor="#241910" />
        <stop offset="100%" stopColor="#120c08" />
      </radialGradient>
    </>
  )
}

export function Stone({
  player,
  selected,
  movable,
  lastMoved,
  lift = 0,
  tilt = 0,
  scale = 1,
}: StoneProps) {
  const isWhite = player === 'white'
  const air = Math.min(Math.max(lift, 0) / 13, 1.25)

  return (
    <g className={`stone ${selected ? 'is-selected' : ''} ${movable ? 'is-movable' : ''} ${lastMoved ? 'is-last' : ''}`}>
      <ellipse
        cx={2.5}
        cy={4.5 + lift * 0.25}
        rx={18 + air * 4}
        ry={6 + air * 1.2}
        fill="rgba(20, 10, 4, 0.35)"
        opacity={Math.max(0.12, 1 - air * 0.4)}
      />
      <g transform={`translate(0 ${-lift}) scale(${scale}) rotate(${tilt})`}>
        <circle
          r={20}
          fill={isWhite ? 'url(#stoneWhite)' : 'url(#stoneBlack)'}
          stroke={isWhite ? '#d7c4a3' : '#1a120c'}
          strokeWidth={1.4}
        />
        <circle
          cx={-6}
          cy={-7}
          r={7}
          fill={isWhite ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)'}
        />
      </g>
    </g>
  )
}

export function pointLabel(point: Point): string {
  const file = String.fromCharCode(97 + point.x)
  const rank = 5 - point.y
  return `${file}${rank}`
}
