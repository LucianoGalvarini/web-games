import { GameError, callUno, calloutPlayer, drawCard, playCard, removePlayer, startGame } from './gameEngine'
import { QUICK_PHRASES } from './protocol'
import type { ClientMessage } from './protocol'
import {
  authenticate,
  broadcastEvent,
  broadcastRoom,
  createRoom,
  getRoom,
  getRoomSafe,
  joinRoom,
  registerSocket,
  toPublic,
  unregisterSocket,
} from './store'
import type { PublicRoomState, UnoSink } from './types'

export type SocketCtx = { roomId: string; playerId: string }

export type RoomSession = {
  room: PublicRoomState
  token: string
  playerId: string
}

function victoryPayload(room: { players: { id: string; name: string }[]; winnerId: string | null }) {
  const winner = room.players.find((p) => p.id === room.winnerId)
  return { type: 'victory', winnerId: room.winnerId, winnerName: winner ? winner.name : 'Jugador' }
}

export function apiCreateRoom(name: string): RoomSession {
  const trimmed = name.trim()
  if (!trimmed) throw new GameError('Poné un nombre.')
  const { room, token, playerId } = createRoom(trimmed)
  return { room: toPublic(room, playerId), token, playerId }
}

export function apiJoinRoom(roomId: string, name: string): RoomSession {
  const trimmed = name.trim()
  if (!trimmed) throw new GameError('Poné un nombre.')
  const { room, token, playerId } = joinRoom(roomId, trimmed)
  return { room: toPublic(room, playerId), token, playerId }
}

export function handleMessage(ws: UnoSink, ctx: SocketCtx | null, raw: unknown): { ctx: SocketCtx | null; close: boolean } {
  if (!raw || typeof raw !== 'object' || !('type' in raw)) {
    return { ctx, close: false }
  }
  const msg = raw as ClientMessage
  if (msg.type === 'join') {
    const room = getRoom(msg.roomId)
    const player = authenticate(room, msg.playerId, msg.token)
    registerSocket(room.id, player.id, ws)
    player.connected = true
    broadcastRoom(room)
    return { ctx: { roomId: room.id, playerId: player.id }, close: false }
  }

  if (!ctx) {
    ws.send(JSON.stringify({ type: 'error', message: 'Entrá a una sala antes de jugar.' }))
    return { ctx, close: false }
  }

  const room = getRoom(ctx.roomId)
  const player = room.players.find((p) => p.id === ctx.playerId)
  if (!player) return { ctx, close: false }

  switch (msg.type) {
    case 'start': {
      if (!player.isHost) throw new GameError('Solo el anfitrión puede empezar.')
      startGame(room)
      broadcastRoom(room)
      break
    }
    case 'play': {
      playCard(room, player, msg.cardId, msg.color)
      broadcastRoom(room)
      if (room.status === 'finished' && room.winnerId) {
        broadcastEvent(room.id, victoryPayload(room))
      }
      break
    }
    case 'draw': {
      drawCard(room, player)
      broadcastRoom(room)
      break
    }
    case 'uno': {
      callUno(room, player)
      broadcastRoom(room)
      break
    }
    case 'callout': {
      calloutPlayer(room, player, msg.targetId)
      broadcastRoom(room)
      break
    }
    case 'chat': {
      if ((QUICK_PHRASES as readonly string[]).includes(msg.phrase)) {
        broadcastEvent(room.id, {
          type: 'chatBubble',
          playerId: player.id,
          phrase: msg.phrase,
          ts: Date.now(),
        })
      }
      break
    }
    case 'leave': {
      const name = player.name
      removePlayer(room, player.id)
      unregisterSocket(room.id, ctx.playerId, ws)
      broadcastEvent(room.id, { type: 'playerLeft', playerId: ctx.playerId, name })
      broadcastRoom(room)
      if (room.status === 'finished' && room.winnerId) {
        broadcastEvent(room.id, victoryPayload(room))
      }
      return { ctx: null, close: true }
    }
    default:
      break
  }

  return { ctx, close: false }
}

export function handleDisconnect(ctx: SocketCtx | null, ws: UnoSink) {
  if (!ctx) return
  const room = getRoomSafe(ctx.roomId)
  unregisterSocket(ctx.roomId, ctx.playerId, ws)
  if (!room) return
  const player = room.players.find((p) => p.id === ctx.playerId)
  if (player) {
    player.connected = false
    broadcastRoom(room)
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof GameError) return err.message
  if (err instanceof Error) return err.message
  return 'Algo salió mal.'
}
