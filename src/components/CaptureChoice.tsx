import type { Move } from '../game'

type CaptureChoiceProps = {
  options: Move[]
  onChoose: (move: Move) => void
  onCancel: () => void
  canCancel: boolean
}

function kindLabel(kind: Move['kind']): string {
  if (kind === 'approach') {
    return 'Acercamiento'
  }
  if (kind === 'withdrawal') {
    return 'Alejamiento'
  }
  return 'Paika'
}

export function CaptureChoice({ options, onChoose, onCancel, canCancel }: CaptureChoiceProps) {
  return (
    <div className="capture-choice" role="dialog" aria-label="Elegir tipo de captura">
      <p>Este movimiento puede capturar de dos formas. Elegí una:</p>
      <div className="capture-choice-actions">
        {options.map((move) => (
          <button
            key={move.kind}
            type="button"
            className="btn btn-gold"
            onClick={() => onChoose(move)}
          >
            {kindLabel(move.kind)} ({move.captured.length})
          </button>
        ))}
        {canCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  )
}
