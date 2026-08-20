import { MALAS_LIMIT } from './constants'

export function scoreHalf(points: number): { label: 'Buenas' | 'Malas'; value: number } {
  if (points >= MALAS_LIMIT) {
    return { label: 'Buenas', value: points - MALAS_LIMIT }
  }
  return { label: 'Malas', value: Math.max(0, points) }
}

export function scoreBoxes(value: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(MALAS_LIMIT, value))
  return [
    Math.min(5, clamped),
    Math.min(5, Math.max(0, clamped - 5)),
    Math.min(5, Math.max(0, clamped - 10)),
  ]
}
