import { useState } from 'react'
import { POKEMON, STAT_LABEL, TRIVIA_REWARD } from '../../pokealbum'
import type { TriviaState } from '../../hooks/usePokeAlbum'
import { playSfx } from '../../shared/sfx'
import { PokeSprite } from './PokeSprite'

type TriviaCardProps = {
  trivia: TriviaState
  coins: number
  onStart: (wager: number) => void
  onNewQuestion: () => void
  onAnswerStatPair: (side: 'a' | 'b') => void
  onAnswerTrueFalse: (value: boolean) => void
  onAnswerMultipleChoice: (index: number) => void
}

function nameOf(id: number): string {
  return POKEMON.find((p) => p.id === id)?.name ?? `#${id}`
}

export function TriviaCard({
  trivia,
  coins,
  onStart,
  onNewQuestion,
  onAnswerStatPair,
  onAnswerTrueFalse,
  onAnswerMultipleChoice,
}: TriviaCardProps) {
  const [stake, setStake] = useState('')

  if (trivia.status === 'idle') {
    const stakeValue = Number(stake)
    const canWager = stake !== '' && Number.isFinite(stakeValue) && stakeValue > 0 && stakeValue <= coins
    return (
      <div className="status-card pokealbum-trivia">
        <p>Ganá monedas respondiendo preguntas sobre Pokémon.</p>
        <button type="button" className="btn btn-gold" onMouseEnter={() => playSfx('hover')} onClick={() => onStart(0)}>
          Responder pregunta por {TRIVIA_REWARD} monedas — gratis
        </button>
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
  const wagerBanner = trivia.wager > 0 && (
    <p className="pokealbum-wager-banner">Apostando {trivia.wager} monedas — doble o nada.</p>
  )
  const reward = trivia.reward ?? 0
  const resultLine = answered && (
    <div className="pokealbum-trivia-result">
      <p>
        {reward > 0
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
