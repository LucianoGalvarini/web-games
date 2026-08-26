import { useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ManualSpot, ManualStep } from '../shared/manual'

type ManualTourProps = {
  open: boolean
  title?: string
  steps: ManualStep[]
  onClose: () => void
}

type Hole = {
  top: number
  left: number
  width: number
  height: number
}

function holeOf(spot: ManualSpot | undefined): Hole | null {
  if (!spot) {
    return null
  }
  const node = document.querySelector(`[data-manual="${spot}"]`)
  if (!(node instanceof HTMLElement)) {
    return null
  }
  const rect = node.getBoundingClientRect()
  const pad = 8
  return {
    top: Math.max(12, rect.top - pad),
    left: Math.max(12, rect.left - pad),
    width: Math.min(window.innerWidth - 24, rect.width + pad * 2),
    height: Math.min(window.innerHeight - 24, rect.height + pad * 2),
  }
}

const CARD_MARGIN = 16
const MIN_SPACE = 220

function cardStyle(hole: Hole | null): CSSProperties {
  const width = Math.min(380, window.innerWidth - CARD_MARGIN * 2)

  if (!hole) {
    return {
      top: '50%',
      left: '50%',
      width,
      maxHeight: window.innerHeight - CARD_MARGIN * 2,
      transform: 'translate(-50%, -50%)',
    }
  }

  const spaceBelow = window.innerHeight - (hole.top + hole.height) - CARD_MARGIN
  const spaceAbove = hole.top - CARD_MARGIN

  let top: number
  if (spaceBelow >= MIN_SPACE || spaceBelow >= spaceAbove) {
    top = hole.top + hole.height + CARD_MARGIN
  } else {
    top = Math.max(CARD_MARGIN, hole.top - CARD_MARGIN - spaceAbove)
  }

  // If the highlighted region is taller than the viewport (a tall board, say),
  // neither "below" nor "above" has room — pin the card near the top instead
  // of letting it drift off-screen, and let it scroll internally if it's tall.
  const maxTop = Math.max(CARD_MARGIN, window.innerHeight - CARD_MARGIN - MIN_SPACE)
  top = Math.min(Math.max(CARD_MARGIN, top), maxTop)

  let left = hole.left
  if (left + width > window.innerWidth - CARD_MARGIN) {
    left = window.innerWidth - width - CARD_MARGIN
  }
  left = Math.max(CARD_MARGIN, left)

  return { top, left, width, maxHeight: window.innerHeight - top - CARD_MARGIN }
}

export function ManualTour({ open, title = 'Manual', steps, onClose }: ManualTourProps) {
  const [index, setIndex] = useState(0)
  const [hole, setHole] = useState<Hole | null>(null)

  useEffect(() => {
    if (open) {
      setIndex(0)
    }
  }, [open])

  const step = steps[index]
  const last = index >= steps.length - 1

  useLayoutEffect(() => {
    if (!open) {
      return
    }
    const spot = step?.spot
    const node = spot ? document.querySelector(`[data-manual="${spot}"]`) : null
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
    const measure = () => setHole(holeOf(spot))
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, index, step?.spot])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        if (last) {
          onClose()
        } else {
          setIndex((current) => Math.min(steps.length - 1, current + 1))
        }
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex((current) => Math.max(0, current - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, last, onClose, steps.length])

  if (!open || !step) {
    return null
  }

  return (
    <div className="manual-layer" role="dialog" aria-modal="true" aria-labelledby="manual-title">
      {hole ? <div className="manual-hole" style={hole} /> : <div className="manual-veil" />}
      <div className="manual-card" style={cardStyle(hole)}>
        <p className="eyebrow">
          {title} · {index + 1} / {steps.length}
        </p>
        <h2 id="manual-title">{step.title}</h2>
        <p>{step.body}</p>
        {step.tryIt ? <p className="manual-try">{step.tryIt}</p> : null}
        <div className="manual-actions">
          <button type="button" className="btn" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
            Anterior
          </button>
          {last ? (
            <button type="button" className="btn btn-gold" onClick={onClose}>
              Listo
            </button>
          ) : (
            <button type="button" className="btn btn-gold" onClick={() => setIndex((current) => current + 1)}>
              Siguiente
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
