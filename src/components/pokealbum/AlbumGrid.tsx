import { POKEMON } from '../../pokealbum'
import type { AlbumEntry } from '../../pokealbum'
import { playSfx } from '../../shared/sfx'
import { AlbumSlot } from './AlbumSlot'

type AlbumGridProps = {
  entries: Record<number, AlbumEntry>
  page: number
  pageCount: number
  pageSize: number
  pendingCounts: Record<number, number>
  onPageChange: (page: number) => void
  onSell: (id: number) => void
  onStick: (id: number) => void
  onOpenPokedex: (id: number) => void
}

export function AlbumGrid({
  entries,
  page,
  pageCount,
  pageSize,
  pendingCounts,
  onPageChange,
  onSell,
  onStick,
  onOpenPokedex,
}: AlbumGridProps) {
  const start = page * pageSize
  const items = POKEMON.slice(start, start + pageSize)

  const changePage = (next: number) => {
    playSfx('pageTurn')
    onPageChange(next)
  }

  return (
    <div className="pokealbum-page">
      <div className="pokealbum-grid" key={page}>
        {items.map((p) => (
          <AlbumSlot
            key={p.id}
            p={p}
            entry={entries[p.id]}
            pendingCount={pendingCounts[p.id] ?? 0}
            onSell={onSell}
            onStick={onStick}
            onOpenPokedex={onOpenPokedex}
          />
        ))}
      </div>
      <div className="pokealbum-pager">
        <button
          type="button"
          className="btn"
          onClick={() => changePage(page - 1)}
          onMouseEnter={() => page > 0 && playSfx('hover')}
          disabled={page === 0}
        >
          ← Anterior
        </button>
        <span>
          Hoja {page + 1} · página {page + 1} de {pageCount}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => changePage(page + 1)}
          onMouseEnter={() => page < pageCount - 1 && playSfx('hover')}
          disabled={page === pageCount - 1}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
