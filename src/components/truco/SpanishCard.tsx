import type { Card, Rank, Suit } from '../../truco'
import { cardLabel } from '../../truco'

type CardSize = 'sm' | 'md'

type SpanishCardProps = {
  card?: Card
  faceDown?: boolean
  playable?: boolean
  disabled?: boolean
  size?: CardSize
  onClick?: () => void
}

const SUIT_COLOR: Record<Suit, string> = {
  oros: '#b45309',
  copas: '#9b1c1c',
  espadas: '#1e3a5f',
  bastos: '#3f6212',
}

const SUIT_NAME: Record<Suit, string> = {
  oros: 'OROS',
  copas: 'COPAS',
  espadas: 'ESPADAS',
  bastos: 'BASTOS',
}

function rankMain(rank: Rank): string {
  if (rank === 1) {
    return 'AS'
  }
  return String(rank)
}

function rankName(rank: Rank): string | null {
  if (rank === 10) {
    return 'SOTA'
  }
  if (rank === 11) {
    return 'CABALLO'
  }
  if (rank === 12) {
    return 'REY'
  }
  return null
}

function SuitMark({ suit, x, y, size }: { suit: Suit; x: number; y: number; size: number }) {
  const color = SUIT_COLOR[suit]
  if (suit === 'oros') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={size} fill={color} />
        <circle r={size * 0.72} fill="none" stroke="#fde68a" strokeWidth={size * 0.12} />
        <circle r={size * 0.42} fill="#fde68a" />
        <circle r={size * 0.16} fill={color} />
      </g>
    )
  }
  if (suit === 'copas') {
    const s = size / 14
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
        <path d="M0-16c-7.5 0-13 6-13 13 0 9 8 14 13 22 5-8 13-13 13-22 0-7-5.5-13-13-13z" />
        <rect x="-3.5" y="17" width="7" height="7" rx="1.2" />
        <rect x="-9" y="23" width="18" height="4.2" rx="1.2" />
      </g>
    )
  }
  if (suit === 'espadas') {
    const s = size / 15
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
        <path d="M0-22l8 16c2.4 4.5 2.4 9 0 12l-8 5-8-5c-2.4-3-2.4-7.5 0-12z" />
        <rect x="-1.8" y="9" width="3.6" height="12" rx="0.6" />
        <rect x="-7" y="20" width="14" height="3.4" rx="0.8" />
      </g>
    )
  }
  const s = size / 15
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <rect x="-2.4" y="-20" width="4.8" height="34" rx="2" />
      <path d="M-2.2-9c-8-8-13-5-13 3 0 5 4 8 10 8h5zM2.2-9c8-8 13-5 13 3 0 5-4 8-10 8h-5z" />
      <path d="M-2 4c-4 6-4 10 0 12h4c4-2 4-6 0-12z" />
      <rect x="-8" y="15" width="16" height="4" rx="1" />
    </g>
  )
}

function pipPoints(rank: Rank): { x: number; y: number }[] {
  const cx = 80
  const left = 50
  const right = 110
  const top = 62
  const mid = 120
  const bot = 178
  const upper = 90
  if (rank === 1) {
    return [{ x: cx, y: mid }]
  }
  if (rank === 2) {
    return [
      { x: cx, y: top },
      { x: cx, y: bot },
    ]
  }
  if (rank === 3) {
    return [
      { x: cx, y: top },
      { x: cx, y: mid },
      { x: cx, y: bot },
    ]
  }
  if (rank === 4) {
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bot },
      { x: right, y: bot },
    ]
  }
  if (rank === 5) {
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: cx, y: mid },
      { x: left, y: bot },
      { x: right, y: bot },
    ]
  }
  if (rank === 6) {
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: mid },
      { x: right, y: mid },
      { x: left, y: bot },
      { x: right, y: bot },
    ]
  }
  if (rank === 7) {
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: cx, y: upper },
      { x: left, y: mid },
      { x: right, y: mid },
      { x: left, y: bot },
      { x: right, y: bot },
    ]
  }
  return []
}

function Corner({ rank, suit }: { rank: Rank; suit: Suit }) {
  const color = SUIT_COLOR[suit]
  const name = rankName(rank)
  return (
    <g>
      <text
        x="12"
        y="28"
        fill={color}
        fontSize={rank === 1 || rank >= 10 ? 16 : 26}
        fontFamily="Outfit, Segoe UI, sans-serif"
        fontWeight="800"
      >
        {rankMain(rank)}
      </text>
      {name ? (
        <text
          x="12"
          y="39"
          fill={color}
          fontSize="7"
          fontFamily="Outfit, Segoe UI, sans-serif"
          fontWeight="700"
        >
          {name}
        </text>
      ) : null}
      <SuitMark suit={suit} x={22} y={name ? 52 : 44} size={7} />
    </g>
  )
}

