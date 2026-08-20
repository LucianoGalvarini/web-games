import type { FlowerKind } from '../../paisho'
import type { Player } from '../../shared/types'

type PaiShoTileFaceProps = {
  kind: FlowerKind
  player: Player
}

function tone(player: Player) {
  if (player === 'white') {
    return { fill: '#f3e6d2', stroke: '#5b3918', ink: '#6d4320', red: '#c45c48', white: '#efe6d6' }
  }
  return { fill: '#241910', stroke: '#e4b45a', ink: '#f0d59a', red: '#8f3a28', white: '#d9d2c4' }
}

function petalCount(kind: FlowerKind): 3 | 4 | 5 | 0 {
  if (kind === 'r3' || kind === 'w3') {
    return 3
  }
  if (kind === 'r4' || kind === 'w4') {
    return 4
  }
  if (kind === 'r5' || kind === 'w5') {
    return 5
  }
  return 0
}

export function PaiShoTileFace({ kind, player }: PaiShoTileFaceProps) {
  const color = tone(player)
  const count = petalCount(kind)
  const petal = kind === 'lotus' ? '#e8c27a' : kind.startsWith('r') ? color.red : color.white
  return (
    <g aria-hidden="true">
      <circle cx="20" cy="20" r="17.5" fill={color.fill} stroke={color.stroke} strokeWidth="1.6" />
      {kind === 'lotus' ? (
        <g fill={petal} stroke={color.stroke} strokeWidth="0.8">
          <path d="M20 8c3 5 4 8 0 12-4-4-3-7 0-12z" />
          <path d="M20 8c3 5 4 8 0 12-4-4-3-7 0-12z" transform="rotate(72 20 22)" />
          <path d="M20 8c3 5 4 8 0 12-4-4-3-7 0-12z" transform="rotate(144 20 22)" />
          <path d="M20 8c3 5 4 8 0 12-4-4-3-7 0-12z" transform="rotate(216 20 22)" />
          <path d="M20 8c3 5 4 8 0 12-4-4-3-7 0-12z" transform="rotate(288 20 22)" />
          <circle cx="20" cy="22" r="3" fill={color.ink} stroke="none" />
        </g>
      ) : (
        <g>
          {Array.from({ length: count }, (_, index) => (
            <ellipse
              key={index}
              cx="20"
              cy="12.2"
              rx="4.1"
              ry="7.2"
              fill={petal}
              stroke={color.stroke}
              strokeWidth="0.8"
              transform={`rotate(${(360 / count) * index} 20 20)`}
            />
          ))}
          <circle cx="20" cy="20" r="5.4" fill={color.fill} stroke={color.stroke} strokeWidth="0.7" />
          <text
            x="20"
            y="23.2"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fontFamily="Outfit, sans-serif"
            fill={color.ink}
          >
            {count}
          </text>
        </g>
      )}
    </g>
  )
}
