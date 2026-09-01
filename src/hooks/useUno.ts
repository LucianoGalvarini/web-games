import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSession, connectRoom, createRoomRequest, joinRoomRequest, saveSession } from '../uno/client'
import type { Session } from '../uno/client'
import { QUICK_PHRASES } from '../uno/protocol'
import type { ClientMessage } from '../uno/protocol'
import type { Color, PublicRoomState } from '../uno/types'
import { playSfx } from '../shared/sfx'

export type ChatBubble = {
  id: string
  playerId: string
  phrase: string
  ts: number
}

export type VictoryInfo = {
  winnerId: string
  winnerName: string
}

export function useUno() {
  const [session, setSession] = useState<Session | null>(null)
  const [room, setRoom] = useState<PublicRoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [bubbles, setBubbles] = useState<ChatBubble[]>([])
  const [victory, setVictory] = useState<VictoryInfo | null>(null)
  const socketRef = useRef<ReturnType<typeof connectRoom> | null>(null)
  const statusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!session) return

    const socket = connectRoom(session, {
      onMessage(msg) {
        switch (msg.type) {
          case 'state': {
            if (statusRef.current && statusRef.current !== 'playing' && msg.room.status === 'playing') {
              playSfx('deal')
            }
            statusRef.current = msg.room.status
            setRoom(msg.room)
            setError(null)
            break
          }
          case 'chatBubble': {
            const id = `${msg.playerId}-${msg.ts}`
            setBubbles((b) => [...b, { id, playerId: msg.playerId, phrase: msg.phrase, ts: msg.ts }])
            playSfx('click')
            window.setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== id)), 3200)
            break
          }
          case 'victory': {
            setVictory({ winnerId: msg.winnerId, winnerName: msg.winnerName })
            playSfx('win')
            break
          }
          case 'error': {
            setError(msg.message)
            break
          }
          default:
            break
        }
      },
      onClose() {
        /* el socket se recrea al cambiar la sesión */
      },
    })
    socketRef.current = socket

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [session])

  const send = useCallback((payload: ClientMessage) => {
    socketRef.current?.send(payload)
  }, [])

  const enter = useCallback(async (mode: 'create' | 'join', name: string, code: string) => {
    setError(null)
    if (!name.trim()) {
      setError('Poné tu nombre para seguir.')
      return
    }
    if (mode === 'join' && !code.trim()) {
      setError('Poné el código de la sala.')
      return
    }
    setBusy(true)
    try {
      const result =
        mode === 'create' ? await createRoomRequest(name) : await joinRoomRequest(code.trim(), name)
      const next: Session = { roomId: result.room.id, playerId: result.playerId, token: result.token }
      saveSession(next)
      setRoom(result.room)
      setSession(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.')
    } finally {
      setBusy(false)
    }
  }, [])

  const start = useCallback(() => send({ type: 'start' }), [send])
  const playCard = useCallback(
    (cardId: string, color?: Color) => {
      send({ type: 'play', cardId, color })
      playSfx('card')
    },
    [send],
  )
  const draw = useCallback(() => {
    send({ type: 'draw' })
    playSfx('deal')
  }, [send])
  const callUno = useCallback(() => {
    send({ type: 'uno' })
    playSfx('shout')
  }, [send])
  const callout = useCallback((targetId: string) => send({ type: 'callout', targetId }), [send])
  const leave = useCallback(() => {
    send({ type: 'leave' })
    if (session) clearSession(session.roomId)
    socketRef.current?.close()
    socketRef.current = null
    setSession(null)
    setRoom(null)
    setVictory(null)
    setBubbles([])
    statusRef.current = null
  }, [send, session])
  const sendChat = useCallback(
    (phrase: string) => {
      if ((QUICK_PHRASES as readonly string[]).includes(phrase)) send({ type: 'chat', phrase })
    },
    [send],
  )

  return {
    session,
    room,
    error,
    busy,
    bubbles,
    victory,
    enter,
    start,
    playCard,
    draw,
    callUno,
    callout,
    leave,
    sendChat,
    dismissVictory: () => setVictory(null),
  }
}
