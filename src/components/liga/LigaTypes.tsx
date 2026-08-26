import { TYPE_COLOR, TYPE_INK } from '../../liga/fx'
import { TYPE_LABELS } from '../../liga/labels'
import type { LigaType } from '../../liga/types'

type LigaTypesProps = {
  types: LigaType[]
}

export function LigaTypes({ types }: LigaTypesProps) {
  return (
    <span className="liga-types">
      {types.map((type) => (
        <em
          key={type}
          className="liga-type"
          style={{ background: TYPE_COLOR[type], color: TYPE_INK[type] }}
        >
          {TYPE_LABELS[type]}
        </em>
      ))}
    </span>
  )
}
