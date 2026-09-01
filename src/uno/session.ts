import type { ClientMessage, ServerMessage } from './protocol'
import type { PublicRoomState } from './types'

export type Session = {
  roomId: string
  playerId: string
  token: string
}

function key(roomId: string) {
  return `uno-session-${roomId.toUpperCase()}`
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(key(session.roomId), JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

export function loadSession(roomId: string): Session | null {
  try {
    const raw = localStorage.getItem(key(roomId))
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function clearSession(roomId: string) {
  try {
    localStorage.removeItem(key(roomId))
  } catch {
    /* ignore */
  }
}

export type RoomSessionReply = {
  room: PublicRoomState
  token: string
  playerId: string
}

export type UnoSocket = {
  send: (payload: ClientMessage) => void
  close: () => void
}

export type UnoHandlers = {
  onMessage: (msg: ServerMessage) => void
  onClose: () => void
}
