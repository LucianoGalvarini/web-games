import { DUPLICATE_SELL_VALUE, RARITY_LABEL } from '../../pokealbum'
import type { AlbumEntry, PokedexEntry } from '../../pokealbum'
import { heightToScale, usePokemonHeight } from '../../hooks/usePokemonHeight'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type AlbumSlotProps = {
  p: PokedexEntry
  entry: AlbumEntry
  pendingCount: number
  onSell: (id: number) => void
  onStick: (id: number) => void
  onOpenPokedex: (id: number) => void
}

export function AlbumSlot({ p, entry, pendingCount, onSell, onStick, onOpenPokedex }: AlbumSlotProps) {
  const hasPending = pendingCount > 0
  const heightM = usePokemonHeight(p.id)
  const scale = entry.owned || hasPending ? heightToScale(heightM) : 1

  return (
    <div
      data-rarity={p.rarity}
      className={`pokealbum-slot${entry.owned ? ' is-owned' : ''}${hasPending ? ' has-pending' : ''}`}
      onMouseEnter={() => (entry.owned || hasPending) && playSfx('hover')}
    >
      {hasPending ? (
        <button type="button" className="pokealbum-stick-btn" onClick={() => onStick(p.id)}>
          <span className="pokealbum-stick-silhouette">
            <PokeSprite id={p.id} name={p.name} scale={scale} />
            <span className="pokealbum-stick-question" aria-hidden="true">
              ?
            </span>
          </span>
          <span className="pokealbum-stick-label">¡Pegar!{pendingCount > 1 ? ` ×${pendingCount}` : ''}</span>
        </button>
      ) : entry.owned ? (
        <button type="button" className="pokealbum-dex-open" onClick={() => onOpenPokedex(p.id)}>
          <PokeSprite id={p.id} name={p.name} scale={scale} />
        </button>
      ) : (
        <span className="pokealbum-unknown" aria-hidden="true">
          ?
        </span>
      )}
      {entry.duplicates > 0 && <span className="pokealbum-dup">×{entry.duplicates + 1}</span>}
      <div className="pokealbum-slot-label">
        <strong>{entry.owned || hasPending ? p.name : `N.º ${p.id}`}</strong>
        <span>{RARITY_LABEL[p.rarity]}</span>
      </div>
      {entry.duplicates > 0 && (
        <div className="pokealbum-slot-actions">
          <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={() => onSell(p.id)}>
            Vender ×1 (+{DUPLICATE_SELL_VALUE[p.rarity]})
          </button>
        </div>
      )}
    </div>
  )
}
