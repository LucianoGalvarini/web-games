import type { PokedexEntry, Rarity } from './types'

export const TOTAL_POKEMON = 151

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 70,
  uncommon: 25,
  rare: 8,
  legendary: 2,
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Poco Común',
  rare: 'Rara',
  legendary: 'Legendario',
}

// Self-hosted instead of hotlinked from raw.githubusercontent.com: that host rate-limits and
// occasionally 503s under concurrent load (exactly what a page full of sprites triggers), which is
// why sprites used to fail to load or silently stay stuck on the static fallback. Serving them
// from the same origin as everything else makes loads fast and consistent.
export function spriteUrl(id: number): string {
  return `/pokealbum/images/pokemon/static/${id}.png`
}

export function animatedSpriteUrl(id: number): string {
  return `/pokealbum/images/pokemon/animated/${id}.gif`
}

export function shinySpriteUrl(id: number): string {
  return `/pokealbum/images/pokemon/shiny-static/${id}.png`
}

export function shinyAnimatedSpriteUrl(id: number): string {
  return `/pokealbum/images/pokemon/shiny-animated/${id}.gif`
}

export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export const STAT_LABEL: Record<StatKey, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque Especial',
  'special-defense': 'Defensa Especial',
  speed: 'Velocidad',
}

export const TYPE_ES_BY_SLUG: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
}

export const TYPE_COLOR: Record<string, string> = {
  normal: '#a8a878',
  fire: '#f08030',
  water: '#6890f0',
  electric: '#f8d030',
  grass: '#78c850',
  ice: '#98d8d8',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#a890f0',
  psychic: '#f85888',
  bug: '#a8b820',
  rock: '#b8a038',
  ghost: '#705898',
  dragon: '#7038f8',
}

const RARITY_RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 }

export function bestRarity(ids: number[]): Rarity {
  let best: Rarity = 'common'
  for (const id of ids) {
    const rarity = POKEMON.find((p) => p.id === id)?.rarity
    if (rarity && RARITY_RANK[rarity] > RARITY_RANK[best]) {
      best = rarity
    }
  }
  return best
}

