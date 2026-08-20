import type { Player } from '../shared/types'

export type FlowerKind = 'r3' | 'r4' | 'r5' | 'w3' | 'w4' | 'w5' | 'lotus'

export type PaiTile = {
  id: number
  x: number
  y: number
  player: Player
  kind: FlowerKind
}

export type PaiMove =
  | { kind: 'plant'; tile: FlowerKind; x: number; y: number }
  | { kind: 'arrange'; fromX: number; fromY: number; toX: number; toY: number }

export type Reserve = Record<FlowerKind, number>

export type PaiPosition = {
  tiles: PaiTile[]
  current: Player
  reserve: { white: Reserve; black: Reserve }
  nextId: number
}

export type Garden = 'gate' | 'red' | 'white' | 'neutral'
