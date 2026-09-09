import { useEffect, useState } from 'react'
import { randomCheatTaunt } from '../../shared/anticheat'

type CheatLockOverlayProps = {
  remainingMs: number
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function CheatLockOverlay({ remainingMs }: CheatLockOverlayProps) {
  const [display, setDisplay] = useState(remainingMs)
  const [taunt] = useState(randomCheatTaunt)

  useEffect(() => {
    setDisplay(remainingMs)
    const id = window.setInterval(() => {
      setDisplay((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [remainingMs])

  return (
    <div className="pokealbum-cheat-lock">
      <div className="pokealbum-cheat-lock-card">
        <p className="pokealbum-cheat-lock-title">{taunt}</p>
        <p className="pokealbum-cheat-lock-body">
          Se detectó un intento de modificar el juego desde las herramientas de desarrollador (monedas, racha u
          otros datos guardados). Por las dudas, quedaste bloqueado un rato.
        </p>
        <p className="pokealbum-cheat-lock-timer">Podés volver a jugar en {formatRemaining(display)}</p>
      </div>
    </div>
  )
}
