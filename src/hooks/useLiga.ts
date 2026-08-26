import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyAction, createGame, listedBag } from '../liga/apply'
import { itemUsable } from '../liga/battle'
import { DIFFICULTIES, KEY_DIR, PRESETS, WALK_MS } from '../liga/constants'
import { isAKey, isBKey, isTurboKey, moveCursor } from '../liga/cursor'
import { moveOf, speciesOf } from '../liga/dex'
import { sfxForType, type LigaAnim } from '../liga/fx'
import { canStep } from '../liga/map'
import { cloneSlot } from '../liga/team'
import type { LigaAction, LigaDir, LigaItemId, LigaSlot, LigaState } from '../liga/types'
import { playSfx } from '../shared/sfx'
import type { Difficulty } from '../shared/types'
import type { Point } from '../shared/point'

type WalkAnim = {
  from: Point
  to: Point
  dir: LigaDir
}

const FX_MS = 1520
const FX_SEND_MS = 980
const FX_FAINT_MS = 1120
const FX_IMMUNE_MS = 1080
const FX_NOTE_MS = 900
const FX_GAP = 260
const FX_FAINT_GAP = 520
const FX_HIT_AT = 0.52
const TURBO = 4

function cue(prev: LigaState, next: LigaState, action: LigaAction): void {
  if (action.kind === 'step' && (prev.player.x !== next.player.x || prev.player.y !== next.player.y)) {
    playSfx('slide')
    return
  }
  if (action.kind === 'interact' && next.phase === 'dialog') {
    playSfx('click')
    return
  }
  if (action.kind === 'interact' && next.phase === 'battle') {
    playSfx('shout')
  }
}

