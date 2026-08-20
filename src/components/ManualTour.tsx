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

function cardStyle(hole: Hole | null): CSSProperties {
  const width = Math.min(380, window.innerWidth - 32)
  if (!hole) {
    return {
      top: '50%',
      left: '50%',
      width,
      transform: 'translate(-50%, -50%)',
    }
  }
  const below = hole.top + hole.height + 16
  const fitsBelow = below + 240 < window.innerHeight
  const top = fitsBelow ? below : Math.max(16, hole.top - 16 - 220)
  let left = hole.left
  if (left + width > window.innerWidth - 16) {
    left = window.innerWidth - width - 16
  }
  return { top, left, width }
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
    const measure = () => setHole(holeOf(step?.spot))
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
