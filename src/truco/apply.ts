import { opponent } from '../shared/player'
import type { Player } from '../shared/types'
import { TARGET_SCORE } from './constants'
import { fullDeck, removeCard, shuffle } from './deck'
import {
  acceptedEnvidoPoints,
  envidoOf,
  envidoWinner,
  faltaValue,
  rejectedEnvidoPoints,
} from './envido'
import { isLegalAction } from './legal'
import { compareTruco } from './ranking'
import type { EnvidoCall, LogEvent, TrickPlay, TrickResult, TrucoAction, TrucoState } from './types'

function copy(state: TrucoState): TrucoState {
  return {
    scores: { ...state.scores },
    mano: state.mano,
    hands: {
      white: [...state.hands.white],
      black: [...state.hands.black],
    },
    dealt: {
      white: [...state.dealt.white],
      black: [...state.dealt.black],
    },
    toPlay: state.toPlay,
    tricks: state.tricks.map((trick) => ({
      lead: trick.lead,
      winner: trick.winner,
      plays: trick.plays.map((play) => ({ player: play.player, card: play.card })),
    })),
    current: {
      lead: state.current.lead,
      plays: state.current.plays.map((play) => ({ player: play.player, card: play.card })),
    },
    trucoLevel: state.trucoLevel,
    trucoPending: state.trucoPending ? { ...state.trucoPending } : null,
    lastTrucoBy: state.lastTrucoBy,
    envidoChain: [...state.envidoChain],
    envidoPending: state.envidoPending ? { ...state.envidoPending } : null,
    envidoDone: state.envidoDone,
    envidoReveal: state.envidoReveal
      ? {
          white: state.envidoReveal.white,
          black: state.envidoReveal.black,
          winner: state.envidoReveal.winner,
          points: state.envidoReveal.points,
        }
      : null,
    folded: state.folded,
    handWinner: state.handWinner,
    handPoints: state.handPoints,
    matchWinner: state.matchWinner,
    log: [...state.log],
  }
}

function push(state: TrucoState, event: LogEvent): void {
  state.log.push(event)
}

function award(state: TrucoState, player: Player, points: number): void {
  state.scores[player] += points
  if (state.scores[player] >= TARGET_SCORE) {
    state.matchWinner = player
  }
}

function endHand(state: TrucoState, winner: Player, points: number): void {
  state.handWinner = winner
  state.handPoints = points
  award(state, winner, points)
  push(state, { kind: 'hand', winner, points })
}

function trickWinnerOf(plays: TrickPlay[]): Player | 'parda' {
  const first = plays[0]
  const second = plays[1]
  if (!first || !second) {
    throw new Error('La baza no está completa.')
  }
  const diff = compareTruco(first.card, second.card)
  if (diff > 0) {
    return first.player
  }
  if (diff < 0) {
    return second.player
  }
  return 'parda'
}

function decidedHandWinner(tricks: TrickResult[], mano: Player): Player | null {
  const wins = { white: 0, black: 0 }
  for (const trick of tricks) {
    if (trick.winner !== 'parda') {
      wins[trick.winner] += 1
    }
  }

  if (tricks.length >= 2) {
    const first = tricks[0]
    const second = tricks[1]
    if (first && second && first.winner === 'parda' && second.winner !== 'parda') {
      return second.winner
    }
    if (first && second && first.winner !== 'parda' && second.winner === 'parda') {
      return first.winner
    }
  }

  if (wins.white >= 2) {
    return 'white'
  }
  if (wins.black >= 2) {
    return 'black'
  }

  if (tricks.length === 3) {
    if (wins.white > wins.black) {
      return 'white'
    }
    if (wins.black > wins.white) {
      return 'black'
    }
    const firstWon = tricks.find((trick) => trick.winner !== 'parda')
    return firstWon && firstWon.winner !== 'parda' ? firstWon.winner : mano
  }

  return null
}

function resolveEnvido(state: TrucoState, accepted: boolean): void {
  const chain = state.envidoChain
  const falta = faltaValue(state.scores)
  const from = state.envidoPending?.from
  if (!from || chain.length === 0) {
    return
  }

  state.envidoPending = null
  state.envidoDone = true

  if (!accepted) {
    const points = rejectedEnvidoPoints(chain, falta)
    award(state, from, points)
    state.envidoReveal = null
    push(state, { kind: 'envido-result', winner: from, points, accepted: false, values: null })
    return
  }

  const values = {
    white: envidoOf(state.dealt.white),
    black: envidoOf(state.dealt.black),
  }
  const winner = envidoWinner(values, state.mano)
  const points = acceptedEnvidoPoints(chain, falta)
  award(state, winner, points)
  state.envidoReveal = { ...values, winner, points }
  push(state, { kind: 'envido-result', winner, points, accepted: true, values })
}