export function useLiga() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [state, setState] = useState<LigaState>(() => createGame('medium'))
  const [walk, setWalk] = useState<WalkAnim | null>(null)
  const [walkT, setWalkT] = useState(1)
  const [itemPick, setItemPick] = useState<LigaItemId | null>(null)
  const [cursor, setCursor] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [anim, setAnim] = useState<LigaAnim | null>(null)
  const [turbo, setTurbo] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [speechSkip, setSpeechSkip] = useState(false)
  const [field, setField] = useState<{ player: LigaSlot; foe: LigaSlot } | null>(null)

  const stateRef = useRef(state)
  const walkRef = useRef(walk)
  const difficultyRef = useRef(difficulty)
  const itemPickRef = useRef(itemPick)
  const cursorRef = useRef(cursor)
  const animatingRef = useRef(animating)
  const turboRef = useRef(false)
  const speechReadyRef = useRef(true)
  const bagRef = useRef(listedBag(state.bag))
  const fieldRef = useRef(field)
  stateRef.current = state
  walkRef.current = walk
  difficultyRef.current = difficulty
  itemPickRef.current = itemPick
  cursorRef.current = cursor
  animatingRef.current = animating
  turboRef.current = turbo
  fieldRef.current = field

  const bag = useMemo(() => listedBag(state.bag), [state.bag])
  bagRef.current = bag

  const play = useCallback((action: LigaAction) => {
    if (walkRef.current && action.kind === 'step') {
      return
    }
    const current = stateRef.current
    const next = applyAction(current, action)
    if (action.kind === 'step' && (current.player.x !== next.player.x || current.player.y !== next.player.y)) {
      setWalk({ from: current.player, to: next.player, dir: action.dir })
      setWalkT(0)
    }
    cue(current, next, action)
    setState(next)
    if (next.battle && !current.battle) {
      const spawn = next.battle
      setField({
        player: cloneSlot(spawn.playerParty[spawn.playerActive]!),
        foe: cloneSlot(spawn.foeParty[spawn.foeActive]!),
      })
    }
    if (current.battle && (action.kind === 'move' || action.kind === 'item' || action.kind === 'switch')) {
      setField({
        player: cloneSlot(current.battle.playerParty[current.battle.playerActive]!),
        foe: cloneSlot(current.battle.foeParty[current.battle.foeActive]!),
      })
    }
    if (!next.battle) {
      setField(null)
    }
    if (action.kind === 'open' || action.kind === 'move' || action.kind === 'switch' || action.kind === 'item') {
      setCursor(0)
      setHint(null)
    }
    if (action.kind !== 'open' && action.kind !== 'resolve') {
      if (action.kind !== 'item') {
        setItemPick(null)
      }
    }
  }, [])

  const resetGame = useCallback((nextDifficulty = difficultyRef.current, seed = Date.now()) => {
    setDifficulty(nextDifficulty)
    setState(createGame(nextDifficulty, seed))
    setWalk(null)
    setWalkT(1)
    setItemPick(null)
    setCursor(0)
    setAnimating(false)
    setAnim(null)
    setHint(null)
    setSpeechSkip(false)
    setTurbo(false)
    setField(null)
  }, [])

  const changeDifficulty = useCallback(
    (next: Difficulty) => {
      resetGame(next)
    },
    [resetGame],
  )

  useEffect(() => {
    if (!walk) {
      return
    }
    let raf = 0
    let elapsed = 0
    let last = performance.now()
    const loop = (now: number) => {
      elapsed += (now - last) * (turboRef.current ? TURBO : 1)
      last = now
      const t = Math.min(1, elapsed / WALK_MS)
      setWalkT(t)
      if (t >= 1) {
        setWalk(null)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [walk])

  useEffect(() => {
    setSpeechSkip(false)
  }, [state.dialog, hint, anim?.line])

  useEffect(() => {
    if (state.phase !== 'battle' || animating || !state.battle) {
      return
    }
    const slot = state.battle.playerParty[state.battle.playerActive]
    if (!slot || slot.maxHp <= 0 || slot.hp / slot.maxHp > 0.2 || slot.hp <= 0) {
      return
    }
    const id = window.setInterval(() => playSfx('ligaLowHp'), turbo ? 280 : 740)
    return () => window.clearInterval(id)
  }, [animating, state.battle, state.phase, turbo])

  useEffect(() => {
    if (state.fxQueue.length === 0) {
      return
    }
    const steps = state.fxQueue
    let cancelled = false
    const rafs = new Set<number>()
    const arm = (fn: FrameRequestCallback) => {
      const id = requestAnimationFrame((now) => {
        rafs.delete(id)
        fn(now)
      })
      rafs.add(id)
    }
    setAnimating(true)
    const durationOf = (step: (typeof steps)[number]) => {
      if (step.kind === 'move' && step.factor === 0) {
        return FX_IMMUNE_MS
      }
      if (step.kind === 'move') {
        return FX_MS
      }
      if (step.kind === 'faint') {
        return FX_FAINT_MS
      }
      return FX_SEND_MS
    }
    const gapOf = (kind: (typeof steps)[number]['kind']) => (kind === 'faint' ? FX_FAINT_GAP : FX_GAP)
    const waitMs = (hold: number, then: () => void) => {
      let elapsed = 0
      let last = performance.now()
      const loop = (now: number) => {
        if (cancelled) {
          return
        }
        elapsed += (now - last) * (turboRef.current ? TURBO : 1)
        last = now
        if (elapsed >= hold) {
          then()
          return
        }
        arm(loop)
      }
      arm(loop)
    }
    const waitThen = (kind: (typeof steps)[number]['kind'], then: () => void) => waitMs(gapOf(kind), then)
    const drainTo = (playerHp: number, foeHp: number, then: () => void) => {
      const current = fieldRef.current
      if (!current || (current.player.hp === playerHp && current.foe.hp === foeHp)) {
        then()
        return
      }
      const fromP = current.player.hp
      const fromF = current.foe.hp
      const dist = Math.max(
        Math.abs(playerHp - fromP) / Math.max(1, current.player.maxHp),
        Math.abs(foeHp - fromF) / Math.max(1, current.foe.maxHp),
      )
      const duration = Math.min(920, Math.max(420, dist * 1600))
      let elapsed = 0
      let last = performance.now()
      const loop = (now: number) => {
        if (cancelled) {
          return
        }
        elapsed += (now - last) * (turboRef.current ? TURBO : 1)
        last = now
        const t = Math.min(1, elapsed / duration)
        const eased = 1 - (1 - t) * (1 - t)
        setField((slot) =>
          slot
            ? {
                player: { ...slot.player, hp: Math.round(fromP + (playerHp - fromP) * eased) },
                foe: { ...slot.foe, hp: Math.round(fromF + (foeHp - fromF) * eased) },
              }
            : slot,
        )
        if (t >= 1) {
          then()
          return
        }
        arm(loop)
      }
      arm(loop)
    }
    const finish = () => {
      if (cancelled) {
        return
      }
      const battle = stateRef.current.battle
      const shown = fieldRef.current
      const player = battle?.playerParty[battle.playerActive]
      const foe = battle?.foeParty[battle.foeActive]
      if (
        battle &&
        shown &&
        player &&
        foe &&
        player.speciesId === shown.player.speciesId &&
        foe.speciesId === shown.foe.speciesId &&
        (player.hp !== shown.player.hp || foe.hp !== shown.foe.hp)
      ) {
        drainTo(player.hp, foe.hp, () => {
          if (!cancelled) {
            setAnim(null)
            setAnimating(false)
            play({ kind: 'resolve' })
          }
        })
        return
      }
      if (player && foe) {
        setField({ player: cloneSlot(player), foe: cloneSlot(foe) })
      }
      setAnim(null)
      setAnimating(false)
      play({ kind: 'resolve' })
    }
    const run = (index: number) => {
      const step = steps[index]
      if (!step || cancelled) {
        finish()
        return
      }
      const name = speciesOf(step.speciesId).label
      let line = `¡${name} entra en combate!`
      let type = speciesOf(step.speciesId).types[0] ?? 'normal'
      const immune = step.kind === 'move' && step.factor === 0
      if (step.kind === 'move') {
        const move = moveOf(step.moveId)
        type = move.type
        line = `¡${name} usó ${move.label}!`
        if (immune) {
          playSfx('ligaBeep')
        } else {
          playSfx('ligaWhoosh')
          playSfx(move.effect === 'heal' ? 'ligaHeal' : sfxForType(move.type))
        }
      } else if (step.kind === 'faint') {
        line = `¡${name} se debilitó!`
        playSfx('ligaFaint')
      } else if (step.kind === 'recall') {
        line = `¡${name}, de vuelta!`
        playSfx('ligaWhoosh')
      } else {
        playSfx('ligaBall')
        playSfx('shout')
        const battle = stateRef.current.battle
        const incoming =
          step.side === 'player' ? battle?.playerParty[battle.playerActive] : battle?.foeParty[battle.foeActive]
        if (incoming) {
          setField((currentField) =>
            currentField ? { ...currentField, [step.side]: cloneSlot(incoming) } : currentField,
          )
        }
      }
      let elapsed = 0
      let last = performance.now()
      let hitStarted = false
      let animDone = false
      let drainDone = step.kind !== 'move' || immune
      let advanced = false
      const limit = durationOf(step)
      const paint = (t: number, text: string) => {
        setAnim({ side: step.side, type, t, kind: step.kind, line: text, factor: step.factor })
      }
      const maybeNext = () => {
        if (!animDone || !drainDone || cancelled || advanced) {
          return
        }
        advanced = true
        const go = () => waitThen(step.kind, () => run(index + 1))
        if (step.kind === 'move' && step.note && !immune) {
          paint(1, step.note)
          waitMs(FX_NOTE_MS, go)
          return
        }
        go()
      }
      const loop = (now: number) => {
        if (cancelled) {
          return
        }
        elapsed += (now - last) * (turboRef.current ? TURBO : 1)
        last = now
        const t = Math.min(1, elapsed / limit)
        const shown = immune && step.note && t >= 0.42 ? step.note : line
        paint(t, shown)
        if (step.kind === 'move' && !immune && !hitStarted) {
          const move = moveOf(step.moveId)
          const hitAt = move.power > 0 ? FX_HIT_AT : 0.36
          if (t >= hitAt) {
            hitStarted = true
            if (move.power > 0) {
              playSfx('ligaHit')
            }
            if (step.playerHp !== undefined && step.foeHp !== undefined) {
              drainTo(step.playerHp, step.foeHp, () => {
                drainDone = true
                maybeNext()
              })
            } else {
              drainDone = true
            }
          }
        }
        if (t >= 1) {
          animDone = true
          maybeNext()
          return
        }
        arm(loop)
      }
      arm(loop)
    }
    run(0)
    return () => {
      cancelled = true
      rafs.forEach((id) => cancelAnimationFrame(id))
      setAnim(null)
      setAnimating(false)
    }
  }, [play, state.fxQueue])

  useEffect(() => {
    const held: Partial<Record<LigaDir, boolean>> = {}

    const confirmBattle = () => {
      const current = stateRef.current
      const battle = current.battle
      if (!battle || animatingRef.current) {
        return
      }
      const index = cursorRef.current
      const pick = itemPickRef.current
      playSfx('ligaBeep')
      if (battle.mustSwitch || battle.menu === 'party' || pick) {
        const slot = battle.playerParty[index]
        if (!slot) {
          return
        }
        if (pick) {
          if (!itemUsable(pick, battle.playerParty, index, battle.playerActive)) {
            playSfx('error')
            return
          }
          play({ kind: 'item', itemId: pick, target: index })
          setItemPick(null)
          return
        }
        if (slot.hp <= 0 || index === battle.playerActive) {
          playSfx('error')
          return
        }
        play({ kind: 'switch', index })
        return
      }
      if (battle.menu === 'fight') {
        const used = battle.playerParty[battle.playerActive]?.moves[index]
        if (!used || used.pp <= 0) {
          playSfx('error')
          return
        }
        play({ kind: 'move', index })
        return
      }
      if (battle.menu === 'bag') {
        const item = bagRef.current[index]
        if (!item) {
          playSfx('error')
          return
        }
        if (item.id === 'x-attack' || item.id === 'x-sp-atk' || item.id === 'x-speed') {
          play({ kind: 'item', itemId: item.id, target: battle.playerActive })
          return
        }
        setItemPick(item.id)
        setCursor(0)
        return
      }
      if (index === 0) {
        play({ kind: 'open', menu: 'fight' })
        return
      }
      if (index === 1) {
        play({ kind: 'open', menu: 'bag' })
        return
      }
      if (index === 2) {
        play({ kind: 'open', menu: 'party' })
        return
      }
      playSfx('error')
      setHint('¡No se puede huir de la Liga!')
    }

    const cancelBattle = () => {
      const battle = stateRef.current.battle
      if (!battle || battle.mustSwitch || animatingRef.current) {
        return
      }
      playSfx('click')
      if (itemPickRef.current) {
        setItemPick(null)
        setCursor(0)
        return
      }
      if (battle.menu !== 'root') {
        play({ kind: 'open', menu: 'root' })
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTurboKey(event.key)) {
        event.preventDefault()
        turboRef.current = true
        setTurbo(true)
        return
      }
      if (event.repeat) {
        return
      }
      const current = stateRef.current
      if (isAKey(event.key)) {
        event.preventDefault()
        if ((current.phase === 'dialog' || current.phase === 'battle') && !speechReadyRef.current) {
          setSpeechSkip(true)
          return
        }
        if (current.phase === 'walk' || current.phase === 'dialog') {
          play({ kind: 'interact' })
          setSpeechSkip(false)
          return
        }
        if (current.phase === 'battle') {
          confirmBattle()
        }
        return
      }
      if (isBKey(event.key)) {
        event.preventDefault()
        if (current.phase === 'dialog') {
          if (!speechReadyRef.current) {
            setSpeechSkip(true)
            return
          }
          play({ kind: 'interact' })
          setSpeechSkip(false)
          return
        }
        if (current.phase === 'battle') {
          cancelBattle()
        }
        return
      }
      const dir = KEY_DIR[event.key]
      if (dir === undefined) {
        return
      }
      event.preventDefault()
      if (current.phase === 'walk') {
        held[dir] = true
        play({ kind: 'step', dir })
        return
      }
      if (current.phase !== 'battle' || !current.battle || animatingRef.current) {
        return
      }
      playSfx('ligaBeep')
      const battle = current.battle
      const pick = itemPickRef.current
      let count = 4
      let cols = 2
      if (battle.mustSwitch || battle.menu === 'party' || pick) {
        count = battle.playerParty.length
        cols = 2
      } else if (battle.menu === 'fight') {
        count = battle.playerParty[battle.playerActive]?.moves.length ?? 0
        cols = 2
      } else if (battle.menu === 'bag') {
        count = Math.max(1, bagRef.current.length)
        cols = 1
      }
      setCursor((value) => moveCursor(value, count, dir, cols))
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTurboKey(event.key)) {
        turboRef.current = false
        setTurbo(false)
      }
      const dir = KEY_DIR[event.key]
      if (dir) {
        held[dir] = false
      }
    }

    let raf = 0
    const loop = () => {
      const current = stateRef.current
      if (!walkRef.current && current.phase === 'walk') {
        const dir = (['up', 'down', 'left', 'right'] as const).find((key) => held[key] && canStep(current, key))
        if (dir) {
          play({ kind: 'step', dir })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [play])

  const statusText = useMemo(() => {
    if (state.phase === 'won') {
      return 'Ganaste la Liga. El Hall de la Fama registra tu equipo.'
    }
    if (state.phase === 'lost') {
      return 'El equipo se debilitó. Nueva liga, otro equipo.'
    }
    if (state.phase === 'battle') {
      return 'Flechas mueven el cursor. Z elige. X vuelve. Espacio acelera.'
    }
    if (state.phase === 'dialog') {
      return 'Z sigue. Espacio acelera el texto.'
    }
    return 'Flechas o WASD caminan. Z habla. Espacio acelera. F pantalla completa.'
  }, [state.phase])

  return {
    state,
    difficulty,
    difficulties: DIFFICULTIES,
    preset: PRESETS[difficulty],
    walk,
    walkT,
    bag,
    itemPick,
    cursor,
    animating,
    anim,
    field,
    turbo,
    hint,
    speechSkip,
    setSpeechReady: (ready: boolean) => {
      speechReadyRef.current = ready
    },
    statusText,
    play,
    resetGame,
    changeDifficulty,
  }
}
