import type { Player } from '../shared/types'
import { sameCard } from './deck'
import { legalEnvidoRaises } from './envido'
import type { TrucoAction, TrucoState } from './types'

export function envidoWindowOpen(state: TrucoState): boolean {
  return !state.envidoDone && state.tricks.length === 0 && state.current.plays.length < 2
}

export function canStartEnvido(state: TrucoState, player: Player): boolean {
  if (!envidoWindowOpen(state) || state.envidoPending || state.handWinner || state.matchWinner) {
    return false
  }
  return state.hands[player].length === 3
}

export function canRaiseTruco(state: TrucoState, player: Player): boolean {
  if (state.handWinner || state.matchWinner || state.envidoPending) {
    return false
  }
  if (state.trucoPending) {
    return player === state.trucoPending.to && state.trucoPending.level < 4
  }
  if (player !== state.toPlay) {
    return false
  }
  if (state.trucoLevel === 4) {
    return false
  }
  return state.lastTrucoBy !== player
}

export function actorOf(state: TrucoState): Player | null {
  if (state.matchWinner || state.handWinner) {
    return null
  }
  if (state.envidoPending) {
    return state.envidoPending.to
  }
  if (state.trucoPending) {
    return state.trucoPending.to
  }
  return state.toPlay
}

export function legalActions(state: TrucoState, player: Player): TrucoAction[] {
  if (state.matchWinner || state.handWinner || actorOf(state) !== player) {
    return []
  }

  const actions: TrucoAction[] = []

  if (state.envidoPending) {
    actions.push({ kind: 'quiero' }, { kind: 'no-quiero' })
    for (const call of legalEnvidoRaises(state.envidoChain)) {
      actions.push({ kind: call })
    }
    return actions
  }

  if (state.trucoPending) {
    actions.push({ kind: 'quiero' }, { kind: 'no-quiero' })
    if (canRaiseTruco(state, player)) {
      actions.push({ kind: 'truco' })
    }
    if (canStartEnvido(state, player)) {
      for (const call of legalEnvidoRaises([])) {
        actions.push({ kind: call })
      }
    }
    return actions
  }

  for (const card of state.hands[player]) {
    actions.push({ kind: 'play', card })
  }
  if (canStartEnvido(state, player)) {
    for (const call of legalEnvidoRaises([])) {
      actions.push({ kind: call })
    }
  }
  if (canRaiseTruco(state, player)) {
    actions.push({ kind: 'truco' })
  }
  actions.push({ kind: 'mazo' })
  return actions
}

export function isLegalAction(state: TrucoState, player: Player, action: TrucoAction): boolean {
  return legalActions(state, player).some((item) => sameAction(item, action))
}

export function sameAction(a: TrucoAction, b: TrucoAction): boolean {
  if (a.kind !== b.kind) {
    return false
  }
  if (a.kind === 'play' && b.kind === 'play') {
    return sameCard(a.card, b.card)
  }
  return true
}
