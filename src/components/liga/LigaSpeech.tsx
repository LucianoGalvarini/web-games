import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../shared/sfx'

type LigaSpeechProps = {
  text: string
  turbo: boolean
  reveal: boolean
  onReady: (ready: boolean) => void
}

export function LigaSpeech({ text, turbo, reveal, onReady }: LigaSpeechProps) {
  const [n, setN] = useState(0)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const shown = reveal ? text.length : n
  const ready = shown >= text.length

  useEffect(() => {
    setN(0)
    onReadyRef.current(text.length === 0)
  }, [text])

  useEffect(() => {
    onReadyRef.current(shown >= text.length)
  }, [shown, text.length])

  useEffect(() => {
    if (reveal || n >= text.length) {
      return
    }
    const ms = turbo ? 8 : 38
    const id = window.setTimeout(() => {
      const step = turbo ? Math.max(2, Math.ceil(text.length / 10)) : 1
      const next = Math.min(text.length, n + step)
      setN(next)
      if (next % 3 === 0) {
        playSfx('ligaText')
      }
    }, ms)
    return () => window.clearTimeout(id)
  }, [n, reveal, text, turbo])

  return (
    <p>
      {text.slice(0, shown)}
      <b className={ready ? 'liga-caret' : 'liga-caret is-type'}>{ready ? '▼' : '_'}</b>
    </p>
  )
}
