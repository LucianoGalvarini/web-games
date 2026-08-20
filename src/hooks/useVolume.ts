import { useEffect, useState } from 'react'
import { getVolume, setVolume, subscribeVolume } from '../shared/sfx'

export function useVolume(): { volume: number; setVolume: (value: number) => void; muted: boolean } {
  const [volume, setVolumeState] = useState(getVolume)

  useEffect(() => subscribeVolume(setVolumeState), [])

  return {
    volume,
    setVolume,
    muted: volume === 0,
  }
}
