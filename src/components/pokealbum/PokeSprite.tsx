import { useState } from 'react'
import { animatedSpriteUrl, spriteUrl } from '../../pokealbum'

type PokeSpriteProps = {
  id: number
  name: string
  className?: string
  scale?: number
}

export function PokeSprite({ id, name, className, scale }: PokeSpriteProps) {
  const [src, setSrc] = useState(() => animatedSpriteUrl(id))
  return (
    <img
      src={src}
      alt={name}
      className={className}
      loading="lazy"
      onError={() => setSrc(spriteUrl(id))}
      style={scale && scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    />
  )
}
