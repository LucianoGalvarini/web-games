import { useEffect, useRef } from 'react'
import { FIELD_THEME, TYPE_COLOR, itemFxColor, type LigaAnim } from '../../liga/fx'
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

function along(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  p: number,
): { x: number; y: number } {
  return { x: fromX + (toX - fromX) * p, y: fromY + (toY - fromY) * p }
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, tip: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - size * 1.6)
  ctx.quadraticCurveTo(x + size, y - size * 0.2, x, y + size * 0.6)
  ctx.quadraticCurveTo(x - size, y - size * 0.2, x, y - size * 1.6)
  ctx.fill()
  ctx.fillStyle = tip
  ctx.beginPath()
  ctx.ellipse(x, y - size * 0.15, size * 0.38, size * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0, 8, 3.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = shade(color, -40)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-7, 0)
  ctx.lineTo(7, 0)
  ctx.stroke()
  ctx.restore()
}

function shard(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -9)
  ctx.lineTo(4, 2)
  ctx.lineTo(0, 8)
  ctx.lineTo(-4, 2)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.globalAlpha *= 0.55
  ctx.beginPath()
  ctx.moveTo(0, -6)
  ctx.lineTo(1.4, 0)
  ctx.lineTo(0, 3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
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
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const fade = t < 0.08 ? t / 0.08 : t > 0.88 ? Math.max(0, (1 - t) / 0.12) : 1
  ctx.globalAlpha = fade
  if (type === 'electric') {
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
    for (let i = 6; i >= 0; i -= 1) {
      const p = travel - i * 0.07
      if (p <= 0) {
        continue
      }
      const pos = along(fromX, fromY, toX, toY, p)
      flame(ctx, pos.x + (i % 2) * 3 - 1, pos.y - i * 1.4, 9 - i * 0.7, i % 2 === 0 ? color : shade(color, 36), i < 2 ? '#fff4c8' : '#f0c050')
    }
    if (t > 0.5) {
      flame(ctx, toX, toY + 2, 16 + (t - 0.5) * 10, color, '#fff4c0')
      flame(ctx, toX - 10, toY + 4, 10, shade(color, -20), '#f0a848')
      flame(ctx, toX + 11, toY + 3, 9, shade(color, 20), '#ffe078')
    }
  } else if (type === 'water') {
    for (let i = 0; i < 5; i += 1) {
      const p = Math.max(0, travel - i * 0.09)
      const pos = along(fromX, fromY, toX, toY, p)
      ctx.fillStyle = i === 0 ? '#d8f0ff' : color
      ctx.beginPath()
      ctx.ellipse(pos.x, pos.y, 12 - i * 1.6, 6 - i * 0.7, travel * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(x - 3, y - 2, 4, 2, 0.4, 0, Math.PI * 2)
    ctx.fill()
    if (t > 0.5) {
      ctx.globalAlpha = Math.max(0, 1 - (t - 0.5) * 2)
      ctx.strokeStyle = '#c8e8ff'
      ctx.lineWidth = 2
      for (let r = 8; r <= 22; r += 7) {
        ctx.beginPath()
        ctx.ellipse(toX, toY + 4, r + (t - 0.5) * 16, r * 0.45, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  } else if (type === 'ice') {
    for (let i = 0; i < 4; i += 1) {
      const p = Math.max(0, travel - i * 0.12)
      const pos = along(fromX, fromY, toX, toY, p)
      shard(ctx, pos.x, pos.y, t * 6 + i, color)
    }
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + t * 3
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11)
      ctx.stroke()
    }
    if (t > 0.5) {
      ctx.fillStyle = 'rgba(220, 244, 255, 0.35)'
      ctx.beginPath()
      ctx.arc(toX, toY, 10 + (t - 0.5) * 16, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'grass' || type === 'bug') {
    for (let i = 0; i < 6; i += 1) {
      const p = Math.max(0, travel - i * 0.08)
      const pos = along(fromX, fromY, toX, toY, p)
      leaf(ctx, pos.x + ((i % 2) * 6 - 3), pos.y + (i % 3) - 2, 0.4 + i * 0.5 + t * 2, i % 2 === 0 ? color : shade(color, 30))
    }
    if (t > 0.5) {
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2
        leaf(ctx, toX + Math.cos(a) * (8 + (t - 0.5) * 14), toY + Math.sin(a) * (6 + (t - 0.5) * 10), a, color)
      }
    }
  } else if (type === 'poison') {
    for (let i = 0; i < 5; i += 1) {
      const p = Math.max(0, travel - i * 0.1)
      const pos = along(fromX, fromY, toX, toY, p)
      const r = 5 + (i % 3)
      ctx.fillStyle = i % 2 === 0 ? color : shade(color, 40)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y - i * 3 - t * 6, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.arc(pos.x - 1.4, pos.y - i * 3 - t * 6 - 1.5, r * 0.28, 0, Math.PI * 2)
      ctx.fill()
    }
    if (t > 0.52) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(toX, toY, 8 + (t - 0.52) * 18, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (type === 'psychic') {
    ctx.strokeStyle = color
    for (let i = 1; i <= 3; i += 1) {
      ctx.lineWidth = 4 - i
      ctx.beginPath()
      ctx.arc(x, y, 4 + i * 6 + t * 10, t * 8, t * 8 + 4.2)
      ctx.stroke()
    }
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
    if (t > 0.48) {
      ctx.strokeStyle = '#ffd0ea'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(toX, toY, 6 + (t - 0.48) * 22, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (type === 'ghost' || type === 'dark') {
    const base = ctx.globalAlpha
    for (let i = 0; i < 4; i += 1) {
      const p = Math.max(0, travel - i * 0.11)
      const pos = along(fromX, fromY, toX, toY, p)
      ctx.globalAlpha = base * (0.9 - i * 0.15)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(pos.x, pos.y, 10 - i, 14 - i * 2, 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = fade
    ctx.fillStyle = '#1a1020'
    ctx.beginPath()
    ctx.arc(x - 3, y - 2, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 3, y - 2, 1.6, 0, Math.PI * 2)
    ctx.fill()
    if (t > 0.5) {
      ctx.strokeStyle = shade(color, 50)
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(toX, toY, 12 + (t - 0.5) * 14, 0.4, 2.6)
      ctx.stroke()
    }
  } else if (type === 'dragon') {
    for (let i = 5; i >= 0; i -= 1) {
      const p = Math.max(0, travel - i * 0.06)
      const pos = along(fromX, fromY, toX, toY, p)
      ctx.fillStyle = i === 0 ? '#e8d8ff' : color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 11 - i * 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = shade(color, 70)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 14 + t * 6, 0, Math.PI * 2)
    ctx.stroke()
    if (t > 0.5) {
      ctx.strokeStyle = '#fff'
      ctx.beginPath()
      ctx.arc(toX, toY, 8 + (t - 0.5) * 20, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (type === 'rock' || type === 'ground' || type === 'steel') {
    for (let i = 0; i < 4; i += 1) {
      const p = Math.max(0, travel - i * 0.1)
      const pos = along(fromX, fromY, toX, toY, p)
      const spin = t * 10 + i
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.rotate(spin)
      ctx.fillStyle = i % 2 === 0 ? color : shade(color, -25)
      ctx.fillRect(-6, -5, 12, 10)
      if (type === 'steel') {
        ctx.fillStyle = '#fff'
        ctx.globalAlpha *= 0.4
        ctx.fillRect(-4, -3, 5, 2)
      }
      ctx.restore()
    }
    if (t > 0.5) {
      ctx.fillStyle = color
      ctx.fillRect(toX - 8, toY - 4, 7, 7)
      ctx.fillRect(toX + 2, toY - 7, 9, 6)
      ctx.fillRect(toX - 3, toY + 3, 6, 6)
    }
  } else if (type === 'fighting') {
    ctx.strokeStyle = shade(color, -30)
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(x, y, 11, 0.15, 2.5)
    ctx.stroke()
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y, 11, 0.15, 2.5)
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x + 7, y + 1, 3, 0, Math.PI * 2)
    ctx.fill()
    if (t > 0.5) {
      ctx.strokeStyle = '#ffe8d0'
      ctx.lineWidth = 2
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2
        const reach = 10 + (t - 0.5) * 16
        ctx.beginPath()
        ctx.moveTo(toX + Math.cos(a) * 4, toY + Math.sin(a) * 4)
        ctx.lineTo(toX + Math.cos(a) * reach, toY + Math.sin(a) * reach)
        ctx.stroke()
      }
    }
  } else {
    const slash = (ox: number, oy: number, w: number, c: string) => {
      ctx.strokeStyle = c
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(x - 16 + ox, y - 7 + oy)
      ctx.lineTo(x + 18 + ox, y + 5 + oy)
      ctx.moveTo(x - 14 + ox, y + 9 + oy)
      ctx.lineTo(x + 16 + ox, y - 5 + oy)
      ctx.stroke()
    }
    slash(0, 0, 6, shade(color, -40))
    slash(0, 0, 3, color)
    slash(0, 0, 1, '#fff')
  }
  ctx.globalAlpha = fade
  burst(ctx, toX, toY, t, color)
  ctx.restore()
}

function drawItemFx(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string): void {
  ctx.save()
  ctx.globalAlpha = t < 0.12 ? t / 0.12 : t > 0.82 ? Math.max(0, (1 - t) / 0.18) : 1
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(x, y + 10, 18 + t * 14, 7 + t * 4, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.globalAlpha *= 0.28
  ctx.beginPath()
  ctx.ellipse(x, y + 10, 16 + t * 10, 6 + t * 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = t < 0.12 ? t / 0.12 : t > 0.82 ? Math.max(0, (1 - t) / 0.18) : 1
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + t * 4
    const rise = 8 + t * 26 + (i % 3) * 5
    const px = x + Math.cos(a) * (8 + (i % 4) * 5)
    const py = y + 6 - rise
    ctx.fillStyle = i % 2 === 0 ? color : '#fffef4'
    ctx.beginPath()
    ctx.arc(px, py, 1.6 + (i % 3) * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#fff'
  ctx.globalAlpha *= 0.55
  ctx.beginPath()
  ctx.arc(x, y - t * 8, 4 + (1 - t) * 6, 0, Math.PI * 2)
  ctx.fill()
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
  const itemUse = kind === 'item'
  const swap = send || recall
  const impact = kind === 'move' && (anim?.factor ?? 1) !== 0
  const playerLunge = impact && anim?.side === 'player' ? Math.sin(Math.min(1, anim.t / 0.38) * Math.PI) * 18 : 0
  const foeLunge = impact && anim?.side === 'foe' ? Math.sin(Math.min(1, anim.t / 0.38) * Math.PI) * -18 : 0
  const playerHit = impact && anim?.side === 'foe' && anim.t > 0.5 ? Math.sin(anim.t * 52) * 5 : 0
  const foeHit = impact && anim?.side === 'player' && anim.t > 0.5 ? Math.sin(anim.t * 52) * 5 : 0
  const playerSink = faint && anim?.side === 'player' ? anim.t * 28 : 0
  const foeSink = faint && anim?.side === 'foe' ? anim.t * 28 : 0
  const playerFade = faint && anim?.side === 'player' ? 1 - anim.t : 1
  const foeFade = faint && anim?.side === 'foe' ? 1 - anim.t : 1
  const playerScale =
    swap && anim?.side === 'player'
      ? send
        ? 0.12 + anim.t * 0.88
        : 1 - anim.t * 0.9
      : itemUse && anim
        ? 1 + Math.sin(Math.min(1, anim.t) * Math.PI) * 0.08
        : 1
  const foeScale = swap && anim?.side === 'foe' ? (send ? 0.12 + anim.t * 0.88 : 1 - anim.t * 0.9) : 1
  const shaking = Boolean(anim && impact && anim.t > 0.5 && anim.t < 0.88)
  const flash = Boolean(
    anim && ((impact && anim.t > 0.5 && anim.t < 0.7) || (send && anim.t > 0.28 && anim.t < 0.48) || (itemUse && anim.t > 0.18 && anim.t < 0.42)),
  )

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
    if (anim && impact) {
      const from = anim.side === 'player' ? { x: 70, y: 78 } : { x: 168, y: 42 }
      const to = anim.side === 'player' ? { x: 168, y: 42 } : { x: 70, y: 78 }
      drawFx(ctx, anim.type, from.x, from.y, to.x, to.y, anim.t)
    }
    if (anim?.kind === 'item') {
      const pos = { x: 58, y: 78 }
      drawItemFx(ctx, pos.x, pos.y, anim.t, anim.itemId ? itemFxColor(anim.itemId) : '#e878a0')
    }
    if (anim && swap && anim.t < 0.55) {
      const pos = anim.side === 'player' ? { x: 58, y: 88 } : { x: 168, y: 50 }
      drawBall(ctx, pos.x, pos.y, anim.t)
    }
  }, [anim, impact, swap, itemUse])

  return (
    <div className={`liga-field${shaking ? ' is-hit' : ''}`}>
      <canvas ref={canvasRef} className="liga-field-canvas" width={W} height={H} aria-hidden="true" />
      <div className={`liga-poke-bob is-foe${faint && anim?.side === 'foe' ? ' is-faint' : ''}`}>
        <img
          className="liga-poke"
          src={spriteUrl(foeId)}
          alt=""
          style={{
            transform: `translate(${foeLunge + foeHit}px, ${foeSink + (anim?.side === 'foe' && impact ? -6 : 0)}px) scale(${foeScale})`,
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
            transform: `translate(${playerLunge + playerHit}px, ${playerSink + (anim?.side === 'player' && impact ? -4 : 0)}px) scale(${playerScale})`,
            opacity: playerFade,
            filter: itemUse && anim ? `brightness(${1.05 + Math.sin(anim.t * Math.PI) * 0.55})` : undefined,
          }}
        />
      </div>
      <canvas ref={fxRef} className="liga-field-fx" width={W} height={H} aria-hidden="true" />
      {flash ? <div className={`liga-flash${anim?.type === 'electric' ? ' is-spark' : ''}${itemUse ? ' is-heal' : ''}`} /> : null}
    </div>
  )
}
