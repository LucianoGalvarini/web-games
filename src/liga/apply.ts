import type { Difficulty } from '../shared/types'
import { playTurn, startBattle } from './battle'
import { DIRS, PRESETS } from './constants'
import { TRAINER_INTRO, TRAINER_OUTRO } from './labels'
import { canStep, facingTrainer, nextRoom, prevRoom, roomOf, tileAt, trainerIdOf } from './map'
import { createRng } from './rng'
import { cloneParty, createTrainers, pickPlayerParty } from './team'
import type { LigaAction, LigaDir, LigaItemId, LigaState } from './types'

export function createGame(difficulty: Difficulty, seed = Date.now()): LigaState {
  const random = createRng(seed)
  return {
    seed,
    difficulty,
    phase: 'walk',
    room: 'sidney',
    player: roomOf('sidney').spawn,
    facing: 'up',
    party: pickPlayerParty(difficulty, random),
    bag: { ...PRESETS[difficulty].bag },
    trainers: createTrainers(difficulty, random),
    dialog: null,
    battle: null,
    fxQueue: [],
  }
}

export function listedBag(bag: LigaState['bag']): { id: LigaItemId; count: number }[] {
  return (Object.entries(bag) as [LigaItemId, number | undefined][])
    .filter((entry): entry is [LigaItemId, number] => (entry[1] ?? 0) > 0)
    .map(([id, count]) => ({ id, count }))
}

function spendItem(state: LigaState, itemId: LigaItemId): LigaState {
  const count = state.bag[itemId] ?? 0
  if (count <= 1) {
    const bag = { ...state.bag }
    delete bag[itemId]
    return { ...state, bag }
  }
  return { ...state, bag: { ...state.bag, [itemId]: count - 1 } }
}

function finishBattle(state: LigaState, result: 'win' | 'lose'): LigaState {
  const battle = state.battle
  if (!battle) {
    return state
  }
  if (result === 'lose') {
    return { ...state, phase: 'lost', party: cloneParty(battle.playerParty), battle: null, dialog: null, fxQueue: [] }
  }
  const trainer = state.trainers[battle.trainerId]
  return {
    ...state,
    phase: 'dialog',
    party: cloneParty(battle.playerParty),
    trainers: {
      ...state.trainers,
      [battle.trainerId]: { ...trainer, beaten: true, party: cloneParty(battle.foeParty) },
    },
    dialog: TRAINER_OUTRO[battle.trainerId],
    battle: null,
    facing: 'up',
    fxQueue: [],
  }
}

function stepTo(state: LigaState, dir: LigaDir): LigaState {
  const facing = { ...state, facing: dir }
  if (state.phase !== 'walk' || !canStep(facing, dir)) {
    return facing
  }
  const delta = DIRS[dir]
  const x = state.player.x + delta.x
  const y = state.player.y + delta.y
  const tile = tileAt(state.room, x, y)
  if (tile === 'door-n') {
    const next = nextRoom(state.room)
    if (!next) {
      return facing
    }
    if (next === 'hall') {
      return { ...facing, phase: 'won', room: next, player: roomOf(next).spawnSouth }
    }
    return { ...facing, room: next, player: roomOf(next).spawnSouth }
  }
  if (tile === 'door-s') {
    const prev = prevRoom(state.room)
    if (!prev) {
      return facing
    }
    return { ...facing, room: prev, player: roomOf(prev).spawnNorth }
  }
  return { ...facing, player: { x, y } }
}

function interact(state: LigaState): LigaState {
  if (state.phase === 'dialog') {
    const trainerId = trainerIdOf(state.room)
    if (trainerId && !state.trainers[trainerId].beaten && state.dialog === TRAINER_INTRO[trainerId]) {
      return {
        ...state,
        phase: 'battle',
        dialog: null,
        battle: startBattle(state.party, state.trainers[trainerId].party, trainerId),
      }
    }
    return { ...state, phase: 'walk', dialog: null }
  }
  if (state.phase !== 'walk') {
    return state
  }
  const trainerId = facingTrainer(state)
  if (!trainerId) {
    return state
  }
  return { ...state, phase: 'dialog', dialog: TRAINER_INTRO[trainerId] }
}

function battleAction(state: LigaState, action: LigaAction, random: () => number): LigaState {
  const battle = state.battle
  if (!battle || state.phase !== 'battle') {
    return state
  }
  if (action.kind === 'open') {
    if (battle.mustSwitch && action.menu !== 'party') {
      return state
    }
    return { ...state, battle: { ...battle, menu: action.menu }, fxQueue: [] }
  }
  if (action.kind === 'move' || action.kind === 'switch') {
    const played = playTurn(
      battle,
      action.kind === 'move' ? { kind: 'move', index: action.index } : { kind: 'switch', index: action.index },
      state.difficulty,
      random,
    )
    const next = { ...state, battle: played.battle, fxQueue: played.battle.lastFx }
    return next
  }
  if (action.kind === 'resolve') {
    if (battle.outcome === 'win' || battle.outcome === 'lose') {
      return finishBattle(state, battle.outcome)
    }
    return { ...state, fxQueue: [] }
  }
  if (action.kind !== 'item') {
    return state
  }
  if ((state.bag[action.itemId] ?? 0) <= 0) {
    return state
  }
  const played = playTurn(battle, { kind: 'item', itemId: action.itemId, target: action.target }, state.difficulty, random)
  const next = played.itemId
    ? spendItem({ ...state, battle: played.battle, fxQueue: played.battle.lastFx }, played.itemId)
    : { ...state, battle: played.battle, fxQueue: played.battle.lastFx }
  return next
}

export function applyAction(state: LigaState, action: LigaAction, random: () => number = Math.random): LigaState {
  if (state.phase === 'won' || state.phase === 'lost') {
    return state
  }
  if (action.kind === 'reorder') {
    if (state.phase === 'battle' || state.battle) {
      return state
    }
    const from = state.party[action.from]
    const to = state.party[action.to]
    if (!from || !to || action.from === action.to) {
      return state
    }
    const party = cloneParty(state.party)
    party[action.from] = to
    party[action.to] = from
    return { ...state, party }
  }
  if (action.kind === 'step') {
    return stepTo(state, action.dir)
  }
  if (action.kind === 'interact') {
    return interact(state)
  }
  return battleAction(state, action, random)
}
