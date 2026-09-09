import { useEffect, useState } from 'react'
import { animatedSpriteUrl, shinyAnimatedSpriteUrl, shinySpriteUrl, spriteUrl } from '../../pokealbum'

type PokeSpriteProps = {
  id: number
  name: string
  className?: string
  scale?: number
  shiny?: boolean
}

export function PokeSprite({ id, name, className, scale, shiny }: PokeSpriteProps) {
  const animated = shiny ? shinyAnimatedSpriteUrl(id) : animatedSpriteUrl(id)
  const [src, setSrc] = useState(animated)

  // id/shiny can change under an already-mounted <img> (e.g. right after unlocking shiny) —
  // reset back to the animated source instead of getting stuck on whichever fallback fired last.
  useEffect(() => {
    setSrc(animated)
  }, [animated])

  return (
    <img
      src={src}
      alt={name}
      className={className}
      loading="lazy"
      onError={() => setSrc(shiny ? shinySpriteUrl(id) : spriteUrl(id))}
      style={scale && scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    />
  )
}
