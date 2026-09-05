import type { Player } from '../shared/types'
import { POINT_COUNT } from './constants'
import type { BackgammonPosition, PointSquare } from './types'

export function createInitialPosition(): BackgammonPosition {
  const points: PointSquare[] = new Array(POINT_COUNT).fill(null)
  points[23] = { player: 'white', count: 2 }
  points[12] = { player: 'white', count: 5 }
  points[7] = { player: 'white', count: 3 }
  points[5] = { player: 'white', count: 5 }
  points[0] = { player: 'black', count: 2 }
  points[11] = { player: 'black', count: 5 }
  points[16] = { player: 'black', count: 3 }
  points[18] = { player: 'black', count: 5 }

  return {
    points,
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
    current: 'white',
  }
}

export function clonePosition(position: BackgammonPosition): BackgammonPosition {
  return {
    points: position.points.map((square) => (square ? { ...square } : null)),
    bar: { ...position.bar },
    off: { ...position.off },
    current: position.current,
  }
}

export function opponentOf(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

export function checkersOf(position: BackgammonPosition, player: Player): number {
  let total = position.bar[player] + position.off[player]
  for (const square of position.points) {
    if (square && square.player === player) {
      total += square.count
    }
  }
  return total
}

export function serializePosition(position: BackgammonPosition): string {
  const grid = position.points
    .map((square) => (square ? `${square.player === 'white' ? 'W' : 'B'}${square.count}` : '.'))
    .join(',')
  return `${position.current}:${grid}:bar${position.bar.white}-${position.bar.black}:off${position.off.white}-${position.off.black}`
}
