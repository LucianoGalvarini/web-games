import { useEffect } from 'react'
import type { Achievement } from '../../pokealbum'
import { formatAchievementReward } from './achievementReward'

type AchievementToastProps = {
  queue: Achievement[]
  onDismiss: () => void
}

const DISPLAY_MS = 4200

export function AchievementToast({ queue, onDismiss }: AchievementToastProps) {
  const current = queue[0] ?? null

  useEffect(() => {
    if (!current) {
      return
    }
    const id = window.setTimeout(onDismiss, DISPLAY_MS)
    return () => window.clearTimeout(id)
  }, [current, onDismiss])

  if (!current) {
    return null
  }

  return (
    <div className="pokealbum-achievement-toast" role="status" key={current.id}>
      <span className="pokealbum-achievement-toast-icon" aria-hidden="true">
        {current.icon}
      </span>
      <div className="pokealbum-achievement-toast-body">
        <p className="pokealbum-achievement-toast-title">¡Logro desbloqueado!</p>
        <strong>{current.title}</strong>
        <span className="pokealbum-achievement-toast-reward">{formatAchievementReward(current.reward)}</span>
      </div>
    </div>
  )
}
