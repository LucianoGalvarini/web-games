import { pieceName } from '../../ajedrez'
import type { PieceKind } from '../../ajedrez'
import { ChessPiece } from './ChessPiece'

type PromotionPickerProps = {
  player: 'white' | 'black'
  onPick: (kind: PieceKind) => void
  onCancel: () => void
}

const OPTIONS: PieceKind[] = ['q', 'r', 'b', 'n']

export function PromotionPicker({ player, onPick, onCancel }: PromotionPickerProps) {
  return (
    <div
      className="ajedrez-promo"
      role="dialog"
      aria-modal="true"
      aria-label="Coronación"
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onCancel()
        }
      }}
    >
      <div
        className="ajedrez-promo-card"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <p>Elegí pieza</p>
        <div className="ajedrez-promo-row">
          {OPTIONS.map((kind) => (
            <button key={kind} type="button" className="ajedrez-promo-btn" onClick={() => onPick(kind)}>
              <ChessPiece kind={kind} player={player} />
              <span>{pieceName(kind)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn ajedrez-promo-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
