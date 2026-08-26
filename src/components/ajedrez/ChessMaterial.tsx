import { opponent } from '../../shared/player'
import type { Player } from '../../shared/types'
import type { PieceKind } from '../../ajedrez'
import { ChessPiece } from './ChessPiece'

type ChessMaterialProps = {
  player: Player
  kinds: PieceKind[]
  advantage: number
}

function formatAdvantage(centipawns: number): string {
  if (centipawns <= 0) {
    return ''
  }
  const pawns = Math.round(centipawns / 10) / 10
  return Number.isInteger(pawns) ? `+${pawns}` : `+${pawns.toFixed(1)}`
}

export function ChessMaterial({ player, kinds, advantage }: ChessMaterialProps) {
  const capturedColor = opponent(player)
  const label = formatAdvantage(advantage)
  if (kinds.length === 0 && !label) {
    return <span>Sin capturas</span>
  }
  return (
    <span className="ajedrez-material">
      {kinds.map((kind, index) => (
        <span key={`${kind}-${index}`} className="ajedrez-material-piece" title={kind}>
          <ChessPiece kind={kind} player={capturedColor} />
        </span>
      ))}
      {label ? <span className="ajedrez-material-adv">{label}</span> : null}
    </span>
  )
}
