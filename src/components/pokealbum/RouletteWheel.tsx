import { useEffect, useRef, useState } from 'react'
import { ROULETTE_SEGMENTS } from '../../pokealbum'
import type { RouletteSegment } from '../../pokealbum'
import { playSfx } from '../../shared/sfx'

type SpinResult = { segment: RouletteSegment; amount: number }

type RouletteWheelProps = {
  spinReadyAt: number
  pendingSpin: SpinResult | null
  lastSpinResult: SpinResult | null
  onSpin: () => void
  onClaim: () => void
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

function claimedMessage(result: SpinResult): string {
  const { segment, amount } = result
  switch (segment.kind) {
    case 'coins':
    case 'jackpot':
      return `¡Ganaste +${amount} monedas!`
    case 'loseCoins':
      return `Perdiste ${amount} monedas.`
    case 'freePack':
      return '¡Se abrió tu sobre gratis!'
    case 'freeQuestion':
      return 'Sumaste 1 pregunta de bonus, no gasta tu límite diario.'
    case 'wagerBoost':
      return 'Tu próxima apuesta acertada va a pagar el doble.'
    case 'extraSpin':
      return '¡Ya podés girar de nuevo, sin esperar!'
    default:
      return 'No pasó nada esta vez.'
  }
}

export function RouletteWheel({ spinReadyAt, pendingSpin, lastSpinResult, onSpin, onClaim }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const lastHandledResult = useRef<SpinResult | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!pendingSpin || pendingSpin === lastHandledResult.current) {
      return
    }
    lastHandledResult.current = pendingSpin
    const index = ROULETTE_SEGMENTS.findIndex((seg) => seg.id === pendingSpin.segment.id)
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
      playSfx('dexOpen')
    }, SPIN_ANIMATION_MS)
    return () => window.clearTimeout(timeout)
  }, [pendingSpin])

  const gradientStops = ROULETTE_SEGMENTS.map((_, i) => {
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length]
    return `${color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`
  }).join(', ')

  const readyMs = spinReadyAt - now
  const canSpinNow = readyMs <= 0 && !pendingSpin

  const handleClaim = () => {
    playSfx('coin')
    onClaim()
  }

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
          <div className="pokealbum-roulette-hub" aria-hidden="true" />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-gold pokealbum-roulette-btn"
        onMouseEnter={() => canSpinNow && playSfx('hover')}
        onClick={onSpin}
        disabled={!canSpinNow || spinning}
      >
        {spinning
          ? 'Girando...'
          : pendingSpin
            ? 'Reclamá tu premio para girar de nuevo'
            : readyMs > 0
              ? `Próximo giro: ${formatCountdown(readyMs)}`
              : 'Girar la ruleta'}
      </button>

      <div className="pokealbum-roulette-reward-slot">
        {pendingSpin && !spinning && (
          <div className="pokealbum-roulette-landed-card">
            <span className="pokealbum-roulette-result-icon">{pendingSpin.segment.icon}</span>
            <strong>{pendingSpin.segment.label}</strong>
            <p>{pendingSpin.segment.description}</p>
            <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={handleClaim}>
              Reclamar recompensa
            </button>
          </div>
        )}

        {!pendingSpin && lastSpinResult && !spinning && (
          <div className="pokealbum-roulette-result-card">
            <span className="pokealbum-roulette-result-icon">{lastSpinResult.segment.icon}</span>
            <span className="pokealbum-roulette-result-text">{claimedMessage(lastSpinResult)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
