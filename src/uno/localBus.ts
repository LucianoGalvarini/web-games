import { apiCreateRoom, apiJoinRoom, errorMessage, handleDisconnect, handleMessage } from './dispatch'
import type { SocketCtx } from './dispatch'
import type { ClientMessage, ServerMessage } from './protocol'
import { getRoomSafe } from './store'
import { SINK_OPEN } from './types'
import type { UnoSink } from './types'
import type { RoomSessionReply, Session, UnoHandlers, UnoSocket } from './session'

const CHANNEL = 'web-games-uno'

type BusMsg =
  | { t: 'join'; id: string; roomId: string; name: string }
  | { t: 'joined'; id: string; room: RoomSessionReply['room']; token: string; playerId: string }
  | { t: 'join-err'; id: string; error: string }
  | { t: 'client'; roomId: string; playerId: string; payload: ClientMessage }
  | { t: 'server'; playerId: string; data: string }
  | { t: 'close'; roomId: string; playerId: string }

type Pending = {
  resolve: (value: RoomSessionReply) => void
  reject: (err: Error) => void
}

const pendingJoins = new Map<string, Pending>()
const guestSinks = new Map<string, UnoSink>()
const guestCtx = new Map<string, SocketCtx | null>()
let channel: BroadcastChannel | null = null

function bus(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (ev: MessageEvent<BusMsg>) => {
      const msg = ev.data
      if (!msg || typeof msg !== 'object') return

      if (msg.t === 'join') {
        const room = getRoomSafe(msg.roomId)
        if (!room) return
        try {
          const result = apiJoinRoom(msg.roomId, msg.name)
          channel?.postMessage({
            t: 'joined',
            id: msg.id,
            room: result.room,
            token: result.token,
            playerId: result.playerId,
          } satisfies BusMsg)
        } catch (err) {
          channel?.postMessage({ t: 'join-err', id: msg.id, error: errorMessage(err) } satisfies BusMsg)
        }
        return
      }

      if (msg.t === 'joined') {
        const wait = pendingJoins.get(msg.id)
        if (!wait) return
        pendingJoins.delete(msg.id)
        wait.resolve({ room: msg.room, token: msg.token, playerId: msg.playerId })
        return
      }

      if (msg.t === 'join-err') {
        const wait = pendingJoins.get(msg.id)
        if (!wait) return
        pendingJoins.delete(msg.id)
        wait.reject(new Error(msg.error))
        return
      }

      if (msg.t === 'client') {
        const room = getRoomSafe(msg.roomId)
        if (!room) return
        const sink = ensureGuestSink(msg.playerId)
        try {
          const result = handleMessage(sink, guestCtx.get(msg.playerId) ?? null, msg.payload)
          guestCtx.set(msg.playerId, result.ctx)
          if (result.close) {
            guestSinks.delete(msg.playerId)
            guestCtx.delete(msg.playerId)
          }
        } catch (err) {
          sink.send(JSON.stringify({ type: 'error', message: errorMessage(err) }))
        }
        return
      }

      if (msg.t === 'close') {
        const room = getRoomSafe(msg.roomId)
        if (!room) return
        const sink = guestSinks.get(msg.playerId)
        const ctx = guestCtx.get(msg.playerId) ?? null
        if (sink) handleDisconnect(ctx, sink)
        guestSinks.delete(msg.playerId)
        guestCtx.delete(msg.playerId)
      }
    }
  }
  return channel
}

function ensureGuestSink(playerId: string): UnoSink {
  let sink = guestSinks.get(playerId)
  if (!sink) {
    sink = {
      readyState: SINK_OPEN,
      send(data: string) {
        bus()?.postMessage({ t: 'server', playerId, data } satisfies BusMsg)
      },
    }
    guestSinks.set(playerId, sink)
  }
  return sink
}

export function localCreate(name: string): RoomSessionReply {
  bus()
  return apiCreateRoom(name)
}

export function localJoin(roomId: string, name: string): Promise<RoomSessionReply> {
  const ch = bus()
  if (!ch) return Promise.reject(new Error('No se puede unir a una sala en esta ventana.'))

  const owned = getRoomSafe(roomId)
  if (owned) {
    return Promise.resolve(apiJoinRoom(roomId, name))
  }

  const id = Math.random().toString(36).slice(2)
  return new Promise((resolve, reject) => {
    pendingJoins.set(id, { resolve, reject })
    ch.postMessage({ t: 'join', id, roomId: roomId.toUpperCase(), name } satisfies BusMsg)
    window.setTimeout(() => {
      if (!pendingJoins.has(id)) return
      pendingJoins.delete(id)
      reject(new Error('No se encontró la sala.'))
    }, 1600)
  })
}

export function connectLocalHost(session: Session, handlers: UnoHandlers): UnoSocket {
  bus()
  const sink: UnoSink = {
    readyState: SINK_OPEN,
    send(data: string) {
      handlers.onMessage(JSON.parse(data) as ServerMessage)
    },
  }
  let ctx: SocketCtx | null = null

  const send = (payload: ClientMessage) => {
    try {
      const result = handleMessage(sink, ctx, payload)
      ctx = result.ctx
      if (result.close) handlers.onClose()
    } catch (err) {
      sink.send(JSON.stringify({ type: 'error', message: errorMessage(err) }))
    }
  }

  send({ type: 'join', roomId: session.roomId, playerId: session.playerId, token: session.token })

  return {
    send,
    close() {
      handleDisconnect(ctx, sink)
      handlers.onClose()
    },
  }
}

export function connectLocalGuest(session: Session, handlers: UnoHandlers): UnoSocket {
  const ch = bus()
  if (!ch) {
    handlers.onClose()
    return { send() {}, close() {} }
  }

  const onBus = (ev: MessageEvent<BusMsg>) => {
    const msg = ev.data
    if (msg?.t === 'server' && msg.playerId === session.playerId) {
      handlers.onMessage(JSON.parse(msg.data) as ServerMessage)
    }
  }
  ch.addEventListener('message', onBus)

  const send = (payload: ClientMessage) => {
    ch.postMessage({
      t: 'client',
      roomId: session.roomId,
      playerId: session.playerId,
      payload,
    } satisfies BusMsg)
  }

  send({ type: 'join', roomId: session.roomId, playerId: session.playerId, token: session.token })

  return {
    send,
    close() {
      ch.postMessage({ t: 'close', roomId: session.roomId, playerId: session.playerId } satisfies BusMsg)
      ch.removeEventListener('message', onBus)
      handlers.onClose()
    },
  }
}

export function connectLocal(session: Session, handlers: UnoHandlers): UnoSocket {
  if (getRoomSafe(session.roomId)) {
    return connectLocalHost(session, handlers)
  }
  return connectLocalGuest(session, handlers)
}
