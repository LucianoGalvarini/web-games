import { POKEMON } from './data'
import type { AlbumState, Rarity } from './types'

export type AchievementTriviaMode = 'statPair' | 'trueFalse' | 'multipleChoice'
export type AchievementCategory = 'trivia' | 'album'

export type AchievementReward = { coins?: number; bonusQuestions?: number; wagerBoost?: number }

export type AchievementContext = {
  album: AlbumState
  triviaCorrectTotal: number
  triviaCorrectByMode: Record<AchievementTriviaMode, number>
  bestTriviaStreak: number
  packsOpened: number
  recycleCount: number
}

export type Achievement = {
  id: string
  category: AchievementCategory
  title: string
  description: string
  icon: string
  reward: AchievementReward
  isMet: (ctx: AchievementContext) => boolean
}

const ALBUM_PAGE_SIZE = 9

function ownedCount(album: AlbumState): number {
  return POKEMON.reduce((sum, p) => sum + (album.entries[p.id]?.owned ? 1 : 0), 0)
}

function rarityComplete(album: AlbumState, rarity: Rarity): boolean {
  const ofRarity = POKEMON.filter((p) => p.rarity === rarity)
  return ofRarity.every((p) => album.entries[p.id]?.owned)
}

function hasCompletePage(album: AlbumState): boolean {
  for (let start = 0; start < POKEMON.length; start += ALBUM_PAGE_SIZE) {
    const page = POKEMON.slice(start, start + ALBUM_PAGE_SIZE)
    if (page.length > 0 && page.every((p) => album.entries[p.id]?.owned)) {
      return true
    }
  }
  return false
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'trivia_first_correct',
    category: 'trivia',
    title: 'Primera correcta',
    description: 'Respondé bien tu primera pregunta de trivia.',
    icon: '✅',
    reward: { coins: 20 },
    isMet: (ctx) => ctx.triviaCorrectTotal >= 1,
  },
  {
    id: 'trivia_streak_5',
    category: 'trivia',
    title: 'En racha',
    description: 'Acertá 5 preguntas de trivia seguidas.',
    icon: '🔥',
    reward: { coins: 30 },
    isMet: (ctx) => ctx.bestTriviaStreak >= 5,
  },
  {
    id: 'trivia_streak_10',
    category: 'trivia',
    title: 'Imparable',
    description: 'Acertá 10 preguntas de trivia seguidas.',
    icon: '🔥',
    reward: { coins: 60, bonusQuestions: 1 },
    isMet: (ctx) => ctx.bestTriviaStreak >= 10,
  },
  {
    id: 'trivia_streak_25',
    category: 'trivia',
    title: 'Máquina de trivia',
    description: 'Acertá 25 preguntas de trivia seguidas.',
    icon: '🔥',
    reward: { coins: 150, bonusQuestions: 2, wagerBoost: 1 },
    isMet: (ctx) => ctx.bestTriviaStreak >= 25,
  },
  {
    id: 'trivia_total_10',
    category: 'trivia',
    title: 'Estudiante aplicado',
    description: 'Acumulá 10 respuestas correctas en total.',
    icon: '📘',
    reward: { coins: 30 },
    isMet: (ctx) => ctx.triviaCorrectTotal >= 10,
  },
  {
    id: 'trivia_total_50',
    category: 'trivia',
    title: 'Sabio Pokémon',
    description: 'Acumulá 50 respuestas correctas en total.',
    icon: '📗',
    reward: { coins: 80 },
    isMet: (ctx) => ctx.triviaCorrectTotal >= 50,
  },
  {
    id: 'trivia_total_150',
    category: 'trivia',
    title: 'Profesor Pokémon',
    description: 'Acumulá 150 respuestas correctas en total.',
    icon: '📕',
    reward: { coins: 200, wagerBoost: 1 },
    isMet: (ctx) => ctx.triviaCorrectTotal >= 150,
  },
  {
    id: 'trivia_mode_statpair',
    category: 'trivia',
    title: 'Comparador experto',
    description: 'Acertá 10 preguntas de "quién tiene más stat".',
    icon: '⚖️',
    reward: { coins: 25 },
    isMet: (ctx) => ctx.triviaCorrectByMode.statPair >= 10,
  },
  {
    id: 'trivia_mode_truefalse',
    category: 'trivia',
    title: 'Detector de mentiras',
    description: 'Acertá 10 preguntas de verdadero o falso.',
    icon: '🔎',
    reward: { coins: 25 },
    isMet: (ctx) => ctx.triviaCorrectByMode.trueFalse >= 10,
  },
  {
    id: 'trivia_mode_multiplechoice',
    category: 'trivia',
    title: 'Movimientos memorizados',
    description: 'Acertá 10 preguntas de opción múltiple sobre movimientos.',
    icon: '🥋',
    reward: { coins: 25 },
    isMet: (ctx) => ctx.triviaCorrectByMode.multipleChoice >= 10,
  },
  {
    id: 'album_first_sticker',
    category: 'album',
    title: 'Primer paso',
    description: 'Pegá tu primera figurita en el álbum.',
    icon: '⭐',
    reward: { coins: 10 },
    isMet: (ctx) => ownedCount(ctx.album) >= 1,
  },
  {
    id: 'album_first_page',
    category: 'album',
    title: 'Página completa',
    description: 'Completá una página entera del álbum.',
    icon: '📖',
    reward: { coins: 30 },
    isMet: (ctx) => hasCompletePage(ctx.album),
  },
  {
    id: 'album_half',
    category: 'album',
    title: 'A mitad de camino',
    description: 'Conseguí la mitad de las figuritas de Kanto.',
    icon: '🌓',
    reward: { coins: 80 },
    isMet: (ctx) => ownedCount(ctx.album) >= Math.ceil(POKEMON.length / 2),
  },
  {
    id: 'album_all_uncommon',
    category: 'album',
    title: 'Coleccionista poco común',
    description: 'Conseguí todas las figuritas poco comunes.',
    icon: '🔷',
    reward: { coins: 60 },
    isMet: (ctx) => rarityComplete(ctx.album, 'uncommon'),
  },
  {
    id: 'album_all_rare',
    category: 'album',
    title: 'Coleccionista raro',
    description: 'Conseguí todas las figuritas raras.',
    icon: '🔮',
    reward: { coins: 100, bonusQuestions: 1 },
    isMet: (ctx) => rarityComplete(ctx.album, 'rare'),
  },
  {
    id: 'album_all_legendary',
    category: 'album',
    title: 'Cazador de leyendas',
    description: 'Conseguí todas las figuritas legendarias.',
    icon: '🏆',
    reward: { coins: 150, wagerBoost: 1 },
    isMet: (ctx) => rarityComplete(ctx.album, 'legendary'),
  },
  {
    id: 'album_full_dex',
    category: 'album',
    title: 'Pokédex completa',
    description: 'Conseguí las 151 figuritas de Kanto.',
    icon: '👑',
    reward: { coins: 300, bonusQuestions: 3, wagerBoost: 2 },
    isMet: (ctx) => ownedCount(ctx.album) === POKEMON.length,
  },
  {
    id: 'album_packs_10',
    category: 'album',
    title: 'Comprador frecuente',
    description: 'Abrí 10 sobres.',
    icon: '📦',
    reward: { coins: 20 },
    isMet: (ctx) => ctx.packsOpened >= 10,
  },
  {
    id: 'album_packs_50',
    category: 'album',
    title: 'Adicto a los sobres',
    description: 'Abrí 50 sobres.',
    icon: '📦',
    reward: { coins: 60 },
    isMet: (ctx) => ctx.packsOpened >= 50,
  },
  {
    id: 'album_recycle_5',
    category: 'album',
    title: 'Reciclador',
    description: 'Reciclá repetidas por un sobre gratis 5 veces.',
    icon: '♻️',
    reward: { coins: 20 },
    isMet: (ctx) => ctx.recycleCount >= 5,
  },
]

export function evaluateNewAchievements(ctx: AchievementContext, unlockedIds: ReadonlySet<string>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id) && a.isMet(ctx))
}
