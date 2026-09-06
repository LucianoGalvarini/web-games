import { useEffect, useRef, useState } from 'react'
import { STAT_KEYS, prettyLabel } from '../pokealbum'
import type { StatKey } from '../pokealbum'

export type PokedexData = {
  id: number
  heightM: number
  weightKg: number
  types: string[]
  abilities: { name: string; isHidden: boolean }[]
  stats: Record<StatKey, number>
  genus: string
  flavorText: string
}

export type PokedexEntryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: PokedexData }
  | { status: 'error' }

type SpeciesFlavor = { flavor_text: string; language: { name: string }; version: { name: string } }
type SpeciesGenus = { genus: string; language: { name: string } }

function cleanFlavorText(text: string): string {
  return text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function pickFlavorText(entries: SpeciesFlavor[]): string {
  const spanish = entries.filter((entry) => entry.language.name === 'es')
  const preferred = spanish.find((entry) => entry.version.name === 'firered' || entry.version.name === 'leafgreen')
  if (preferred) {
    return cleanFlavorText(preferred.flavor_text)
  }
  if (spanish[0]) {
    return cleanFlavorText(spanish[0].flavor_text)
  }
  const english = entries.find((entry) => entry.language.name === 'en')
  return english ? cleanFlavorText(english.flavor_text) : ''
}

function pickGenus(entries: SpeciesGenus[]): string {
  const spanish = entries.find((entry) => entry.language.name === 'es')
  if (spanish) {
    return spanish.genus
  }
  const english = entries.find((entry) => entry.language.name === 'en')
  return english?.genus ?? ''
}

async function fetchPokedexData(id: number): Promise<PokedexData> {
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
  ])
  if (!pokemonRes.ok || !speciesRes.ok) {
    throw new Error('bad status')
  }
  const pokemon = (await pokemonRes.json()) as {
    height: number
    weight: number
    types: { type: { name: string } }[]
    abilities: { ability: { name: string }; is_hidden: boolean }[]
    stats: { base_stat: number; stat: { name: string } }[]
  }
  const species = (await speciesRes.json()) as {
    flavor_text_entries: SpeciesFlavor[]
    genera: SpeciesGenus[]
  }

  const stats = {} as Record<StatKey, number>
  for (const entry of pokemon.stats) {
    if ((STAT_KEYS as readonly string[]).includes(entry.stat.name)) {
      stats[entry.stat.name as StatKey] = entry.base_stat
    }
  }

  return {
    id,
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    types: pokemon.types.map((entry) => entry.type.name),
    abilities: pokemon.abilities.map((entry) => ({
      name: prettyLabel(entry.ability.name),
      isHidden: entry.is_hidden,
    })),
    stats,
    genus: pickGenus(species.genera),
    flavorText: pickFlavorText(species.flavor_text_entries),
  }
}

const cache = new Map<number, PokedexData>()

export function usePokedexEntry(id: number | null): PokedexEntryState {
  const [state, setState] = useState<PokedexEntryState>({ status: 'idle' })
  const requestRef = useRef(0)

  useEffect(() => {
    if (id === null) {
      setState({ status: 'idle' })
      return
    }
    const cached = cache.get(id)
    if (cached) {
      setState({ status: 'ready', data: cached })
      return
    }
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setState({ status: 'loading' })
    fetchPokedexData(id)
      .then((data) => {
        if (requestRef.current !== requestId) {
          return
        }
        cache.set(id, data)
        setState({ status: 'ready', data })
      })
      .catch(() => {
        if (requestRef.current !== requestId) {
          return
        }
        setState({ status: 'error' })
      })
  }, [id])

  return state
}
