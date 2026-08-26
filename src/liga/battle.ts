import type { Difficulty } from '../shared/types'
import { ITEM_HEAL, ITEM_REVIVE } from './constants'
import { moveOf, speciesOf } from './dex'
import { TRAINER_LABELS, TRAINER_TITLE, effectivenessLine } from './labels'
import { pickIndex } from './rng'
import { emptyStages, isPhysical, modifiedStat, withStage } from './stats'
import { cloneParty, cloneSlot, firstAlive, partyFainted, speciesLabel } from './team'
import { typeMatchup } from './typeChart'
import type { LigaBattle, LigaEffect, LigaItemId, LigaMove, LigaSlot, LigaStages, LigaStatus, LigaType } from './types'

export type LigaChoice =
  | { kind: 'move'; index: number }
  | { kind: 'item'; itemId: LigaItemId; target: number }
  | { kind: 'switch'; index: number }

export type LigaTurnResult = 'ongoing' | 'win' | 'lose'

function slotOf(party: LigaSlot[], index: number): LigaSlot {
  const slot = party[index]
  if (!slot) {
    throw new Error('No hay Pokémon en ese lugar.')
  }
  return slot
}

function replaceSlot(party: LigaSlot[], index: number, slot: LigaSlot): LigaSlot[] {
  return party.map((entry, i) => (i === index ? slot : entry))
}

function hurt(slot: LigaSlot, amount: number): LigaSlot {
  return { ...slot, hp: Math.max(0, slot.hp - amount) }
}

function heal(slot: LigaSlot, amount: number): LigaSlot {
  return { ...slot, hp: Math.min(slot.maxHp, slot.hp + amount) }
}

export function itemUsable(itemId: LigaItemId, party: LigaSlot[], target: number, active: number): boolean {
  const slot = party[target]
  if (!slot) {
    return false
  }
  if (itemId in ITEM_HEAL) {
    if (slot.hp <= 0) {
      return false
    }
    if (itemId === 'full-restore') {
      return slot.hp < slot.maxHp || slot.status !== null
    }
    return slot.hp < slot.maxHp
  }
  if (itemId in ITEM_REVIVE) {
    return slot.hp <= 0
  }
  if (itemId === 'full-heal') {
    return slot.hp > 0 && slot.status !== null
  }
  return target === active && slot.hp > 0
}

function applyStatus(slot: LigaSlot, status: LigaStatus, sleepTurns: number): LigaSlot {
  if (slot.status) {
    return slot
  }
  return { ...slot, status, sleep: status === 'sleep' ? sleepTurns : 0 }
}

function liveSpe(slot: LigaSlot, stages: LigaStages): number {
  const speed = modifiedStat(slot.spe, stages.spe)
  return slot.status === 'paralyze' ? Math.max(1, Math.floor(speed * 0.25)) : speed
}

function isSelfEffect(effect: LigaEffect): boolean {
  return effect === 'heal' || effect === 'atk2' || effect === 'spe2' || effect === 'calm'
}

function blocksPoison(types: LigaType[]): boolean {
  return types.includes('steel') || types.includes('poison')
}

function statusFactor(move: LigaMove, defending: LigaType[]): number {
  if (isSelfEffect(move.effect)) {
    return 1
  }
  const factor = typeMatchup(move.type, defending)
  if (factor === 0) {
    return 0
  }
  if (move.effect === 'poison' && blocksPoison(defending)) {
    return 0
  }
  return factor
}

export function estimatedDamage(attacker: LigaSlot, defender: LigaSlot, moveIndex: number): number {
  const used = attacker.moves[moveIndex]
  if (!used || used.pp <= 0) {
    return 0
  }
  const move = moveOf(used.moveId)
  const attacking = speciesOf(attacker.speciesId)
  const defending = speciesOf(defender.speciesId)
  if (move.power <= 0) {
    if (isSelfEffect(move.effect)) {
      return move.effect === 'heal' ? -1 : 1
    }
    return statusFactor(move, defending.types) === 0 ? 0 : 1
  }
  const factor = typeMatchup(move.type, defending.types)
  if (factor === 0) {
    return 0
  }
  const physical = isPhysical(move.type)
  const atk = physical ? attacker.atk : attacker.spa
  const def = physical ? defender.def : defender.spd
  let base = Math.floor(Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * move.power * atk) / Math.max(1, def)) / 50) + 2
  if (attacking.types.includes(move.type)) {
    base = Math.floor(base * 1.5)
  }
  return Math.max(1, Math.floor(base * factor))
}

