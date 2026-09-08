import { ACHIEVEMENTS } from '../../pokealbum'
import type { Achievement } from '../../pokealbum'
import { formatAchievementReward } from './achievementReward'

type AchievementsModalProps = {
  open: boolean
  onClose: () => void
  unlockedAchievements: string[]
}

function renderGroup(title: string, list: Achievement[], unlockedSet: Set<string>) {
  return (
    <div className="pokealbum-achievements-group" key={title}>
      <p className="pokealbum-achievements-group-title">{title}</p>
      <div className="pokealbum-achievements-list">
        {list.map((achievement) => {
          const unlocked = unlockedSet.has(achievement.id)
          return (
            <div key={achievement.id} className={`pokealbum-achievement${unlocked ? ' is-unlocked' : ''}`}>
              <span className="pokealbum-achievement-icon" aria-hidden="true">
                {unlocked ? achievement.icon : '🔒'}
              </span>
              <div className="pokealbum-achievement-body">
                <strong>{achievement.title}</strong>
                <p>{achievement.description}</p>
                <span className="pokealbum-achievement-reward">{formatAchievementReward(achievement.reward)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AchievementsModal({ open, onClose, unlockedAchievements }: AchievementsModalProps) {
  if (!open) {
    return null
  }

  const unlockedSet = new Set(unlockedAchievements)
  const triviaAchievements = ACHIEVEMENTS.filter((a) => a.category === 'trivia')
  const albumAchievements = ACHIEVEMENTS.filter((a) => a.category === 'album')

  return (
    <div className="modal-backdrop result-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal pokealbum-achievements-modal pokealbum-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievements-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="pokealbum-dex-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="achievements-title">Logros</h2>
        <p className="pokealbum-achievements-progress">
          {unlockedSet.size} / {ACHIEVEMENTS.length} desbloqueados
        </p>
        {renderGroup('Trivia', triviaAchievements, unlockedSet)}
        {renderGroup('Álbum', albumAchievements, unlockedSet)}
      </div>
    </div>
  )
}
