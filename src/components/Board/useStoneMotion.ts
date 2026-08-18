import { useLayoutEffect, useRef, useState } from 'react'
import { COLS, ROWS, samePoint } from '../../game'
import type { Board, Move, Player, Point } from '../../game'
import { toSvg } from './geometry'

export type StoneVisual = {
  id: number
  player: Player
  point: Point
  x: number
  y: number
  lift: number
  scale: number
  tilt: number
  opacity: number
  moving: boolean
  departing: boolean
}

const TRAVEL_MS = 320
const CAPTURE_MS = 240
const LIFT_PX = 13
const KNOCK_PX = 14

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function clamp01(t: number): number {
  if (t <= 0) {
    return 0
  }
  if (t >= 1) {
    return 1
  }
  return t
}

function cloneStone(stone: StoneVisual): StoneVisual {
  return { ...stone, point: { x: stone.point.x, y: stone.point.y } }
}

function restStone(stone: StoneVisual, point: Point): StoneVisual {
  const pos = toSvg(point)
  return {
    ...stone,
    point: { x: point.x, y: point.y },
    x: pos.x,
    y: pos.y,
    lift: 0,
    scale: 1,
    tilt: 0,
    opacity: 1,
    moving: false,
    departing: false,
  }
}

function stonesFromBoard(board: Board, nextId: { n: number }): StoneVisual[] {
  const stones: StoneVisual[] = []
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const player = board[y][x]
      if (!player) {
        continue
      }
      const pos = toSvg({ x, y })
      stones.push({
        id: nextId.n,
        player,
        point: { x, y },
        x: pos.x,
        y: pos.y,
        lift: 0,
        scale: 1,
        tilt: 0,
        opacity: 1,
        moving: false,
        departing: false,
      })
      nextId.n += 1
    }
  }
  return stones
}

function occupancyMatches(board: Board, stones: StoneVisual[]): boolean {
  const live = stones.filter((stone) => !stone.departing)
  let count = 0
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const player = board[y][x]
      if (!player) {
        continue
      }
      count += 1
      const found = live.some((stone) => stone.player === player && samePoint(stone.point, { x, y }))
      if (!found) {
        return false
      }
    }
  }
  return count === live.length
}

function moveKeyOf(move: Move): string {
  const captured = move.captured.map((point) => `${point.x},${point.y}`).join('|')
  return `${move.from.x},${move.from.y}>${move.to.x},${move.to.y}:${move.kind}:${captured}`
}

export function useStoneMotion(board: Board, lastMove: Move | null): StoneVisual[] {
  const nextId = useRef({ n: 1 })
  const [stones, setStones] = useState<StoneVisual[]>(() => stonesFromBoard(board, nextId.current))
  const stonesRef = useRef(stones)
  const moveKeyRef = useRef('')
  const baseRef = useRef<StoneVisual[] | null>(null)
  stonesRef.current = stones

  useLayoutEffect(() => {
    if (!lastMove) {
      moveKeyRef.current = ''
      baseRef.current = null
      const current = stonesRef.current
      if (occupancyMatches(board, current)) {
        setStones(current.filter((stone) => !stone.departing).map((stone) => restStone(stone, stone.point)))
        return
      }
      setStones(stonesFromBoard(board, nextId.current))
      return
    }

    const moveKey = moveKeyOf(lastMove)
    if (moveKeyRef.current !== moveKey) {
      baseRef.current = stonesRef.current.map(cloneStone)
      moveKeyRef.current = moveKey
    }

    if (prefersReducedMotion()) {
      setStones(stonesFromBoard(board, nextId.current))
      return
    }

    const base = (baseRef.current ?? stonesRef.current)
      .filter((stone) => !stone.departing)
      .map(cloneStone)
    const mover = base.find((stone) => samePoint(stone.point, lastMove.from))
    if (!mover) {
      setStones(stonesFromBoard(board, nextId.current))
      return
    }

    for (const stone of base) {
      if (stone === mover) {
        continue
      }
      const parked = restStone(stone, stone.point)
      stone.x = parked.x
      stone.y = parked.y
      stone.lift = 0
      stone.scale = 1
      stone.tilt = 0
      stone.opacity = 1
      stone.moving = false
      stone.departing = false
    }

    const fromPos = { x: mover.x, y: mover.y }
    const toPos = toSvg(lastMove.to)
    const stepX = lastMove.to.x - lastMove.from.x
    const stepY = lastMove.to.y - lastMove.from.y
    const leanDir = stepX !== 0 ? Math.sign(stepX) : Math.sign(stepY)
    mover.point = { x: lastMove.to.x, y: lastMove.to.y }
    mover.moving = true

    const captives = lastMove.captured
      .map((point) => base.find((stone) => !stone.departing && samePoint(stone.point, point)))
      .filter((stone): stone is StoneVisual => Boolean(stone))
    const captiveStarts = captives.map((stone) => {
      stone.departing = true
      return { stone, x: stone.x, y: stone.y }
    })

    const knockX = Math.sign(toPos.x - fromPos.x) * KNOCK_PX
    const knockY = Math.sign(toPos.y - fromPos.y) * KNOCK_PX
    const captureDelay = lastMove.kind === 'withdrawal' ? 40 : lastMove.kind === 'approach' ? 170 : TRAVEL_MS

    let frame = 0
    const started = performance.now()

    const tick = (now: number) => {
      const elapsed = now - started
      const travelT = clamp01(elapsed / TRAVEL_MS)
      const eased = easeInOutCubic(travelT)
      const hop = Math.sin(travelT * Math.PI)

      mover.x = fromPos.x + (toPos.x - fromPos.x) * eased
      mover.y = fromPos.y + (toPos.y - fromPos.y) * eased
      mover.lift = hop * LIFT_PX
      mover.scale = 1 + hop * 0.07
      mover.tilt = hop * leanDir * 9
      mover.moving = travelT < 1
      if (travelT >= 1) {
        mover.x = toPos.x
        mover.y = toPos.y
        mover.lift = 0
        mover.scale = 1
        mover.tilt = 0
      }

      const captureT = clamp01((elapsed - captureDelay) / CAPTURE_MS)
      const captureEase = easeOutQuad(captureT)
      for (const { stone, x, y } of captiveStarts) {
        stone.x = x + knockX * captureEase
        stone.y = y + knockY * captureEase
        stone.opacity = 1 - captureEase
        stone.scale = 1 - captureEase * 0.42
        stone.lift = captureEase * 6
      }

      const live = captureT >= 1 ? base.filter((stone) => !stone.departing) : base
      setStones(live.map(cloneStone))

      if (travelT < 1 || captureT < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    setStones(base.map(cloneStone))
    frame = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [board, lastMove])

  return stones
}
