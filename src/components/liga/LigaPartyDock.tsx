import { spriteUrl } from '../../liga/sprites'
import { speciesLabel } from '../../liga/team'
import type { LigaSlot } from '../../liga/types'
import { LigaHp } from './LigaHp'

type LigaPartyDockProps = {
  party: LigaSlot[]
}

export function LigaPartyDock({ party }: LigaPartyDockProps) {
  return (
    <ul className="liga-dock" aria-label="Equipo">
      {party.map((slot, index) => (
        <li
          key={`${slot.speciesId}-${index}`}
          className={`${index === 0 ? 'is-lead' : ''}${slot.hp <= 0 ? ' is-faint' : ''}`}
        >
          <em>{slot.level}</em>
          <img src={spriteUrl(slot.speciesId)} alt="" />
          <strong>{speciesLabel(slot)}</strong>
          <LigaHp hp={slot.hp} max={slot.maxHp} showNum={false} />
        </li>
      ))}
    </ul>
  )
}
