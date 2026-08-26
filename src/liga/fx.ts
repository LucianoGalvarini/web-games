import type { SfxName } from '../shared/sfx'
import type { LigaFxKind, LigaTrainerId, LigaType } from './types'

export type LigaAnim = {
  side: 'player' | 'foe'
  type: LigaType
  t: number
  kind: LigaFxKind
  line: string
}

export const TYPE_COLOR: Record<LigaType, string> = {
  normal: '#e4d3b4',
  fire: '#e07040',
  water: '#4a90d0',
  electric: '#f0d050',
  grass: '#58b050',
  ice: '#98d8f0',
  fighting: '#c04038',
  poison: '#a050c0',
  ground: '#d8b050',
  flying: '#a8c8f0',
  psychic: '#f070a0',
  bug: '#a8c030',
  rock: '#b8a050',
  ghost: '#705898',
  dragon: '#7038f8',
  dark: '#705848',
  steel: '#b8b8d0',
}

export const FIELD_THEME: Record<
  LigaTrainerId,
  { sky: string; sky2: string; wall: string; floor: string; accent: string; platform: string }
> = {
  sidney: {
    sky: '#1a1028',
    sky2: '#3a2450',
    wall: '#2a1838',
    floor: '#241430',
    accent: '#6b3d8c',
    platform: '#4a3060',
  },
  phoebe: {
    sky: '#181028',
    sky2: '#4a3878',
    wall: '#2c2048',
    floor: '#201830',
    accent: '#c8b8e0',
    platform: '#5a4878',
  },
  glacia: {
    sky: '#8ab0c8',
    sky2: '#d8eef8',
    wall: '#b8d4e4',
    floor: '#c8dcec',
    accent: '#f4fcff',
    platform: '#e8f4fc',
  },
  drake: {
    sky: '#2a100c',
    sky2: '#6a2818',
    wall: '#3a1810',
    floor: '#2a140c',
    accent: '#c45c48',
    platform: '#5a3020',
  },
  steven: {
    sky: '#1c2228',
    sky2: '#3a4850',
    wall: '#2a3238',
    floor: '#242a30',
    accent: '#c8b060',
    platform: '#4a545c',
  },
}

export function sfxForType(type: LigaType): SfxName {
  if (type === 'fire') {
    return 'ligaFire'
  }
  if (type === 'water') {
    return 'ligaWater'
  }
  if (type === 'ice') {
    return 'ligaIce'
  }
  if (type === 'electric') {
    return 'ligaSpark'
  }
  if (type === 'dragon') {
    return 'ligaDragon'
  }
  if (type === 'psychic') {
    return 'ligaBeam'
  }
  if (type === 'ghost' || type === 'dark') {
    return 'ligaGhost'
  }
  if (type === 'grass' || type === 'bug') {
    return 'ligaGrass'
  }
  if (type === 'poison') {
    return 'ligaPoison'
  }
  if (type === 'rock' || type === 'ground' || type === 'steel') {
    return 'ligaRock'
  }
  if (type === 'fighting') {
    return 'ligaPunch'
  }
  if (type === 'flying' || type === 'normal') {
    return 'ligaSlash'
  }
  return 'ligaHit'
}
