import type { Player } from './types'

export function opponent(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

export function playerLabel(player: Player): string {
  return player === 'white' ? 'Blancas' : 'Negras'
}
