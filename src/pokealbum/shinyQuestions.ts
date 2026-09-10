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

// The dataset is ~2.2MB of JSON covering all 151 species — served as a static asset and fetched
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

// Easy questions warm up the player, medium makes up the bulk, and it always ends on a run of
// hard questions — a ramp that finishes on the hardest available for the species, matching the
// escalating time limits in economy.ts. Every dataset entry has at least 2 easy / 6 medium / 4
// hard questions, which is what caps how many of each tier a plan can safely ask for.
const TIER_PLAN_BY_TOTAL: Record<number, { difficulty: ShinyDifficulty; count: number }[]> = {
  5: [
    { difficulty: 'fácil', count: 1 },
    { difficulty: 'media', count: 2 },
    { difficulty: 'difícil', count: 2 },
  ],
  7: [
    { difficulty: 'fácil', count: 1 },
    { difficulty: 'media', count: 3 },
    { difficulty: 'difícil', count: 3 },
  ],
  10: [
    { difficulty: 'fácil', count: 2 },
    { difficulty: 'media', count: 4 },
    { difficulty: 'difícil', count: 4 },
  ],
  12: [
    { difficulty: 'fácil', count: 2 },
    { difficulty: 'media', count: 6 },
    { difficulty: 'difícil', count: 4 },
  ],
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Evolution/pre-evolution/evolutionary-line questions all lean on the same handful of facts about
// a species — asking several per attempt made the challenge feel repetitive. At most one gets
// through; if a candidate slot lands on a second one, it's swapped for a same-difficulty
// non-evolution question when one is available (and just left in place otherwise, rather than
// shrinking the challenge below its intended length).
const EVOLUTION_CATEGORIES = new Set(['evoluciones', 'involuciones', 'linea_evolutiva', 'nivel_o_metodo_evolucion'])

function enforceEvolutionQuota(picked: ShinyQuestion[], pool: ShinyQuestion[], rng: () => number): ShinyQuestion[] {
  const evoIndices = picked.reduce<number[]>((acc, q, i) => {
    if (EVOLUTION_CATEGORIES.has(q.category)) acc.push(i)
    return acc
  }, [])
  if (evoIndices.length <= 1) {
    return picked
  }
  const result = [...picked]
  const usedIds = new Set(picked.map((q) => q.id))
  for (const idx of evoIndices.slice(1)) {
    const tier = result[idx].difficulty
    const candidates = shuffle(
      pool.filter((q) => q.difficulty === tier && !EVOLUTION_CATEGORIES.has(q.category) && !usedIds.has(q.id)),
      rng,
    )
    const replacement = candidates[0]
    if (replacement) {
      usedIds.add(replacement.id)
      result[idx] = replacement
    }
  }
  return result
}

// Options are authored in a fixed order in the static dataset, so without this, the correct
// answer's position for a given question is the same every single time it's asked — a pattern a
// player could simply memorize across playthroughs. Shuffled once per pick, then stable for the
// rest of that attempt (re-render, countdown ticking, resuming after a reload all reuse this).
function shuffleQuestionOptions(question: ShinyQuestion, rng: () => number): ShinyQuestion {
  const order = shuffle(
    question.options.map((_, i) => i),
    rng,
  )
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    answerIndex: order.indexOf(question.answerIndex),
  }
}

export function pickShinyChallengeQuestions(
  pool: ShinyQuestion[],
  rng: () => number = Math.random,
  total = 5,
): ShinyQuestion[] {
  const plan = TIER_PLAN_BY_TOTAL[total] ?? TIER_PLAN_BY_TOTAL[5]
  let picked: ShinyQuestion[] = []
  for (const tier of plan) {
    const candidates = shuffle(
      pool.filter((q) => q.difficulty === tier.difficulty),
      rng,
    )
    picked.push(...candidates.slice(0, tier.count))
  }
  if (picked.length < total) {
    const pickedIds = new Set(picked.map((q) => q.id))
    const leftovers = shuffle(
      pool.filter((q) => !pickedIds.has(q.id)),
      rng,
    )
    picked.push(...leftovers.slice(0, total - picked.length))
  }
  picked = enforceEvolutionQuota(picked, pool, rng)
  return picked.map((q) => shuffleQuestionOptions(q, rng))
}
