import { useCallback, useEffect, useRef } from 'react'

type LigaPadProps = {
  turbo: boolean
  onDown: (key: string) => void
  onUp: (key: string) => void
}

const DIRS: { key: string; label: string; slot: string }[] = [
  { key: 'ArrowUp', label: '▲', slot: 'n' },
  { key: 'ArrowLeft', label: '◀', slot: 'w' },
  { key: 'ArrowRight', label: '▶', slot: 'e' },
  { key: 'ArrowDown', label: '▼', slot: 's' },
]

function PadKey({
  code,
  label,
  className,
  latch,
  onDown,
  onUp,
}: {
  code: string
  label: string
  className: string
  latch?: boolean
  onDown: (key: string) => void
  onUp: (key: string) => void
}) {
  const held = useRef(false)
  const release = useCallback(() => {
    if (latch || !held.current) {
      return
    }
    held.current = false
    onUp(code)
  }, [code, latch, onUp])
  useEffect(() => () => release(), [release])
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-pressed={latch ? className.includes('is-on') : undefined}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault()
        if (latch) {
          onDown(code)
          return
        }
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* iOS a veces no captura */
        }
        if (held.current) {
          return
        }
        held.current = true
        onDown(code)
        const id = event.pointerId
        const up = (ev: PointerEvent) => {
          if (ev.pointerId !== id) {
            return
          }
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          release()
        }
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }}
      onPointerUp={latch ? undefined : release}
      onPointerCancel={latch ? undefined : release}
      onLostPointerCapture={latch ? undefined : release}
    >
      {label}
    </button>
  )
}

export function LigaPad({ turbo, onDown, onUp }: LigaPadProps) {
  return (
    <div className="liga-pad" onContextMenu={(event) => event.preventDefault()}>
      <div className="liga-dpad" aria-hidden="false">
        {DIRS.map((dir) => (
          <PadKey
            key={dir.key}
            code={dir.key}
            label={dir.label}
            className={`liga-pad-btn is-dir is-${dir.slot}`}
            onDown={onDown}
            onUp={onUp}
          />
        ))}
        <PadKey
          code=" "
          label="SPC"
          latch
          className={`liga-pad-btn is-turbo${turbo ? ' is-on' : ''}`}
          onDown={onDown}
          onUp={onUp}
        />
      </div>
      <div className="liga-pad-ab">
        <PadKey code="Enter" label="ENT" className="liga-pad-btn is-start" onDown={onDown} onUp={onUp} />
        <PadKey code="x" label="X" className="liga-pad-btn is-b" onDown={onDown} onUp={onUp} />
        <PadKey code="z" label="Z" className="liga-pad-btn is-a" onDown={onDown} onUp={onUp} />
      </div>
    </div>
  )
}
