import { useEffect, useState } from 'react'
import { POKEMON, RARITY_LABEL } from '../../pokealbum'
import type { AlbumEntry, Rarity } from '../../pokealbum'
import { playSfx } from '../../shared/sfx'
import { AlbumSlot } from './AlbumSlot'

type AlbumGridProps = {
  entries: Record<number, AlbumEntry>
  page: number
  pageCount: number
  pageSize: number
  pendingCounts: Record<number, number>
  // Bumped by the parent whenever "Ir a pegar"/"Ir a repetidas" jumps to a page — those buttons
  // navigate the unfiltered album, so the rarity filter must clear or the jump has nowhere to land.
  clearFilterSignal?: number
  onPageChange: (page: number) => void
  onSell: (id: number) => void
  onStick: (id: number) => void
  onOpenPokedex: (id: number) => void
}

const ALL_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary']

export function AlbumGrid({
  entries,
  page,
  pageCount,
  pageSize,
  pendingCounts,
  clearFilterSignal,
  onPageChange,
  onSell,
  onStick,
  onOpenPokedex,
}: AlbumGridProps) {
  const [activeRarities, setActiveRarities] = useState<Set<Rarity>>(new Set(ALL_RARITIES))
  const [filterPage, setFilterPage] = useState(0)

  useEffect(() => {
    if (clearFilterSignal !== undefined) {
      setActiveRarities(new Set(ALL_RARITIES))
      setFilterPage(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearFilterSignal])

  const isFiltering = activeRarities.size < ALL_RARITIES.length
  const filteredItems = POKEMON.filter((p) => activeRarities.has(p.rarity))
  const filteredPageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize))

  const start = page * pageSize
  const items = isFiltering
    ? filteredItems.slice(filterPage * pageSize, filterPage * pageSize + pageSize)
    : POKEMON.slice(start, start + pageSize)

  const currentPage = isFiltering ? filterPage : page
  const currentPageCount = isFiltering ? filteredPageCount : pageCount

  const changePage = (next: number) => {
    playSfx('pageTurn')
    if (isFiltering) {
      setFilterPage(Math.max(0, Math.min(filteredPageCount - 1, next)))
    } else {
      onPageChange(next)
    }
  }

  const toggleRarity = (rarity: Rarity) => {
    playSfx('hover')
    setFilterPage(0)
    setActiveRarities((prev) => {
      const next = new Set(prev)
      if (next.has(rarity)) {
        if (next.size > 1) {
          next.delete(rarity)
        }
      } else {
        next.add(rarity)
      }
      return next
    })
  }

  return (
    <div className="pokealbum-page">
      <div className="pokealbum-rarity-filter">
        {ALL_RARITIES.map((rarity) => {
          const isActive = activeRarities.has(rarity)
          return (
            <label
              key={rarity}
              className={`pokealbum-rarity-filter-item${isActive ? ' is-active' : ''}`}
              data-rarity={rarity}
            >
              <input type="checkbox" checked={isActive} onChange={() => toggleRarity(rarity)} />
              {RARITY_LABEL[rarity]}
            </label>
          )
        })}
      </div>
      <div className="pokealbum-grid" key={isFiltering ? `filtered-${filterPage}` : page}>
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
          onClick={() => changePage(currentPage - 1)}
          onMouseEnter={() => currentPage > 0 && playSfx('hover')}
          disabled={currentPage === 0}
        >
          ← Anterior
        </button>
        <span>
          Hoja {currentPage + 1} · página {currentPage + 1} de {currentPageCount}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => changePage(currentPage + 1)}
          onMouseEnter={() => currentPage < currentPageCount - 1 && playSfx('hover')}
          disabled={currentPage === currentPageCount - 1}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
