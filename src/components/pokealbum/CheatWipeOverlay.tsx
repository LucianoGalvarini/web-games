import { useState } from 'react'
import { randomCheatTaunt } from '../../shared/anticheat'

type CheatWipeOverlayProps = {
  onDismiss: () => void
}

// Shown once, right after wipeAccountForCheating() actually erased the account — unlike the
// DevTools-open suspicion lock, this only fires on confirmed evidence (a save or counter whose
// signature doesn't match its own contents), so it's framed as a done deal, not a warning.
export function CheatWipeOverlay({ onDismiss }: CheatWipeOverlayProps) {
  const [taunt] = useState(randomCheatTaunt)

  return (
    <div className="pokealbum-cheat-lock pokealbum-cheat-wipe">
      <div className="pokealbum-cheat-lock-card">
        <p className="pokealbum-cheat-lock-title">{taunt}</p>
        <p className="pokealbum-cheat-lock-body">
          Se detectó que se modificó el guardado o algún contador del juego por fuera de la
          aplicación (por consola, o importando un código editado). Se borró toda la cuenta:
          monedas, colección, rachas y premios. Arrancás de cero.
        </p>
        <button type="button" className="btn btn-gold" onClick={onDismiss}>
          Entendido
        </button>
      </div>
    </div>
  )
}
