import { playSfx } from '../../shared/sfx'

type TieBugBonusModalProps = {
  open: boolean
  amount: number
  onClose: () => void
}

export function TieBugBonusModal({ open, amount, onClose }: TieBugBonusModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation">
      <div
        className="modal result-modal pokealbum-tie-bonus"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tie-bonus-title"
      >
        <span className="pokealbum-tie-bonus-icon" aria-hidden="true">
          🎁
        </span>
        <h2 id="tie-bonus-title">¡Regalo de disculpas!</h2>
        <p>
          Encontramos un error en las preguntas de "¿quién tiene más/menos?": cuando los dos Pokémon tenían el
          mismo valor en la estadística, el juego igual marcaba una respuesta como incorrecta y podías perder
          monedas sin que hubiera forma de acertar. Ya está arreglado.
        </p>
        <p className="pokealbum-tie-bonus-amount">+{amount} monedas de regalo</p>
        <button
          type="button"
          className="btn btn-gold"
          onMouseEnter={() => playSfx('hover')}
          onClick={() => {
            playSfx('coin')
            onClose()
          }}
        >
          ¡Genial, gracias!
        </button>
      </div>
    </div>
  )
}
