import type { Player } from '../shared/types'
import { emptyReserve } from './constants'
import type { PaiPosition, PaiTile } from './types'

export function createInitialPosition(): PaiPosition {
  return {
    tiles: [],
    current: 'white',
    reserve: { white: emptyReserve(), black: emptyReserve() },
    nextId: 1,
  }
}

export function tileAt(tiles: PaiTile[], x: number, y: number): PaiTile | undefined {
  return tiles.find((tile) => tile.x === x && tile.y === y)
}

export function tilesOf(tiles: PaiTile[], player: Player): PaiTile[] {
  return tiles.filter((tile) => tile.player === player)
}

export function countOnBoard(position: PaiPosition, player: Player): number {
  return tilesOf(position.tiles, player).length
}

export function countReserve(position: PaiPosition, player: Player): number {
  const pack = position.reserve[player]
  return pack.r3 + pack.r4 + pack.r5 + pack.w3 + pack.w4 + pack.w5 + pack.lotus
}

export function serializePosition(position: PaiPosition): string {
  const placed = [...position.tiles]
    .sort((a, b) => a.x - b.x || a.y - b.y || a.kind.localeCompare(b.kind))
    .map((tile) => `${tile.player[0]}${tile.kind}:${tile.x},${tile.y}`)
    .join(';')
  const pack = (player: Player) =>
    Object.entries(position.reserve[player])
      .map(([kind, count]) => `${kind}${count}`)
      .join('')
  return `${position.current}|${placed}|${pack('white')}|${pack('black')}`
}
