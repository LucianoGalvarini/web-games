import type { Player } from '../shared/types'
import type { Card, LogEvent, Rank, Suit, TrucoLevel, TrucoState } from './types'

export const SUIT_LABEL: Record<Suit, string> = {
  oros: 'oros',
  copas: 'copas',
  espadas: 'espadas',
  bastos: 'bastos',
}

export const RANK_LABEL: Record<Rank, string> = {
  1: 'As',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
}

export function cardLabel(card: Card): string {
  return `${RANK_LABEL[card.rank]} de ${SUIT_LABEL[card.suit]}`
}

export function trucoLevelLabel(level: TrucoLevel): string {
  if (level === 1) {
    return 'Quiero'
  }
  if (level === 2) {
    return 'Truco'
  }
  if (level === 3) {
    return 'Retruco'
  }
  return 'Vale cuatro'
}

export function nextTrucoLabel(level: TrucoLevel): string {
  if (level === 1) {
    return 'Truco'
  }
  if (level === 2) {
    return 'Retruco'
  }
  return 'Vale cuatro'
}

export function seatLabel(player: Player, mode: 'local' | 'cpu', humanColor: Player): string {
  if (mode === 'cpu') {
    return player === humanColor ? 'Vos' : 'CPU'
  }
  return player === 'white' ? 'Jugador 1' : 'Jugador 2'
}

export function logText(event: LogEvent, nameOf: (player: Player) => string): string {
  if (event.kind === 'envido') {
    return `${nameOf(event.player)} cantó envido.`
  }
  if (event.kind === 'real') {
    return `${nameOf(event.player)} cantó real envido.`
  }
  if (event.kind === 'falta') {
    return `${nameOf(event.player)} cantó falta envido.`
  }
  if (event.kind === 'truco') {
    return `${nameOf(event.player)} cantó ${trucoLevelLabel(event.level).toLowerCase()}.`
  }
  if (event.kind === 'quiero') {
    return `${nameOf(event.player)} dijo quiero.`
  }
  if (event.kind === 'no-quiero') {
    return `${nameOf(event.player)} dijo no quiero.`
  }
  if (event.kind === 'mazo') {
    return `${nameOf(event.player)} se fue al mazo.`
  }
  if (event.kind === 'play') {
    return `${nameOf(event.player)} jugó ${cardLabel(event.card)}.`
  }
  if (event.kind === 'trick') {
    if (event.winner === 'parda') {
      return 'Baza parda.'
    }
    return `${nameOf(event.winner)} ganó la baza.`
  }
  if (event.kind === 'envido-result') {
    if (!event.accepted || !event.values) {
      return `${nameOf(event.winner)} se llevó el envido (${event.points}), no querido.`
    }
    return `${nameOf(event.winner)} se llevó el envido (${event.points}). ${nameOf('white')} ${event.values.white} — ${nameOf('black')} ${event.values.black}.`
  }
  return `${nameOf(event.winner)} ganó la mano (${event.points}).`
}

export function statusText(
  state: TrucoState,
  actor: Player | null,
  nameOf: (player: Player) => string,
  thinking: boolean,
): string {
  if (state.matchWinner) {
    return `${nameOf(state.matchWinner)} llegó a 30.`
  }
  if (state.handWinner) {
    return `${nameOf(state.handWinner)} se llevó la mano (${state.handPoints}).`
  }
  if (thinking) {
    return 'La computadora está pensando…'
  }
  if (state.envidoPending && actor) {
    return `${nameOf(actor)} responde el envido.`
  }
  if (state.trucoPending && actor) {
    return `${nameOf(actor)} responde el ${trucoLevelLabel(state.trucoPending.level).toLowerCase()}.`
  }
  if (actor) {
    return `Juega ${nameOf(actor).toLowerCase()}. Mano: ${nameOf(state.mano)}.`
  }
  return 'Mesa quieta.'
}
