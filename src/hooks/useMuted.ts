import { useEffect, useState } from 'react'
import { isMuted, setMuted, subscribeMuted } from '../shared/sfx'

export function useMuted(): { muted: boolean; toggleMuted: () => void } {
  const [muted, setMutedState] = useState(isMuted)

  useEffect(() => subscribeMuted(setMutedState), [])

  return {
    muted,
    toggleMuted: () => setMuted(!muted),
  }
}
