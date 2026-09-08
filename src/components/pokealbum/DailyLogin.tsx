import { playSfx } from '../../shared/sfx'

type DailyLoginProps = {
  streak: number
  nextDay: number | null
  canClaim: boolean
  rewards: number[]
  streakLength: number
  onClaim: () => void
}

export function DailyLogin({ streak, nextDay, canClaim, rewards, streakLength, onClaim }: DailyLoginProps) {
  const litCount = canClaim ? (nextDay === 1 ? 0 : streak) : streak
  const previewLabel =
    nextDay === null ? null : nextDay === streakLength ? 'Sobre especial' : `+${rewards[nextDay - 1]} monedas`

  return (
    <div className="status-card pokealbum-daily-login">
      <p>Recompensa diaria</p>
      <div className="pokealbum-daily-days">
        {Array.from({ length: streakLength }, (_, i) => i + 1).map((day) => (
          <span
            key={day}
            className={`pokealbum-daily-day${day <= litCount ? ' is-claimed' : ''}${day === nextDay ? ' is-next' : ''}`}
          >
            {day === streakLength ? '🎁' : day}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-gold"
        onMouseEnter={() => canClaim && playSfx('hover')}
        onClick={onClaim}
        disabled={!canClaim}
      >
        {canClaim ? `Reclamar día ${nextDay} (${previewLabel})` : 'Ya reclamada hoy'}
      </button>
    </div>
  )
}
