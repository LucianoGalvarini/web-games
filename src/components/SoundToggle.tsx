import { useMuted } from '../hooks/useMuted'

export function SoundToggle() {
  const { muted, toggleMuted } = useMuted()

  return (
    <button type="button" className="btn btn-ghost" onClick={toggleMuted} aria-pressed={!muted}>
      {muted ? 'Sonido off' : 'Sonido on'}
    </button>
  )
}
