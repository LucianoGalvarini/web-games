import { useEffect, useRef } from 'react'
import { PRESETS } from '../../liga/constants'
import { revealCursor } from '../../liga/cursor'
import { itemHasTarget, itemUsable } from '../../liga/battle'
import type { LigaFieldScreen } from '../../liga/fieldMenu'
import { ITEM_LABELS, ROOM_LABELS } from '../../liga/labels'
import { moveOf, speciesOf } from '../../liga/dex'
import { spriteUrl } from '../../liga/sprites'
import { speciesLabel } from '../../liga/team'
import type { LigaItemId, LigaRoomId, LigaSlot } from '../../liga/types'
import type { Difficulty } from '../../shared/types'
import { LigaHp } from './LigaHp'
import { LigaItemIcon } from './LigaItemIcon'
import { LigaTypes } from './LigaTypes'

type LigaFieldMenuProps = {
  screen: LigaFieldScreen
  cursor: number
  swapFrom: number | null
  party: LigaSlot[]
  bag: { id: LigaItemId; count: number }[]
  itemPick: LigaItemId | null
  difficulty: Difficulty
  difficulties: Difficulty[]
  room: LigaRoomId
  beaten: number
}

const ROOT = ['POKÉMON', 'MOCHILA', 'OPCIÓN', 'REINICIAR JUEGO'] as const

function cursorClass(on: boolean): string {
  return on ? 'is-cursor' : ''
}

export function LigaFieldMenu({
  screen,
  cursor,
  swapFrom,
  party,
  bag,
  itemPick,
  difficulty,
  difficulties,
  room,
  beaten,
}: LigaFieldMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    revealCursor(panelRef.current)
  }, [cursor, screen])

  return (
    <div ref={panelRef} className={`liga-field-menu is-${screen}`}>
      {screen === 'root' ? (
        <div className="liga-start-box">
          <p className="liga-start-meta">
            {ROOM_LABELS[room]}
            <span>{beaten}/5</span>
          </p>
          <ul>
            {ROOT.map((label, index) => (
              <li key={label} className={cursorClass(cursor === index)}>
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {screen === 'party' ? (
        <div className="liga-start-panel">
          <p>
            {itemPick
              ? `¿A quién le das ${ITEM_LABELS[itemPick]}?`
              : swapFrom === null
                ? 'El primero sale al combate.'
                : 'Elegí con quién cambiar.'}
          </p>
          <ul className="liga-party">
            {party.map((slot, index) => (
              <li
                key={`${slot.speciesId}-${index}`}
                className={`${cursorClass(cursor === index)}${swapFrom === index ? ' is-swap' : ''}${index === 0 ? ' is-lead' : ''}${
                  itemPick && !itemUsable(itemPick, party, index, -1) ? ' is-off' : ''
                }`}
              >
                <img src={spriteUrl(slot.speciesId)} alt="" />
                <span className="liga-party-info">
                  <strong>
                    <span>
                      {index === 0 ? '▲ ' : ''}
                      {speciesLabel(slot)}
                    </span>
                    <em>Nv.{slot.level}</em>
                  </strong>
                  <LigaTypes types={speciesOf(slot.speciesId).types} />
                  <LigaHp hp={slot.hp} max={slot.maxHp} labeled stacked />
                  <em className="liga-move-read">
                    {slot.moves
                      .map((entry) => moveOf(entry.moveId).label)
                      .join(' / ')}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {screen === 'bag' ? (
        <div className="liga-start-panel">
          <p>MOCHILA</p>
          <ul className="liga-gba-list">
            {bag.length === 0 ? <li>Vacía</li> : null}
            {bag.map((item, index) => (
              <li
                key={item.id}
                className={`${cursorClass(cursor === index)}${itemHasTarget(item.id, party) ? '' : ' is-off'}`}
              >
                <LigaItemIcon id={item.id} />
                <span className="liga-item-name">{ITEM_LABELS[item.id]}</span>
                <span className="liga-item-qty">×{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {screen === 'option' ? (
        <div className="liga-start-box is-option">
          <p className="liga-start-meta">OPCIÓN</p>
          <p className="liga-opt-label">Dificultad</p>
          <ul className="liga-diff-list">
            {difficulties.map((id, index) => (
              <li
                key={id}
                className={`${cursorClass(cursor === index)}${id === difficulty ? ' is-on' : ''}`}
              >
                <span className="liga-diff-mark" />
                {PRESETS[id].label}
              </li>
            ))}
          </ul>
          <ul className="liga-opt-actions">
            <li className={cursorClass(cursor === difficulties.length)}>AYUDA</li>
            <li className={cursorClass(cursor === difficulties.length + 1)}>ELEGIR JUEGO</li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
