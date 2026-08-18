import { keyOf, samePoint } from '../shared/point'
import type { Point } from '../shared/point'
import type { Player } from '../shared/types'
import type { Hands, MorrisBoard } from './types'
import type { MorrisVariant, MorrisVariantId } from './variants'

function addNeighbor(map: Map<string, Point[]>, from: Point, to: Point): void {
  const key = keyOf(from)
  const current = map.get(key) ?? []
  if (!current.some((point) => samePoint(point, to))) {
    current.push(to)
    map.set(key, current)
  }
}

function buildNeighbors(variant: MorrisVariant): Map<string, Point[]> {
  const map = new Map<string, Point[]>()
  for (const mill of variant.mills) {
    addNeighbor(map, mill[0], mill[1])
    addNeighbor(map, mill[1], mill[0])
    addNeighbor(map, mill[1], mill[2])
    addNeighbor(map, mill[2], mill[1])
  }
  for (const [a, b] of variant.extraAdjacency ?? []) {
    addNeighbor(map, a, b)
    addNeighbor(map, b, a)
  }
  return map
}

const NEIGHBORS_BY_VARIANT = new Map<MorrisVariantId, Map<string, Point[]>>()

function neighborsFor(variant: MorrisVariant): Map<string, Point[]> {
  let map = NEIGHBORS_BY_VARIANT.get(variant.id)
  if (!map) {
    map = buildNeighbors(variant)
    NEIGHBORS_BY_VARIANT.set(variant.id, map)
  }
  return map
}

export function neighborsOf(variant: MorrisVariant, point: Point): Point[] {
  return neighborsFor(variant).get(keyOf(point)) ?? []
}

function millOwned(board: MorrisBoard, mill: readonly [Point, Point, Point], player: Player): boolean {
  return mill.every((point) => board[keyOf(point)] === player)
}

export function millsAt(
  variant: MorrisVariant,
  board: MorrisBoard,
  point: Point,
  player: Player,
): Array<readonly [Point, Point, Point]> {
  return variant.mills.filter(
    (mill) => mill.some((item) => samePoint(item, point)) && millOwned(board, mill, player),
  )
}

export function formsMill(variant: MorrisVariant, board: MorrisBoard, point: Point, player: Player): boolean {
  return millsAt(variant, board, point, player).length > 0
}

export function isInMill(variant: MorrisVariant, board: MorrisBoard, point: Point, player: Player): boolean {
  return formsMill(variant, board, point, player)
}

export function isPlacing(inHand: Hands): boolean {
  return inHand.white > 0 || inHand.black > 0
}

export function emptyPoints(variant: MorrisVariant, board: MorrisBoard): Point[] {
  return variant.points.filter((point) => board[keyOf(point)] === null)
}

export function piecesOf(variant: MorrisVariant, board: MorrisBoard, player: Player): Point[] {
  return variant.points.filter((point) => board[keyOf(point)] === player)
}

export function countPieces(variant: MorrisVariant, board: MorrisBoard, player: Player): number {
  return piecesOf(variant, board, player).length
}

export function canFly(variant: MorrisVariant, board: MorrisBoard, inHand: Hands, player: Player): boolean {
  return variant.flyingEnabled && !isPlacing(inHand) && countPieces(variant, board, player) === 3
}

export function removablePieces(variant: MorrisVariant, board: MorrisBoard, enemy: Player): Point[] {
  const pieces = piecesOf(variant, board, enemy)
  const free = pieces.filter((point) => !isInMill(variant, board, point, enemy))
  return free.length > 0 ? free : pieces
}
