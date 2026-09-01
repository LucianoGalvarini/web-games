import type { Color, PublicRoomState } from './types'

export const QUICK_PHRASES = ['¡Buena!', 'Casi…', '¡UNO!', '¿Quién repartió?'] as const
export type QuickPhrase = (typeof QUICK_PHRASES)[number]

export type ClientMessage =
  | { type: 'join'; roomId: string; playerId: string; token: string }
  | { type: 'start' }
  | { type: 'play'; cardId: string; color?: Color }
  | { type: 'draw' }
  | { type: 'uno' }
  | { type: 'callout'; targetId: string }
  | { type: 'chat'; phrase: string }
  | { type: 'leave' }

export type ServerMessage =
  | { type: 'state'; room: PublicRoomState }
  | { type: 'chatBubble'; playerId: string; phrase: string; ts: number }
  | { type: 'victory'; winnerId: string; winnerName: string }
  | { type: 'playerLeft'; playerId: string; name: string }
  | { type: 'error'; message: string }
