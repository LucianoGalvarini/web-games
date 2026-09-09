import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { POKEMON, STAT_LABEL } from '../../pokealbum'
import type { TriviaState } from '../../hooks/usePokeAlbum'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type TriviaModalProps = {
  trivia: TriviaState
  triviaStreak: number
  bestTriviaStreak: number
  onRetry: () => void
  onNewQuestion: () => void
  onExpire: () => void
  onAnswerStatPair: (side: 'a' | 'b') => void
  onAnswerTrueFalse: (value: boolean) => void
  onAnswerMultipleChoice: (index: number) => void
  onAnswerTrainer: (index: number) => void
}

function nameOf(id: number): string {
  return POKEMON.find((p) => p.id === id)?.name ?? `#${id}`
}

function useCountdown(deadline: number | undefined, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(() => (deadline ? Math.max(0, deadline - Date.now()) : 0))

  useEffect(() => {
    if (!deadline) {
      return
    }
    setRemaining(Math.max(0, deadline - Date.now()))
    const id = window.setInterval(() => {
      const left = deadline - Date.now()
      if (left <= 0) {
        setRemaining(0)
        onExpire()
        window.clearInterval(id)
      } else {
        setRemaining(left)
      }
    }, 200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline])

  return remaining
}

// Preguntados-style full-screen modal for an in-progress question: this used to be a small card
// docked in the sidebar with tiny text, which players couldn't read in time. It now takes over
// the screen like the roulette/shiny-challenge modals do, with much bigger question/option text.
export function TriviaModal({
  trivia,
  triviaStreak,
  bestTriviaStreak,
  onRetry,
  onNewQuestion,
  onExpire,
  onAnswerStatPair,
  onAnswerTrueFalse,
  onAnswerMultipleChoice,
  onAnswerTrainer,
}: TriviaModalProps) {
  const deadline = trivia.status === 'ready' ? trivia.deadline : undefined
  const remainingMs = useCountdown(deadline, onExpire)

  if (trivia.status === 'idle') {
    return null
  }

  if (trivia.status === 'loading') {
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div className="modal pokealbum-trivia-modal pokealbum-shell" role="dialog" aria-modal="true">
          <p className="pokealbum-trivia-modal-question">Consultando PokeAPI...</p>
        </div>
      </div>
    )
  }

  if (trivia.status === 'error') {
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div className="modal pokealbum-trivia-modal pokealbum-shell is-error" role="dialog" aria-modal="true">
          <p className="pokealbum-trivia-modal-question">{trivia.message}</p>
          <div className="result-actions">
            <button type="button" className="btn btn-gold" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const answered = trivia.status === 'answered'
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const timerLine = !answered && (
    <p className={`pokealbum-trivia-modal-timer${secondsLeft <= 5 ? ' is-urgent' : ''}`}>⏱ {secondsLeft}s</p>
  )
  const wagerBanner = trivia.wager > 0 && (
    <p className="pokealbum-wager-banner">Apostando {trivia.wager} monedas — doble o nada.</p>
  )
  const reward = trivia.reward ?? 0
  const resultLine = answered && (
    <div className="pokealbum-trivia-result">
      <p className="pokealbum-trivia-modal-outcome">
        {trivia.timedOut
          ? `¡Se acabó el tiempo! ${reward < 0 ? `Perdiste ${Math.abs(reward)} monedas.` : 'No ganaste monedas.'}`
          : reward > 0
            ? `¡Correcto! Ganaste ${reward} monedas.`
            : reward < 0
              ? `Incorrecto. Perdiste ${Math.abs(reward)} monedas.`
              : 'Incorrecto. No ganaste monedas.'}
      </p>
      {triviaStreak > 0 ? (
        <p className="pokealbum-trivia-streak">🔥 Racha actual: {triviaStreak}</p>
      ) : (
        bestTriviaStreak > 0 && <p className="pokealbum-trivia-streak">Se cortó la racha.</p>
      )}
      <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={onNewQuestion}>
        Nueva pregunta
      </button>
    </div>
  )

  let body: ReactNode
  if (trivia.mode === 'statPair') {
    const label = STAT_LABEL[trivia.statKey]
    body = (
      <>
        <p className="pokealbum-trivia-modal-question">
          ¿Cuál de estos dos Pokémon tiene más <strong>{label}</strong>?
        </p>
        <div className="pokealbum-trivia-pair pokealbum-trivia-modal-pair">
          {(['a', 'b'] as const).map((side) => {
            const id = side === 'a' ? trivia.aId : trivia.bId
            const value = side === 'a' ? trivia.aValue : trivia.bValue
            const isPicked = answered && trivia.picked === side
            const isRight = answered && trivia.correct === side
            return (
              <button
                key={side}
                type="button"
                className={`pokealbum-trivia-option pokealbum-trivia-modal-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
                onClick={() => onAnswerStatPair(side)}
                onMouseEnter={() => !answered && playSfx('hover')}
                disabled={answered}
              >
                <PokeSprite id={id} name={nameOf(id)} />
                <span>{nameOf(id)}</span>
                {answered && <span className="pokealbum-trivia-value">{value}</span>}
              </button>
            )
          })}
        </div>
      </>
    )
  } else if (trivia.mode === 'trueFalse') {
    body = (
      <>
        <p className="pokealbum-trivia-modal-question">{trivia.statement}</p>
        <div className="pokealbum-trivia-tf pokealbum-trivia-modal-tf">
          {[true, false].map((value) => {
            const isPicked = answered && trivia.picked === value
            const isRight = answered && trivia.isTrue === value
            return (
              <button
                key={String(value)}
                type="button"
                className={`pokealbum-trivia-option pokealbum-trivia-modal-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
                onClick={() => onAnswerTrueFalse(value)}
                onMouseEnter={() => !answered && playSfx('hover')}
                disabled={answered}
              >
                {value ? 'Verdadero' : 'Falso'}
              </button>
            )
          })}
        </div>
      </>
    )
  } else {
    const isTrainer = trivia.mode === 'trainer'
    body = (
      <>
        {isTrainer && <p className="pokealbum-trivia-trainer-tag">🎓 Trivia de entrenadores</p>}
        <p className="pokealbum-trivia-modal-question">{trivia.prompt}</p>
        <div className="pokealbum-trivia-mc pokealbum-trivia-modal-mc">
          {trivia.options.map((option, index) => {
            const isPicked = answered && trivia.picked === index
            const isRight = answered && trivia.correctIndex === index
            return (
              <button
                key={option}
                type="button"
                className={`pokealbum-trivia-option pokealbum-trivia-modal-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
                onClick={() => (isTrainer ? onAnswerTrainer(index) : onAnswerMultipleChoice(index))}
                onMouseEnter={() => !answered && playSfx('hover')}
                disabled={answered}
              >
                {option}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <div className="modal-backdrop result-backdrop" role="presentation">
      <div className="modal pokealbum-trivia-modal pokealbum-shell" role="dialog" aria-modal="true">
        {wagerBanner}
        {timerLine}
        {body}
        {resultLine}
      </div>
    </div>
  )
}