function FigureArt({ rank, suit }: { rank: Rank; suit: Suit }) {
  const color = SUIT_COLOR[suit]
  const name = rankName(rank) ?? 'AS'
  return (
    <g>
      <rect x="42" y="58" width="76" height="124" rx="10" fill="#fbf3e3" stroke={color} strokeWidth="2.4" />
      {rank === 10 ? (
        <g fill={color}>
          <circle cx="80" cy="86" r="11" />
          <rect x="68" y="98" width="24" height="28" rx="4" />
          <rect x="72" y="126" width="7" height="22" rx="2" />
          <rect x="81" y="126" width="7" height="22" rx="2" />
          <rect x="108" y="92" width="4" height="48" rx="1.5" />
          <circle cx="110" cy="88" r="5" fill={color} />
        </g>
      ) : null}
      {rank === 11 ? (
        <g fill={color}>
          <ellipse cx="78" cy="118" rx="22" ry="14" />
          <path d="M96 112c10-2 16-10 18-20 1 10-2 18-10 22z" />
          <circle cx="118" cy="90" r="7" />
          <rect x="62" y="128" width="6" height="18" rx="2" />
          <rect x="74" y="130" width="6" height="16" rx="2" />
          <rect x="86" y="130" width="6" height="16" rx="2" />
          <rect x="96" y="128" width="6" height="18" rx="2" />
          <circle cx="80" cy="100" r="8" />
        </g>
      ) : null}
      {rank === 12 ? (
        <g fill={color}>
          <path d="M62 78l9 8 9-12 9 12 9-8-4 18H66z" />
          <circle cx="80" cy="108" r="13" />
          <path d="M54 148c4-18 14-24 26-24s22 6 26 24z" />
        </g>
      ) : null}
      <SuitMark suit={suit} x={80} y={rank === 12 ? 132 : 108} size={rank === 12 ? 9 : 11} />
      <text
        x="80"
        y="166"
        textAnchor="middle"
        fill={color}
        fontSize={rank === 11 ? 11 : 13}
        fontFamily="Outfit, Segoe UI, sans-serif"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        {name}
      </text>
    </g>
  )
}

function CardFace({ card, compact }: { card: Card; compact: boolean }) {
  const color = SUIT_COLOR[card.suit]
  const figure = card.rank === 1 || card.rank >= 10
  const name = rankName(card.rank)

  if (compact) {
    return (
      <>
        <text
          x="80"
          y={name ? 78 : 88}
          textAnchor="middle"
          fill={color}
          fontSize={card.rank === 1 ? 28 : 40}
          fontFamily="Outfit, Segoe UI, sans-serif"
          fontWeight="800"
        >
          {rankMain(card.rank)}
        </text>
        {name ? (
          <text
            x="80"
            y="96"
            textAnchor="middle"
            fill={color}
            fontSize="11"
            fontFamily="Outfit, Segoe UI, sans-serif"
            fontWeight="800"
          >
            {name}
          </text>
        ) : null}
        <SuitMark suit={card.suit} x={80} y={name ? 128 : 132} size={22} />
        <text
          x="80"
          y="188"
          textAnchor="middle"
          fill={color}
          fontSize="9"
          fontFamily="Outfit, Segoe UI, sans-serif"
          fontWeight="700"
          letterSpacing="0.14em"
        >
          {SUIT_NAME[card.suit]}
        </text>
      </>
    )
  }

  return (
    <>
      <Corner rank={card.rank} suit={card.suit} />
      <g transform="rotate(180 80 120)">
        <Corner rank={card.rank} suit={card.suit} />
      </g>
      {figure ? (
        <FigureArt rank={card.rank} suit={card.suit} />
      ) : (
        pipPoints(card.rank).map((pip, index) => (
          <SuitMark key={`${pip.x}-${pip.y}-${index}`} suit={card.suit} x={pip.x} y={pip.y} size={card.rank === 1 ? 24 : 14} />
        ))
      )}
    </>
  )
}

export function SpanishCard({
  card,
  faceDown = false,
  playable = false,
  disabled = false,
  size = 'md',
  onClick,
}: SpanishCardProps) {
  const label = card && !faceDown ? cardLabel(card) : 'Carta boca abajo'
  const className = `truco-card is-${size}${playable ? ' is-playable' : ''}${faceDown ? ' is-back' : ''}`
  const face = (
    <svg viewBox="0 0 160 240" aria-hidden="true">
      <rect x="1.5" y="1.5" width="157" height="237" rx="16" fill="#f8eedc" stroke="#5b3918" strokeWidth="3" />
      <rect x="8" y="8" width="144" height="224" rx="12" fill="none" stroke="rgba(91, 57, 24, 0.18)" strokeWidth="1.2" />
      {faceDown || !card ? (
        <>
          <rect x="14" y="14" width="132" height="212" rx="10" fill="#7a4a1f" />
          <rect x="24" y="24" width="112" height="192" rx="8" fill="none" stroke="#e4b45a" strokeWidth="3" />
          <path
            d="M80 70l18 18-18 18-18-18zM80 134l18 18-18 18-18-18z"
            fill="none"
            stroke="#f0d59a"
            strokeWidth="3"
          />
          <circle cx="80" cy="120" r="10" fill="#e4b45a" />
        </>
      ) : (
        <CardFace card={card} compact={size === 'sm'} />
      )}
    </svg>
  )

  if (!onClick) {
    return (
      <div className={className} role="img" aria-label={label}>
        {face}
      </div>
    )
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick} aria-label={label}>
      {face}
    </button>
  )
}
