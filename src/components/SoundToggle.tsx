import { useMuted } from '../hooks/useMuted'

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9.5h3.2L12 6v12l-4.8-3.5H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M15.2 9.2l5.6 5.6M20.8 9.2l-5.6 5.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path
          d="M15.4 9.2a4.2 4.2 0 0 1 0 5.6M17.8 7a7 7 0 0 1 0 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function SoundToggle() {
  const { muted, toggleMuted } = useMuted()

  return (
    <button
      type="button"
      className={`hud-btn ${muted ? 'is-off' : ''}`}
      onClick={toggleMuted}
      aria-pressed={!muted}
      aria-label={muted ? 'Sonido off' : 'Sonido on'}
      title={muted ? 'Sonido off' : 'Sonido on'}
    >
      <SpeakerIcon muted={muted} />
    </button>
  )
}
