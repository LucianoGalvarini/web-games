import { useState } from 'react'
import { TRIVIA_REWARD } from '../../pokealbum'
import { playSfx } from '../../shared/sfx'

type TriviaCardProps = {
  active: boolean
  coins: number
  freeTriviaUsed: number
  freeTriviaLimit: number
  bonusQuestions: number
  wagerBoost: number
  triviaStreak: number
  bestTriviaStreak: number
  onStart: (wager: number) => void
}

// Only the idle controls (start a free question / place a wager) live in the sidebar now — once
// a question is active, TriviaModal takes over as a big, readable full-screen overlay.
export function TriviaCard({
  active,
  coins,
  freeTriviaUsed,
  freeTriviaLimit,
  bonusQuestions,
  wagerBoost,
  triviaStreak,
  bestTriviaStreak,
  onStart,
}: TriviaCardProps) {
  const [stake, setStake] = useState('')

  if (active) {
    return null
  }

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
      {(triviaStreak > 0 || bestTriviaStreak > 0) && (
        <p className="pokealbum-trivia-streak">
          {triviaStreak > 0 ? `🔥 Racha actual: ${triviaStreak}` : 'Sin racha activa'}
          {bestTriviaStreak > 0 ? ` · Mejor racha: ${bestTriviaStreak}` : ''}
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