export function chooseFoeMove(battle: LigaBattle, difficulty: Difficulty, random: () => number): number {
  const foe = slotOf(battle.foeParty, battle.foeActive)
  const player = slotOf(battle.playerParty, battle.playerActive)
  const usable = foe.moves.map((move, index) => ({ index, pp: move.pp })).filter((entry) => entry.pp > 0)
  if (usable.length === 0) {
    return 0
  }
  if (difficulty === 'easy') {
    return usable[pickIndex(random, usable.length)]?.index ?? 0
  }
  let best = usable[0]?.index ?? 0
  let bestScore = -1
  for (const entry of usable) {
    const score = estimatedDamage(foe, player, entry.index)
    if (score > bestScore) {
      best = entry.index
      bestScore = score
    }
  }
  if (difficulty === 'medium' && random() < 0.25) {
    return usable[pickIndex(random, usable.length)]?.index ?? best
  }
  return best
}

function spendPp(slot: LigaSlot, index: number): LigaSlot {
  const used = slot.moves[index]
  if (!used) {
    return slot
  }
  return {
    ...slot,
    moves: slot.moves.map((move, i) => (i === index ? { ...move, pp: Math.max(0, move.pp - 1) } : move)),
  }
}

function rollDamage(
  attacker: LigaSlot,
  defender: LigaSlot,
  atkStages: LigaStages,
  defStages: LigaStages,
  moveIndex: number,
  random: () => number,
): { damage: number; factor: number; crit: boolean; miss: boolean; log: string[] } {
  const used = attacker.moves[moveIndex]
  const log: string[] = []
  if (!used) {
    return { damage: 0, factor: 1, crit: false, miss: true, log }
  }
  const move = moveOf(used.moveId)
  const attackerName = speciesLabel(attacker)
  log.push(`¡${attackerName} usó ${move.label}!`)
  if (move.accuracy < 100 && random() * 100 >= move.accuracy) {
    log.push(`¡El ataque de ${attackerName} falló!`)
    return { damage: 0, factor: 1, crit: false, miss: true, log }
  }
  const attacking = speciesOf(attacker.speciesId)
  const defending = speciesOf(defender.speciesId)
  if (move.power <= 0) {
    const factor = statusFactor(move, defending.types)
    if (factor === 0) {
      const immune = effectivenessLine(0, speciesLabel(defender))
      if (immune) {
        log.push(immune)
      }
      return { damage: 0, factor: 0, crit: false, miss: false, log }
    }
    return { damage: 0, factor: 1, crit: false, miss: false, log }
  }
  const factor = typeMatchup(move.type, defending.types)
  const immune = effectivenessLine(factor, speciesLabel(defender))
  if (factor === 0) {
    if (immune) {
      log.push(immune)
    }
    return { damage: 0, factor: 0, crit: false, miss: false, log }
  }
  const physical = isPhysical(move.type)
  let atk = modifiedStat(physical ? attacker.atk : attacker.spa, physical ? atkStages.atk : atkStages.spa)
  if (physical && attacker.status === 'burn') {
    atk = Math.max(1, Math.floor(atk * 0.5))
  }
  const def = modifiedStat(physical ? defender.def : defender.spd, physical ? defStages.def : defStages.spd)
  let base = Math.floor(Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * move.power * atk) / Math.max(1, def)) / 50) + 2
  const crit = random() < 1 / 16
  if (crit) {
    base = Math.floor(base * 2)
    log.push('¡Un golpe crítico!')
  }
  if (attacking.types.includes(move.type)) {
    base = Math.floor(base * 1.5)
  }
  base = Math.floor(base * factor)
  base = Math.max(1, Math.floor((base * (85 + Math.floor(random() * 16))) / 100))
  const line = effectivenessLine(factor)
  if (line) {
    log.push(line)
  }
  return { damage: base, factor, crit, miss: false, log }
}

