import { pieceKanji } from '../../shogi'
import type { DroppableKind, Hand } from '../../shogi'
import type { Player } from '../../shared/types'

const ORDER: DroppableKind[] = ['r', 'b', 'g', 's', 'n', 'l', 'p']

type ShogiHandProps = {
  player: Player
  hand: Hand
  selectedDrop: DroppableKind | null
  droppable: Set<DroppableKind>
  active: boolean
  disabled: boolean
  onSelect: (kind: DroppableKind) => void
}

export function ShogiHand({ player, hand, selectedDrop, droppable, active, disabled, onSelect }: ShogiHandProps) {
  const kinds = ORDER.filter((kind) => hand[kind] > 0)

  return (
    <div className={`shogi-hand is-${player} ${active ? 'is-active' : ''}`}>
      <span className="shogi-hand-label">{player === 'white' ? 'Mano · Blancas' : 'Mano · Negras'}</span>
      <div className="shogi-hand-pieces">
        {kinds.length === 0 ? <span className="shogi-hand-empty">Sin piezas capturadas</span> : null}
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`shogi-hand-piece is-${player} ${selectedDrop === kind ? 'is-selected' : ''}`}
            disabled={disabled || !active || !droppable.has(kind)}
            onClick={() => onSelect(kind)}
          >
            <span className="shogi-glyph">{pieceKanji(kind, false, player)}</span>
            <span className="shogi-hand-count">{hand[kind]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
