import { connectLocal, localCreate, localJoin } from './localBus'
import type { ClientMessage, ServerMessage } from './protocol'
import type { RoomSessionReply, Session, UnoHandlers, UnoSocket } from './session'

export type { Session } from './session'
export { clearSession, loadSession, saveSession } from './session'

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  return `${root}${path}`
}

async function request<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await res.text()
  let data: { error?: string } = {}
  try {
    data = text ? (JSON.parse(text) as { error?: string }) : {}
  } catch {
    throw new Error('Request failed.')
  }
  if (!res.ok) throw new Error(data.error || 'Request failed.')
  return data as T
}

let transport: 'http' | 'local' = 'http'

export async function createRoomRequest(name: string): Promise<RoomSessionReply> {
  try {
    const result = await request<RoomSessionReply>(apiUrl('/api/rooms'), { name })
    transport = 'http'
    return result
  } catch {
    transport = 'local'
    return localCreate(name)
  }
}

export async function joinRoomRequest(roomId: string, name: string): Promise<RoomSessionReply> {
  try {
    const result = await request<RoomSessionReply>(apiUrl(`/api/rooms/${roomId}/join`), { name })
    transport = 'http'
    return result
  } catch {
    transport = 'local'
    return localJoin(roomId, name)
  }
}

function wsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const base = import.meta.env.BASE_URL
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  return `${protocol}://${window.location.host}${root}/ws`
}

function connectHttp(session: Session, handlers: UnoHandlers): UnoSocket {
  const ws = new WebSocket(wsUrl())

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'join',
        roomId: session.roomId,
        playerId: session.playerId,
        token: session.token,
      } satisfies ClientMessage),
    )
  }

  ws.onmessage = (evt) => {
    handlers.onMessage(JSON.parse(evt.data as string) as ServerMessage)
  }

  ws.onclose = () => handlers.onClose()

  return {
    send(payload) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
    },
    close() {
      ws.close()
    },
  }
}

export function connectRoom(session: Session, handlers: UnoHandlers): UnoSocket {
  if (transport === 'local') {
    return connectLocal(session, handlers)
  }
  return connectHttp(session, handlers)
}
