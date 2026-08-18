import { keyOf, samePoint } from '../shared/point'
import type { Point } from '../shared/point'
import type { Player } from '../shared/types'
import { MILLS, POINTS } from './constants'
import type { Hands, MorrisBoard } from './types'

function addNeighbor(map: Map<string, Point[]>, from: Point, to: Point): void {
  const key = keyOf(from)
  const current = map.get(key) ?? []
  if (!current.some((point) => samePoint(point, to))) {
    current.push(to)
    map.set(key, current)
  }
}

function buildNeighbors(): Map<string, Point[]> {
  const map = new Map<string, Point[]>()
  for (const mill of MILLS) {
    addNeighbor(map, mill[0], mill[1])
    addNeighbor(map, mill[1], mill[0])
    addNeighbor(map, mill[1], mill[2])
    addNeighbor(map, mill[2], mill[1])
  }
  return map
}

const NEIGHBORS = buildNeighbors()

export function neighborsOf(point: Point): Point[] {
  return NEIGHBORS.get(keyOf(point)) ?? []
}

function millOwned(board: MorrisBoard, mill: readonly [Point, Point, Point], player: Player): boolean {
  return mill.every((point) => board[keyOf(point)] === player)
}

export function millsAt(board: MorrisBoard, point: Point, player: Player): Array<readonly [Point, Point, Point]> {
  return MILLS.filter(
    (mill) => mill.some((item) => samePoint(item, point)) && millOwned(board, mill, player),
  )
}

export function formsMill(board: MorrisBoard, point: Point, player: Player): boolean {
  return millsAt(board, point, player).length > 0
}

export function isInMill(board: MorrisBoard, point: Point, player: Player): boolean {
  return formsMill(board, point, player)
}

export function isPlacing(inHand: Hands): boolean {
  return inHand.white > 0 || inHand.black > 0
}

export function emptyPoints(board: MorrisBoard): Point[] {
  return POINTS.filter((point) => board[keyOf(point)] === null)
}

export function piecesOf(board: MorrisBoard, player: Player): Point[] {
  return POINTS.filter((point) => board[keyOf(point)] === player)
}

export function countPieces(board: MorrisBoard, player: Player): number {
  return piecesOf(board, player).length
}

export function canFly(board: MorrisBoard, inHand: Hands, player: Player): boolean {
  return !isPlacing(inHand) && countPieces(board, player) === 3
}

export function removablePieces(board: MorrisBoard, enemy: Player): Point[] {
  const pieces = piecesOf(board, enemy)
  const free = pieces.filter((point) => !isInMill(board, point, enemy))
  return free.length > 0 ? free : pieces
}
