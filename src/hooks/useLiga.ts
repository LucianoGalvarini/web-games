import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyAction, createGame, listedBag } from '../liga/apply'
import { itemHasTarget, itemUsable } from '../liga/battle'
import { DIFFICULTIES, KEY_DIR, PRESETS, WALK_MS } from '../liga/constants'
import { isAKey, isBKey, isStartKey, isTurboKey, moveCursor } from '../liga/cursor'
import { moveOf, speciesOf } from '../liga/dex'
import { sfxForType, type LigaAnim } from '../liga/fx'
import { FIELD_PARTY_COLS, FIELD_ROOT_COUNT, fieldOptionCount, rootCursorOf, type LigaFieldScreen } from '../liga/fieldMenu'
import { ITEM_LABELS } from '../liga/labels'
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
const FX_ITEM_MS = 1400
const FX_NOTE_MS = 900
const FX_GAP = 260
const FX_ITEM_GAP = 420
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

export function useLiga(handlers: { onBack?: () => void; onHelp?: () => void } = {}) {
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
  const [fieldMenu, setFieldMenu] = useState<LigaFieldScreen | null>(null)
  const [swapFrom, setSwapFrom] = useState<number | null>(null)
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
  const heldRef = useRef<Partial<Record<LigaDir, boolean>>>({})
  const holdAckRef = useRef(false)
  const fieldMenuRef = useRef(fieldMenu)
  const swapFromRef = useRef(swapFrom)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  stateRef.current = state
  walkRef.current = walk
  difficultyRef.current = difficulty
  itemPickRef.current = itemPick
  cursorRef.current = cursor
  animatingRef.current = animating
  turboRef.current = turbo
  fieldRef.current = field
  fieldMenuRef.current = fieldMenu
  swapFromRef.current = swapFrom

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
    if (action.kind === 'open') {
      if (action.menu === 'fight' && next.battle) {
        const moves = next.battle.playerParty[next.battle.playerActive]?.moves.length ?? 1
        setCursor(Math.max(0, Math.min(next.battle.lastMoveIndex, moves - 1)))
      } else {
        setCursor(0)
      }
      setHint(null)
    } else if (action.kind === 'move' || action.kind === 'switch' || action.kind === 'item') {
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
    setFieldMenu(null)
    setSwapFrom(null)
    heldRef.current = {}
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
    holdAckRef.current = false
    const durationOf = (step: (typeof steps)[number]) => {
      if (step.kind === 'move' && (step.factor === 0 || step.miss || step.idle)) {
        return FX_IMMUNE_MS
      }
      if (step.kind === 'move') {
        return FX_MS
      }
      if (step.kind === 'item') {
        return FX_ITEM_MS
      }
      if (step.kind === 'faint') {
        return FX_FAINT_MS
      }
      return FX_SEND_MS
    }
    const gapOf = (kind: (typeof steps)[number]['kind']) => {
      if (kind === 'faint') {
        return FX_FAINT_GAP
      }
      if (kind === 'item') {
        return FX_ITEM_GAP
      }
      return FX_GAP
    }
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
    const holdForA = (then: () => void) => {
      holdAckRef.current = false
      const tick = () => {
        if (cancelled) {
          return
        }
        if (speechReadyRef.current && holdAckRef.current) {
          then()
          return
        }
        arm(tick)
      }
      arm(tick)
    }
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
      const skipped = Boolean(step.miss || step.idle)
      const needsDrain = ((step.kind === 'move' && !immune && !skipped) || step.kind === 'item')
      if (step.kind === 'move') {
        const move = moveOf(step.moveId)
        type = move.type
        line = step.idle && step.note ? step.note : `¡${name} usó ${move.label}!`
        if (immune || skipped) {
          playSfx('ligaBeep')
        } else {
          playSfx('ligaWhoosh')
          playSfx(move.effect === 'heal' ? 'ligaHeal' : sfxForType(move.type))
        }
      } else if (step.kind === 'item') {
        line = step.itemId ? `¡Usaste ${ITEM_LABELS[step.itemId]}!` : `${name} usó un objeto.`
        playSfx('ligaWhoosh')
        playSfx('ligaHeal')
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
          const shown = cloneSlot(incoming)
          if (step.side === 'player' && step.playerHp !== undefined) {
            shown.hp = step.playerHp
          }
          if (step.side === 'foe' && step.foeHp !== undefined) {
            shown.hp = step.foeHp
          }
          setField((currentField) =>
            currentField ? { ...currentField, [step.side]: shown } : currentField,
          )
        }
      }
      let elapsed = 0
      let last = performance.now()
      let hitStarted = false
      let animDone = false
      let drainDone = !needsDrain
      let advanced = false
      const limit = durationOf(step)
      const paint = (t: number, text: string) => {
        setAnim({
          side: step.side,
          type,
          t,
          kind: step.kind,
          line: text,
          factor: step.factor,
          itemId: step.itemId,
        })
      }
      const maybeNext = () => {
        if (!animDone || !drainDone || cancelled || advanced) {
          return
        }
        advanced = true
        const go = () => waitThen(step.kind, () => run(index + 1))
        const showHold = (text: string, then: () => void) => {
          paint(1, text)
          holdForA(then)
        }
        if (step.miss && step.note) {
          showHold(step.note, go)
          return
        }
        if (step.idle && step.note) {
          showHold(step.note, go)
          return
        }
        const afterEffect = () => {
          if (step.statusNote) {
            showHold(step.statusNote, go)
            return
          }
          go()
        }
        if ((step.kind === 'move' || step.kind === 'item') && step.note && !immune) {
          paint(1, step.note)
          waitMs(FX_NOTE_MS, afterEffect)
          return
        }
        afterEffect()
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
        if (needsDrain && !hitStarted) {
          const hitAt =
            step.kind === 'item' || (step.kind === 'move' && moveOf(step.moveId).power <= 0) ? 0.32 : FX_HIT_AT
          if (t >= hitAt) {
            hitStarted = true
            if (step.kind === 'move' && moveOf(step.moveId).power > 0) {
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

  const pressDown = useCallback(
    (key: string) => {
      if (isTurboKey(key)) {
        const next = !turboRef.current
        turboRef.current = next
        setTurbo(next)
        return
      }
      const current = stateRef.current
      const closeField = () => {
        setFieldMenu(null)
        setSwapFrom(null)
        setItemPick(null)
        setCursor(0)
      }
      if (isStartKey(key)) {
        if (current.phase === 'battle' || animatingRef.current) {
          return
        }
        if (fieldMenuRef.current) {
          closeField()
          playSfx('click')
          return
        }
        if (current.phase !== 'walk') {
          return
        }
        setFieldMenu('root')
        setSwapFrom(null)
        setCursor(0)
        playSfx('ligaBeep')
        return
      }
      if (fieldMenuRef.current) {
        const screen = fieldMenuRef.current
        if (isAKey(key)) {
          playSfx('ligaBeep')
          if (screen === 'root') {
            if (cursorRef.current === 0) {
              setFieldMenu('party')
              setCursor(0)
              return
            }
            if (cursorRef.current === 1) {
              setFieldMenu('bag')
              setCursor(0)
              return
            }
            if (cursorRef.current === 2) {
              setFieldMenu('option')
              setCursor(0)
              return
            }
            closeField()
            resetGame()
            return
          }
          if (screen === 'party') {
            const index = cursorRef.current
            if (!current.party[index]) {
              return
            }
            const pick = itemPickRef.current
            if (pick) {
              if (!itemUsable(pick, current.party, index, -1)) {
                playSfx('error')
                return
              }
              play({ kind: 'item', itemId: pick, target: index })
              playSfx('ligaHeal')
              setItemPick(null)
              setFieldMenu('bag')
              setCursor(0)
              return
            }
            if (swapFromRef.current === null) {
              setSwapFrom(index)
              return
            }
            if (swapFromRef.current === index) {
              setSwapFrom(null)
              return
            }
            play({ kind: 'reorder', from: swapFromRef.current, to: index })
            setSwapFrom(null)
            return
          }
          if (screen === 'bag') {
            const item = bagRef.current[cursorRef.current]
            if (!item || !itemHasTarget(item.id, current.party)) {
              playSfx('error')
              return
            }
            setItemPick(item.id)
            setFieldMenu('party')
            setSwapFrom(null)
            setCursor(0)
            return
          }
          if (screen === 'option') {
            const choice = cursorRef.current
            if (choice < DIFFICULTIES.length) {
              const next = DIFFICULTIES[choice]
              if (next) {
                closeField()
                changeDifficulty(next)
              }
              return
            }
            if (choice === DIFFICULTIES.length) {
              handlersRef.current.onHelp?.()
              return
            }
            closeField()
            handlersRef.current.onBack?.()
          }
          return
        }
        if (isBKey(key)) {
          playSfx('click')
          if (screen === 'party' && itemPickRef.current) {
            setItemPick(null)
            setFieldMenu('bag')
            setSwapFrom(null)
            setCursor(0)
            return
          }
          if (screen === 'party' && swapFromRef.current !== null) {
            setSwapFrom(null)
            return
          }
          if (screen === 'root') {
            closeField()
            return
          }
          setFieldMenu('root')
          setSwapFrom(null)
          setItemPick(null)
          setCursor(rootCursorOf(screen))
          return
        }
        const dir = KEY_DIR[key]
        if (!dir) {
          return
        }
        playSfx('ligaBeep')
        let count = FIELD_ROOT_COUNT
        let cols = 1
        if (screen === 'party') {
          count = current.party.length
          cols = FIELD_PARTY_COLS
        } else if (screen === 'bag') {
          count = Math.max(1, bagRef.current.length)
        } else if (screen === 'option') {
          count = fieldOptionCount(DIFFICULTIES)
        }
        setCursor((value) => moveCursor(value, count, dir, cols))
        return
      }
      if (isAKey(key)) {
        if ((current.phase === 'dialog' || current.phase === 'battle') && !speechReadyRef.current) {
          setSpeechSkip(true)
          return
        }
        if (current.phase === 'battle' && animatingRef.current) {
          holdAckRef.current = true
          return
        }
        if (current.phase === 'walk' || current.phase === 'dialog') {
          play({ kind: 'interact' })
          setSpeechSkip(false)
          return
        }
        if (current.phase === 'battle') {
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
        return
      }
      if (isBKey(key)) {
        if (current.phase === 'dialog') {
          if (!speechReadyRef.current) {
            setSpeechSkip(true)
            return
          }
          play({ kind: 'interact' })
          setSpeechSkip(false)
          return
        }
        const battle = current.battle
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
        return
      }
      const dir = KEY_DIR[key]
      if (dir === undefined) {
        return
      }
      if (current.phase === 'walk') {
        heldRef.current[dir] = true
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
    },
    [changeDifficulty, play, resetGame],
  )

  const pressUp = useCallback((key: string) => {
    const dir = KEY_DIR[key]
    if (dir) {
      heldRef.current[dir] = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTurboKey(event.key) || isAKey(event.key) || isBKey(event.key) || isStartKey(event.key) || KEY_DIR[event.key]) {
        event.preventDefault()
      }
      if (event.repeat) {
        return
      }
      pressDown(event.key)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      pressUp(event.key)
    }
    let raf = 0
    const loop = () => {
      const current = stateRef.current
      if (!walkRef.current && current.phase === 'walk' && !fieldMenuRef.current) {
        const dir = (['up', 'down', 'left', 'right'] as const).find(
          (key) => heldRef.current[key] && canStep(current, key),
        )
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
  }, [play, pressDown, pressUp])

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
    return 'Enter abre el menú. Flechas caminan. Z habla. Espacio acelera. F pantalla completa.'
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
    fieldMenu,
    swapFrom,
    play,
    pressDown,
    pressUp,
    resetGame,
    changeDifficulty,
  }
}
