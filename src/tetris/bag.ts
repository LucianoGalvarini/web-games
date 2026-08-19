import { PIECE_IDS } from './constants'
import type { PieceId } from './types'

export function shuffleBag(random = Math.random): PieceId[] {
  const bag: PieceId[] = [...PIECE_IDS]
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const left = bag[i]
    const right = bag[j]
    if (left === undefined || right === undefined) {
      continue
    }
    bag[i] = right
    bag[j] = left
  }
  return bag
}

export function takeNext(
  queue: PieceId[],
  bag: PieceId[],
  random = Math.random,
): { id: PieceId; queue: PieceId[]; bag: PieceId[] } {
  let nextQueue = [...queue]
  let nextBag = [...bag]
  while (nextQueue.length < 8) {
    if (nextBag.length === 0) {
      nextBag = shuffleBag(random)
    }
    const drawn = nextBag[0]
    if (drawn === undefined) {
      break
    }
    nextQueue.push(drawn)
    nextBag = nextBag.slice(1)
  }
  const id = nextQueue[0]
  if (id === undefined) {
    throw new Error('La bolsa de piezas quedó vacía.')
  }
  return { id, queue: nextQueue.slice(1), bag: nextBag }
}
