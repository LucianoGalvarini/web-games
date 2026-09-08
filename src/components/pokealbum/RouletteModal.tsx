import type { RouletteSegment } from '../../pokealbum'
import { DailyLogin } from './DailyLogin'
import { RouletteWheel } from './RouletteWheel'

type SpinResult = { segment: RouletteSegment; amount: number }

type RouletteModalProps = {
  open: boolean
  onClose: () => void
  streak: number
  nextDay: number | null
  canClaim: boolean
  rewards: number[]
  streakLength: number
  onClaimDailyLogin: () => void
  spinReadyAt: number
  pendingSpin: SpinResult | null
  lastSpinResult: SpinResult | null
  onSpin: () => void
  onClaimSpin: () => void
}

export function RouletteModal({
  open,
  onClose,
  streak,
  nextDay,
  canClaim,
  rewards,
  streakLength,
  onClaimDailyLogin,
  spinReadyAt,
  pendingSpin,
  lastSpinResult,
  onSpin,
  onClaimSpin,
}: RouletteModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal pokealbum-roulette-modal pokealbum-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roulette-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="pokealbum-dex-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="roulette-title">Ruleta y recompensas</h2>
        <DailyLogin
          streak={streak}
          nextDay={nextDay}
          canClaim={canClaim}
          rewards={rewards}
          streakLength={streakLength}
          onClaim={onClaimDailyLogin}
        />
        <RouletteWheel
          spinReadyAt={spinReadyAt}
          pendingSpin={pendingSpin}
          lastSpinResult={lastSpinResult}
          onSpin={onSpin}
          onClaim={onClaimSpin}
        />
      </div>
    </div>
  )
}
