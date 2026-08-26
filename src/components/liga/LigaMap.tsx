import { useEffect, useRef } from 'react'
import { ROOM_COLS, ROOM_ROWS, TILE } from '../../liga/constants'
import { doorOpen, roomOf, trainerPos } from '../../liga/map'
import type { LigaDir, LigaRoomId, LigaState, LigaTrainerId } from '../../liga/types'
import type { Point } from '../../shared/point'

type LigaMapProps = {
  state: LigaState
  walk: { from: Point; to: Point; dir: LigaDir } | null
  walkT: number
}

const PALETTE: Record<LigaRoomId, { floor: string; wall: string; carpet: string; door: string }> = {
  sidney: { floor: '#3a2450', wall: '#160c22', carpet: '#6b3d8c', door: '#241034' },
  phoebe: { floor: '#4a3870', wall: '#1c142c', carpet: '#c8b8e0', door: '#2a1c40' },
  glacia: { floor: '#c8dcec', wall: '#4a7088', carpet: '#f4fcff', door: '#8ab0c4' },
  drake: { floor: '#4a2018', wall: '#1c0c08', carpet: '#a04028', door: '#301410' },
  steven: { floor: '#3a4048', wall: '#161a1e', carpet: '#c8b060', door: '#2a3038' },
  hall: { floor: '#e4c878', wall: '#6a4820', carpet: '#fff0b8', door: '#8a6030' },
}

const TRAINER_COLOR: Record<LigaTrainerId, string> = {
  sidney: '#3d8a4a',
  phoebe: '#e8dcf4',
  glacia: '#d0e8f8',
  drake: '#c45c48',
  steven: '#9aa8b8',
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (n & 255) + amount))
  return `rgb(${r},${g},${b})`
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
}

function drawPerson(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  dir: LigaDir,
  body: string,
  cap: string,
  phase: number,
): void {
  const bob = Math.round(Math.abs(Math.sin(phase * Math.PI)) * 2)
  const stride = Math.round(Math.sin(phase * Math.PI * 2) * 2)
  const skin = '#f0d59a'
  const shade = '#241910'
  const shoe = '#3a2418'
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(px + 3, py + 14, 10, 3)
  ctx.fillStyle = shoe
  if (dir === 'left' || dir === 'right') {
    ctx.fillRect(px + (dir === 'right' ? 4 : 3) + stride, py + 13 - bob, 4, 3)
    ctx.fillRect(px + (dir === 'right' ? 9 : 8) - stride, py + 13 - bob, 4, 3)
  } else {
    ctx.fillRect(px + 3, py + 13 - bob, 4, 3)
    ctx.fillRect(px + 9, py + 13 - bob, 4, 3)
  }
  ctx.fillStyle = shadeHex(body, -30)
  ctx.fillRect(px + 5, py + 10 - bob, 2, 4)
  ctx.fillRect(px + 9, py + 10 - bob, 2, 4)
  ctx.fillStyle = body
  ctx.fillRect(px + 4, py + 7 - bob, 8, 6)
  ctx.fillStyle = shadeHex(body, 28)
  ctx.fillRect(px + 5, py + 8 - bob, 6, 2)
  if (dir === 'left') {
    ctx.fillStyle = body
    ctx.fillRect(px + 2, py + 8 - bob, 3, 5)
  } else if (dir === 'right') {
    ctx.fillStyle = body
    ctx.fillRect(px + 11, py + 8 - bob, 3, 5)
  } else {
    ctx.fillStyle = body
    ctx.fillRect(px + 3, py + 8 - bob, 2, 5)
    ctx.fillRect(px + 11, py + 8 - bob, 2, 5)
  }
  ctx.fillStyle = skin
  ctx.fillRect(px + 5, py + 3 - bob, 6, 5)
  ctx.fillStyle = cap
  ctx.fillRect(px + 4, py + 1 - bob, 8, 3)
  if (dir === 'down') {
    ctx.fillRect(px + 4, py + 3 - bob, 8, 1)
  }
  ctx.fillStyle = shade
  if (dir === 'down') {
    ctx.fillRect(px + 6, py + 5 - bob, 1, 1)
    ctx.fillRect(px + 9, py + 5 - bob, 1, 1)
    ctx.fillRect(px + 7, py + 7 - bob, 2, 1)
  } else if (dir === 'up') {
    ctx.fillStyle = cap
    ctx.fillRect(px + 4, py + 1 - bob, 8, 4)
  } else if (dir === 'left') {
    ctx.fillRect(px + 6, py + 5 - bob, 1, 1)
  } else {
    ctx.fillRect(px + 9, py + 5 - bob, 1, 1)
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, leaf: string, pot: string): void {
  ctx.fillStyle = pot
  ctx.fillRect(x * TILE + 5, y * TILE + 10, 6, 5)
  ctx.fillStyle = leaf
  ctx.fillRect(x * TILE + 6, y * TILE + 3, 4, 8)
  ctx.fillRect(x * TILE + 3, y * TILE + 5, 4, 3)
  ctx.fillRect(x * TILE + 9, y * TILE + 6, 4, 3)
}

function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, flame: string): void {
  ctx.fillStyle = '#5a3a20'
  ctx.fillRect(x * TILE + 7, y * TILE + 6, 2, 8)
  ctx.fillStyle = flame
  ctx.fillRect(x * TILE + 6, y * TILE + 2, 4, 5)
  ctx.fillStyle = '#f8e080'
  ctx.fillRect(x * TILE + 7, y * TILE + 3, 2, 3)
}

