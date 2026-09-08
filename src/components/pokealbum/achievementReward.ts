import type { AchievementReward } from '../../pokealbum'

export function formatAchievementReward(reward: AchievementReward): string {
  const parts: string[] = []
  if (reward.coins) {
    parts.push(`+${reward.coins} monedas`)
  }
  if (reward.bonusQuestions) {
    parts.push(`+${reward.bonusQuestions} pregunta${reward.bonusQuestions > 1 ? 's' : ''} bonus`)
  }
  if (reward.wagerBoost) {
    parts.push(`+${reward.wagerBoost} bonus "todo o nada"`)
  }
  return parts.join(' · ')
}
