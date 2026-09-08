import { useEffect, useRef, useState } from 'react'
import { ROULETTE_SEGMENTS } from '../../pokealbum'
import type { RouletteSegment } from '../../pokealbum'
import { playSfx } from '../../shared/sfx'

type RouletteWheelProps = {
  spinReadyAt: number
  lastSpinResult: { segment: RouletteSegment; amount: number } | null
  onSpin: () => void
}

const SEGMENT_COUNT = ROULETTE_SEGMENTS.length
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT
const WHEEL_COLORS = ['#e0402c', '#3868c8', '#e4b45a', '#3a2818']
const SPIN_ANIMATION_MS = 3200
const ICON_RADIUS = 150

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function resultSuffix(result: { segment: RouletteSegment; amount: number }): string {
  if (result.segment.kind === 'coins' || result.segment.kind === 'jackpot') {
    return ` +${result.amount} monedas`
  }
  if (result.segment.kind === 'loseCoins') {
    return ` -${result.amount} monedas`
  }
  return ''
}

export function RouletteWheel({ spinReadyAt, lastSpinResult, onSpin }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [resultSeq, setResultSeq] = useState(0)
  const lastHandledResult = useRef<{ segment: RouletteSegment; amount: number } | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!lastSpinResult || lastSpinResult === lastHandledResult.current) {
      return
    }
    lastHandledResult.current = lastSpinResult
    const index = ROULETTE_SEGMENTS.findIndex((seg) => seg.id === lastSpinResult.segment.id)
    if (index === -1) {
      return
    }
    const targetCenterAngle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    setSpinning(true)
    setRotation((prev) => {
      const currentMod = ((prev % 360) + 360) % 360
      const delta = (360 - targetCenterAngle - currentMod + 360) % 360
      return prev + delta + 5 * 360
    })
    const timeout = window.setTimeout(() => {
      setSpinning(false)
      setResultSeq((seq) => seq + 1)
    }, SPIN_ANIMATION_MS)
    return () => window.clearTimeout(timeout)
  }, [lastSpinResult])

  const gradientStops = ROULETTE_SEGMENTS.map((_, i) => {
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length]
    return `${color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`
  }).join(', ')

  const readyMs = spinReadyAt - now
  const canSpinNow = readyMs <= 0

  return (
    <div className="pokealbum-roulette">
      <div className="pokealbum-roulette-frame">
        <div className="pokealbum-roulette-pointer" aria-hidden="true" />
        <div
          className="pokealbum-roulette-wheel"
          style={{ background: `conic-gradient(${gradientStops})`, transform: `rotate(${rotation}deg)` }}
        >
          {ROULETTE_SEGMENTS.map((seg, i) => {
            const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90
            return (
              <span
                key={seg.id}
                className="pokealbum-roulette-icon"
                style={{ transform: `rotate(${angle}deg) translate(${ICON_RADIUS}px) rotate(${-angle}deg)` }}
              >
                {seg.icon}
              </span>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-gold pokealbum-roulette-btn"
        onMouseEnter={() => canSpinNow && !spinning && playSfx('hover')}
        onClick={onSpin}
        disabled={!canSpinNow || spinning}
      >
        {spinning ? 'Girando...' : canSpinNow ? 'Girar la ruleta' : `Próximo giro: ${formatCountdown(readyMs)}`}
      </button>
      {lastSpinResult && !spinning && (
        <div key={resultSeq} className="pokealbum-roulette-result-card">
          <span className="pokealbum-roulette-result-icon">{lastSpinResult.segment.icon}</span>
          <span className="pokealbum-roulette-result-text">
            ¡{lastSpinResult.segment.label}!
            {resultSuffix(lastSpinResult) && <strong>{resultSuffix(lastSpinResult)}</strong>}
          </span>
        </div>
      )}
    </div>
  )
}
