import { BOARD_SIZE, fileOf, pieceKanji, pieceName, rankOf, squareLabel } from '../../shogi'
import type { PieceKind } from '../../shogi'
import type { Player } from '../../shared/types'

export type BoardPiece = {
  id: number
  index: number
  player: Player
  kind: PieceKind
  promoted: boolean
  capturing?: boolean
}

type PendingPromotion = { from: number; to: number }

type ShogiBoardProps = {
  pieces: BoardPiece[]
  selected: number | null
  targets: number[]
  lastFrom: number | null
  lastTo: number | null
  checkIndex: number | null
  flipped: boolean
  disabled: boolean
  pendingPromotion: PendingPromotion | null
  onSelect: (index: number) => void
  onConfirmPromotion: (yes: boolean) => void
}

const CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index)

function displayIndex(index: number, flipped: boolean): { x: number; y: number } {
  const file = fileOf(index)
  const rank = rankOf(index)
  if (!flipped) {
    return { x: file, y: rank }
  }
  return { x: BOARD_SIZE - 1 - file, y: BOARD_SIZE - 1 - rank }
}

export function ShogiBoard({
  pieces,
  selected,
  targets,
  lastFrom,
  lastTo,
  checkIndex,
  flipped,
  disabled,
  pendingPromotion,
  onSelect,
  onConfirmPromotion,
}: ShogiBoardProps) {
  return (
    <div className={`shogi-field ${disabled ? 'is-disabled' : ''}`}>
      <div className="shogi-cells">
        {CELLS.map((index) => {
          const pose = displayIndex(index, flipped)
          const target = targets.includes(index)
          const last = index === lastFrom || index === lastTo
          const check = index === checkIndex
          return (
            <button
              key={index}
              type="button"
              className={[
                'shogi-cell',
                target ? 'is-target' : '',
                last ? 'is-last' : '',
                check ? 'is-check' : '',
                selected === index ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ gridColumn: pose.x + 1, gridRow: pose.y + 1 }}
              disabled={disabled}
              aria-label={squareLabel(index)}
              onClick={() => onSelect(index)}
            />
          )
        })}
      </div>

      <div className="shogi-pieces">
        {pieces.map((piece) => {
          const pose = displayIndex(piece.index, flipped)
          const rotated = (piece.player === 'black') !== flipped
          return (
            <div
              key={piece.id}
              className={[
                'shogi-piece',
                `is-${piece.player}`,
                rotated ? 'is-rotated' : '',
                piece.promoted ? 'is-promoted' : '',
                piece.index === selected ? 'is-selected' : '',
                targets.includes(piece.index) ? 'is-target' : '',
                piece.index === checkIndex ? 'is-check' : '',
                piece.capturing ? 'is-capturing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${(pose.x / BOARD_SIZE) * 100}%`,
                top: `${(pose.y / BOARD_SIZE) * 100}%`,
              }}
              onClick={() => !disabled && onSelect(piece.index)}
            >
              <span className="shogi-koma">
                <span className="shogi-glyph">{pieceKanji(piece.kind, piece.promoted, piece.player)}</span>
              </span>
              <span className="visually-hidden">{pieceName(piece.kind, piece.promoted)}</span>
            </div>
          )
        })}
      </div>

      {pendingPromotion ? (
        <div className="shogi-promo" role="dialog" aria-label="Promoción">
          <p>¿Promocionar la pieza?</p>
          <div className="shogi-promo-row">
            <button type="button" className="btn btn-gold" onClick={() => onConfirmPromotion(true)}>
              Sí
            </button>
            <button type="button" className="btn" onClick={() => onConfirmPromotion(false)}>
              No
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
