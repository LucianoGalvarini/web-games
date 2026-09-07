import { CHANGELOG, CURRENT_VERSION } from '../../pokealbum'

type ChangelogModalProps = {
  open: boolean
  onClose: () => void
}

export function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal result-modal pokealbum-changelog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="pokealbum-dex-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="changelog-title">Notas de versión</h2>
        <p className="pokealbum-changelog-current">Versión actual: {CURRENT_VERSION}</p>
        <div className="pokealbum-changelog-list">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="pokealbum-changelog-entry">
              <p className="pokealbum-changelog-version">
                v{entry.version}
                {entry.date ? ` · ${entry.date}` : ''}
              </p>
              <ul>
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
