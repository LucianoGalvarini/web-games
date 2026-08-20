import { opponent } from '../shared/player'
import type { Difficulty, Player } from '../shared/types'
import { sameCard } from './deck'
import { envidoOf, faltaValue, legalEnvidoRaises } from './envido'
import { canRaiseTruco, canStartEnvido, legalActions } from './legal'
import { compareTruco, trucoPower } from './ranking'
import type { Card, TrucoAction, TrucoState } from './types'

function pick<T>(items: T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) {
    throw new Error('No hay opciones para la CPU.')
  }
  return item
}

function roll(random: () => number, chance: number): boolean {
  return random() < chance
}

function can(actions: TrucoAction[], kind: TrucoAction['kind']): boolean {
  return actions.some((action) => action.kind === kind)
}

function ledCard(state: TrucoState, player: Player): Card | null {
  const play = state.current.plays.find((item) => item.player === opponent(player))
  return play?.card ?? null
}

function sortedByPower(hand: Card[]): Card[] {
  return [...hand].sort(compareTruco)
}

function highCount(hand: Card[]): { high: number; matadoras: number; best: number } {
  const powers = hand.map(trucoPower)
  return {
    high: powers.filter((power) => power >= 10).length,
    matadoras: powers.filter((power) => power >= 11).length,
    best: Math.max(0, ...powers),
  }
}

function vivoOf(difficulty: Difficulty) {
  if (difficulty === 'easy') {
    return {
      fakeEnvido: 0.18,
      fakeTruco: 0.26,
      fakeRetruco: 0.12,
      duck: 0.3,
      leadHigh: 0.16,
      acceptWeak: 0.34,
      rejectOk: 0.2,
      mazo: 0.32,
    }
  }
  if (difficulty === 'medium') {
    return {
      fakeEnvido: 0.22,
      fakeTruco: 0.34,
      fakeRetruco: 0.2,
      duck: 0.16,
      leadHigh: 0.36,
      acceptWeak: 0.12,
      rejectOk: 0.18,
      mazo: 0.58,
    }
  }
  return {
    fakeEnvido: 0.16,
    fakeTruco: 0.38,
    fakeRetruco: 0.26,
    duck: 0.1,
    leadHigh: 0.48,
    acceptWeak: 0.06,
    rejectOk: 0.24,
    mazo: 0.72,
  }
}

function chooseCard(
  state: TrucoState,
  player: Player,
  difficulty: Difficulty,
  random: () => number,
): Card {
  const hand = state.hands[player]
  if (hand.length === 0) {
    throw new Error('La CPU no tiene cartas.')
  }
  const vivo = vivoOf(difficulty)
  const ranked = sortedByPower(hand)
  const lowest = ranked[0] ?? hand[0]
  const highest = ranked[ranked.length - 1] ?? hand[0]
  const led = ledCard(state, player)

  if (!led) {
    const wonFirst = state.tricks[0]?.winner === player
    if (wonFirst && trucoPower(highest) >= 10 && roll(random, vivo.leadHigh)) {
      return highest
    }
    return lowest
  }

  const beating = ranked.filter((card) => compareTruco(card, led) > 0)
  const cheapestWin = beating[0]
  if (cheapestWin) {
    const wouldSpendMatadora = trucoPower(cheapestWin) >= 11
    const canDuck = compareTruco(lowest, led) <= 0
    if (wouldSpendMatadora && canDuck && roll(random, vivo.duck + 0.18)) {
      return lowest
    }
    if (lowest !== cheapestWin && roll(random, vivo.duck)) {
      return lowest
    }
    return cheapestWin
  }
  return lowest
}

function isDeadHand(state: TrucoState, player: Player): boolean {
  if (state.tricks[0]?.winner !== opponent(player)) {
    return false
  }
  return highCount(state.hands[player]).best < 8
}

