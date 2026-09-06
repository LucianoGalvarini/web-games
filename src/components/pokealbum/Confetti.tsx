import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Rarity } from '../../pokealbum'

const CONFETTI_COLORS: Record<Rarity, string[]> = {
  common: ['#c9c9c9', '#e4e4e4', '#9fa6ad'],
  uncommon: ['#7fd0ff', '#9fe6b0', '#e4e4e4'],
  rare: ['#c98bff', '#8bb4ff', '#ff9be0'],
  legendary: ['#ffd76a', '#fff2b0', '#ff9b4a', '#fff'],
}

type ConfettiProps = {
  rarity: Rarity
  count: number
}

export function Confetti({ rarity, count }: ConfettiProps) {
  const colors = CONFETTI_COLORS[rarity]
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 400),
        duration: 900 + Math.round(Math.random() * 700),
        drift: Math.round((Math.random() - 0.5) * 120),
        color: colors[i % colors.length],
        size: 5 + Math.round(Math.random() * 5),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rarity, count],
  )
  return (
    <div className="pokealbum-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="pokealbum-confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 1.6,
              background: piece.color,
              animationDelay: `${piece.delay}ms`,
              animationDuration: `${piece.duration}ms`,
              '--drift': `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
