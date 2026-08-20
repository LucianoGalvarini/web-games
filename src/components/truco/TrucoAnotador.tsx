import { useId } from 'react'
import { TARGET_SCORE, scoreBoxes, scoreHalf } from '../../truco'

type TrucoAnotadorProps = {
  leftName: string
  leftPoints: number
  rightName: string
  rightPoints: number
}

type StickPose = {
  cx: number
  cy: number
  length: number
  angle: number
  head: 'start' | 'end'
}

const GROUP = 108
const STICKS: StickPose[] = [
  { cx: 22, cy: 54, length: 70, angle: 90, head: 'start' },
  { cx: 54, cy: 22, length: 70, angle: 0, head: 'end' },
  { cx: 86, cy: 54, length: 70, angle: 90, head: 'end' },
  { cx: 54, cy: 86, length: 70, angle: 0, head: 'start' },
  { cx: 54, cy: 54, length: 92, angle: 41, head: 'end' },
]

const NUDGE = [
  { a: -1.8, x: 0.4, y: -0.3 },
  { a: 1.4, x: -0.35, y: 0.25 },
  { a: -1.1, x: 0.2, y: 0.4 },
  { a: 1.6, x: -0.2, y: -0.35 },
  { a: -1.3, x: 0.35, y: 0.2 },
]

const PILE: { x: number; y: number; a: number }[] = [
  { x: 36, y: 28, a: -18 },
  { x: 44, y: 26, a: -8 },
  { x: 52, y: 24, a: 4 },
  { x: 60, y: 27, a: 12 },
  { x: 68, y: 25, a: 22 },
  { x: 40, y: 34, a: -14 },
  { x: 50, y: 36, a: 2 },
  { x: 61, y: 33, a: 16 },
  { x: 47, y: 42, a: -6 },
  { x: 57, y: 40, a: 10 },
]

function Fosforo({
  pose,
  nudge,
  wood,
  head,
}: {
  pose: StickPose
  nudge: { a: number; x: number; y: number }
  wood: string
  head: string
}) {
  const length = pose.length
  const thick = 8.2
  const headX = pose.head === 'end' ? length / 2 - 0.6 : -length / 2 + 0.6
  return (
    <g
      transform={`translate(${pose.cx + nudge.x} ${pose.cy + nudge.y}) rotate(${pose.angle + nudge.a})`}
    >
      <rect
        x={-length / 2}
        y={-thick / 2}
        width={length}
        height={thick}
        rx={thick / 2}
        fill={`url(#${wood})`}
      />
      <rect
        x={-length / 2 + 3}
        y={-thick / 2 + 1.1}
        width={length - 8}
        height={2.2}
        rx={1}
        fill="#f8e7c2"
        opacity={0.38}
      />
      <ellipse cx={headX} cy={0} rx={5.1} ry={6.1} fill={`url(#${head})`} />
      <ellipse cx={headX - 1.2} cy={-1.6} rx={1.8} ry={2.1} fill="#ffb199" opacity={0.55} />
    </g>
  )
}

function FosforoDefs({ wood, head, shadow }: { wood: string; head: string; shadow: string }) {
  return (
    <defs>
      <linearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0d7a4" />
        <stop offset="40%" stopColor="#d4ae6c" />
        <stop offset="100%" stopColor="#9a6b34" />
      </linearGradient>
      <radialGradient id={head} cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#ff6a4a" />
        <stop offset="45%" stopColor="#d3261c" />
        <stop offset="100%" stopColor="#6a0f0c" />
      </radialGradient>
      <filter id={shadow} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0.8" dy="1.8" stdDeviation="1.2" floodColor="#000" floodOpacity="0.45" />
      </filter>
    </defs>
  )
}

function FosforoGroup({ filled, seed, uid }: { filled: number; seed: number; uid: string }) {
  const wood = `anotador-wood-${uid}`
  const head = `anotador-head-${uid}`
  const shadow = `anotador-shadow-${uid}`
  return (
    <svg className="truco-anotador-group" viewBox={`0 0 ${GROUP} ${GROUP}`} aria-hidden="true">
      <FosforoDefs wood={wood} head={head} shadow={shadow} />
      <g filter={`url(#${shadow})`}>
        {STICKS.slice(0, filled).map((pose, index) => {
          const nudge = NUDGE[(index + seed) % NUDGE.length] ?? NUDGE[0]
          if (!nudge) {
            return null
          }
          return <Fosforo key={index} pose={pose} nudge={nudge} wood={wood} head={head} />
        })}
      </g>
    </svg>
  )
}

function AnotadorColumn({ name, points, uid }: { name: string; points: number; uid: string }) {
  const half = scoreHalf(points)
  const boxes = scoreBoxes(half.value)
  return (
    <div className="truco-anotador-col">
      <p className="truco-anotador-name">{name}</p>
      <p className={`truco-anotador-half is-${half.label.toLowerCase()}`}>
        {half.value} {half.label}
      </p>
      <div className="truco-anotador-groups">
        {boxes.map((filled, index) => (
          <FosforoGroup key={index} filled={filled} seed={index * 3 + 1} uid={`${uid}-${index}`} />
        ))}
      </div>
    </div>
  )
}

function AnotadorPole() {
  const waves = 11
  const steps = 80
  let celeste = `M 24 8`
  let blanca = `M 24 20`
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    const y = 8 + t * 500
    celeste += ` L ${24 + Math.sin(t * waves * Math.PI * 2) * 13} ${y}`
    blanca += ` L ${24 + Math.sin(t * waves * Math.PI * 2 + Math.PI) * 13} ${y}`
  }
  return (
    <svg className="truco-anotador-pole" viewBox="0 0 48 520" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="anotador-pole-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a6418" />
          <stop offset="35%" stopColor="#f0d59a" />
          <stop offset="70%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#6e4e12" />
        </linearGradient>
      </defs>
      <rect x="18" y="0" width="12" height="520" rx="6" fill="url(#anotador-pole-gold)" />
      <path d={celeste} fill="none" stroke="#74acdf" strokeWidth="7" strokeLinecap="round" />
      <path d={blanca} fill="none" stroke="#f6f6f6" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  )
}

function AnotadorPile({ uid }: { uid: string }) {
  const wood = `anotador-pile-wood-${uid}`
  const head = `anotador-pile-head-${uid}`
  const shadow = `anotador-pile-shadow-${uid}`
  const stick: StickPose = { cx: 0, cy: 0, length: 52, angle: 90, head: 'start' }
  return (
    <svg className="truco-anotador-pile" viewBox="0 0 104 64" aria-hidden="true">
      <FosforoDefs wood={wood} head={head} shadow={shadow} />
      <g filter={`url(#${shadow})`}>
        {PILE.map((item, index) => (
          <g key={index} transform={`translate(${item.x} ${item.y}) rotate(${item.a})`}>
            <Fosforo pose={stick} nudge={{ a: 0, x: 0, y: 0 }} wood={wood} head={head} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function TrucoAnotador({
  leftName,
  leftPoints,
  rightName,
  rightPoints,
}: TrucoAnotadorProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <div
      className="truco-anotador"
      aria-label={`${leftName} ${leftPoints}, ${rightName} ${rightPoints}, a ${TARGET_SCORE}`}
    >
      <div className="truco-anotador-target">{TARGET_SCORE}</div>
      <AnotadorPole />
      <div className="truco-anotador-cols">
        <AnotadorColumn name={leftName} points={leftPoints} uid={`${uid}-l`} />
        <AnotadorColumn name={rightName} points={rightPoints} uid={`${uid}-r`} />
      </div>
      <AnotadorPile uid={uid} />
    </div>
  )
}
