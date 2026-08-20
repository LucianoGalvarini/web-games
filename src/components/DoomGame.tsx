import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVolume } from '../hooks/useVolume'
import { DOOM_MANUAL } from '../shared/manuals'
import { prefetchDoom } from '../shared/prefetchDoom'
import { ManualTour } from './ManualTour'
import { TableHud } from './TableHud'

type DoomGameProps = {
  onBack: () => void
}

export function DoomGame({ onBack }: DoomGameProps) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [frameSrc, setFrameSrc] = useState<string>()
  const { volume } = useVolume()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const src = useMemo(() => `${import.meta.env.BASE_URL}doom/index.html`, [])

  const sendVolume = useCallback((value: number) => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'doom-volume', value: value / 100 },
      window.location.origin,
    )
  }, [])

  useEffect(() => {
    prefetchDoom()
    const frame = window.requestAnimationFrame(() => setFrameSrc(src))
    return () => window.cancelAnimationFrame(frame)
  }, [src])

  useEffect(() => {
    sendVolume(volume)
  }, [sendVolume, volume])

  return (
    <div className="app">
      <TableHud onManual={() => setRulesOpen(true)} />
      <div className="shell doom-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">FPS</p>
            <h1>Doom</h1>
            <p className="lede">Shareware de 1993 en el navegador. Tocá el recuadro y usá el teclado.</p>
          </header>

          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table doom-table" data-manual="board">
          {frameSrc ? (
            <iframe
              ref={frameRef}
              className="doom-frame"
              title="Doom"
              src={frameSrc}
              allow="autoplay; fullscreen; gamepad; pointer-lock"
              onLoad={() => sendVolume(volume)}
            />
          ) : (
            <div className="doom-frame doom-frame-wait" aria-hidden="true" />
          )}
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="status-card">
            <ul className="doom-help">
              <li>WASD o flechas: avanzar y girar</li>
              <li>Alt + A/D o Alt + flechas: strafe</li>
              <li>Clic o Ctrl: disparar</li>
              <li>Espacio: puertas e interruptores</li>
              <li>Shift: correr</li>
              <li>1 a 7: armas · Tab: mapa · Esc: menú</li>
            </ul>
          </div>
        </aside>
      </div>

      <ManualTour open={rulesOpen} steps={DOOM_MANUAL} onClose={() => setRulesOpen(false)} />
    </div>
  )
}
