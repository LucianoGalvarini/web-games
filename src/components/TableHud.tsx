import { SoundToggle } from './SoundToggle'

type TableHudProps = {
  onManual: () => void
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.2c-1.6-1-3.7-1.5-6.2-1.5H4.5v14.2h1.4c2.4 0 4.4.5 6.1 1.5 1.7-1 3.7-1.5 6.1-1.5h1.4V3.7h-1.3c-2.5 0-4.6.5-6.2 1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 5.4v13.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 8.2h2.4M8 11h2.4M15.6 8.2H13.2M15.6 11H13.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function TableHud({ onManual }: TableHudProps) {
  return (
    <div className="table-hud">
      <button type="button" className="hud-btn" onClick={onManual} aria-label="Manual" title="Manual">
        <BookIcon />
        <span>Manual</span>
      </button>
      <SoundToggle />
    </div>
  )
}
