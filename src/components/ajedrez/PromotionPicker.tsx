import { pieceName } from '../../ajedrez'
import type { PieceKind } from '../../ajedrez'
import { ChessPiece } from './ChessPiece'

type PromotionPickerProps = {
  player: 'white' | 'black'
  onPick: (kind: PieceKind) => void
}

const OPTIONS: PieceKind[] = ['q', 'r', 'b', 'n']

export function PromotionPicker({ player, onPick }: PromotionPickerProps) {
  return (
    <div className="ajedrez-promo" role="dialog" aria-label="Coronación">
      <p>Elegí pieza</p>
      <div className="ajedrez-promo-row">
        {OPTIONS.map((kind) => (
          <button key={kind} type="button" className="ajedrez-promo-btn" onClick={() => onPick(kind)}>
            <ChessPiece kind={kind} player={player} />
            <span>{pieceName(kind)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
