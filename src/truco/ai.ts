import { opponent } from '../shared/player'
import type { Difficulty, Player } from '../shared/types'
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

function ledCard(state: TrucoState, player: Player): Card | null {
  const play = state.current.plays.find((item) => item.player === opponent(player))
  return play?.card ?? null
}

function chooseCard(hand: Card[], led: Card | null, difficulty: Difficulty, random: () => number): Card {
  if (hand.length === 0) {
    throw new Error('La CPU no tiene cartas.')
  }
  if (difficulty === 'easy' && random() < 0.55) {
    return pick(hand, random)
  }

  if (led) {
    const beating = [...hand].filter((card) => compareTruco(card, led) > 0).sort(compareTruco)
    if (beating[0]) {
      return beating[0]
    }
    return [...hand].sort(compareTruco)[0] ?? hand[0]
  }

  if (difficulty === 'hard') {
    return [...hand].sort(compareTruco).at(-1) ?? hand[0]
  }
  return pick(hand, random)
}

function highCount(hand: Card[]): { high: number; matadoras: number; best: number } {
  const powers = hand.map(trucoPower)
  return {
    high: powers.filter((power) => power >= 10).length,
    matadoras: powers.filter((power) => power >= 11).length,
    best: Math.max(0, ...powers),
  }
}

function playAction(state: TrucoState, player: Player, difficulty: Difficulty, random: () => number): TrucoAction {
  const card = chooseCard(state.hands[player], ledCard(state, player), difficulty, random)
  return { kind: 'play', card }
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

  if (state.envidoPending) {
    const raises = legalEnvidoRaises(state.envidoChain)
    if (difficulty !== 'easy' && ours >= 31 && raises.includes('falta') && falta >= 3) {
      return { kind: 'falta' }
    }
    if (difficulty === 'hard' && ours >= 28 && raises.includes('real')) {
      return { kind: 'real' }
    }
    if (ours >= 27 && raises.includes('envido')) {
      return { kind: 'envido' }
    }
    if (ours >= 24 || (ours >= 20 && state.envidoChain.length === 1 && state.envidoChain[0] === 'envido')) {
      return { kind: 'quiero' }
    }
    if (difficulty === 'easy' && random() < 0.35) {
      return { kind: 'quiero' }
    }
    return { kind: 'no-quiero' }
  }

  if (state.trucoPending) {
    const canEnvido = canStartEnvido(state, player)
    if (canEnvido && ours >= 28 && difficulty !== 'easy') {
      return { kind: 'envido' }
    }
    const strong = matadoras >= 1 || high >= 2 || best >= 13
    const ok = high >= 1 || best >= 10
    if (strong && canRaiseTruco(state, player) && difficulty === 'hard' && random() < 0.45) {
      return { kind: 'truco' }
    }
    if (strong || (ok && difficulty !== 'easy') || (difficulty === 'easy' && random() < 0.5)) {
      return { kind: 'quiero' }
    }
    return { kind: 'no-quiero' }
  }

  if (difficulty === 'easy' && plays.length > 0 && random() < 0.72) {
    return playAction(state, player, difficulty, random)
  }

  if (canStartEnvido(state, player)) {
    if (ours >= 31 && difficulty === 'hard') {
      return { kind: 'falta' }
    }
    if (ours >= 27 || (ours >= 25 && player === state.mano && difficulty !== 'easy')) {
      return { kind: 'envido' }
    }
  }

  if (canRaiseTruco(state, player)) {
    const want =
      matadoras >= 1 ||
      high >= 2 ||
      (difficulty === 'hard' && best >= 12 && high >= 1) ||
      (difficulty === 'hard' && random() < 0.08)
    if (want) {
      return { kind: 'truco' }
    }
  }

  if (plays.length > 0) {
    return playAction(state, player, difficulty, random)
  }

  return pick(actions, random)
}
