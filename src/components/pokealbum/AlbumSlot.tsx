import { useEffect, useState } from 'react'
import {
  DUPLICATE_SELL_VALUE,
  RARITY_LABEL,
  SHINY_CHALLENGE_DUPLICATES,
  SHINY_CHALLENGE_QUESTION_COUNT,
  shinySkipCostForPaidCount,
} from '../../pokealbum'
import type { AlbumEntry, PokedexEntry } from '../../pokealbum'
import { heightToScale, usePokemonHeight } from '../../hooks/usePokemonHeight'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type AlbumSlotProps = {
  p: PokedexEntry
  entry: AlbumEntry
  pendingCount: number
  coins: number
  shinyAttemptReadyAt: number
  shinySkipsPaid: number
  onSell: (id: number) => void
  onStick: (id: number) => void
  onOpenPokedex: (id: number) => void
  onAttemptShiny: (id: number, paySkip?: boolean) => void
}

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AlbumSlot({
  p,
  entry,
  pendingCount,
  coins,
  shinyAttemptReadyAt,
  shinySkipsPaid,
  onSell,
  onStick,
  onOpenPokedex,
  onAttemptShiny,
}: AlbumSlotProps) {
  const hasPending = pendingCount > 0
  const heightM = usePokemonHeight(p.id)
  const scale = entry.owned || hasPending ? heightToScale(heightM) : 1
  const canAttemptShiny = entry.owned && !entry.shiny && entry.duplicates >= SHINY_CHALLENGE_DUPLICATES

  // Only ticks while this slot could actually show the shiny button — no point running a timer
  // on every slot in the grid when at most a couple ever qualify at once.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!canAttemptShiny) {
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [canAttemptShiny])

  const shinyOnCooldown = canAttemptShiny && now < shinyAttemptReadyAt
  // Doubles with every skip already paid inside this cooldown window (100k, 200k, 400k...) — see
  // shinySkipCostForPaidCount. null means the price outgrew what can be charged safely, which is
  // treated as "no more skips this window" rather than silently wrapping to a tiny number.
  const skipCost = shinySkipCostForPaidCount(shinySkipsPaid)
  const canSkipCooldown = skipCost !== null && coins >= skipCost

  return (
    <div
      data-rarity={p.rarity}
      className={`pokealbum-slot${entry.owned ? ' is-owned' : ''}${hasPending ? ' has-pending' : ''}${entry.shiny ? ' is-shiny' : ''}`}
      onMouseEnter={() => (entry.owned || hasPending) && playSfx('hover')}
    >
      {entry.shiny && (
        <span className="pokealbum-shiny-badge" title="Shiny desbloqueado" aria-hidden="true">
          ✨
        </span>
      )}
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
          <PokeSprite id={p.id} name={p.name} scale={scale} shiny={entry.shiny} />
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
      {(entry.duplicates > 0 || canAttemptShiny) && (
        <div className="pokealbum-slot-actions">
          {entry.duplicates > 0 && (
            <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={() => onSell(p.id)}>
              Vender ×1 (+{DUPLICATE_SELL_VALUE[p.rarity]})
            </button>
          )}
          {canAttemptShiny && !shinyOnCooldown && (
            <button
              type="button"
              className="btn btn-gold pokealbum-shiny-attempt"
              onMouseEnter={() => playSfx('hover')}
              onClick={() => onAttemptShiny(p.id)}
              title={`${SHINY_CHALLENGE_QUESTION_COUNT[p.rarity]} preguntas, todas correctas`}
            >
              ✨ Intentar Shiny ({SHINY_CHALLENGE_QUESTION_COUNT[p.rarity]} preguntas)
            </button>
          )}
          {canAttemptShiny && shinyOnCooldown && (
            <>
              <span className="pokealbum-shiny-cooldown">
                ✨ Próximo intento libre: {formatCooldown(shinyAttemptReadyAt - now)}
              </span>
              <button
                type="button"
                className="btn btn-gold pokealbum-shiny-attempt is-skip"
                onMouseEnter={() => canSkipCooldown && playSfx('hover')}
                onClick={() => onAttemptShiny(p.id, true)}
                disabled={!canSkipCooldown}
                title={
                  skipCost === null
                    ? 'Ya no se puede pagar otro salto en esta ventana'
                    : `Pagá ${skipCost} monedas para intentarlo ahora mismo (el precio se duplica en cada salto pagado dentro de esta espera)`
                }
              >
                {skipCost === null ? 'Ya no se puede saltar' : `Pagar ${skipCost} y probar ahora`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
