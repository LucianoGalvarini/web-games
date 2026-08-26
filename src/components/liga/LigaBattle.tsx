import { itemUsable } from '../../liga/battle'
import { moveOf, speciesOf } from '../../liga/dex'
import type { LigaAnim } from '../../liga/fx'
import { ITEM_LABELS, STATUS_LABELS, TYPE_LABELS } from '../../liga/labels'
import { spriteUrl } from '../../liga/sprites'
import { speciesLabel } from '../../liga/team'
import type { LigaBattle, LigaItemId, LigaSlot } from '../../liga/types'
import { LigaField } from './LigaField'
import { LigaHp } from './LigaHp'
import { LigaItemIcon } from './LigaItemIcon'
import { LigaSpeech } from './LigaSpeech'
import { LigaTypes } from './LigaTypes'

type LigaBattleViewProps = {
  battle: LigaBattle
  bag: { id: LigaItemId; count: number }[]
  itemPick: LigaItemId | null
  cursor: number
  animating: boolean
  anim: LigaAnim | null
  field: { player: LigaSlot; foe: LigaSlot } | null
  turbo: boolean
  hint: string | null
  speechSkip: boolean
  onSpeechReady: (ready: boolean) => void
}

function cursorClass(active: boolean): string {
  return active ? 'is-cursor' : ''
}

function PartyRows({
  party,
  cursor,
  active,
  itemId,
}: {
  party: LigaSlot[]
  cursor: number
  active: number
  itemId: LigaItemId | null
}) {
  return (
    <ul className="liga-party">
      {party.map((slot, index) => {
        const disabled = itemId ? !itemUsable(itemId, party, index, active) : slot.hp <= 0
        return (
          <li key={`${slot.speciesId}-${index}`} className={`${cursorClass(cursor === index)} ${disabled ? 'is-off' : ''}`}>
            <img src={spriteUrl(slot.speciesId)} alt="" />
            <span className="liga-party-info">
              <strong>
                <span>{speciesLabel(slot)}</span>
                {slot.status ? <em>{STATUS_LABELS[slot.status]}</em> : null}
              </strong>
              <LigaTypes types={speciesOf(slot.speciesId).types} />
              <LigaHp hp={slot.hp} max={slot.maxHp} labeled stacked />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function LigaBattleView({
  battle,
  bag,
  itemPick,
  cursor,
  animating,
  anim,
  field,
  turbo,
  hint,
  speechSkip,
  onSpeechReady,
}: LigaBattleViewProps) {
  const player = field?.player ?? battle.playerParty[battle.playerActive]
  const foe = field?.foe ?? battle.foeParty[battle.foeActive]
  const active = battle.playerParty[battle.playerActive]
  if (!player || !foe || !active) {
    return null
  }
  const playerSpecies = speciesOf(player.speciesId)
  const foeSpecies = speciesOf(foe.speciesId)
  const selectedMove = active.moves[cursor]
  const selected = selectedMove ? moveOf(selectedMove.moveId) : null
  const prompt = battle.mustSwitch
    ? '¿Cuál Pokémon entra?'
    : itemPick
      ? `¿A quién le das ${ITEM_LABELS[itemPick]}?`
      : battle.menu === 'fight'
        ? '¿Qué ataque usará?'
        : battle.menu === 'bag'
          ? '¿Qué objeto usás?'
          : battle.menu === 'party'
            ? '¿Cuál Pokémon?'
            : `¿Qué debería hacer ${speciesOf(active.speciesId).label.toUpperCase()}?`
  const picking = !animating && (battle.mustSwitch || battle.menu === 'party' || Boolean(itemPick))
  const bagOpen = !animating && battle.menu === 'bag' && !itemPick
  const line = animating && anim ? anim.line : (hint ?? prompt)

  return (
    <div className={`liga-battle${picking ? ' is-pick' : ''}${bagOpen ? ' is-bag' : ''}`}>
      <LigaField trainerId={battle.trainerId} playerId={player.speciesId} foeId={foe.speciesId} anim={anim} />
      <div className="liga-hud is-foe">
        <p>
          <strong>{foeSpecies.label.toUpperCase()}</strong>
          <span>Nv{foe.level}</span>
        </p>
        <LigaTypes types={foeSpecies.types} />
        <LigaHp hp={foe.hp} max={foe.maxHp} showNum={false} labeled stacked />
      </div>
      <div className={`liga-hud is-player${anim?.kind === 'item' ? ' is-item' : ''}`}>
        <p>
          <strong>{playerSpecies.label.toUpperCase()}</strong>
          <span>Nv{player.level}</span>
        </p>
        <LigaTypes types={playerSpecies.types} />
        <LigaHp hp={player.hp} max={player.maxHp} labeled stacked />
        {player.status ? <em>{STATUS_LABELS[player.status]}</em> : null}
      </div>

      <div
        className={`liga-gba-bar${animating ? ' is-wide' : ''}${
          !animating && battle.menu === 'fight' && !battle.mustSwitch && !itemPick ? ' is-fight' : ''
        }${picking ? ' is-party' : ''}${bagOpen ? ' is-bag' : ''}`}
      >
        <div className="liga-textbox">
          <LigaSpeech text={line} turbo={turbo} reveal={speechSkip} onReady={onSpeechReady} />
        </div>
        {animating ? null : (
          <div className="liga-cmd" key={`${battle.menu}-${itemPick ?? ''}-${battle.mustSwitch ? 'sw' : ''}`}>
            {battle.mustSwitch || battle.menu === 'party' || itemPick ? (
              <PartyRows party={battle.playerParty} cursor={cursor} active={battle.playerActive} itemId={itemPick} />
            ) : battle.menu === 'fight' ? (
              <div className="liga-fight">
                <ul className="liga-gba-grid">
                  {active.moves.map((entry, index) => (
                    <li key={entry.moveId} className={`${cursorClass(cursor === index)} ${entry.pp <= 0 ? 'is-off' : ''}`}>
                      {moveOf(entry.moveId).label}
                    </li>
                  ))}
                </ul>
                <aside className="liga-pp">
                  <p>PP {selectedMove?.pp ?? 0}/{selected?.pp ?? 0}</p>
                  <p>{selected ? TYPE_LABELS[selected.type].toUpperCase() : ''}</p>
                </aside>
              </div>
            ) : battle.menu === 'bag' ? (
              <ul className="liga-gba-list">
                {bag.length === 0 ? <li>Vacía</li> : null}
                {bag.map((item, index) => (
                  <li key={item.id} className={cursorClass(cursor === index)}>
                    <LigaItemIcon id={item.id} />
                    <span className="liga-item-name">{ITEM_LABELS[item.id]}</span>
                    <span className="liga-item-qty">×{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="liga-gba-grid is-cmd">
                <li className={cursorClass(cursor === 0)}>LUCHAR</li>
                <li className={cursorClass(cursor === 1)}>MOCHILA</li>
                <li className={cursorClass(cursor === 2)}>POKÉMON</li>
                <li className={`${cursorClass(cursor === 3)} is-off`}>HUIR</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
