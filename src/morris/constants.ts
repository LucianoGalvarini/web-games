import type { Point } from '../shared/point'

export const PIECES_PER_PLAYER = 9
export const GRID_SIZE = 7

export const POINTS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 6, y: 0 },
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 5, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 2, y: 4 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 1, y: 5 },
  { x: 3, y: 5 },
  { x: 5, y: 5 },
  { x: 0, y: 6 },
  { x: 3, y: 6 },
  { x: 6, y: 6 },
]

export const MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 6, y: 0 },
  ],
  [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 5, y: 1 },
  ],
  [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ],
  [
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
  ],
  [
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 6, y: 3 },
  ],
  [
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
  ],
  [
    { x: 1, y: 5 },
    { x: 3, y: 5 },
    { x: 5, y: 5 },
  ],
  [
    { x: 0, y: 6 },
    { x: 3, y: 6 },
    { x: 6, y: 6 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 3 },
    { x: 0, y: 6 },
  ],
  [
    { x: 1, y: 1 },
    { x: 1, y: 3 },
    { x: 1, y: 5 },
  ],
  [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 2, y: 4 },
  ],
  [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
  ],
  [
    { x: 3, y: 4 },
    { x: 3, y: 5 },
    { x: 3, y: 6 },
  ],
  [
    { x: 4, y: 2 },
    { x: 4, y: 3 },
    { x: 4, y: 4 },
  ],
  [
    { x: 5, y: 1 },
    { x: 5, y: 3 },
    { x: 5, y: 5 },
  ],
  [
    { x: 6, y: 0 },
    { x: 6, y: 3 },
    { x: 6, y: 6 },
  ],
]
