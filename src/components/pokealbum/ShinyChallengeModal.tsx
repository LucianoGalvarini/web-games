import { useEffect, useState } from 'react'
import { POKEMON } from '../../pokealbum'
import type { ShinyChallengeState } from '../../hooks/usePokeAlbum'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type ShinyChallengeModalProps = {
  challenge: ShinyChallengeState
  onAnswer: (picked: number) => void
  onExpire: () => void
  onContinue: () => void
  onClose: () => void
  onRetryLoad: (id: number) => void
}

const DIFFICULTY_LABEL: Record<string, string> = {
  fácil: 'Fácil',
  media: 'Media',
  difícil: 'Difícil',
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

export function ShinyChallengeModal({ challenge, onAnswer, onExpire, onContinue, onClose, onRetryLoad }: ShinyChallengeModalProps) {
  const deadline = challenge.status === 'ready' ? challenge.deadline : undefined
  const remainingMs = useCountdown(deadline, onExpire)

  if (challenge.status === 'closed') {
    return null
  }

  if (challenge.status === 'loading') {
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div className="modal result-modal pokealbum-shiny-modal" role="dialog" aria-modal="true">
          <p>Preparando el desafío shiny de {nameOf(challenge.pokemonId)}...</p>
        </div>
      </div>
    )
  }

  if (challenge.status === 'error') {
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div className="modal result-modal pokealbum-shiny-modal is-error" role="dialog" aria-modal="true">
          <p>{challenge.message}</p>
          <div className="result-actions">
            <button type="button" className="btn btn-gold" onClick={() => onRetryLoad(challenge.pokemonId)}>
              Reintentar
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (challenge.status === 'finished') {
    return (
      <div className="modal-backdrop result-backdrop" role="presentation">
        <div
          className={`modal result-modal pokealbum-shiny-modal pokealbum-shiny-result${challenge.won ? ' is-won' : ' is-lost'}`}
          role="dialog"
          aria-modal="true"
        >
          {challenge.won ? (
            <>
              <p className="eyebrow">✨ ¡Desafío superado!</p>
              <h2>{nameOf(challenge.pokemonId)} Shiny desbloqueado</h2>
              <div className="pokealbum-shiny-reveal-sprite">
                <PokeSprite id={challenge.pokemonId} name={nameOf(challenge.pokemonId)} shiny />
              </div>
              <p>A partir de ahora tu figurita de {nameOf(challenge.pokemonId)} luce en su versión shiny.</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Desafío perdido</p>
              <h2>Te quedaste sin oportunidades</h2>
              <p>
                Fallaste una pregunta del desafío shiny de {nameOf(challenge.pokemonId)}. Las 5 repetidas que usaste
                para intentarlo ya se gastaron: juntá 5 nuevas para volver a intentarlo.
              </p>
            </>
          )}
          <div className="result-actions">
            <button type="button" className="btn btn-gold" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const question = challenge.questions[challenge.index]
  const answered = challenge.status === 'answered'
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const isLastQuestion = challenge.index === challenge.questions.length - 1

  return (
    <div className="modal-backdrop result-backdrop" role="presentation">
      <div className="modal result-modal pokealbum-shiny-modal" role="dialog" aria-modal="true">
        <p className="eyebrow">✨ Desafío shiny · {nameOf(challenge.pokemonId)}</p>
        <div className="pokealbum-shiny-progress">
          <span>
            Pregunta {challenge.index + 1} de {challenge.questions.length}
          </span>
          <span className={`pokealbum-shiny-difficulty is-${question.difficulty === 'difícil' ? 'hard' : question.difficulty === 'media' ? 'medium' : 'easy'}`}>
            {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
            {isLastQuestion ? ' · ¡Última pregunta!' : ''}
          </span>
        </div>
        {!answered && (
          <p className={`pokealbum-trivia-timer${secondsLeft <= 3 ? ' is-urgent' : ''}`}>⏱ Tiempo: {secondsLeft}s</p>
        )}
        <p className="pokealbum-shiny-question">{question.question}</p>
        <div className="pokealbum-trivia-mc">
          {question.options.map((option, index) => {
            const isPicked = answered && challenge.picked === index
            const isRight = answered && question.answerIndex === index
            return (
              <button
                key={option}
                type="button"
                className={`pokealbum-trivia-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
                onClick={() => onAnswer(index)}
                onMouseEnter={() => !answered && playSfx('hover')}
                disabled={answered}
              >
                {option}
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="pokealbum-shiny-result-line">
            <p>
              {challenge.timedOut
                ? '¡Se acabó el tiempo! Eso cuenta como error.'
                : challenge.correct
                  ? '¡Correcto!'
                  : 'Incorrecto.'}
            </p>
            <p className="pokealbum-shiny-explanation">{question.explanation}</p>
            {!challenge.correct && <p className="pokealbum-shiny-fail-warn">El desafío termina acá.</p>}
            <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={onContinue}>
              {!challenge.correct ? 'Ver resultado' : isLastQuestion ? 'Ver resultado' : 'Siguiente pregunta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
