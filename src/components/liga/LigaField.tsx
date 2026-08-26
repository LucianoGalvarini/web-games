import { useEffect, useRef } from 'react'
import { FIELD_THEME, TYPE_COLOR, type LigaAnim } from '../../liga/fx'
import { spriteUrl } from '../../liga/sprites'
import type { LigaTrainerId, LigaType } from '../../liga/types'

type LigaFieldProps = {
  trainerId: LigaTrainerId
  playerId: number
  foeId: number
  anim: LigaAnim | null
}

const W = 240
const H = 118

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (n & 255) + amount))
  return `rgb(${r},${g},${b})`
}

function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawField(ctx: CanvasRenderingContext2D, trainerId: LigaTrainerId): void {
  const theme = FIELD_THEME[trainerId]
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, theme.sky)
  sky.addColorStop(0.42, theme.sky2)
  sky.addColorStop(1, theme.floor)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = theme.wall
  ctx.fillRect(0, 30, W, 14)
  ctx.fillStyle = shade(theme.wall, 18)
  for (let x = 0; x < W; x += 20) {
    ctx.fillRect(x, 8, 14, 36)
    ctx.fillStyle = theme.accent
    ctx.fillRect(x + 4, 14, 6, 8)
    ctx.fillStyle = shade(theme.wall, 18)
  }

  ctx.fillStyle = theme.accent
  ctx.fillRect(18, 4, 12, 28)
  ctx.fillRect(210, 4, 12, 28)

  ctx.fillStyle = theme.floor
  ctx.fillRect(0, 66, W, H - 66)
  for (let y = 68; y < H; y += 8) {
    for (let x = 0; x < W; x += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillStyle = shade(theme.floor, 14)
        ctx.fillRect(x, y, 8, 8)
      }
    }
  }

  oval(ctx, 168, 58, 48, 13, 'rgba(20, 16, 28, 0.35)')
  oval(ctx, 168, 56, 42, 10, theme.platform)
  oval(ctx, 168, 54, 28, 5, shade(theme.accent, 20))

  oval(ctx, 58, 96, 54, 15, 'rgba(20, 16, 28, 0.35)')
  oval(ctx, 58, 94, 48, 12, theme.platform)
  oval(ctx, 58, 92, 32, 6, shade(theme.accent, 20))
}

function burst(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string): void {
  if (t <= 0.5) {
    return
  }
  const p = Math.min(1, (t - 0.5) / 0.35)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2
    const reach = (18 + (i % 3) * 6) * p
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach * 0.72)
    ctx.stroke()
  }
  ctx.fillStyle = '#fff'
  ctx.globalAlpha *= 0.85
  ctx.beginPath()
  ctx.arc(x, y, 3 + (1 - p) * 8, 0, Math.PI * 2)
  ctx.fill()
}

function bolt(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  seed: number,
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  const steps = 10
  for (let i = 1; i <= steps; i += 1) {
    const p = i / steps
    const jag = ((i + seed) % 2 === 0 ? 1 : -1) * (7 - Math.abs(5 - i))
    ctx.lineTo(fromX + (toX - fromX) * p + jag, fromY + (toY - fromY) * p + jag * 0.35)
  }
  ctx.stroke()
}

function drawFx(
  ctx: CanvasRenderingContext2D,
  type: LigaType,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  t: number,
): void {
  const color = TYPE_COLOR[type]
  const travel = Math.max(0, Math.min(1, (t - 0.1) / 0.42))
  const x = fromX + (toX - fromX) * travel
  const y = fromY + (toY - fromY) * travel
  ctx.save()
  ctx.globalAlpha = t < 0.08 ? t / 0.08 : t > 0.88 ? Math.max(0, (1 - t) / 0.12) : 1
  if (type === 'electric') {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    bolt(ctx, fromX, fromY, x, y, 1, shade(color, -40), 5)
    bolt(ctx, fromX, fromY, x, y, 1, color, 3)
    bolt(ctx, fromX, fromY, x, y, 1, '#fff6c8', 1)
    if (t > 0.48) {
      bolt(ctx, fromX - 6, fromY + 4, toX + 5, toY - 3, 3, color, 2)
      bolt(ctx, fromX + 8, fromY - 5, toX - 6, toY + 4, 5, '#fff', 1)
    }
    if (t > 0.5) {
      ctx.fillStyle = '#fffbe8'
      ctx.beginPath()
      ctx.arc(toX, toY, 6 + (t - 0.5) * 18, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'fire') {
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? color : shade(color, 50)
      ctx.beginPath()
      ctx.arc(x - 4 + i * 3, y - 6 - (i % 3) * 3, 8 - i, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'water') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(x, y, 13, 7, travel, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha *= 0.7
    ctx.beginPath()
    ctx.ellipse(x - 8, y + 4, 7, 4, 0.4, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'ice') {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + t * 4
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12)
      ctx.stroke()
    }
  } else if (type === 'grass' || type === 'bug') {
    ctx.fillStyle = color
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      ctx.ellipse(x + i * 4 - 6, y + (i % 2) * 4, 7, 3, 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'poison') {
    ctx.fillStyle = color
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath()
      ctx.arc(x + i * 5 - 5, y - (t * 8 + i * 2), 5 + i, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'psychic' || type === 'ghost' || type === 'dark') {
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, 6 + t * 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 3 + t * 8, 0, Math.PI * 2)
    ctx.stroke()
  } else if (type === 'dragon') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = shade(color, 60)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 16 + t * 8, 0, Math.PI * 2)
    ctx.stroke()
  } else if (type === 'rock' || type === 'ground' || type === 'steel') {
    ctx.fillStyle = color
    ctx.fillRect(x - 6, y - 6, 12, 12)
    ctx.fillRect(x + 4, y - 3, 8, 8)
    ctx.fillRect(x - 12, y + 1, 7, 7)
  } else if (type === 'fighting') {
    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(x, y, 10 + t * 8, 0.2, 2.4)
    ctx.stroke()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + 6, y + 2, 5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x - 14, y - 6)
    ctx.lineTo(x + 16, y + 4)
    ctx.moveTo(x - 12, y + 8)
    ctx.lineTo(x + 14, y - 4)
    ctx.stroke()
  }
  burst(ctx, toX, toY, t, color)
  ctx.restore()
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const r = 5 + (1 - Math.abs(t - 0.35) * 2) * 3
  ctx.fillStyle = '#d82828'
  ctx.beginPath()
  ctx.arc(x, y, r, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = '#f4f4f4'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI)
  ctx.fill()
  ctx.strokeStyle = '#201810'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x - r, y)
  ctx.lineTo(x + r, y)
  ctx.stroke()
  ctx.fillStyle = '#f4f4f4'
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, Math.PI * 2)
  ctx.fill()
}

