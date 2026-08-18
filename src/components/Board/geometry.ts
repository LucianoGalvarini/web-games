import { COLS, ROWS } from '../../game'
import type { Point } from '../../game'

export const BOARD_PAD = 58
export const BOARD_GAP = 76

export const BOARD_WIDTH = BOARD_PAD * 2 + BOARD_GAP * (COLS - 1)
export const BOARD_HEIGHT = BOARD_PAD * 2 + BOARD_GAP * (ROWS - 1)

export function toSvg(point: Point): { x: number; y: number } {
  return {
    x: BOARD_PAD + point.x * BOARD_GAP,
    y: BOARD_PAD + point.y * BOARD_GAP,
  }
}
