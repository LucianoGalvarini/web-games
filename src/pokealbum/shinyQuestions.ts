export type ShinyDifficulty = 'fácil' | 'media' | 'difícil'

export type ShinyQuestion = {
  id: string
  category: string
  difficulty: ShinyDifficulty
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type RawShinyQuestion = {
  id: string
  category: string
  difficulty: ShinyDifficulty
  question: string
  options: string[]
  answer_index: number
  explanation: string
}

type RawShinyDataset = {
  pokemon: { pokemon_id: number; pokemon: string; questions: RawShinyQuestion[] }[]
}

export type ShinyDataset = Map<number, ShinyQuestion[]>

let datasetPromise: Promise<ShinyDataset> | null = null

// The dataset is ~1.1MB of JSON covering all 151 species — served as a static asset and fetched
// only the first time a player actually opens a shiny challenge, so it never touches the main
// bundle for players who never use the feature. Cached module-wide so repeated challenges (or a
// second usePokeAlbum consumer) don't refetch it.
export function loadShinyQuestions(): Promise<ShinyDataset> {
  if (!datasetPromise) {
    datasetPromise = fetch('/pokealbum/data/shiny-questions.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`shiny questions fetch failed: ${res.status}`)
        }
        return res.json() as Promise<RawShinyDataset>
      })
      .then((raw) => {
        const map: ShinyDataset = new Map()
        for (const entry of raw.pokemon) {
          map.set(
            entry.pokemon_id,
            entry.questions.map((q) => ({
              id: q.id,
              category: q.category,
              difficulty: q.difficulty,
              question: q.question,
              options: q.options,
              answerIndex: q.answer_index,
              explanation: q.explanation,
            })),
          )
        }
        return map
      })
      .catch((err) => {
        // Let the next attempt retry instead of caching a rejected promise forever.
        datasetPromise = null
        throw err
      })
  }
  return datasetPromise
}

// 1 easy, 2 medium, 2 hard, always in that order — a ramp that ends on the hardest question
// available for the species, matching the escalating time limits in economy.ts.
const TIER_PLAN: { difficulty: ShinyDifficulty; count: number }[] = [
  { difficulty: 'fácil', count: 1 },
  { difficulty: 'media', count: 2 },
  { difficulty: 'difícil', count: 2 },
]

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickShinyChallengeQuestions(pool: ShinyQuestion[], rng: () => number = Math.random): ShinyQuestion[] {
  const picked: ShinyQuestion[] = []
  for (const tier of TIER_PLAN) {
    const candidates = shuffle(
      pool.filter((q) => q.difficulty === tier.difficulty),
      rng,
    )
    picked.push(...candidates.slice(0, tier.count))
  }
  if (picked.length < 5) {
    const pickedIds = new Set(picked.map((q) => q.id))
    const leftovers = shuffle(
      pool.filter((q) => !pickedIds.has(q.id)),
      rng,
    )
    picked.push(...leftovers.slice(0, 5 - picked.length))
  }
  return picked
}
