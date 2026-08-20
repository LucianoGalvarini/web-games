import { CENTER, CLASH, HARMONY, isGate } from './constants'
import type { FlowerKind, PaiTile } from './types'

export function isBlooming(tile: PaiTile): boolean {
  return !isGate(tile.x, tile.y)
}

function aligned(a: PaiTile, b: PaiTile): boolean {
  return a.x === b.x || a.y === b.y
}

function betweenClear(a: PaiTile, b: PaiTile, tiles: PaiTile[]): boolean {
  if (a.x === b.x) {
    const x = a.x
    const minY = Math.min(a.y, b.y)
    const maxY = Math.max(a.y, b.y)
    for (let y = minY + 1; y < maxY; y += 1) {
      if (isGate(x, y) || tiles.some((tile) => tile.x === x && tile.y === y)) {
        return false
      }
    }
    return maxY !== minY
  }
  if (a.y === b.y) {
    const y = a.y
    const minX = Math.min(a.x, b.x)
    const maxX = Math.max(a.x, b.x)
    for (let x = minX + 1; x < maxX; x += 1) {
      if (isGate(x, y) || tiles.some((tile) => tile.x === x && tile.y === y)) {
        return false
      }
    }
    return maxX !== minX
  }
  return false
}

export function harmonious(a: FlowerKind, b: FlowerKind): boolean {
  return HARMONY[a].includes(b) || HARMONY[b].includes(a)
}

export function clashing(a: FlowerKind, b: FlowerKind): boolean {
  return CLASH[a] === b
}

export type HarmonyLink = {
  a: number
  b: number
}

export function harmonyLinks(tiles: PaiTile[], player: PaiTile['player']): HarmonyLink[] {
  const own = tiles.filter((tile) => tile.player === player && isBlooming(tile))
  const links: HarmonyLink[] = []
  for (let i = 0; i < own.length; i += 1) {
    for (let j = i + 1; j < own.length; j += 1) {
      const a = own[i]
      const b = own[j]
      if (!a || !b) {
        continue
      }
      if (!aligned(a, b) || !betweenClear(a, b, tiles)) {
        continue
      }
      if (harmonious(a.kind, b.kind)) {
        links.push({ a: a.id, b: b.id })
      }
    }
  }
  return links
}

export function hasClash(tiles: PaiTile[]): boolean {
  const blooming = tiles.filter(isBlooming)
  for (let i = 0; i < blooming.length; i += 1) {
    for (let j = i + 1; j < blooming.length; j += 1) {
      const a = blooming[i]
      const b = blooming[j]
      if (!a || !b) {
        continue
      }
      if (!aligned(a, b) || !betweenClear(a, b, tiles)) {
        continue
      }
      if (clashing(a.kind, b.kind)) {
        return true
      }
    }
  }
  return false
}

function byId(tiles: PaiTile[], id: number): PaiTile | undefined {
  return tiles.find((tile) => tile.id === id)
}

function segmentTouchesCenter(a: PaiTile, b: PaiTile): boolean {
  if (a.x === b.x && a.x === CENTER) {
    const minY = Math.min(a.y, b.y)
    const maxY = Math.max(a.y, b.y)
    return minY <= CENTER && CENTER <= maxY
  }
  if (a.y === b.y && a.y === CENTER) {
    const minX = Math.min(a.x, b.x)
    const maxX = Math.max(a.x, b.x)
    return minX <= CENTER && CENTER <= maxX
  }
  return false
}

function isLeft(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
}

function enclosesCenter(cycle: PaiTile[]): boolean {
  let winding = 0
  for (let i = 0; i < cycle.length; i += 1) {
    const a = cycle[i]
    const b = cycle[(i + 1) % cycle.length]
    if (!a || !b) {
      continue
    }
    if (segmentTouchesCenter(a, b)) {
      return false
    }
    if (a.y <= CENTER) {
      if (b.y > CENTER && isLeft(a.x, a.y, b.x, b.y, CENTER, CENTER) > 0) {
        winding += 1
      }
    } else if (b.y <= CENTER && isLeft(a.x, a.y, b.x, b.y, CENTER, CENTER) < 0) {
      winding -= 1
    }
  }
  return winding !== 0
}

export function hasHarmonyRing(tiles: PaiTile[], player: PaiTile['player']): boolean {
  const links = harmonyLinks(tiles, player)
  if (links.length < 4) {
    return false
  }
  const adj = new Map<number, number[]>()
  for (const link of links) {
    const a = adj.get(link.a) ?? []
    const b = adj.get(link.b) ?? []
    a.push(link.b)
    b.push(link.a)
    adj.set(link.a, a)
    adj.set(link.b, b)
  }

  const visit = (node: number, parent: number, path: number[]): boolean => {
    const neighbors = adj.get(node) ?? []
    for (const next of neighbors) {
      if (next === parent) {
        continue
      }
      const index = path.indexOf(next)
      if (index >= 0) {
        const loop = path.slice(index)
        if (loop.length < 4) {
          continue
        }
        const cycle = loop.map((id) => byId(tiles, id)).filter((tile): tile is PaiTile => Boolean(tile))
        if (cycle.length === loop.length && enclosesCenter(cycle)) {
          return true
        }
        continue
      }
      if (path.length >= 16) {
        continue
      }
      if (visit(next, node, [...path, next])) {
        return true
      }
    }
    return false
  }

  for (const start of adj.keys()) {
    if (visit(start, -1, [start])) {
      return true
    }
  }
  return false
}