function startEnvido(state: TrucoState, player: Player, call: EnvidoCall): void {
  state.envidoChain = [...state.envidoChain, call]
  state.envidoPending = { from: player, to: opponent(player) }
  push(state, { kind: call, player })
}

export function dealHand(
  scores: { white: number; black: number },
  mano: Player,
  random = Math.random,
): TrucoState {
  const deck = shuffle(fullDeck(), random)
  const white = mano === 'white' ? deck.slice(0, 3) : deck.slice(3, 6)
  const black = mano === 'black' ? deck.slice(0, 3) : deck.slice(3, 6)
  return {
    scores: { ...scores },
    mano,
    hands: { white: [...white], black: [...black] },
    dealt: { white: [...white], black: [...black] },
    toPlay: mano,
    tricks: [],
    current: { lead: mano, plays: [] },
    trucoLevel: 1,
    trucoPending: null,
    lastTrucoBy: null,
    envidoChain: [],
    envidoPending: null,
    envidoDone: false,
    envidoReveal: null,
    folded: null,
    handWinner: null,
    handPoints: 0,
    matchWinner: scores.white >= TARGET_SCORE ? 'white' : scores.black >= TARGET_SCORE ? 'black' : null,
    log: [],
  }
}

export function createMatch(random = Math.random, firstMano: Player = 'white'): TrucoState {
  return dealHand({ white: 0, black: 0 }, firstMano, random)
}

export function nextHand(state: TrucoState, random = Math.random): TrucoState {
  if (!state.handWinner || state.matchWinner) {
    return state
  }
  return dealHand(state.scores, opponent(state.mano), random)
}

export function applyAction(state: TrucoState, player: Player, action: TrucoAction): TrucoState {
  if (!isLegalAction(state, player, action)) {
    return state
  }

  const next = copy(state)

  if (action.kind === 'envido' || action.kind === 'real' || action.kind === 'falta') {
    startEnvido(next, player, action.kind)
    return next
  }

  if (action.kind === 'truco') {
    const proposed = next.trucoPending
      ? next.trucoPending.level === 2
        ? 3
        : 4
      : nextTrucoPropose(next.trucoLevel)
    next.trucoPending = { from: player, to: opponent(player), level: proposed }
    next.lastTrucoBy = player
    push(next, { kind: 'truco', player, level: proposed })
    return next
  }

  if (action.kind === 'quiero') {
    push(next, { kind: 'quiero', player })
    if (next.envidoPending) {
      resolveEnvido(next, true)
      return next
    }
    if (next.trucoPending) {
      next.trucoLevel = next.trucoPending.level
      next.trucoPending = null
    }
    return next
  }

  if (action.kind === 'no-quiero') {
    push(next, { kind: 'no-quiero', player })
    if (next.envidoPending) {
      resolveEnvido(next, false)
      return next
    }
    if (next.trucoPending) {
      const rejectPoints = next.trucoPending.level === 2 ? 1 : next.trucoPending.level === 3 ? 2 : 3
      const winner = next.trucoPending.from
      next.trucoPending = null
      endHand(next, winner, rejectPoints)
    }
    return next
  }

  if (action.kind === 'mazo') {
    push(next, { kind: 'mazo', player })
    next.folded = player
    endHand(next, opponent(player), next.trucoLevel)
    return next
  }

  const card = action.card
  next.hands[player] = removeCard(next.hands[player], card)
  next.current.plays.push({ player, card })
  push(next, { kind: 'play', player, card })

  if (next.current.plays.length === 1) {
    next.toPlay = opponent(player)
    return next
  }

  const winner = trickWinnerOf(next.current.plays)
  const trick: TrickResult = {
    lead: next.current.lead,
    plays: next.current.plays,
    winner,
  }
  next.tricks.push(trick)
  push(next, { kind: 'trick', winner })

  const handWinner = decidedHandWinner(next.tricks, next.mano)
  if (handWinner) {
    endHand(next, handWinner, next.trucoLevel)
    return next
  }

  const nextLead = winner === 'parda' ? next.current.lead : winner
  next.current = { lead: nextLead, plays: [] }
  next.toPlay = nextLead
  next.envidoDone = true
  return next
}

function nextTrucoPropose(level: 1 | 2 | 3 | 4): 2 | 3 | 4 {
  if (level === 1) {
    return 2
  }
  if (level === 2) {
    return 3
  }
  return 4
}