export function LigaField({ trainerId, playerId, foeId, anim }: LigaFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const kind = anim?.kind ?? 'move'
  const faint = kind === 'faint'
  const send = kind === 'send'
  const recall = kind === 'recall'
  const swap = send || recall
  const playerLunge = kind === 'move' && anim?.side === 'player' ? Math.sin(Math.min(1, anim.t / 0.38) * Math.PI) * 18 : 0
  const foeLunge = kind === 'move' && anim?.side === 'foe' ? Math.sin(Math.min(1, anim.t / 0.38) * Math.PI) * -18 : 0
  const playerHit = kind === 'move' && anim?.side === 'foe' && anim.t > 0.5 ? Math.sin(anim.t * 52) * 5 : 0
  const foeHit = kind === 'move' && anim?.side === 'player' && anim.t > 0.5 ? Math.sin(anim.t * 52) * 5 : 0
  const playerSink = faint && anim?.side === 'player' ? anim.t * 28 : 0
  const foeSink = faint && anim?.side === 'foe' ? anim.t * 28 : 0
  const playerFade = faint && anim?.side === 'player' ? 1 - anim.t : 1
  const foeFade = faint && anim?.side === 'foe' ? 1 - anim.t : 1
  const playerScale =
    swap && anim?.side === 'player' ? (send ? 0.12 + anim.t * 0.88 : 1 - anim.t * 0.9) : 1
  const foeScale = swap && anim?.side === 'foe' ? (send ? 0.12 + anim.t * 0.88 : 1 - anim.t * 0.9) : 1
  const shaking = Boolean(anim && kind === 'move' && anim.t > 0.5 && anim.t < 0.88)
  const flash = Boolean(anim && ((kind === 'move' && anim.t > 0.5 && anim.t < 0.7) || (send && anim.t > 0.28 && anim.t < 0.48)))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      return
    }
    ctx.imageSmoothingEnabled = false
    drawField(ctx, trainerId)
  }, [trainerId])

  useEffect(() => {
    const canvas = fxRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      return
    }
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, W, H)
    if (anim && kind === 'move') {
      const from = anim.side === 'player' ? { x: 70, y: 78 } : { x: 168, y: 42 }
      const to = anim.side === 'player' ? { x: 168, y: 42 } : { x: 70, y: 78 }
      drawFx(ctx, anim.type, from.x, from.y, to.x, to.y, anim.t)
    }
    if (anim && swap && anim.t < 0.55) {
      const pos = anim.side === 'player' ? { x: 58, y: 88 } : { x: 168, y: 50 }
      drawBall(ctx, pos.x, pos.y, anim.t)
    }
  }, [anim, kind, swap])

  return (
    <div className={`liga-field${shaking ? ' is-hit' : ''}`}>
      <canvas ref={canvasRef} className="liga-field-canvas" width={W} height={H} aria-hidden="true" />
      <div className={`liga-poke-bob is-foe${faint && anim?.side === 'foe' ? ' is-faint' : ''}`}>
        <img
          className="liga-poke"
          src={spriteUrl(foeId)}
          alt=""
          style={{
            transform: `translate(${foeLunge + foeHit}px, ${foeSink + (anim?.side === 'foe' && kind === 'move' ? -6 : 0)}px) scale(${foeScale})`,
            opacity: foeFade,
          }}
        />
      </div>
      <div className={`liga-poke-bob is-player${faint && anim?.side === 'player' ? ' is-faint' : ''}`}>
        <img
          className="liga-poke"
          src={spriteUrl(playerId, true)}
          alt=""
          style={{
            transform: `translate(${playerLunge + playerHit}px, ${playerSink + (anim?.side === 'player' && kind === 'move' ? -4 : 0)}px) scale(${playerScale})`,
            opacity: playerFade,
          }}
        />
      </div>
      <canvas ref={fxRef} className="liga-field-fx" width={W} height={H} aria-hidden="true" />
      {flash ? <div className={`liga-flash${anim?.type === 'electric' ? ' is-spark' : ''}`} /> : null}
    </div>
  )
}
