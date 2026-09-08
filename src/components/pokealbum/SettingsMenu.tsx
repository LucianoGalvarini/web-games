import { playSfx } from '../../shared/sfx'

type SettingsMenuProps = {
  open: boolean
  onClose: () => void
  musicMuted: boolean
  trackName: string
  onToggleMusic: () => void
  onNextTrack: () => void
  justCopied: boolean
  onCopyCode: () => void
  importCodeValue: string
  onSetImportCode: (value: string) => void
  justImported: boolean
  onImportCode: () => void
  importError: string | null
  confirmingReset: boolean
  onRequestReset: () => void
  onConfirmReset: () => void
  onCancelReset: () => void
  onOpenChangelog: () => void
  onBack: () => void
}

export function SettingsMenu({
  open,
  onClose,
  musicMuted,
  trackName,
  onToggleMusic,
  onNextTrack,
  justCopied,
  onCopyCode,
  importCodeValue,
  onSetImportCode,
  justImported,
  onImportCode,
  importError,
  confirmingReset,
  onRequestReset,
  onConfirmReset,
  onCancelReset,
  onOpenChangelog,
  onBack,
}: SettingsMenuProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal pokealbum-menu pokealbum-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="pokealbum-dex-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="menu-title">Menú</h2>

        <section className="pokealbum-menu-section">
          <p className="pokealbum-menu-label">Música</p>
          <div className="pokealbum-music-controls">
            <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={onToggleMusic}>
              {musicMuted ? 'Música: silenciada' : 'Música: sonando'}
            </button>
            <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={onNextTrack}>
              Tono: {trackName}
            </button>
          </div>
        </section>

        <section className="pokealbum-menu-section pokealbum-save">
          <span>Código de respaldo</span>
          <button
            type="button"
            className={`btn${justCopied ? ' btn-gold' : ''}`}
            onMouseEnter={() => playSfx('hover')}
            onClick={onCopyCode}
          >
            {justCopied ? '¡Copiado! ✓' : 'Copiar código'}
          </button>
          <input
            type="text"
            placeholder="Pegá un código para importar"
            value={importCodeValue}
            onChange={(event) => onSetImportCode(event.target.value)}
          />
          <button
            type="button"
            className={`btn${justImported ? ' btn-gold' : ''}`}
            onMouseEnter={() => playSfx('hover')}
            onClick={onImportCode}
          >
            {justImported ? '¡Importado! ✓' : 'Importar'}
          </button>
          {importError && <p className="pokealbum-error">{importError}</p>}
        </section>

        <section className="pokealbum-menu-section actions">
          {confirmingReset ? (
            <>
              <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={onConfirmReset}>
                Sí, borrar todo
              </button>
              <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={onCancelReset}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className="btn" onMouseEnter={() => playSfx('hover')} onClick={onRequestReset}>
              Reiniciar álbum
            </button>
          )}
          <button type="button" className="btn btn-ghost" onMouseEnter={() => playSfx('hover')} onClick={onOpenChangelog}>
            Notas de versión
          </button>
          <button type="button" className="btn btn-ghost" onMouseEnter={() => playSfx('hover')} onClick={onBack}>
            Elegir juego
          </button>
        </section>
      </div>
    </div>
  )
}
