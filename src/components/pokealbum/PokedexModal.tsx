import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { POKEMON, RARITY_LABEL, STAT_LABEL, TYPE_COLOR, TYPE_ES_BY_SLUG } from '../../pokealbum'
import { usePokedexEntry } from '../../hooks/usePokedexEntry'
import { playPokemonCry, playSfx } from '../../shared/sfx'
import { Confetti } from './Confetti'
import { PokeSprite } from './PokeSprite'

type PokedexModalProps = {
  id: number | null
  isShinyUnlocked: boolean
  onClose: () => void
}

const STAT_MAX = 180

function Sparkles({ count }: { count: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 2000),
        duration: 1400 + Math.round(Math.random() * 1200),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  )
  return (
    <div className="pokealbum-dex-sparkles" aria-hidden="true">
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="pokealbum-dex-sparkle"
          style={
            {
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              animationDelay: `${dot.delay}ms`,
              animationDuration: `${dot.duration}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function PokedexModal({ id, isShinyUnlocked, onClose }: PokedexModalProps) {
  const entry = usePokedexEntry(id)
  const [showShiny, setShowShiny] = useState(false)

  const p = id !== null ? POKEMON.find((item) => item.id === id) : undefined

  useEffect(() => {
    if (!p) {
      return
    }
    playSfx('dexOpen')
    if (p.rarity === 'legendary') {
      window.setTimeout(() => playSfx('legendary'), 100)
    } else if (p.rarity === 'rare') {
      window.setTimeout(() => playSfx('rarePull'), 100)
    }
    window.setTimeout(() => playPokemonCry(p.id, 0.8), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Every time a new card opens, default back to the normal sprite instead of remembering the
  // last choice — otherwise opening a non-shiny species right after a shiny one would look broken
  // (toggle stuck "on" for a Pokémon that has no shiny form to show).
  useEffect(() => {
    setShowShiny(false)
  }, [id])

  if (id === null || !p) {
    return null
  }

  const primaryType = entry.status === 'ready' ? entry.data.types[0] : undefined
  const accent = primaryType ? TYPE_COLOR[primaryType] : 'var(--gold)'
  const isEpic = p.rarity === 'rare' || p.rarity === 'legendary'

  return (
    <div className="modal-backdrop result-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal result-modal pokealbum-dex${p.rarity === 'legendary' ? ' is-legendary' : ''}`}
        data-rarity={p.rarity}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dex-title"
        style={{ '--dex-accent': accent } as CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pokealbum-dex-rays" aria-hidden="true" />
        {isEpic && <Sparkles count={p.rarity === 'legendary' ? 18 : 10} />}
        {isEpic && <Confetti rarity={p.rarity} count={p.rarity === 'legendary' ? 26 : 12} />}
        <button type="button" className="pokealbum-dex-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="pokealbum-dex-header">
          <p className="eyebrow">
            N.º {String(p.id).padStart(3, '0')} · {RARITY_LABEL[p.rarity]}
          </p>
          <h2 id="dex-title">{p.name}</h2>
        </div>
        <div className="pokealbum-dex-sprite-frame">
          <div className="pokealbum-dex-sprite-glow" aria-hidden="true" />
          <PokeSprite id={p.id} name={p.name} className="pokealbum-dex-sprite" shiny={showShiny} />
        </div>
        {isShinyUnlocked && (
          <label className="pokealbum-dex-shiny-toggle">
            <input
              type="checkbox"
              checked={showShiny}
              onChange={(event) => {
                setShowShiny(event.target.checked)
                playSfx('hover')
              }}
            />
            <span>✨ Ver versión shiny</span>
          </label>
        )}

        {entry.status === 'loading' && <p className="pokealbum-dex-status">Consultando la Pokédex...</p>}
        {entry.status === 'error' && (
          <p className="pokealbum-dex-status">No se pudo cargar la info oficial. Probá de nuevo.</p>
        )}

        {entry.status === 'ready' && (
          <>
            <div className="pokealbum-dex-types">
              {entry.data.types.map((type) => (
                <span key={type} className="pokealbum-type-badge" style={{ background: TYPE_COLOR[type] }}>
                  {TYPE_ES_BY_SLUG[type] ?? type}
                </span>
              ))}
            </div>

            {entry.data.genus && <p className="pokealbum-dex-genus">{entry.data.genus}</p>}
            {entry.data.flavorText && <p className="pokealbum-dex-flavor">{entry.data.flavorText}</p>}

            <div className="pokealbum-dex-measures">
              <div>
                <strong>{entry.data.heightM.toFixed(1)} m</strong>
                <span>Altura</span>
              </div>
              <div>
                <strong>{entry.data.weightKg.toFixed(1)} kg</strong>
                <span>Peso</span>
              </div>
            </div>

            <div className="pokealbum-dex-stats">
              {Object.entries(entry.data.stats).map(([key, value]) => (
                <div key={key} className="pokealbum-dex-stat-row">
                  <span className="pokealbum-dex-stat-label">{STAT_LABEL[key as keyof typeof STAT_LABEL]}</span>
                  <div className="pokealbum-dex-stat-bar">
                    <div
                      className="pokealbum-dex-stat-fill"
                      style={{ width: `${Math.min(100, (value / STAT_MAX) * 100)}%` }}
                    />
                  </div>
                  <span className="pokealbum-dex-stat-value">{value}</span>
                </div>
              ))}
            </div>

            {entry.data.abilities.length > 0 && (
              <div className="pokealbum-dex-abilities">
                {entry.data.abilities.map((ability) => (
                  <span
                    key={ability.name}
                    className={`pokealbum-ability-badge${ability.isHidden ? ' is-hidden' : ''}`}
                  >
                    {ability.name}
                    {ability.isHidden ? ' (oculta)' : ''}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
