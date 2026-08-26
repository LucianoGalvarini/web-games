import { TYPE_COLOR } from '../../liga/fx'
import { TYPE_LABELS } from '../../liga/labels'
import type { LigaType } from '../../liga/types'

const LIGHT: ReadonlySet<LigaType> = new Set(['fighting', 'poison', 'water', 'ghost', 'dragon', 'dark'])

type LigaTypesProps = {
  types: LigaType[]
}

export function LigaTypes({ types }: LigaTypesProps) {
  return (
    <span className="liga-types">
      {types.map((type) => (
        <em
          key={type}
          className={`liga-type${LIGHT.has(type) ? ' is-light' : ''}`}
          style={{ background: TYPE_COLOR[type] }}
        >
          {TYPE_LABELS[type]}
        </em>
      ))}
    </span>
  )
}
