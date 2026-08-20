import { ALL_FLOWERS, MOVE_RANGE, flowerName } from '../../paisho'
import type { FlowerKind, Reserve } from '../../paisho'
import type { Player } from '../../shared/types'
import { PaiShoTileFace } from './PaiShoTileFace'

type PaiShoReserveProps = {
  reserve: Reserve
  player: Player
  selected: FlowerKind | null
  disabled: boolean
  onSelect: (kind: FlowerKind) => void
}

export function PaiShoReserve({ reserve, player, selected, disabled, onSelect }: PaiShoReserveProps) {
  return (
    <div className="paisho-reserve" data-manual="pad">
      {ALL_FLOWERS.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`paisho-reserve-btn ${selected === kind ? 'is-selected' : ''}`}
          disabled={disabled || reserve[kind] <= 0}
          aria-label={`${flowerName(kind)}, alcance ${MOVE_RANGE[kind]}, ${reserve[kind]} en reserva`}
          title={`${flowerName(kind)} · alcance ${MOVE_RANGE[kind]}`}
          onClick={() => onSelect(kind)}
        >
          <svg viewBox="0 0 40 40" width="40" height="40" className="paisho-glyph">
            <PaiShoTileFace kind={kind} player={player} />
          </svg>
          <span>
            {flowerName(kind)} · {reserve[kind]}
          </span>
        </button>
      ))}
    </div>
  )
}
