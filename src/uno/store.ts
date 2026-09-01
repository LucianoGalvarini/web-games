import { GameError } from './gameEngine'
import type { Player, PublicPlayer, PublicRoomState, RoomState, UnoSink } from './types'
import { SINK_OPEN } from './types'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(len = 5): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

type SocketRegistry = Map<string, Map<string, UnoSink>>

type GlobalStore = {
  rooms: Map<string, RoomState>
  sockets: SocketRegistry
}

const globalForStore = globalThis as unknown as { __unoStore?: GlobalStore }

if (!globalForStore.__unoStore) {
  globalForStore.__unoStore = { rooms: new Map(), sockets: new Map() }
}

const store = globalForStore.__unoStore

export function getRoomSafe(roomId: string): RoomState | null {
  return store.rooms.get(roomId.toUpperCase()) ?? null
}

export function registerSocket(roomId: string, playerId: string, ws: UnoSink) {
  let room = store.sockets.get(roomId)
  if (!room) {
    room = new Map()
    store.sockets.set(roomId, room)
  }
  room.set(playerId, ws)
}

export function unregisterSocket(roomId: string, playerId: string, ws: UnoSink) {
  const room = store.sockets.get(roomId)
  if (!room) return
  if (room.get(playerId) === ws) {
    room.delete(playerId)
  }
  if (room.size === 0) store.sockets.delete(roomId)
}

export function broadcastRoom(room: RoomState) {
  const sockets = store.sockets.get(room.id)
  if (!sockets) return
  for (const [playerId, ws] of sockets) {
    if (ws.readyState !== SINK_OPEN) continue
    ws.send(JSON.stringify({ type: 'state', room: toPublic(room, playerId) }))
  }
}

export function broadcastEvent(roomId: string, event: Record<string, unknown>) {
  const sockets = store.sockets.get(roomId)
  if (!sockets) return
  const payload = JSON.stringify(event)
  for (const ws of sockets.values()) {
    if (ws.readyState === SINK_OPEN) ws.send(payload)
  }
}

export function createRoom(hostName: string): { room: RoomState; token: string; playerId: string } {
  let id = randomCode()
  let guard = 0
  while (store.rooms.has(id) && guard < 20) {
    id = randomCode()
    guard += 1
  }

  const token = randomId()
  const playerId = randomId()

  const host: Player = {
    id: playerId,
    token,
    name: hostName.trim().slice(0, 20) || 'Jugador',
    hand: [],
    isHost: true,
    connected: true,
    saidUno: false,
    lastSeen: Date.now(),
  }

  const room: RoomState = {
    id,
    createdAt: Date.now(),
    status: 'lobby',
    players: [host],
    currentPlayerIndex: 0,
    direction: 1,
    drawPile: [],
    discardPile: [],
    currentColor: 'red',
    winnerId: null,
    log: [{ id: 'l0', text: `${host.name} creó la sala.`, ts: Date.now() }],
    drawStreak: { playerId: null, pendingDraw: 0 },
  }

  store.rooms.set(id, room)
  return { room, token, playerId }
}

export function getRoom(roomId: string): RoomState {
  const room = store.rooms.get(roomId.toUpperCase())
  if (!room) throw new GameError('No se encontró la sala.')
  return room
}

export function joinRoom(roomId: string, name: string): { room: RoomState; token: string; playerId: string } {
  const room = getRoom(roomId)
  if (room.status !== 'lobby') throw new GameError('Esta partida ya empezó.')
  if (room.players.length >= 6) throw new GameError('La sala está llena (máximo 6).')

  const trimmed = name.trim().slice(0, 20) || 'Jugador'
  const taken = room.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  const finalName = taken ? `${trimmed} (${room.players.length + 1})` : trimmed

  const token = randomId()
  const playerId = randomId()
  const player: Player = {
    id: playerId,
    token,
    name: finalName,
    hand: [],
    isHost: false,
    connected: true,
    saidUno: false,
    lastSeen: Date.now(),
  }
  room.players.push(player)
  room.log.push({ id: `l${room.log.length}`, text: `${finalName} se unió a la sala.`, ts: Date.now() })

  return { room, token, playerId }
}

export function authenticate(room: RoomState, playerId: string, token: string): Player {
  const player = room.players.find((p) => p.id === playerId)
  if (!player || player.token !== token) throw new GameError('No estás autorizado en esta sala.')
  player.lastSeen = Date.now()
  player.connected = true
  return player
}

export function removeRoomIfStale() {
  const now = Date.now()
  for (const [id, room] of store.rooms.entries()) {
    if (now - room.createdAt > 1000 * 60 * 60 * 12) {
      store.rooms.delete(id)
    }
  }
}

export function toPublic(room: RoomState, viewerId: string | null): PublicRoomState {
  const players: PublicPlayer[] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    handCount: p.hand.length,
    isHost: p.isHost,
    connected: p.connected,
    saidUno: p.saidUno,
  }))

  const you = viewerId ? room.players.find((p) => p.id === viewerId) : null

  return {
    id: room.id,
    status: room.status,
    players,
    currentPlayerIndex: room.currentPlayerIndex,
    direction: room.direction,
    drawPileCount: room.drawPile.length,
    topCard: room.discardPile.length ? room.discardPile[room.discardPile.length - 1] : null,
    currentColor: room.status === 'lobby' ? null : room.currentColor,
    winnerId: room.winnerId,
    log: room.log.slice(-25),
    you: you ? { id: you.id, hand: you.hand } : null,
  }
}
