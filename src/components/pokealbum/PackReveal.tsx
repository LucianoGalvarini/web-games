import { POKEMON, RARITY_LABEL, bestRarity } from '../../pokealbum'
import type { RevealState } from '../../hooks/usePokeAlbum'
import { OPENING_DURATION, OPENING_DURATION_LEGENDARY, OPENING_DURATION_RARE } from '../../hooks/usePokeAlbum'
import { Confetti } from './Confetti'
import { PokeSprite } from './PokeSprite'

type PackRevealProps = {
  reveal: RevealState
  onClose: () => void
}

export function PackReveal({ reveal, onClose }: PackRevealProps) {
  if (reveal.phase === 'closed') {
    return null
  }

  if (reveal.phase === 'opening') {
    const isPack = reveal.kind !== 'recycle'
    const isEpic = reveal.rarity === 'rare' || reveal.rarity === 'legendary'
    const duration = reveal.rarity === 'legendary' ? OPENING_DURATION_LEGENDARY : reveal.rarity === 'rare' ? OPENING_DURATION_RARE : OPENING_DURATION
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div
          className={`modal result-modal pokealbum-opening${isEpic ? ` is-epic is-${reveal.rarity}` : ''}`}
          role="dialog"
          aria-modal="true"
        >
          {isEpic && <div className="pokealbum-rays" aria-hidden="true" />}
          {reveal.rarity === 'legendary' && <Confetti rarity="legendary" count={24} />}
          <div
            className={`pokealbum-opening-icon${isPack ? ' is-pack' : ' is-recycle'}${isEpic ? ' is-epic' : ''}`}
            style={{ animationDuration: `${duration}ms` }}
          >
            {isPack ? (
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <rect x="8" y="20" width="48" height="36" rx="4" fill="var(--gold)" />
                <path d="M8 22 L32 42 L56 22" fill="none" stroke="#241910" strokeWidth="3" />
                <rect x="8" y="20" width="48" height="36" rx="4" fill="none" stroke="#241910" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path
                  d="M32 8 A24 24 0 0 1 54 44"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M32 56 A24 24 0 0 1 10 20"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path d="M46 36 L54 44 L60 34" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" />
                <path d="M18 28 L10 20 L4 30" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" />
              </svg>
            )}
            <span className="pokealbum-opening-spark" />
            <span className="pokealbum-opening-spark" />
            <span className="pokealbum-opening-spark" />
          </div>
          <p>
            {isPack
              ? reveal.rarity === 'legendary'
                ? '¡Algo LEGENDARIO está por salir...!'
                : reveal.rarity === 'rare'
                  ? '¡Algo especial está por salir...!'
                  : 'Abriendo el sobre...'
              : 'Reciclando repetidas...'}
          </p>
        </div>
      </div>
    )
  }

  const rarity = bestRarity(reveal.items.map((item) => item.id))
  const isBig = rarity === 'rare' || rarity === 'legendary'

  return (
    <div className="modal-backdrop result-backdrop" role="presentation">
      <div
        className={`modal result-modal pokealbum-reveal${isBig ? ` is-${rarity}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pack-title"
      >
        {rarity === 'legendary' && <div className="pokealbum-rays" aria-hidden="true" />}
        {isBig && <Confetti rarity={rarity} count={rarity === 'legendary' ? 32 : 20} />}
        <p className="eyebrow">
          {reveal.kind === 'pack' ? 'Nuevo sobre' : reveal.kind === 'freePack' ? 'Sobre gratis' : 'Reciclaje'}
        </p>
        <h2 id="pack-title">Obtuviste:</h2>
        <div className="pokealbum-reveal-grid">
          {reveal.items.map((item, index) => {
            const p = POKEMON.find((entry) => entry.id === item.id)
            if (!p) {
              return null
            }
            return (
              <div
                key={`${item.id}-${index}`}
                className="pokealbum-reveal-card"
                data-rarity={p.rarity}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <span className="pokealbum-reveal-shine" aria-hidden="true" />
                <PokeSprite id={p.id} name={p.name} />
                <strong>{p.name}</strong>
                <span>{RARITY_LABEL[p.rarity]}</span>
                <span className="pokealbum-reveal-tag">{item.isNew ? '¡NUEVA!' : 'Repetida ✓'}</span>
              </div>
            )
          })}
        </div>
        <p className="pokealbum-reveal-hint">
          {reveal.items.some((item) => item.isNew)
            ? 'Las repetidas ya se sumaron solas. Cerrá y andá a pegar las nuevas en el álbum.'
            : 'Todas repetidas: ya se sumaron solas a tu álbum.'}
        </p>
        <div className="result-actions">
          <button type="button" className="btn btn-gold" onClick={onClose}>
            {reveal.items.some((item) => item.isNew) ? 'Cerrar e ir a pegarlas' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
