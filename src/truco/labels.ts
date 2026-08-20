import type { Player } from '../shared/types'
import type { Card, LogEvent, Rank, Suit, TrucoLevel, TrucoState } from './types'

export const SUIT_LABEL: Record<Suit, string> = {
  oros: 'oros',
  copas: 'copas',
  espadas: 'espadas',
  bastos: 'bastos',
}

export const RANK_LABEL: Record<Rank, string> = {
  1: '1',
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

export type TableShout = {
  title: string
  sub?: string
  who: Player
  kind: 'call' | 'answer'
  waiting: boolean
}

function lastCallTitle(chain: TrucoState['envidoChain']): string {
  const last = chain[chain.length - 1]
  if (last === 'falta') {
    return 'Falta envido'
  }
  if (last === 'real') {
    return 'Real envido'
  }
  if (chain.filter((item) => item === 'envido').length > 1) {
    return 'Envido envido'
  }
  return 'Envido'
}

function shoutFromEvent(event: LogEvent): TableShout | null {
  if (event.kind === 'envido') {
    return { title: 'Envido', who: event.player, kind: 'call', waiting: false }
  }
  if (event.kind === 'real') {
    return { title: 'Real envido', who: event.player, kind: 'call', waiting: false }
  }
  if (event.kind === 'falta') {
    return { title: 'Falta envido', who: event.player, kind: 'call', waiting: false }
  }
  if (event.kind === 'truco') {
    return { title: trucoLevelLabel(event.level), who: event.player, kind: 'call', waiting: false }
  }
  if (event.kind === 'quiero') {
    return { title: 'Quiero', who: event.player, kind: 'answer', waiting: false }
  }
  if (event.kind === 'no-quiero') {
    return { title: 'No quiero', who: event.player, kind: 'answer', waiting: false }
  }
  if (event.kind === 'mazo') {
    return { title: 'Me voy al mazo', who: event.player, kind: 'answer', waiting: false }
  }
  if (event.kind === 'envido-result') {
    return {
      title: event.accepted ? 'Envido' : 'No querido',
      sub: event.accepted ? `Se llevó ${event.points}` : `Vale ${event.points}`,
      who: event.winner,
      kind: 'answer',
      waiting: false,
    }
  }
  return null
}

export function tableShout(state: TrucoState): TableShout | null {
  if (state.envidoPending) {
    return {
      title: lastCallTitle(state.envidoChain),
      who: state.envidoPending.from,
      kind: 'call',
      waiting: true,
    }
  }
  if (state.trucoPending) {
    return {
      title: trucoLevelLabel(state.trucoPending.level),
      who: state.trucoPending.from,
      kind: 'call',
      waiting: true,
    }
  }
  for (let index = state.log.length - 1; index >= 0; index -= 1) {
    const event = state.log[index]
    if (!event || event.kind === 'play' || event.kind === 'trick') {
      continue
    }
    if (event.kind === 'hand') {
      return null
    }
    return shoutFromEvent(event)
  }
  return null
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

export function logSide(event: LogEvent, viewing: Player): 'you' | 'them' | 'meta' {
  if (event.kind === 'trick' && event.winner === 'parda') {
    return 'meta'
  }
  const who =
    event.kind === 'envido-result' || event.kind === 'hand' || event.kind === 'trick'
      ? event.winner
      : event.player
  if (who === 'parda') {
    return 'meta'
  }
  return who === viewing ? 'you' : 'them'
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
