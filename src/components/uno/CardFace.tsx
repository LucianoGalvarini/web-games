import type { Card } from '../../uno/types'

const SYMBOL: Record<string, string> = {
  skip: '\u2298',
  reverse: '\u21C4',
  draw2: '+2',
  wild: '',
  wild4: '+4',
}

function isAction(card: Card): boolean {
  return (
    card.value === 'skip' ||
    card.value === 'reverse' ||
    card.value === 'draw2' ||
    card.value === 'wild' ||
    card.value === 'wild4'
  )
}

type CardFaceProps = {
  card: Card
  size?: 'sm'
}

export function CardFace({ card, size }: CardFaceProps) {
  const label = SYMBOL[card.value] ?? card.value
  const action = isAction(card)
  const isWild = card.color === 'wild'

  return (
    <div className={`uno-card color-${card.color}`} style={size === 'sm' ? { width: 56, height: 82 } : undefined}>
      <span className="uno-card-corner tl">{label}</span>
      <span className="uno-card-corner br">{label}</span>
      {!isWild && <span className="uno-card-oval" />}
      {isWild ? (
        <span className="uno-card-wildpip">
          <i className="q red" />
          <i className="q yellow" />
          <i className="q green" />
          <i className="q blue" />
          {card.value === 'wild4' && <span className="uno-card-wild4-label">+4</span>}
        </span>
      ) : (
        <span className={`uno-card-pip${action ? ' is-action' : ''}`}>{label}</span>
      )}
    </div>
  )
}
