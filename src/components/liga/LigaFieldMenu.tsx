import { useEffect, useRef } from 'react'
import { itemHasTarget, itemUsable } from '../../liga/battle'
import { PRESETS } from '../../liga/constants'
import { revealCursor } from '../../liga/cursor'
import { moveOf, speciesOf } from '../../liga/dex'
import type { LigaFieldScreen } from '../../liga/fieldMenu'
import { ITEM_LABELS, ROOM_LABELS, TYPE_LABELS } from '../../liga/labels'
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
  partyIndex: number | null
  moveSlot: number | null
  moveQuery: string
  catalog: number[]
  party: LigaSlot[]
  bag: { id: LigaItemId; count: number }[]
  itemPick: LigaItemId | null
  difficulty: Difficulty
  difficulties: Difficulty[]
  room: LigaRoomId
  beaten: number
}

const ROOT = ['POKÉMON', 'MOCHILA', 'OPCIÓN', 'REINICIAR JUEGO'] as const
const ACTIONS = ['CAMBIAR', 'ATAQUES'] as const

function cursorClass(on: boolean): string {
  return on ? 'is-cursor' : ''
}

export function LigaFieldMenu({
  screen,
  cursor,
  swapFrom,
  partyIndex,
  moveSlot,
  moveQuery,
  catalog,
  party,
  bag,
  itemPick,
  difficulty,
  difficulties,
  room,
  beaten,
}: LigaFieldMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const slot = partyIndex !== null ? party[partyIndex] : undefined

  useEffect(() => {
    revealCursor(panelRef.current)
  }, [cursor, screen, moveSlot, moveQuery])

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
      {screen === 'party' || screen === 'actions' ? (
        <div className="liga-start-panel">
          <p>
            {itemPick
              ? `¿A quién le das ${ITEM_LABELS[itemPick]}?`
              : swapFrom === null
                ? 'El primero sale al combate. Z abre CAMBIAR o ATAQUES.'
                : 'Elegí con quién cambiar.'}
          </p>
          <ul className="liga-party">
            {party.map((entry, index) => (
              <li
                key={`${entry.speciesId}-${index}`}
                className={`${cursorClass((screen === 'party' && cursor === index) || partyIndex === index)}${
                  swapFrom === index ? ' is-swap' : ''
                }${index === 0 ? ' is-lead' : ''}${
                  itemPick && !itemUsable(itemPick, party, index, -1) ? ' is-off' : ''
                }`}
              >
                <img src={spriteUrl(entry.speciesId)} alt="" />
                <span className="liga-party-info">
                  <strong>
                    <span>
                      {index === 0 ? '▲ ' : ''}
                      {speciesLabel(entry)}
                    </span>
                    <em>Nv.{entry.level}</em>
                  </strong>
                  <LigaTypes types={speciesOf(entry.speciesId).types} />
                  <LigaHp hp={entry.hp} max={entry.maxHp} labeled stacked />
                  <em className="liga-move-read">
                    {entry.moves
                      .map((move) => moveOf(move.moveId).label)
                      .join(' / ')}
                  </em>
                </span>
              </li>
            ))}
          </ul>
          {screen === 'actions' && slot ? (
            <div className="liga-start-box is-actions">
              <p className="liga-start-meta">{speciesLabel(slot)}</p>
              <ul>
                {ACTIONS.map((label, index) => (
                  <li key={label} className={cursorClass(cursor === index)}>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {screen === 'moves' && slot ? (
        <div className="liga-start-panel is-moves">
          <p>
            {moveSlot === null
              ? `¿Cuál ataque de ${speciesLabel(slot)} reemplazás?`
              : `¿Cuál ataque le enseñás?${moveQuery ? `  ${moveQuery}` : ''}`}
          </p>
          <ul className="liga-move-set">
            {slot.moves.map((entry, index) => {
              const move = moveOf(entry.moveId)
              return (
                <li
                  key={`${entry.moveId}-${index}`}
                  className={`${cursorClass(moveSlot === null && cursor === index)}${
                    moveSlot === index ? ' is-on' : ''
                  }`}
                >
                  <strong>{move.label}</strong>
                  <span>{TYPE_LABELS[move.type]}</span>
                  <em>
                    {move.power > 0 ? `Pod. ${move.power}` : 'Estado'} · PP {move.pp}
                  </em>
                </li>
              )
            })}
          </ul>
          {moveSlot !== null ? (
            <ul className="liga-gba-list liga-move-catalog">
              {catalog.length === 0 ? <li>Sin coincidencias</li> : null}
              {catalog.map((id, index) => {
                const move = moveOf(id)
                const equipped = slot.moves.some((entry) => entry.moveId === id)
                return (
                  <li
                    key={id}
                    className={`${cursorClass(cursor === index)}${equipped ? ' is-on' : ''}`}
                  >
                    <span className="liga-item-name">{move.label}</span>
                    <span className="liga-item-qty">{TYPE_LABELS[move.type]}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="liga-move-tip">Escribí para buscar. Z elige. X vuelve.</p>
          )}
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
