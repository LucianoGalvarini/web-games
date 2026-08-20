import type { PieceKind } from '../../ajedrez'
import type { Player } from '../../shared/types'

type ChessPieceProps = {
  kind: PieceKind
  player: Player
}

function tone(player: Player) {
  if (player === 'white') {
    return { fill: '#f3e6d2', stroke: '#5b3918', ink: '#3d2918' }
  }
  return { fill: '#241910', stroke: '#e4b45a', ink: '#f0d59a' }
}

export function ChessPiece({ kind, player }: ChessPieceProps) {
  const color = tone(player)
  return (
    <svg viewBox="0 0 40 40" className="ajedrez-glyph" aria-hidden="true">
      {kind === 'p' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <circle cx="20" cy="13" r="5.2" />
          <path d="M13 28c2-7 4.5-10 7-10s5 3 7 10z" />
          <rect x="11" y="28" width="18" height="4.5" rx="1.4" />
        </g>
      ) : null}
      {kind === 'n' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <path d="M12 30l2-9 4-3-1-5 5-6 3 3 7 2-2 6-4 2 3 10z" />
          <rect x="11" y="29" width="18" height="4.2" rx="1.3" />
          <circle cx="18" cy="14" r="1.1" fill={color.ink} stroke="none" />
        </g>
      ) : null}
      {kind === 'b' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <circle cx="20" cy="8.5" r="2.2" />
          <path d="M20 11c-4 6-6 11-6 15 0 2 12 2 12 0 0-4-2-9-6-15z" />
          <rect x="12" y="28" width="16" height="4.4" rx="1.3" />
          <path d="M20 14v10" stroke={color.ink} strokeWidth="1.2" fill="none" />
        </g>
      ) : null}
      {kind === 'r' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <path d="M11 12h4v-4h3v4h4v-4h3v4h4v5H11z" />
          <path d="M13 17h14v10H13z" />
          <rect x="10" y="28" width="20" height="4.5" rx="1.3" />
        </g>
      ) : null}
      {kind === 'q' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <circle cx="11" cy="10" r="2" />
          <circle cx="20" cy="7.5" r="2" />
          <circle cx="29" cy="10" r="2" />
          <path d="M11 12l3 14h12l3-14-5 6-4-8-4 8z" />
          <rect x="11" y="28" width="18" height="4.4" rx="1.3" />
        </g>
      ) : null}
      {kind === 'k' ? (
        <g fill={color.fill} stroke={color.stroke} strokeWidth="1.4">
          <path d="M18 6h4v3h3v3h-3v3h-4v-3h-3V9h3z" />
          <path d="M12 16c2 2 4 3 8 3s6-1 8-3l-2 12H14z" />
          <rect x="11" y="28" width="18" height="4.4" rx="1.3" />
        </g>
      ) : null}
    </svg>
  )
}