function drawStatue(ctx: CanvasRenderingContext2D, x: number, y: number, stone: string): void {
  ctx.fillStyle = stone
  ctx.fillRect(x * TILE + 4, y * TILE + 10, 8, 5)
  ctx.fillRect(x * TILE + 5, y * TILE + 4, 6, 7)
  ctx.fillRect(x * TILE + 6, y * TILE + 1, 4, 4)
  ctx.fillStyle = shadeHex(stone, 24)
  ctx.fillRect(x * TILE + 7, y * TILE + 2, 2, 2)
}

function drawDecor(ctx: CanvasRenderingContext2D, room: LigaRoomId, palette: (typeof PALETTE)[LigaRoomId]): void {
  const flame = room === 'drake' ? '#f07838' : room === 'glacia' ? '#d8f4ff' : '#f0a038'
  const leaf = room === 'phoebe' ? '#c8b8e0' : room === 'glacia' ? '#9cc8b0' : '#3d8a4a'
  const stone = room === 'steven' ? '#9aa8b8' : shadeHex(palette.wall, 40)
  drawTorch(ctx, 1, 2, flame)
  drawTorch(ctx, 11, 2, flame)
    drawPlant(ctx, 1, 6, leaf, '#8a5030')
  drawPlant(ctx, 11, 6, leaf, '#8a5030')
  drawStatue(ctx, 1, 4, stone)
  drawStatue(ctx, 11, 4, stone)
  if (room === 'hall') {
    ctx.fillStyle = '#c8a048'
    ctx.fillRect(3 * TILE + 2, 3 * TILE + 2, 12, 10)
    ctx.fillRect(8 * TILE + 2, 3 * TILE + 2, 12, 10)
  }
}

export function LigaMap({ state, walk, walkT }: LigaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const room = roomOf(state.room)
  const palette = PALETTE[state.room]
  const trainer = trainerPos(state, state.room)
  const trainerId = state.room === 'hall' ? null : state.room
  const open = doorOpen(state, state.room)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      return
    }
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = palette.wall
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < ROOM_ROWS; y += 1) {
      for (let x = 0; x < ROOM_COLS; x += 1) {
        const tile = room.tiles[y]?.[x]
        if (tile === 'wall') {
          drawTile(ctx, x, y, palette.wall)
          ctx.fillStyle = shadeHex(palette.wall, 22)
          ctx.fillRect(x * TILE, y * TILE, TILE, 2)
          continue
        }
        if ((tile === 'door-n' || tile === 'door-s') && !(tile === 'door-s' || open)) {
          drawTile(ctx, x, y, palette.door)
          continue
        }
        const carpet = x === 6 && y >= 3 && y <= 8
        const checker = (x + y) % 2 === 0
        drawTile(ctx, x, y, carpet ? palette.carpet : checker ? palette.floor : shadeHex(palette.floor, 14))
        ctx.fillStyle = shadeHex(carpet ? palette.carpet : palette.floor, checker ? -18 : 8)
        ctx.fillRect(x * TILE, y * TILE + TILE - 1, TILE, 1)
        ctx.fillRect(x * TILE + TILE - 1, y * TILE, 1, TILE)
        if (carpet) {
          ctx.fillStyle = shadeHex(palette.carpet, 24)
          ctx.fillRect(x * TILE + 1, y * TILE, 1, TILE)
          ctx.fillRect(x * TILE + TILE - 2, y * TILE, 1, TILE)
        }
        if (tile === 'door-n' || tile === 'door-s') {
          ctx.fillStyle = palette.carpet
          ctx.fillRect(x * TILE + 4, y * TILE, 8, TILE)
        }
      }
    }
    drawDecor(ctx, state.room, palette)
    for (const px of [2, 10]) {
      ctx.fillStyle = shadeHex(palette.wall, 36)
      ctx.fillRect(px * TILE + 5, 2 * TILE, 6, TILE * 2)
      ctx.fillStyle = palette.carpet
      ctx.fillRect(px * TILE + 3, 2 * TILE - 3, 10, 5)
    }
    if (trainer && trainerId) {
      ctx.fillStyle = shadeHex(palette.carpet, -24)
      ctx.fillRect((trainer.x - 1) * TILE, (trainer.y + 1) * TILE - 2, TILE * 3, 6)
      ctx.fillStyle = palette.carpet
      ctx.fillRect((trainer.x - 1) * TILE + 1, (trainer.y + 1) * TILE - 4, TILE * 3 - 2, 4)
      drawPerson(ctx, trainer.x * TILE, trainer.y * TILE, 'down', TRAINER_COLOR[trainerId], '#241910', 0)
    }
    const px = walk ? lerp(walk.from.x, walk.to.x, walkT) : state.player.x
    const py = walk ? lerp(walk.from.y, walk.to.y, walkT) : state.player.y
    const dir = walk?.dir ?? state.facing
    drawPerson(ctx, px * TILE, py * TILE, dir, '#3d6b9a', '#c45c48', walk ? walkT : 0)
  }, [open, palette, room.tiles, state.facing, state.player.x, state.player.y, state.room, trainer, trainerId, walk, walkT])

  return (
    <canvas
      ref={canvasRef}
      className="liga-canvas"
      width={ROOM_COLS * TILE}
      height={ROOM_ROWS * TILE}
      aria-hidden="true"
    />
  )
}