function applySelfEffect(
  attacker: LigaSlot,
  stages: LigaStages,
  moveIndex: number,
): { slot: LigaSlot; stages: LigaStages; log: string[] } {
  const used = attacker.moves[moveIndex]
  const log: string[] = []
  if (!used) {
    return { slot: attacker, stages, log }
  }
  const move = moveOf(used.moveId)
  const name = speciesLabel(attacker)
  if (move.effect === 'heal') {
    const amount = Math.max(1, Math.floor(attacker.maxHp / 2))
    log.push(`${name} recuperó PS.`)
    return { slot: heal(attacker, amount), stages, log }
  }
  if (move.effect === 'atk2') {
    log.push(`¡El ataque de ${name} subió mucho!`)
    return { slot: attacker, stages: withStage(stages, 'atk', 2), log }
  }
  if (move.effect === 'spe2') {
    log.push(`¡La velocidad de ${name} subió mucho!`)
    return { slot: attacker, stages: withStage(stages, 'spe', 2), log }
  }
  if (move.effect === 'calm') {
    log.push(`¡El ataque especial de ${name} subió!`)
    return { slot: attacker, stages: withStage(withStage(stages, 'spa', 1), 'spd', 1), log }
  }
  return { slot: attacker, stages, log }
}

function applyTargetEffect(
  attacker: LigaSlot,
  defender: LigaSlot,
  moveIndex: number,
  random: () => number,
): { slot: LigaSlot; log: string[] } {
  const used = attacker.moves[moveIndex]
  const log: string[] = []
  if (!used) {
    return { slot: defender, log }
  }
  const move = moveOf(used.moveId)
  if (move.power > 0 || move.effect === 'none' || move.effect === 'heal' || move.effect === 'atk2' || move.effect === 'spe2' || move.effect === 'calm') {
    return { slot: defender, log }
  }
  const name = speciesLabel(defender)
  if (defender.status) {
    log.push(`No afectó a ${name}.`)
    return { slot: defender, log }
  }
  if (move.effect === 'poison' && blocksPoison(speciesOf(defender.speciesId).types)) {
    log.push(`No afectó a ${name}.`)
    return { slot: defender, log }
  }
  if (move.effect === 'paralyze') {
    log.push(`¡${name} está paralizado!`)
    return { slot: applyStatus(defender, 'paralyze', 0), log }
  }
  if (move.effect === 'burn') {
    log.push(`¡${name} se quemó!`)
    return { slot: applyStatus(defender, 'burn', 0), log }
  }
  if (move.effect === 'poison') {
    log.push(`¡${name} fue envenenado!`)
    return { slot: applyStatus(defender, 'poison', 0), log }
  }
  log.push(`¡${name} se durmió!`)
  return { slot: applyStatus(defender, 'sleep', 1 + Math.floor(random() * 3)), log }
}

type Side = 'player' | 'foe'

type ExecutedMove = {
  battle: LigaBattle
  factor: number
  note: string | null
}

function idleMove(battle: LigaBattle): ExecutedMove {
  return { battle, factor: 1, note: null }
}

