import { SoundToggle } from '../SoundToggle'

type LigaChromeProps = {
  wide: boolean
  onToggleWide: () => void
}

function FullscreenIcon({ wide }: { wide: boolean }) {
  if (wide) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 9H5V5h4v3M16 9h3V5h-4v3M8 15H5v4h4v-3M16 15h3v4h-4v-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LigaChrome({ wide, onToggleWide }: LigaChromeProps) {
  return (
    <div className="liga-chrome">
      <SoundToggle compact />
      <button
        type="button"
        className="hud-btn is-chrome"
        onClick={onToggleWide}
        aria-label={wide ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={wide ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        <span className="hud-icon">
          <FullscreenIcon wide={wide} />
        </span>
      </button>
    </div>
  )
}
