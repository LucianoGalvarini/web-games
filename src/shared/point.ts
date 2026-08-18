export type Point = {
  readonly x: number
  readonly y: number
}

export function keyOf(point: Point): string {
  return `${point.x},${point.y}`
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}