function executeMove(battle: LigaBattle, side: Side, moveIndex: number, random: () => number): ExecutedMove {
  const attackerParty = side === 'player' ? battle.playerParty : battle.foeParty
  const defenderParty = side === 'player' ? battle.foeParty : battle.playerParty
  const attackerIndex = side === 'player' ? battle.playerActive : battle.foeActive
  const defenderIndex = side === 'player' ? battle.foeActive : battle.playerActive
  let attacker = cloneSlot(slotOf(attackerParty, attackerIndex))
  let defender = cloneSlot(slotOf(defenderParty, defenderIndex))
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return idleMove(battle)
  }
  const log = battle.log.slice()
  if (attacker.status === 'sleep') {
    if (attacker.sleep <= 1) {
      attacker = { ...attacker, status: null, sleep: 0 }
      log.push(`¡${speciesLabel(attacker)} se despertó!`)
    } else {
      attacker = { ...attacker, sleep: attacker.sleep - 1 }
      log.push(`${speciesLabel(attacker)} está dormido.`)
      const party = replaceSlot(attackerParty, attackerIndex, attacker)
      const next = side === 'player' ? { ...battle, playerParty: party, log } : { ...battle, foeParty: party, log }
      return idleMove(next)
    }
  }
  if (attacker.status === 'paralyze' && random() < 0.25) {
    log.push(`¡${speciesLabel(attacker)} está paralizado y no se puede mover!`)
    const party = replaceSlot(attackerParty, attackerIndex, attacker)
    const next = side === 'player' ? { ...battle, playerParty: party, log } : { ...battle, foeParty: party, log }
    return idleMove(next)
  }
  attacker = spendPp(attacker, moveIndex)
  const atkStages = side === 'player' ? battle.playerStages : battle.foeStages
  const defStages = side === 'player' ? battle.foeStages : battle.playerStages
  const rolled = rollDamage(attacker, defender, atkStages, defStages, moveIndex, random)
  log.push(...rolled.log)
  if (!rolled.miss && rolled.damage > 0) {
    defender = hurt(defender, rolled.damage)
    if (defender.hp <= 0) {
      log.push(`¡${speciesLabel(defender)} se debilitó!`)
    }
  }
  let nextAtkStages = atkStages
  const used = attacker.moves[moveIndex]
  const damaging = Boolean(used && moveOf(used.moveId).power > 0)
  const note =
    !rolled.miss && (damaging || rolled.factor === 0)
      ? effectivenessLine(rolled.factor, speciesLabel(defender))
      : null
  if (!rolled.miss && rolled.factor !== 0) {
    const self = applySelfEffect(attacker, atkStages, moveIndex)
    attacker = self.slot
    nextAtkStages = self.stages
    log.push(...self.log)
    const target = applyTargetEffect(attacker, defender, moveIndex, random)
    defender = target.slot
    log.push(...target.log)
  }
  if (used && moveOf(used.moveId).name === 'explosion' && rolled.factor !== 0) {
    attacker = { ...attacker, hp: 0 }
    log.push(`¡${speciesLabel(attacker)} se debilitó!`)
  }
  const nextAttackerParty = replaceSlot(attackerParty, attackerIndex, attacker)
  const nextDefenderParty = replaceSlot(defenderParty, defenderIndex, defender)
  const nextBattle =
    side === 'player'
      ? {
          ...battle,
          playerParty: nextAttackerParty,
          foeParty: nextDefenderParty,
          playerStages: nextAtkStages,
          log,
        }
      : {
          ...battle,
          foeParty: nextAttackerParty,
          playerParty: nextDefenderParty,
          foeStages: nextAtkStages,
          log,
        }
  return { battle: nextBattle, factor: rolled.factor, note }
}

function chip(slot: LigaSlot): { slot: LigaSlot; log: string | null } {
  if (slot.hp <= 0 || (slot.status !== 'burn' && slot.status !== 'poison')) {
    return { slot, log: null }
  }
  const amount = Math.max(1, Math.floor(slot.maxHp / 8))
  const next = hurt(slot, amount)
  const why = slot.status === 'burn' ? 'la quemadura' : 'el veneno'
  const line = `${speciesLabel(slot)} sufre por ${why}.`
  if (next.hp <= 0) {
    return { slot: next, log: `${line} ¡${speciesLabel(slot)} se debilitó!` }
  }
  return { slot: next, log: line }
}

