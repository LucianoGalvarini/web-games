export function createRng(seed: number): () => number {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length))
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = pickIndex(random, i + 1)
    const a = next[i]
    const b = next[j]
    if (a === undefined || b === undefined) {
      continue
    }
    next[i] = b
    next[j] = a
  }
  return next
}
