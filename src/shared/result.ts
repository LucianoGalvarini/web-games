import type { GameMode, Player, Winner } from './types'

export type ResultVariant = 'win' | 'loss' | 'draw'

export function resultTitle(winner: Winner, mode: GameMode, humanColor: Player = 'white'): string {
  if (!winner) {
    return ''
  }
  if (winner === 'draw') {
    return 'Tablas'
  }
  if (mode === 'cpu') {
    return winner === humanColor ? 'Ganaste' : 'Perdiste'
  }
  return winner === 'white' ? 'Ganaron las blancas' : 'Ganaron las negras'
}

export function resultEyebrow(winner: Winner, mode: GameMode, humanColor: Player = 'white'): string {
  if (!winner) {
    return ''
  }
  if (winner === 'draw') {
    return 'Partida terminada'
  }
  if (mode === 'cpu' && winner !== humanColor) {
    return 'Derrota'
  }
  return 'Victoria'
}

export function resultVariant(winner: Winner, mode: GameMode, humanColor: Player = 'white'): ResultVariant {
  if (!winner || winner === 'draw') {
    return 'draw'
  }
  if (mode === 'cpu' && winner !== humanColor) {
    return 'loss'
  }
  return 'win'
}
