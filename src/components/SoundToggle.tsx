import { useEffect, useRef, useState } from 'react'
import { useVolume } from '../hooks/useVolume'

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

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const { volume, setVolume, muted } = useVolume()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={`hud-volume${compact ? ' is-compact' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`hud-btn ${muted ? 'is-off' : ''}${compact ? ' is-chrome' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="hud-volume-slider"
        aria-label="Volumen"
        title="Volumen"
      >
        <span className="hud-icon">
          <SpeakerIcon muted={muted} />
        </span>
        {compact ? null : <span className="hud-label">Sonido</span>}
      </button>
      {open ? (
        <div className="hud-volume-pop" id="hud-volume-slider">
          <label className="hud-volume-field">
            <span>{volume}</span>
            <input
              className="hud-volume-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volume}
              aria-label="Volumen"
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
