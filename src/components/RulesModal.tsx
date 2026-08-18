type RulesModalProps = {
  open: boolean
  title?: string
  rules: string[]
  onClose: () => void
}

export function RulesModal({ open, title = 'Cómo se juega', rules, onClose }: RulesModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rules-title">{title}</h2>
        <ul>
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <button type="button" className="btn btn-gold" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}