function endChip(battle: LigaBattle): LigaBattle {
  const player = chip(slotOf(battle.playerParty, battle.playerActive))
  const foe = chip(slotOf(battle.foeParty, battle.foeActive))
  const log = battle.log.slice()
  if (player.log) {
    log.push(player.log)
  }
  if (foe.log) {
    log.push(foe.log)
  }
  return {
    ...battle,
    playerParty: replaceSlot(battle.playerParty, battle.playerActive, player.slot),
    foeParty: replaceSlot(battle.foeParty, battle.foeActive, foe.slot),
    log,
  }
}

function sendNextFoe(battle: LigaBattle): LigaBattle {
  const index = firstAlive(battle.foeParty)
  if (index < 0) {
    return battle
  }
  const log = battle.log.slice()
  log.push(`¡${speciesLabel(slotOf(battle.foeParty, index))} entra en combate!`)
  return { ...battle, foeActive: index, foeStages: emptyStages(), log }
}

function switchPlayer(battle: LigaBattle, index: number): LigaBattle | null {
  const slot = battle.playerParty[index]
  if (!slot || slot.hp <= 0 || index === battle.playerActive) {
    return null
  }
  const log = battle.log.slice()
  if (!battle.mustSwitch) {
    log.push(`¡${speciesLabel(slotOf(battle.playerParty, battle.playerActive))}, de vuelta!`)
  }
  log.push(`¡Adelante, ${speciesLabel(slot)}!`)
  return {
    ...battle,
    playerActive: index,
    playerStages: emptyStages(),
    mustSwitch: false,
    menu: 'root',
    log,
  }
}

function applyBagItem(battle: LigaBattle, itemId: LigaItemId, target: number): LigaBattle | null {
  if (!itemUsable(itemId, battle.playerParty, target, battle.playerActive)) {
    return null
  }
  let slot = cloneSlot(slotOf(battle.playerParty, target))
  const log = battle.log.slice()
  const name = speciesLabel(slot)
  const healFor = ITEM_HEAL[itemId]
  const reviveFor = ITEM_REVIVE[itemId]
  let stages = battle.playerStages
  if (healFor !== undefined) {
    slot = heal(slot, healFor)
    if (itemId === 'full-restore') {
      slot = { ...slot, status: null, sleep: 0 }
    }
    log.push(`${name} recuperó PS.`)
  } else if (reviveFor !== undefined) {
    slot = { ...slot, hp: Math.max(1, Math.floor(slot.maxHp * reviveFor)), status: null, sleep: 0 }
    log.push(`¡${name} recuperó la salud!`)
  } else if (itemId === 'full-heal') {
    slot = { ...slot, status: null, sleep: 0 }
    log.push(`${name} ya no tiene problemas de estado.`)
  } else if (itemId === 'x-attack') {
    stages = withStage(stages, 'atk', 1)
    log.push(`¡El ataque de ${name} subió!`)
  } else if (itemId === 'x-sp-atk') {
    stages = withStage(stages, 'spa', 1)
    log.push(`¡El ataque especial de ${name} subió!`)
  } else if (itemId === 'x-speed') {
    stages = withStage(stages, 'spe', 1)
    log.push(`¡La velocidad de ${name} subió!`)
  }
  return {
    ...battle,
    playerParty: replaceSlot(battle.playerParty, target, slot),
    playerStages: stages,
    menu: 'root',
    log,
  }
}

function settle(battle: LigaBattle): { battle: LigaBattle; result: LigaTurnResult } {
  if (partyFainted(battle.playerParty)) {
    return { battle: { ...battle, menu: 'root', mustSwitch: false, outcome: 'lose' }, result: 'lose' }
  }
  if (partyFainted(battle.foeParty)) {
    return { battle: { ...battle, menu: 'root', mustSwitch: false, outcome: 'win' }, result: 'win' }
  }
  let next = battle
  if (slotOf(next.foeParty, next.foeActive).hp <= 0) {
    next = sendNextFoe(next)
  }
  if (slotOf(next.playerParty, next.playerActive).hp <= 0) {
    return { battle: { ...next, mustSwitch: true, menu: 'party', outcome: 'ongoing' }, result: 'ongoing' }
  }
  return { battle: { ...next, menu: 'root', mustSwitch: false, outcome: 'ongoing' }, result: 'ongoing' }
}

