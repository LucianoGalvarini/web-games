import type { GameMode, Winner } from './types'

export type ResultVariant = 'win' | 'loss' | 'draw'

export function resultTitle(winner: Winner, mode: GameMode): string {
  if (!winner) {
    return ''
  }
  if (winner === 'draw') {
    return 'Tablas'
  }
  if (mode === 'cpu') {
    return winner === 'white' ? 'Ganaste' : 'Perdiste'
  }
  return winner === 'white' ? 'Ganaron las blancas' : 'Ganaron las negras'
}

export function resultEyebrow(winner: Winner, mode: GameMode): string {
  if (!winner) {
    return ''
  }
  if (winner === 'draw') {
    return 'Partida terminada'
  }
  if (mode === 'cpu' && winner === 'black') {
    return 'Derrota'
  }
  return 'Victoria'
}

export function resultVariant(winner: Winner, mode: GameMode): ResultVariant {
  if (!winner || winner === 'draw') {
    return 'draw'
  }
  if (mode === 'cpu' && winner === 'black') {
    return 'loss'
  }
  return 'win'
}
