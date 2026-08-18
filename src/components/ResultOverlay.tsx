import { useEffect, useState } from 'react'
import type { ResultVariant } from '../shared/result'

type ResultOverlayProps = {
  open: boolean
  eyebrow: string
  title: string
  detail: string
  variant: ResultVariant
  rematchLabel?: string
  extraLabel?: string
  onRematch: () => void
  onMenu: () => void
  onExtra?: () => void
}

export function ResultOverlay({
  open,
  eyebrow,
  title,
  detail,
  variant,
  rematchLabel = 'Jugar de nuevo',
  extraLabel,
  onRematch,
  onMenu,
  onExtra,
}: ResultOverlayProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(false)
  }, [open, title])

  if (!open || hidden) {
    return null
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation">
      <div
        className={`modal result-modal is-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="result-title">{title}</h2>
        <p className="result-detail">{detail}</p>
        <div className="result-actions">
          <button type="button" className="btn btn-gold" onClick={onRematch}>
            {rematchLabel}
          </button>
          {extraLabel && onExtra ? (
            <button type="button" className="btn" onClick={onExtra}>
              {extraLabel}
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onMenu}>
            Elegir juego
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setHidden(true)}>
            Ver tablero
          </button>
        </div>
      </div>
    </div>
  )
}