function foeActs(battle: LigaBattle, difficulty: Difficulty, random: () => number): {
  battle: LigaBattle
  moveId: number | null
  factor: number
  note: string | null
} {
  if (slotOf(battle.foeParty, battle.foeActive).hp <= 0 || slotOf(battle.playerParty, battle.playerActive).hp <= 0) {
    return { battle, moveId: null, factor: 1, note: null }
  }
  const index = chooseFoeMove(battle, difficulty, random)
  const move = slotOf(battle.foeParty, battle.foeActive).moves[index]
  const executed = executeMove(battle, 'foe', index, random)
  return { battle: executed.battle, moveId: move?.moveId ?? null, factor: executed.factor, note: executed.note }
}

function hpOf(battle: LigaBattle, side: 'player' | 'foe'): number {
  return side === 'player'
    ? slotOf(battle.playerParty, battle.playerActive).hp
    : slotOf(battle.foeParty, battle.foeActive).hp
}

function slotSpecies(battle: LigaBattle, side: 'player' | 'foe'): number {
  return side === 'player'
    ? slotOf(battle.playerParty, battle.playerActive).speciesId
    : slotOf(battle.foeParty, battle.foeActive).speciesId
}

function recordFx(
  steps: LigaBattle['lastFx'],
  prev: LigaBattle,
  next: LigaBattle,
  side: 'player' | 'foe',
  moveId: number,
  factor: number,
  note: string | null,
): void {
  const playerHp = hpOf(next, 'player')
  const foeHp = hpOf(next, 'foe')
  steps.push({
    kind: 'move',
    side,
    moveId,
    speciesId: slotSpecies(prev, side),
    playerHp,
    foeHp,
    factor,
    note: note ?? undefined,
  })
  const target = side === 'player' ? 'foe' : 'player'
  if (hpOf(prev, target) > 0 && hpOf(next, target) <= 0) {
    steps.push({ kind: 'faint', side: target, moveId: 0, speciesId: slotSpecies(prev, target), playerHp, foeHp })
  }
}

function withSend(steps: LigaBattle['lastFx'], before: LigaBattle, after: LigaBattle): LigaBattle['lastFx'] {
  if (after.foeActive === before.foeActive) {
    return steps
  }
  const incoming = after.foeParty[after.foeActive]
  if (!incoming) {
    return steps
  }
  return [...steps, { kind: 'send', side: 'foe', moveId: 0, speciesId: incoming.speciesId }]
}

function fxFromFoe(prev: LigaBattle, after: { battle: LigaBattle; moveId: number | null; factor: number; note: string | null }): LigaBattle['lastFx'] {
  if (after.moveId === null) {
    return []
  }
  const steps: LigaBattle['lastFx'] = []
  recordFx(steps, prev, after.battle, 'foe', after.moveId, after.factor, after.note)
  return steps
}

