import { useEffect, useState } from 'react'

const heightCache = new Map<number, number>()
const inflight = new Map<number, Promise<number>>()

async function fetchHeight(id: number): Promise<number> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!res.ok) {
    throw new Error('bad status')
  }
  const data = (await res.json()) as { height: number }
  return data.height / 10
}

export function usePokemonHeight(id: number): number | null {
  const [height, setHeight] = useState<number | null>(() => heightCache.get(id) ?? null)

  useEffect(() => {
    const cached = heightCache.get(id)
    if (cached !== undefined) {
      setHeight(cached)
      return
    }
    let cancelled = false
    let promise = inflight.get(id)
    if (!promise) {
      promise = fetchHeight(id)
      inflight.set(id, promise)
    }
    promise
      .then((meters) => {
        heightCache.set(id, meters)
        if (!cancelled) {
          setHeight(meters)
        }
      })
      .catch(() => {
        /* keep default size on failure */
      })
      .finally(() => inflight.delete(id))
    return () => {
      cancelled = true
    }
  }, [id])

  return height
}

const MIN_HEIGHT = 0.2
const MAX_HEIGHT = 6
const MIN_SCALE = 0.72
const MAX_SCALE = 1.3

export function heightToScale(heightM: number | null): number {
  if (heightM === null) {
    return 1
  }
  const clamped = Math.min(Math.max(heightM, MIN_HEIGHT), MAX_HEIGHT)
  const ratio = (clamped - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)
  return MIN_SCALE + ratio * (MAX_SCALE - MIN_SCALE)
}
