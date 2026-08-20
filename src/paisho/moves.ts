import { opponent } from '../shared/player'
import { tileAt } from './board'
import { CENTER, GATES, MOVE_RANGE, ORTHO, gardenOf, isGate, isPlayable, isRedFlower, isWhiteFlower } from './constants'
import { clashing, hasClash, isBlooming } from './harmony'
import type { FlowerKind, PaiMove, PaiPosition, PaiTile } from './types'

function canEnd(kind: FlowerKind, x: number, y: number): boolean {
  if (!isPlayable(x, y) || isGate(x, y)) {
    return false
  }
  if (x === CENTER && y === CENTER) {
    return kind === 'lotus'
  }
  const garden = gardenOf(x, y)
  if (kind === 'lotus') {
    return true
  }
  if (isRedFlower(kind) && garden === 'white') {
    return false
  }
  if (isWhiteFlower(kind) && garden === 'red') {
    return false
  }
  return true
}

function arrangeDestinations(position: PaiPosition, tile: PaiTile): { x: number; y: number }[] {
  const max = MOVE_RANGE[tile.kind]
  const found: { x: number; y: number }[] = []
  const seen = new Set<string>([`${tile.x},${tile.y}`])
  const queue: { x: number; y: number; steps: number }[] = [{ x: tile.x, y: tile.y, steps: 0 }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || current.steps >= max) {
      continue
    }
    for (const dir of ORTHO) {
      const x = current.x + dir.x
      const y = current.y + dir.y
      const key = `${x},${y}`
      if (seen.has(key) || !isPlayable(x, y)) {
        continue
      }
      const occupant = tileAt(position.tiles, x, y)
      const nextSteps = current.steps + 1
      if (occupant) {
        if (
          occupant.player !== tile.player &&
          clashing(tile.kind, occupant.kind) &&
          !isGate(x, y) &&
          canEnd(tile.kind, x, y)
        ) {
          found.push({ x, y })
        }
        continue
      }
      seen.add(key)
      if (isGate(x, y)) {
        queue.push({ x, y, steps: nextSteps })
        continue
      }
      if (canEnd(tile.kind, x, y)) {
        found.push({ x, y })
      }
      queue.push({ x, y, steps: nextSteps })
    }
  }
  return found
}

export function applyMove(position: PaiPosition, move: PaiMove): PaiPosition {
  const reserve = {
    white: { ...position.reserve.white },
    black: { ...position.reserve.black },
  }
  let tiles = position.tiles.map((tile) => ({ ...tile }))
  let nextId = position.nextId

  if (move.kind === 'plant') {
    tiles = [...tiles, { id: nextId, x: move.x, y: move.y, player: position.current, kind: move.tile }]
    nextId += 1
    reserve[position.current][move.tile] -= 1
  } else {
    tiles = tiles
      .filter((tile) => !(tile.x === move.toX && tile.y === move.toY && tile.player !== position.current))
      .map((tile) =>
        tile.x === move.fromX && tile.y === move.fromY && tile.player === position.current
          ? { ...tile, x: move.toX, y: move.toY }
          : tile,
      )
  }

  return {
    tiles,
    current: opponent(position.current),
    reserve,
    nextId,
  }
}

export function legalMoves(position: PaiPosition): PaiMove[] {
  const moves: PaiMove[] = []
  const player = position.current
  const pack = position.reserve[player]

  for (const gate of GATES) {
    if (tileAt(position.tiles, gate.x, gate.y)) {
      continue
    }
    for (const kind of Object.keys(pack) as FlowerKind[]) {
      if (pack[kind] <= 0) {
        continue
      }
      const next = applyMove(position, { kind: 'plant', tile: kind, x: gate.x, y: gate.y })
      if (!hasClash(next.tiles)) {
        moves.push({ kind: 'plant', tile: kind, x: gate.x, y: gate.y })
      }
    }
  }

  for (const tile of position.tiles) {
    if (tile.player !== player) {
      continue
    }
    for (const dest of arrangeDestinations(position, tile)) {
      const move: PaiMove = { kind: 'arrange', fromX: tile.x, fromY: tile.y, toX: dest.x, toY: dest.y }
      const next = applyMove(position, move)
      if (!hasClash(next.tiles)) {
        moves.push(move)
      }
    }
  }

  return moves
}

export function sameMove(a: PaiMove, b: PaiMove): boolean {
  if (a.kind !== b.kind) {
    return false
  }
  if (a.kind === 'plant' && b.kind === 'plant') {
    return a.tile === b.tile && a.x === b.x && a.y === b.y
  }
  if (a.kind === 'arrange' && b.kind === 'arrange') {
    return a.fromX === b.fromX && a.fromY === b.fromY && a.toX === b.toX && a.toY === b.toY
  }
  return false
}

export { isBlooming }
