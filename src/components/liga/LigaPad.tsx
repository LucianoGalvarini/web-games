import { useCallback, useEffect, useRef } from 'react'

type LigaPadProps = {
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
  onDown,
  onUp,
}: {
  code: string
  label: string
  className: string
  onDown: (key: string) => void
  onUp: (key: string) => void
}) {
  const held = useRef(false)
  const release = useCallback(() => {
    if (!held.current) {
      return
    }
    held.current = false
    onUp(code)
  }, [code, onUp])
  useEffect(() => () => release(), [release])
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault()
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
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {label}
    </button>
  )
}

export function LigaPad({ onDown, onUp }: LigaPadProps) {
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
      </div>
      <div className="liga-pad-ab">
        <PadKey code=" " label="SPC" className="liga-pad-btn is-turbo" onDown={onDown} onUp={onUp} />
        <PadKey code="x" label="X" className="liga-pad-btn is-b" onDown={onDown} onUp={onUp} />
        <PadKey code="z" label="Z" className="liga-pad-btn is-a" onDown={onDown} onUp={onUp} />
      </div>
    </div>
  )
}