export function prettyLabel(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const POKEMON: PokedexEntry[] = [
  { id: 1, name: 'Bulbasaur', type: 'Planta', rarity: 'common' },
  { id: 2, name: 'Ivysaur', type: 'Planta', rarity: 'uncommon' },
  { id: 3, name: 'Venusaur', type: 'Planta', rarity: 'rare' },
  { id: 4, name: 'Charmander', type: 'Fuego', rarity: 'common' },
  { id: 5, name: 'Charmeleon', type: 'Fuego', rarity: 'uncommon' },
  { id: 6, name: 'Charizard', type: 'Fuego', rarity: 'rare' },
  { id: 7, name: 'Squirtle', type: 'Agua', rarity: 'common' },
  { id: 8, name: 'Wartortle', type: 'Agua', rarity: 'uncommon' },
  { id: 9, name: 'Blastoise', type: 'Agua', rarity: 'rare' },
  { id: 10, name: 'Caterpie', type: 'Bicho', rarity: 'common' },
  { id: 11, name: 'Metapod', type: 'Bicho', rarity: 'uncommon' },
  { id: 12, name: 'Butterfree', type: 'Bicho', rarity: 'rare' },
  { id: 13, name: 'Weedle', type: 'Bicho', rarity: 'common' },
  { id: 14, name: 'Kakuna', type: 'Bicho', rarity: 'uncommon' },
  { id: 15, name: 'Beedrill', type: 'Bicho', rarity: 'rare' },
  { id: 16, name: 'Pidgey', type: 'Normal', rarity: 'common' },
  { id: 17, name: 'Pidgeotto', type: 'Normal', rarity: 'uncommon' },
  { id: 18, name: 'Pidgeot', type: 'Normal', rarity: 'rare' },
  { id: 19, name: 'Rattata', type: 'Normal', rarity: 'common' },
  { id: 20, name: 'Raticate', type: 'Normal', rarity: 'uncommon' },
  { id: 21, name: 'Spearow', type: 'Normal', rarity: 'common' },
  { id: 22, name: 'Fearow', type: 'Normal', rarity: 'uncommon' },
  { id: 23, name: 'Ekans', type: 'Veneno', rarity: 'common' },
  { id: 24, name: 'Arbok', type: 'Veneno', rarity: 'uncommon' },
  { id: 25, name: 'Pikachu', type: 'Eléctrico', rarity: 'uncommon' },
  { id: 26, name: 'Raichu', type: 'Eléctrico', rarity: 'rare' },
  { id: 27, name: 'Sandshrew', type: 'Tierra', rarity: 'common' },
  { id: 28, name: 'Sandslash', type: 'Tierra', rarity: 'uncommon' },
  { id: 29, name: 'Nidoran (H)', type: 'Veneno', rarity: 'common' },
  { id: 30, name: 'Nidorina', type: 'Veneno', rarity: 'uncommon' },
  { id: 31, name: 'Nidoqueen', type: 'Veneno', rarity: 'rare' },
  { id: 32, name: 'Nidoran (M)', type: 'Veneno', rarity: 'common' },
  { id: 33, name: 'Nidorino', type: 'Veneno', rarity: 'uncommon' },
  { id: 34, name: 'Nidoking', type: 'Veneno', rarity: 'rare' },
  { id: 35, name: 'Clefairy', type: 'Hada', rarity: 'common' },
  { id: 36, name: 'Clefable', type: 'Hada', rarity: 'uncommon' },
  { id: 37, name: 'Vulpix', type: 'Fuego', rarity: 'common' },
  { id: 38, name: 'Ninetales', type: 'Fuego', rarity: 'uncommon' },
  { id: 39, name: 'Jigglypuff', type: 'Normal', rarity: 'common' },
  { id: 40, name: 'Wigglytuff', type: 'Normal', rarity: 'uncommon' },
  { id: 41, name: 'Zubat', type: 'Veneno', rarity: 'common' },
  { id: 42, name: 'Golbat', type: 'Veneno', rarity: 'uncommon' },
  { id: 43, name: 'Oddish', type: 'Planta', rarity: 'common' },
  { id: 44, name: 'Gloom', type: 'Planta', rarity: 'uncommon' },
  { id: 45, name: 'Vileplume', type: 'Planta', rarity: 'rare' },
  { id: 46, name: 'Paras', type: 'Bicho', rarity: 'common' },
  { id: 47, name: 'Parasect', type: 'Bicho', rarity: 'uncommon' },
  { id: 48, name: 'Venonat', type: 'Bicho', rarity: 'common' },
  { id: 49, name: 'Venomoth', type: 'Bicho', rarity: 'uncommon' },
  { id: 50, name: 'Diglett', type: 'Tierra', rarity: 'common' },
  { id: 51, name: 'Dugtrio', type: 'Tierra', rarity: 'uncommon' },
  { id: 52, name: 'Meowth', type: 'Normal', rarity: 'common' },
  { id: 53, name: 'Persian', type: 'Normal', rarity: 'uncommon' },
  { id: 54, name: 'Psyduck', type: 'Agua', rarity: 'common' },
  { id: 55, name: 'Golduck', type: 'Agua', rarity: 'uncommon' },
  { id: 56, name: 'Mankey', type: 'Lucha', rarity: 'common' },
  { id: 57, name: 'Primeape', type: 'Lucha', rarity: 'uncommon' },
  { id: 58, name: 'Growlithe', type: 'Fuego', rarity: 'common' },
  { id: 59, name: 'Arcanine', type: 'Fuego', rarity: 'rare' },
  { id: 60, name: 'Poliwag', type: 'Agua', rarity: 'common' },
  { id: 61, name: 'Poliwhirl', type: 'Agua', rarity: 'uncommon' },
  { id: 62, name: 'Poliwrath', type: 'Agua', rarity: 'rare' },
  { id: 63, name: 'Abra', type: 'Psíquico', rarity: 'common' },
  { id: 64, name: 'Kadabra', type: 'Psíquico', rarity: 'uncommon' },
  { id: 65, name: 'Alakazam', type: 'Psíquico', rarity: 'rare' },
  { id: 66, name: 'Machop', type: 'Lucha', rarity: 'common' },
  { id: 67, name: 'Machoke', type: 'Lucha', rarity: 'uncommon' },
  { id: 68, name: 'Machamp', type: 'Lucha', rarity: 'rare' },
  { id: 69, name: 'Bellsprout', type: 'Planta', rarity: 'common' },
  { id: 70, name: 'Weepinbell', type: 'Planta', rarity: 'uncommon' },
  { id: 71, name: 'Victreebel', type: 'Planta', rarity: 'rare' },
  { id: 72, name: 'Tentacool', type: 'Agua', rarity: 'common' },
  { id: 73, name: 'Tentacruel', type: 'Agua', rarity: 'uncommon' },
  { id: 74, name: 'Geodude', type: 'Roca', rarity: 'common' },
  { id: 75, name: 'Graveler', type: 'Roca', rarity: 'uncommon' },
  { id: 76, name: 'Golem', type: 'Roca', rarity: 'rare' },
  { id: 77, name: 'Ponyta', type: 'Fuego', rarity: 'common' },
  { id: 78, name: 'Rapidash', type: 'Fuego', rarity: 'uncommon' },
  { id: 79, name: 'Slowpoke', type: 'Agua', rarity: 'common' },
  { id: 80, name: 'Slowbro', type: 'Agua', rarity: 'uncommon' },
  { id: 81, name: 'Magnemite', type: 'Eléctrico', rarity: 'common' },
  { id: 82, name: 'Magneton', type: 'Eléctrico', rarity: 'uncommon' },
  { id: 83, name: 'Farfetch\'d', type: 'Normal', rarity: 'uncommon' },
  { id: 84, name: 'Doduo', type: 'Normal', rarity: 'common' },
  { id: 85, name: 'Dodrio', type: 'Normal', rarity: 'uncommon' },
  { id: 86, name: 'Seel', type: 'Agua', rarity: 'common' },
  { id: 87, name: 'Dewgong', type: 'Agua', rarity: 'uncommon' },
  { id: 88, name: 'Grimer', type: 'Veneno', rarity: 'common' },
  { id: 89, name: 'Muk', type: 'Veneno', rarity: 'uncommon' },
  { id: 90, name: 'Shellder', type: 'Agua', rarity: 'common' },
  { id: 91, name: 'Cloyster', type: 'Agua', rarity: 'rare' },
  { id: 92, name: 'Gastly', type: 'Fantasma', rarity: 'common' },
  { id: 93, name: 'Haunter', type: 'Fantasma', rarity: 'uncommon' },
  { id: 94, name: 'Gengar', type: 'Fantasma', rarity: 'rare' },
  { id: 95, name: 'Onix', type: 'Roca', rarity: 'uncommon' },
  { id: 96, name: 'Drowzee', type: 'Psíquico', rarity: 'common' },
  { id: 97, name: 'Hypno', type: 'Psíquico', rarity: 'uncommon' },
  { id: 98, name: 'Krabby', type: 'Agua', rarity: 'common' },
  { id: 99, name: 'Kingler', type: 'Agua', rarity: 'uncommon' },
  { id: 100, name: 'Voltorb', type: 'Eléctrico', rarity: 'common' },
  { id: 101, name: 'Electrode', type: 'Eléctrico', rarity: 'uncommon' },
  { id: 102, name: 'Exeggcute', type: 'Planta', rarity: 'common' },
  { id: 103, name: 'Exeggutor', type: 'Planta', rarity: 'rare' },
  { id: 104, name: 'Cubone', type: 'Tierra', rarity: 'common' },
  { id: 105, name: 'Marowak', type: 'Tierra', rarity: 'uncommon' },
  { id: 106, name: 'Hitmonlee', type: 'Lucha', rarity: 'uncommon' },
  { id: 107, name: 'Hitmonchan', type: 'Lucha', rarity: 'uncommon' },
  { id: 108, name: 'Lickitung', type: 'Normal', rarity: 'uncommon' },
  { id: 109, name: 'Koffing', type: 'Veneno', rarity: 'common' },
  { id: 110, name: 'Weezing', type: 'Veneno', rarity: 'uncommon' },
  { id: 111, name: 'Rhyhorn', type: 'Tierra', rarity: 'common' },
  { id: 112, name: 'Rhydon', type: 'Tierra', rarity: 'uncommon' },
  { id: 113, name: 'Chansey', type: 'Normal', rarity: 'rare' },
  { id: 114, name: 'Tangela', type: 'Planta', rarity: 'uncommon' },
  { id: 115, name: 'Kangaskhan', type: 'Normal', rarity: 'rare' },
  { id: 116, name: 'Horsea', type: 'Agua', rarity: 'common' },
  { id: 117, name: 'Seadra', type: 'Agua', rarity: 'uncommon' },
  { id: 118, name: 'Goldeen', type: 'Agua', rarity: 'common' },
  { id: 119, name: 'Seaking', type: 'Agua', rarity: 'uncommon' },
  { id: 120, name: 'Staryu', type: 'Agua', rarity: 'common' },
  { id: 121, name: 'Starmie', type: 'Agua', rarity: 'uncommon' },
  { id: 122, name: 'Mr. Mime', type: 'Psíquico', rarity: 'uncommon' },
  { id: 123, name: 'Scyther', type: 'Bicho', rarity: 'rare' },
  { id: 124, name: 'Jynx', type: 'Hielo', rarity: 'uncommon' },
  { id: 125, name: 'Electabuzz', type: 'Eléctrico', rarity: 'uncommon' },
  { id: 126, name: 'Magmar', type: 'Fuego', rarity: 'uncommon' },
  { id: 127, name: 'Pinsir', type: 'Bicho', rarity: 'rare' },
  { id: 128, name: 'Tauros', type: 'Normal', rarity: 'uncommon' },
  { id: 129, name: 'Magikarp', type: 'Agua', rarity: 'common' },
  { id: 130, name: 'Gyarados', type: 'Agua', rarity: 'rare' },
  { id: 131, name: 'Lapras', type: 'Agua', rarity: 'rare' },
  { id: 132, name: 'Ditto', type: 'Normal', rarity: 'uncommon' },
  { id: 133, name: 'Eevee', type: 'Normal', rarity: 'uncommon' },
  { id: 134, name: 'Vaporeon', type: 'Agua', rarity: 'rare' },
  { id: 135, name: 'Jolteon', type: 'Eléctrico', rarity: 'rare' },
  { id: 136, name: 'Flareon', type: 'Fuego', rarity: 'rare' },
  { id: 137, name: 'Porygon', type: 'Normal', rarity: 'uncommon' },
  { id: 138, name: 'Omanyte', type: 'Roca', rarity: 'common' },
  { id: 139, name: 'Omastar', type: 'Roca', rarity: 'rare' },
  { id: 140, name: 'Kabuto', type: 'Roca', rarity: 'common' },
  { id: 141, name: 'Kabutops', type: 'Roca', rarity: 'rare' },
  { id: 142, name: 'Aerodactyl', type: 'Roca', rarity: 'rare' },
  { id: 143, name: 'Snorlax', type: 'Normal', rarity: 'rare' },
  { id: 144, name: 'Articuno', type: 'Hielo', rarity: 'legendary' },
  { id: 145, name: 'Zapdos', type: 'Eléctrico', rarity: 'legendary' },
  { id: 146, name: 'Moltres', type: 'Fuego', rarity: 'legendary' },
  { id: 147, name: 'Dratini', type: 'Dragón', rarity: 'common' },
  { id: 148, name: 'Dragonair', type: 'Dragón', rarity: 'uncommon' },
  { id: 149, name: 'Dragonite', type: 'Dragón', rarity: 'rare' },
  { id: 150, name: 'Mewtwo', type: 'Psíquico', rarity: 'legendary' },
  { id: 151, name: 'Mew', type: 'Psíquico', rarity: 'legendary' },
]

// Restricted pools for the premium boosters: a rare pack only pulls from rare/legendary
// species, a legendary pack only from legendary ones — the base RARITY_WEIGHT still decides
// the odds between them, it's just applied over a smaller pool.
export const RARE_PACK_POOL = POKEMON.filter((p) => p.rarity === 'rare' || p.rarity === 'legendary')
export const LEGENDARY_PACK_POOL = POKEMON.filter((p) => p.rarity === 'legendary')
