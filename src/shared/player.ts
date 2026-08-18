import type { GameMode, Player } from './types'

export function opponent(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

export function playerLabel(player: Player): string {
  return player === 'white' ? 'Blancas' : 'Negras'
}

export function isCpuTurn(mode: GameMode, current: Player, humanColor: Player): boolean {
  return mode === 'cpu' && current !== humanColor
}
