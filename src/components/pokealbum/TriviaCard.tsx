import { useEffect, useState } from 'react'
import { POKEMON, STAT_LABEL, TRIVIA_REWARD } from '../../pokealbum'
import type { TriviaState } from '../../hooks/usePokeAlbum'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type TriviaCardProps = {
  trivia: TriviaState
  coins: number
  freeTriviaUsed: number
  freeTriviaLimit: number
  bonusQuestions: number
  wagerBoost: number
  onStart: (wager: number) => void
  onNewQuestion: () => void
  onExpire: () => void
  onAnswerStatPair: (side: 'a' | 'b') => void
  onAnswerTrueFalse: (value: boolean) => void
  onAnswerMultipleChoice: (index: number) => void
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

export function TriviaCard({
  trivia,
  coins,
  freeTriviaUsed,
  freeTriviaLimit,
  bonusQuestions,
  wagerBoost,
  onStart,
  onNewQuestion,
  onExpire,
  onAnswerStatPair,
  onAnswerTrueFalse,
  onAnswerMultipleChoice,
}: TriviaCardProps) {
  const [stake, setStake] = useState('')
  const deadline = trivia.status === 'ready' ? trivia.deadline : undefined
  const remainingMs = useCountdown(deadline, onExpire)

  if (trivia.status === 'idle') {
    const stakeValue = Number(stake)
    const canWager = stake !== '' && Number.isFinite(stakeValue) && stakeValue > 0 && stakeValue <= coins
    const freeLeft = Math.max(0, freeTriviaLimit - freeTriviaUsed)
    const freeExhausted = freeLeft <= 0 && bonusQuestions <= 0
    return (
      <div className="status-card pokealbum-trivia">
        <p>Ganá monedas respondiendo preguntas sobre Pokémon.</p>
        <p className="pokealbum-trivia-daily">
          Preguntas gratis hoy: {freeTriviaUsed}/{freeTriviaLimit}
          {bonusQuestions > 0 ? ` · +${bonusQuestions} de bonus` : ''}
        </p>
        {wagerBoost > 0 && (
          <p className="pokealbum-trivia-daily">
            Tenés {wagerBoost} bonus de "Todo o nada": tu próxima apuesta acertada paga el doble.
          </p>
        )}
        <button
          type="button"
          className="btn btn-gold"
          onMouseEnter={() => !freeExhausted && playSfx('hover')}
          onClick={() => onStart(0)}
          disabled={freeExhausted}
        >
          Responder pregunta por {TRIVIA_REWARD} monedas — gratis
        </button>
        {freeExhausted && (
          <p className="pokealbum-trivia-daily-warn">
            Ya usaste tus preguntas gratis de hoy. Apostá monedas para seguir jugando.
          </p>
        )}
        <div className="pokealbum-wager">
          <p>¿Doble o nada? Elegí cuánto apostar de lo tuyo: si acertás lo ganás, si fallás lo perdés.</p>
          <div className="pokealbum-wager-row">
            <input
              type="number"
              min={1}
              max={coins}
              placeholder="Monto a apostar"
              value={stake}
              onChange={(event) => setStake(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-gold"
            onMouseEnter={() => canWager && playSfx('hover')}
            onClick={() => onStart(stakeValue)}
            disabled={!canWager}
          >
            Responder preguntas por apuesta
          </button>
        </div>
      </div>
    )
  }

  if (trivia.status === 'loading') {
    return (
      <div className="status-card pokealbum-trivia">
        <p>Consultando PokeAPI...</p>
      </div>
    )
  }

  if (trivia.status === 'error') {
    return (
      <div className="status-card pokealbum-trivia is-error">
        <p>{trivia.message}</p>
        <button type="button" className="btn" onClick={() => onStart(0)}>
          Reintentar
        </button>
      </div>
    )
  }

  const answered = trivia.status === 'answered'
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const timerLine = !answered && (
    <p className={`pokealbum-trivia-timer${secondsLeft <= 5 ? ' is-urgent' : ''}`}>⏱ Tiempo: {secondsLeft}s</p>
  )
  const wagerBanner = trivia.wager > 0 && (
    <p className="pokealbum-wager-banner">Apostando {trivia.wager} monedas — doble o nada.</p>
  )
  const reward = trivia.reward ?? 0
  const resultLine = answered && (
    <div className="pokealbum-trivia-result">
      <p>
        {trivia.timedOut
          ? `¡Se acabó el tiempo! ${reward < 0 ? `Perdiste ${Math.abs(reward)} monedas.` : 'No ganaste monedas.'}`
          : reward > 0
            ? `¡Correcto! Ganaste ${reward} monedas.`
            : reward < 0
              ? `Incorrecto. Perdiste ${Math.abs(reward)} monedas.`
              : 'Incorrecto. No ganaste monedas.'}
      </p>
      <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={onNewQuestion}>
        Nueva pregunta
      </button>
    </div>
  )

  if (trivia.mode === 'statPair') {
    const label = STAT_LABEL[trivia.statKey]
    return (
      <div className="status-card pokealbum-trivia">
        {wagerBanner}
        {timerLine}
        <p>
          ¿Cuál de estos dos Pokémon tiene más <strong>{label}</strong>?
        </p>
        <div className="pokealbum-trivia-pair">
          {(['a', 'b'] as const).map((side) => {
            const id = side === 'a' ? trivia.aId : trivia.bId
            const value = side === 'a' ? trivia.aValue : trivia.bValue
            const isPicked = answered && trivia.picked === side
            const isRight = answered && trivia.correct === side
            return (
              <button
                key={side}
                type="button"
                className={`pokealbum-trivia-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
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
        {resultLine}
      </div>
    )
  }

  if (trivia.mode === 'trueFalse') {
    return (
      <div className="status-card pokealbum-trivia">
        {wagerBanner}
        {timerLine}
        <p>{trivia.statement}</p>
        <div className="pokealbum-trivia-tf">
          {[true, false].map((value) => {
            const isPicked = answered && trivia.picked === value
            const isRight = answered && trivia.isTrue === value
            return (
              <button
                key={String(value)}
                type="button"
                className={`pokealbum-trivia-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
                onClick={() => onAnswerTrueFalse(value)}
                onMouseEnter={() => !answered && playSfx('hover')}
                disabled={answered}
              >
                {value ? 'Verdadero' : 'Falso'}
              </button>
            )
          })}
        </div>
        {resultLine}
      </div>
    )
  }

  return (
    <div className="status-card pokealbum-trivia">
      {wagerBanner}
      {timerLine}
      <p>{trivia.prompt}</p>
      <div className="pokealbum-trivia-mc">
        {trivia.options.map((option, index) => {
          const isPicked = answered && trivia.picked === index
          const isRight = answered && trivia.correctIndex === index
          return (
            <button
              key={option}
              type="button"
              className={`pokealbum-trivia-option${isRight ? ' is-correct' : ''}${isPicked && !isRight ? ' is-wrong' : ''}`}
              onClick={() => onAnswerMultipleChoice(index)}
              onMouseEnter={() => !answered && playSfx('hover')}
              disabled={answered}
            >
              {option}
            </button>
          )
        })}
      </div>
      {resultLine}
    </div>
  )
}
