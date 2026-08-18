import type { Point } from '../shared/point'

export type MorrisVariantId = 'six' | 'nine' | 'twelve'

export type MorrisVariant = {
  id: MorrisVariantId
  label: string
  piecesPerPlayer: number
  points: readonly Point[]
  mills: ReadonlyArray<readonly [Point, Point, Point]>
  extraAdjacency?: ReadonlyArray<readonly [Point, Point]>
  flyingEnabled: boolean
}

const OUTER_TOP = { x: 0, y: 0 }
const OUTER_TOP_MID = { x: 3, y: 0 }
const OUTER_TOP_RIGHT = { x: 6, y: 0 }
const MID_TOP = { x: 1, y: 1 }
const MID_TOP_MID = { x: 3, y: 1 }
const MID_TOP_RIGHT = { x: 5, y: 1 }
const INNER_TOP = { x: 2, y: 2 }
const INNER_TOP_MID = { x: 3, y: 2 }
const INNER_TOP_RIGHT = { x: 4, y: 2 }
const OUTER_LEFT_MID = { x: 0, y: 3 }
const MID_LEFT_MID = { x: 1, y: 3 }
const INNER_LEFT_MID = { x: 2, y: 3 }
const INNER_RIGHT_MID = { x: 4, y: 3 }
const MID_RIGHT_MID = { x: 5, y: 3 }
const OUTER_RIGHT_MID = { x: 6, y: 3 }
const INNER_BOTTOM_LEFT = { x: 2, y: 4 }
const INNER_BOTTOM_MID = { x: 3, y: 4 }
const INNER_BOTTOM_RIGHT = { x: 4, y: 4 }
const MID_BOTTOM_LEFT = { x: 1, y: 5 }
const MID_BOTTOM_MID = { x: 3, y: 5 }
const MID_BOTTOM_RIGHT = { x: 5, y: 5 }
const OUTER_BOTTOM_LEFT = { x: 0, y: 6 }
const OUTER_BOTTOM_MID = { x: 3, y: 6 }
const OUTER_BOTTOM_RIGHT = { x: 6, y: 6 }

const NINE_POINTS: readonly Point[] = [
  OUTER_TOP,
  OUTER_TOP_MID,
  OUTER_TOP_RIGHT,
  MID_TOP,
  MID_TOP_MID,
  MID_TOP_RIGHT,
  INNER_TOP,
  INNER_TOP_MID,
  INNER_TOP_RIGHT,
  OUTER_LEFT_MID,
  MID_LEFT_MID,
  INNER_LEFT_MID,
  INNER_RIGHT_MID,
  MID_RIGHT_MID,
  OUTER_RIGHT_MID,
  INNER_BOTTOM_LEFT,
  INNER_BOTTOM_MID,
  INNER_BOTTOM_RIGHT,
  MID_BOTTOM_LEFT,
  MID_BOTTOM_MID,
  MID_BOTTOM_RIGHT,
  OUTER_BOTTOM_LEFT,
  OUTER_BOTTOM_MID,
  OUTER_BOTTOM_RIGHT,
]

const OUTER_SQUARE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [OUTER_TOP, OUTER_TOP_MID, OUTER_TOP_RIGHT],
  [OUTER_BOTTOM_LEFT, OUTER_BOTTOM_MID, OUTER_BOTTOM_RIGHT],
  [OUTER_TOP, OUTER_LEFT_MID, OUTER_BOTTOM_LEFT],
  [OUTER_TOP_RIGHT, OUTER_RIGHT_MID, OUTER_BOTTOM_RIGHT],
]

const MIDDLE_SQUARE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [MID_TOP, MID_TOP_MID, MID_TOP_RIGHT],
  [MID_BOTTOM_LEFT, MID_BOTTOM_MID, MID_BOTTOM_RIGHT],
  [MID_TOP, MID_LEFT_MID, MID_BOTTOM_LEFT],
  [MID_TOP_RIGHT, MID_RIGHT_MID, MID_BOTTOM_RIGHT],
]

