import { samePoint, type Point } from '../shared/point'
import { DIRS, ROOM_COLS, ROOM_ORDER, ROOM_ROWS } from './constants'
import type { LigaDir, LigaRoomId, LigaState, LigaTrainerId } from './types'

export type LigaTile = 'wall' | 'floor' | 'door-n' | 'door-s'

export type LigaPropKind = 'torch' | 'plant' | 'statue' | 'pillar' | 'table'

export type LigaProp = { kind: LigaPropKind; x: number; y: number }

export type LigaRoomDef = {
  id: LigaRoomId
  tiles: LigaTile[][]
  trainer: Point | null
  spawn: Point
  spawnNorth: Point
  spawnSouth: Point
}

function buildRoom(id: LigaRoomId, north: boolean, south: boolean, trainer: boolean): LigaRoomDef {
  const tiles: LigaTile[][] = []
  for (let y = 0; y < ROOM_ROWS; y += 1) {
    const row: LigaTile[] = []
    for (let x = 0; x < ROOM_COLS; x += 1) {
      const doorway = x >= 5 && x <= 7
      if (y === 0) {
        row.push(north && doorway ? 'door-n' : 'wall')
        continue
      }
      if (y === ROOM_ROWS - 1) {
        row.push(south && doorway ? 'door-s' : 'wall')
        continue
      }
      if (x === 0 || x === ROOM_COLS - 1) {
        row.push('wall')
        continue
      }
      row.push('floor')
    }
    tiles.push(row)
  }
  return {
    id,
    tiles,
    trainer: trainer ? { x: 6, y: 3 } : null,
    spawn: { x: 6, y: 8 },
    spawnNorth: { x: 6, y: 1 },
    spawnSouth: { x: 6, y: 9 },
  }
}

export const ROOMS: Record<LigaRoomId, LigaRoomDef> = {
  sidney: buildRoom('sidney', true, false, true),
  phoebe: buildRoom('phoebe', true, true, true),
  glacia: buildRoom('glacia', true, true, true),
  drake: buildRoom('drake', true, true, true),
  steven: buildRoom('steven', true, true, true),
  hall: buildRoom('hall', false, true, false),
}

const ROOM_PROPS: LigaProp[] = [
  { kind: 'torch', x: 1, y: 2 },
  { kind: 'torch', x: 11, y: 2 },
  { kind: 'pillar', x: 2, y: 2 },
  { kind: 'pillar', x: 10, y: 2 },
  { kind: 'statue', x: 1, y: 4 },
  { kind: 'statue', x: 11, y: 4 },
  { kind: 'plant', x: 1, y: 6 },
  { kind: 'plant', x: 11, y: 6 },
]

const HALL_PROPS: LigaProp[] = [
  { kind: 'table', x: 3, y: 3 },
  { kind: 'table', x: 8, y: 3 },
]

export function propsOf(room: LigaRoomId): LigaProp[] {
  return room === 'hall' ? [...ROOM_PROPS, ...HALL_PROPS] : ROOM_PROPS
}

function propOccupies(prop: LigaProp, x: number, y: number): boolean {
  if (prop.kind === 'pillar') {
    return prop.x === x && (y === prop.y || y === prop.y + 1)
  }
  return prop.x === x && prop.y === y
}

export function roomOf(id: LigaRoomId): LigaRoomDef {
  return ROOMS[id]
}

export function nextRoom(id: LigaRoomId): LigaRoomId | null {
  const index = ROOM_ORDER.indexOf(id)
  return ROOM_ORDER[index + 1] ?? null
}

export function prevRoom(id: LigaRoomId): LigaRoomId | null {
  const index = ROOM_ORDER.indexOf(id)
  return index > 0 ? (ROOM_ORDER[index - 1] ?? null) : null
}

export function trainerIdOf(room: LigaRoomId): LigaTrainerId | null {
  if (room === 'hall') {
    return null
  }
  return room
}

export function trainerPos(state: LigaState, room: LigaRoomId): Point | null {
  const id = trainerIdOf(room)
  const base = ROOMS[room].trainer
  if (!id || !base) {
    return null
  }
  if (state.trainers[id].beaten) {
    return { x: base.x + 2, y: base.y }
  }
  return base
}

export function doorOpen(state: LigaState, room: LigaRoomId): boolean {
  const id = trainerIdOf(room)
  return id ? state.trainers[id].beaten : true
}

export function tileAt(room: LigaRoomId, x: number, y: number): LigaTile | null {
  return ROOMS[room].tiles[y]?.[x] ?? null
}

export function walkable(state: LigaState, x: number, y: number): boolean {
  const tile = tileAt(state.room, x, y)
  if (!tile || tile === 'wall') {
    return false
  }
  if (tile === 'door-n' && !doorOpen(state, state.room)) {
    return false
  }
  const trainer = trainerPos(state, state.room)
  if (trainer && samePoint(trainer, { x, y })) {
    return false
  }
  if (propsOf(state.room).some((prop) => propOccupies(prop, x, y))) {
    return false
  }
  return true
}

export function facingTile(state: LigaState): Point {
  const step = DIRS[state.facing]
  return { x: state.player.x + step.x, y: state.player.y + step.y }
}

export function facingTrainer(state: LigaState): LigaTrainerId | null {
  const id = trainerIdOf(state.room)
  const pos = trainerPos(state, state.room)
  if (!id || !pos || state.trainers[id].beaten) {
    return null
  }
  return samePoint(facingTile(state), pos) ? id : null
}

export function canStep(state: LigaState, dir: LigaDir): boolean {
  const step = DIRS[dir]
  return walkable(state, state.player.x + step.x, state.player.y + step.y)
}
