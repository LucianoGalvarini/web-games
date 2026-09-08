import { useEffect, useRef, useState } from 'react'

type Direction = 'left' | 'right'

type Walker = {
  id: number
  direction: Direction
  top: number
  duration: number
  delay: number
}

const FALLBACK_IDS = [25, 1, 4, 7, 133, 143]
const MAX_WALKERS = 7

function buildWalkers(ids: number[]): Walker[] {
  const pool = ids.length > 0 ? ids : FALLBACK_IDS
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, MAX_WALKERS)
  return shuffled.map((id) => ({
    id,
    direction: Math.random() < 0.5 ? 'right' : 'left',
    top: Math.round(Math.random() * 65),
    duration: 16 + Math.random() * 12,
    delay: -Math.random() * 20,
  }))
}

type OverworldParadeProps = {
  ownedIds: number[]
}

// A purely decorative strip of walking Pokémon along the bottom of the album. The walker set is
// picked once (not re-shuffled every render, which would look jittery on every album change) —
// except a single one-time upgrade from the placeholder cast to the player's own Pokémon, the
// first time they actually own any.
export function OverworldParade({ ownedIds }: OverworldParadeProps) {
  const [walkers, setWalkers] = useState(() => buildWalkers(ownedIds))
  const upgradedFromOwned = useRef(ownedIds.length > 0)

  useEffect(() => {
    if (!upgradedFromOwned.current && ownedIds.length > 0) {
      upgradedFromOwned.current = true
      setWalkers(buildWalkers(ownedIds))
    }
  }, [ownedIds])

  return (
    <div className="pokealbum-parade" aria-hidden="true">
      {walkers.map((walker, index) => (
        <img
          key={`${walker.id}-${index}`}
          src={`/pokealbum/images/overworld/${walker.direction}/${walker.id}.png`}
          alt=""
          className={`pokealbum-parade-walker is-${walker.direction}`}
          style={{
            top: `${walker.top}%`,
            animationDuration: `${walker.duration}s`,
            animationDelay: `${walker.delay}s`,
          }}
          draggable={false}
        />
      ))}
    </div>
  )
}