const INNER_SQUARE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [INNER_TOP, INNER_TOP_MID, INNER_TOP_RIGHT],
  [INNER_BOTTOM_LEFT, INNER_BOTTOM_MID, INNER_BOTTOM_RIGHT],
  [INNER_TOP, INNER_LEFT_MID, INNER_BOTTOM_LEFT],
  [INNER_TOP_RIGHT, INNER_RIGHT_MID, INNER_BOTTOM_RIGHT],
]

const SPOKE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [OUTER_LEFT_MID, MID_LEFT_MID, INNER_LEFT_MID],
  [INNER_RIGHT_MID, MID_RIGHT_MID, OUTER_RIGHT_MID],
  [OUTER_TOP_MID, MID_TOP_MID, INNER_TOP_MID],
  [INNER_BOTTOM_MID, MID_BOTTOM_MID, OUTER_BOTTOM_MID],
]

const DIAGONAL_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  [OUTER_TOP, MID_TOP, INNER_TOP],
  [OUTER_TOP_RIGHT, MID_TOP_RIGHT, INNER_TOP_RIGHT],
  [OUTER_BOTTOM_LEFT, MID_BOTTOM_LEFT, INNER_BOTTOM_LEFT],
  [OUTER_BOTTOM_RIGHT, MID_BOTTOM_RIGHT, INNER_BOTTOM_RIGHT],
]

const NINE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  ...OUTER_SQUARE_MILLS,
  ...MIDDLE_SQUARE_MILLS,
  ...INNER_SQUARE_MILLS,
  ...SPOKE_MILLS,
]

const SIX_POINTS: readonly Point[] = [
  OUTER_TOP,
  OUTER_TOP_MID,
  OUTER_TOP_RIGHT,
  OUTER_LEFT_MID,
  OUTER_RIGHT_MID,
  OUTER_BOTTOM_LEFT,
  OUTER_BOTTOM_MID,
  OUTER_BOTTOM_RIGHT,
  INNER_TOP,
  INNER_TOP_MID,
  INNER_TOP_RIGHT,
  INNER_LEFT_MID,
  INNER_RIGHT_MID,
  INNER_BOTTOM_LEFT,
  INNER_BOTTOM_MID,
  INNER_BOTTOM_RIGHT,
]

const SIX_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [
  ...OUTER_SQUARE_MILLS,
  ...INNER_SQUARE_MILLS,
]

const SIX_EXTRA_ADJACENCY: ReadonlyArray<readonly [Point, Point]> = [
  [OUTER_LEFT_MID, INNER_LEFT_MID],
  [INNER_RIGHT_MID, OUTER_RIGHT_MID],
  [OUTER_TOP_MID, INNER_TOP_MID],
  [INNER_BOTTOM_MID, OUTER_BOTTOM_MID],
]

const TWELVE_MILLS: ReadonlyArray<readonly [Point, Point, Point]> = [...NINE_MILLS, ...DIAGONAL_MILLS]

export const VARIANTS: Record<MorrisVariantId, MorrisVariant> = {
  six: {
    id: 'six',
    label: 'Molino a 6',
    piecesPerPlayer: 6,
    points: SIX_POINTS,
    mills: SIX_MILLS,
    extraAdjacency: SIX_EXTRA_ADJACENCY,
    flyingEnabled: false,
  },
  nine: {
    id: 'nine',
    label: 'Molino a 9',
    piecesPerPlayer: 9,
    points: NINE_POINTS,
    mills: NINE_MILLS,
    flyingEnabled: true,
  },
  twelve: {
    id: 'twelve',
    label: 'Molino a 12',
    piecesPerPlayer: 12,
    points: NINE_POINTS,
    mills: TWELVE_MILLS,
    flyingEnabled: true,
  },
}

export const DEFAULT_VARIANT: MorrisVariantId = 'nine'

export const VARIANT_ORDER: MorrisVariantId[] = ['six', 'nine', 'twelve']