export function playTurn(
  battle: LigaBattle,
  choice: LigaChoice,
  difficulty: Difficulty,
  random: () => number,
): { battle: LigaBattle; itemId: LigaItemId | null; result: LigaTurnResult } {
  if (choice.kind === 'switch') {
    const switched = switchPlayer(battle, choice.index)
    if (!switched) {
      return { battle, itemId: null, result: 'ongoing' }
    }
    if (battle.mustSwitch) {
      return {
        ...settle({
          ...switched,
          lastFx: [{ kind: 'send', side: 'player', moveId: 0, speciesId: slotOf(switched.playerParty, switched.playerActive).speciesId }],
        }),
        itemId: null,
      }
    }
    const after = foeActs(switched, difficulty, random)
    const steps: LigaBattle['lastFx'] = [
      { kind: 'recall', side: 'player', moveId: 0, speciesId: slotOf(battle.playerParty, battle.playerActive).speciesId },
      { kind: 'send', side: 'player', moveId: 0, speciesId: slotOf(switched.playerParty, switched.playerActive).speciesId },
      ...fxFromFoe(switched, after),
    ]
    const settled = settle({ ...after.battle, lastFx: steps })
    return { ...settled, battle: { ...settled.battle, lastFx: withSend(steps, after.battle, settled.battle) }, itemId: null }
  }
  if (choice.kind === 'item') {
    const used = applyBagItem(battle, choice.itemId, choice.target)
    if (!used) {
      return { battle, itemId: null, result: 'ongoing' }
    }
    const after = foeActs(used, difficulty, random)
    const steps = fxFromFoe(used, after)
    const settled = settle({ ...endChip(after.battle), lastFx: steps })
    return { ...settled, battle: { ...settled.battle, lastFx: withSend(steps, after.battle, settled.battle) }, itemId: choice.itemId }
  }
  const player = slotOf(battle.playerParty, battle.playerActive)
  const foe = slotOf(battle.foeParty, battle.foeActive)
  const playerMove = player.moves[choice.index]
  if (!playerMove || playerMove.pp <= 0) {
    return { battle, itemId: null, result: 'ongoing' }
  }
  const foeIndex = chooseFoeMove(battle, difficulty, random)
  const playerPriority = moveOf(playerMove.moveId).priority
  const foeMove = foe.moves[foeIndex]
  const foePriority = foeMove ? moveOf(foeMove.moveId).priority : 0
  const playerSpe = liveSpe(player, battle.playerStages)
  const foeSpe = liveSpe(foe, battle.foeStages)
  const playerFirst =
    playerPriority > foePriority || (playerPriority === foePriority && (playerSpe > foeSpe || (playerSpe === foeSpe && random() < 0.5)))
  let next = battle
  const steps: LigaBattle['lastFx'] = []
  if (playerFirst) {
    const afterPlayer = executeMove(next, 'player', choice.index, random)
    recordFx(steps, next, afterPlayer.battle, 'player', playerMove.moveId, afterPlayer.factor, afterPlayer.note)
    next = afterPlayer.battle
    if (foeMove && slotOf(next.foeParty, next.foeActive).hp > 0 && slotOf(next.playerParty, next.playerActive).hp > 0) {
      const afterFoe = executeMove(next, 'foe', foeIndex, random)
      recordFx(steps, next, afterFoe.battle, 'foe', foeMove.moveId, afterFoe.factor, afterFoe.note)
      next = afterFoe.battle
    }
  } else {
    const afterFoe = executeMove(next, 'foe', foeIndex, random)
    if (foeMove) {
      recordFx(steps, next, afterFoe.battle, 'foe', foeMove.moveId, afterFoe.factor, afterFoe.note)
    }
    next = afterFoe.battle
    if (slotOf(next.playerParty, next.playerActive).hp > 0 && slotOf(next.foeParty, next.foeActive).hp > 0) {
      const afterPlayer = executeMove(next, 'player', choice.index, random)
      recordFx(steps, next, afterPlayer.battle, 'player', playerMove.moveId, afterPlayer.factor, afterPlayer.note)
      next = afterPlayer.battle
    }
  }
  const settled = settle(endChip({ ...next, lastFx: steps }))
  return { ...settled, battle: { ...settled.battle, lastFx: withSend(steps, next, settled.battle) }, itemId: null }
}

export function startBattle(playerParty: LigaSlot[], foeParty: LigaSlot[], trainerId: LigaBattle['trainerId']): LigaBattle {
  return {
    trainerId,
    playerParty: cloneParty(playerParty),
    foeParty: cloneParty(foeParty),
    playerActive: Math.max(0, firstAlive(playerParty)),
    foeActive: Math.max(0, firstAlive(foeParty)),
    menu: 'root',
    mustSwitch: false,
    playerStages: emptyStages(),
    foeStages: emptyStages(),
    log: [`¡${TRAINER_TITLE[trainerId]} ${TRAINER_LABELS[trainerId]} te desafía!`],
    lastFx: [],
    outcome: 'ongoing',
  }
}