export function chooseAiAction(
  state: TrucoState,
  player: Player,
  difficulty: Difficulty,
  random = Math.random,
): TrucoAction | null {
  const actions = legalActions(state, player)
  if (actions.length === 0) {
    return null
  }

  const plays = actions.filter((action) => action.kind === 'play')
  const ours = envidoOf(state.dealt[player])
  const { high, matadoras, best } = highCount(state.hands[player])
  const falta = faltaValue(state.scores)
  const vivo = vivoOf(difficulty)
  const strong = matadoras >= 1 || high >= 2 || best >= 13
  const ok = high >= 1 || best >= 10
  const weak = !ok
  const led = ledCard(state, player)
  const shownLow = led ? trucoPower(led) <= 5 : false
  const raises = legalEnvidoRaises(state.envidoChain)

  if (state.envidoPending) {
    const isFalta = state.envidoChain.includes('falta')
    if (!isFalta && ours >= 31 && raises.includes('falta') && falta >= 3 && can(actions, 'falta') && difficulty !== 'easy') {
      return { kind: 'falta' }
    }
    if (!isFalta && ours >= 28 && raises.includes('real') && can(actions, 'real') && (difficulty === 'hard' || roll(random, 0.55))) {
      return { kind: 'real' }
    }
    if (!isFalta && ours >= 27 && raises.includes('envido') && can(actions, 'envido') && roll(random, 0.7)) {
      return { kind: 'envido' }
    }
    if (ours >= 24) {
      if (roll(random, vivo.rejectOk)) {
        return { kind: 'no-quiero' }
      }
      return { kind: 'quiero' }
    }
    if (ours >= 20) {
      return roll(random, 0.55) ? { kind: 'quiero' } : { kind: 'no-quiero' }
    }
    if (roll(random, vivo.acceptWeak)) {
      return { kind: 'quiero' }
    }
    return { kind: 'no-quiero' }
  }

  if (state.trucoPending) {
    if (canStartEnvido(state, player) && can(actions, 'envido')) {
      const fakeEnvido = ours < 24 && (difficulty === 'easy' ? ours <= 20 : ours >= 18)
      if (ours >= 27 || (fakeEnvido && roll(random, vivo.fakeEnvido))) {
        return { kind: 'envido' }
      }
    }
    if (strong && canRaiseTruco(state, player) && can(actions, 'truco') && roll(random, difficulty === 'hard' ? 0.58 : 0.3)) {
      return { kind: 'truco' }
    }
    if (weak && canRaiseTruco(state, player) && can(actions, 'truco') && (shownLow || roll(random, vivo.fakeRetruco))) {
      return { kind: 'truco' }
    }
    if (strong || ok) {
      return { kind: 'quiero' }
    }
    if (roll(random, vivo.fakeTruco * 0.65)) {
      return { kind: 'quiero' }
    }
    return { kind: 'no-quiero' }
  }

  if (canStartEnvido(state, player)) {
    if (ours >= 31 && difficulty === 'hard' && can(actions, 'falta')) {
      return { kind: 'falta' }
    }
    if (ours >= 28 && difficulty !== 'easy' && can(actions, 'real')) {
      return { kind: 'real' }
    }
    if ((ours >= 26 || (ours >= 24 && player === state.mano)) && can(actions, 'envido')) {
      return { kind: 'envido' }
    }
    const bluffEnvido =
      difficulty === 'easy'
        ? ours < 24
        : difficulty === 'medium'
          ? ours >= 16 && ours < 26
          : ours >= 19 && ours < 26
    if (bluffEnvido && roll(random, vivo.fakeEnvido) && can(actions, 'envido')) {
      return { kind: 'envido' }
    }
  }

  if (canRaiseTruco(state, player) && can(actions, 'truco')) {
    const wonATrick = state.tricks.some((trick) => trick.winner === player)
    const wantReal = strong || (ok && roll(random, 0.48))
    const timedLie = wonATrick || shownLow || player !== state.mano || state.current.plays.length === 1
    const wantLie = weak && timedLie && roll(random, vivo.fakeTruco)
    if (wantReal || wantLie) {
      return { kind: 'truco' }
    }
  }

  if (plays.length > 0 && can(actions, 'mazo') && isDeadHand(state, player) && roll(random, vivo.mazo)) {
    return { kind: 'mazo' }
  }

  if (plays.length > 0) {
    const card = chooseCard(state, player, difficulty, random)
    const legal = plays.find((action) => action.kind === 'play' && sameCard(action.card, card))
    if (legal) {
      return legal
    }
    return plays[0] ?? pick(actions, random)
  }

  return pick(actions, random)
}
