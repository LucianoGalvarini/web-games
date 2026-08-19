import type { Card, Rank, Suit } from '../../truco'
import { cardLabel } from '../../truco'

function cornerRank(rank: Rank): string {
  if (rank === 10) {
    return 'S'
  }
  if (rank === 11) {
    return 'C'
  }
  if (rank === 12) {
    return 'R'
  }
  return String(rank)
}

type SpanishCardProps = {
  card?: Card
  faceDown?: boolean
  playable?: boolean
  disabled?: boolean
  onClick?: () => void
}

const SUIT_COLOR: Record<Suit, string> = {
  oros: '#b8860b',
  copas: '#8b1e1e',
  espadas: '#1c3147',
  bastos: '#3a5a2a',
}

function SuitMark({ suit, x, y, size }: { suit: Suit; x: number; y: number; size: number }) {
  const color = SUIT_COLOR[suit]
  if (suit === 'oros') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={size} fill={color} />
        <circle r={size * 0.62} fill="none" stroke="#f6ead4" strokeWidth={size * 0.18} />
        <circle r={size * 0.22} fill="#f6ead4" />
      </g>
    )
  }
  if (suit === 'copas') {
    const s = size / 12
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
        <path d="M0-12c-6 0-10 4.5-10 10 0 8 10 14 10 20 0-6 10-12 10-20 0-5.5-4-10-10-10z" />
        <rect x="-3.2" y="16" width="6.4" height="5" rx="1" />
        <rect x="-7" y="20.5" width="14" height="3.2" rx="1" />
      </g>
    )
  }
  if (suit === 'espadas') {
    const s = size / 13
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
        <path d="M0-18l7 14c2 4 2 8 0 10l-7 4-7-4c-2-2-2-6 0-10z" />
        <rect x="-1.6" y="8" width="3.2" height="10" />
        <rect x="-6" y="17" width="12" height="2.6" rx="0.6" />
      </g>
    )
  }
  const s = size / 13
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <rect x="-2" y="-16" width="4" height="28" rx="1.4" />
      <path d="M-2-8c-6-6-10-4-10 2 0 4 3 6 8 6h4zM2-8c6-6 10-4 10 2 0 4-3 6-8 6h-4z" />
      <rect x="-6" y="12" width="12" height="3" rx="0.8" />
    </g>
  )
}

function pipPoints(rank: Rank): { x: number; y: number }[] {
  const cx = 80
  const left = 52
  const right = 108
  const top = 58
  const mid = 120
  const bot = 182
  const upper = 88
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

export function SpanishCard({ card, faceDown = false, playable = false, disabled = false, onClick }: SpanishCardProps) {
  const label = card && !faceDown ? cardLabel(card) : 'Carta boca abajo'
  const className = `truco-card${playable ? ' is-playable' : ''}${faceDown ? ' is-back' : ''}`
  const face = (
    <svg viewBox="0 0 160 240" aria-hidden="true">
      <rect x="2" y="2" width="156" height="236" rx="14" fill="#f3e6d2" stroke="#5b3918" strokeWidth="4" />
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
        <CardFace card={card} />
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

function CardFace({ card }: { card: Card }) {
  const color = SUIT_COLOR[card.suit]
  const figure = card.rank >= 10
  const pips = pipPoints(card.rank)
  const pipSize = card.rank === 1 ? 22 : 13

  return (
    <>
      <text x="16" y="32" fill={color} fontSize="22" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="700">
        {cornerRank(card.rank)}
      </text>
      <SuitMark suit={card.suit} x={28} y={48} size={8} />
      <g transform="rotate(180 80 120)">
        <text x="16" y="32" fill={color} fontSize="22" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="700">
          {cornerRank(card.rank)}
        </text>
        <SuitMark suit={card.suit} x={28} y={48} size={8} />
      </g>
      {figure ? (
        <g>
          <rect x="48" y="72" width="64" height="96" rx="8" fill="#efe0c6" stroke={color} strokeWidth="2" />
          <SuitMark suit={card.suit} x={80} y={108} size={16} />
          <text
            x="80"
            y="148"
            textAnchor="middle"
            fill={color}
            fontSize="18"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontWeight="700"
          >
            {card.rank === 10 ? 'Sota' : card.rank === 11 ? 'Caballo' : 'Rey'}
          </text>
        </g>
      ) : (
        pips.map((pip, index) => (
          <SuitMark key={`${pip.x}-${pip.y}-${index}`} suit={card.suit} x={pip.x} y={pip.y} size={pipSize} />
        ))
      )}
    </>
  )
}
