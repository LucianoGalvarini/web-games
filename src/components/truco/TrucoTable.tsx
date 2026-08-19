import type { Player } from '../../shared/types'
import { cardKey, nextTrucoLabel, sameCard } from '../../truco'
import type { Card, TrucoAction, TrucoState } from '../../truco'
import { SpanishCard } from './SpanishCard'

type TrucoTableProps = {
  state: TrucoState
  viewing: Player
  actions: TrucoAction[]
  canAct: boolean
  nameOf: (player: Player) => string
  onPlayCard: (card: Card) => void
  onAction: (action: TrucoAction) => void
}

function cardOf(state: TrucoState, player: Player): Card | undefined {
  return state.current.plays.find((play) => play.player === player)?.card
}

export function TrucoTable({
  state,
  viewing,
  actions,
  canAct,
  nameOf,
  onPlayCard,
  onAction,
}: TrucoTableProps) {
  const opponent = viewing === 'white' ? 'black' : 'white'
  const reveal = Boolean(state.handWinner || state.matchWinner)
  const playable = actions.filter((action) => action.kind === 'play')
  const canPlay = (card: Card) =>
    canAct && playable.some((action) => action.kind === 'play' && sameCard(action.card, card))

  const cants: { action: TrucoAction; label: string; gold?: boolean }[] = []
  if (actions.some((action) => action.kind === 'quiero')) {
    cants.push({ action: { kind: 'quiero' }, label: 'Quiero', gold: true })
  }
  if (actions.some((action) => action.kind === 'no-quiero')) {
    cants.push({ action: { kind: 'no-quiero' }, label: 'No quiero' })
  }
  if (actions.some((action) => action.kind === 'envido')) {
    cants.push({ action: { kind: 'envido' }, label: 'Envido' })
  }
  if (actions.some((action) => action.kind === 'real')) {
    cants.push({ action: { kind: 'real' }, label: 'Real envido' })
  }
  if (actions.some((action) => action.kind === 'falta')) {
    cants.push({ action: { kind: 'falta' }, label: 'Falta envido' })
  }
  if (actions.some((action) => action.kind === 'truco')) {
    const level = state.trucoPending?.level ?? state.trucoLevel
    cants.push({ action: { kind: 'truco' }, label: nextTrucoLabel(level), gold: true })
  }
  if (actions.some((action) => action.kind === 'mazo')) {
    cants.push({ action: { kind: 'mazo' }, label: 'Al mazo' })
  }

  return (
    <div className="truco-table-inner">
      <div className="truco-row truco-row-opp">
        <p className="truco-seat">{nameOf(opponent)}</p>
        <div className="truco-hand">
          {state.hands[opponent].map((card, index) => (
            <SpanishCard
              key={reveal ? cardKey(card) : `opp-${index}`}
              card={card}
              faceDown={!reveal}
            />
          ))}
        </div>
      </div>

      <div className="truco-play">
        <div className="truco-slot">
          <span>{nameOf(opponent)}</span>
          {cardOf(state, opponent) ? <SpanishCard card={cardOf(state, opponent)} /> : <div className="truco-empty" />}
        </div>
        <div className="truco-slot">
          <span>{nameOf(viewing)}</span>
          {cardOf(state, viewing) ? <SpanishCard card={cardOf(state, viewing)} /> : <div className="truco-empty" />}
        </div>
      </div>

      {state.envidoReveal ? (
        <p className="truco-envido-banner">
          Envido: {nameOf('white')} {state.envidoReveal.white} — {nameOf('black')} {state.envidoReveal.black}. Se llevó{' '}
          {nameOf(state.envidoReveal.winner)} ({state.envidoReveal.points}).
        </p>
      ) : null}

      <div className="truco-row">
        <p className="truco-seat">{nameOf(viewing)}</p>
        <div className="truco-hand">
          {state.hands[viewing].map((card) => (
            <SpanishCard
              key={cardKey(card)}
              card={card}
              playable={canPlay(card)}
              disabled={!canPlay(card)}
              onClick={canPlay(card) ? () => onPlayCard(card) : undefined}
            />
          ))}
        </div>
      </div>

      {cants.length > 0 ? (
        <div className="truco-cants">
          {cants.map((cant) => (
            <button
              key={cant.label}
              type="button"
              className={`btn${cant.gold ? ' btn-gold' : ''}`}
              onClick={() => onAction(cant.action)}
            >
              {cant.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="truco-cants truco-cants-placeholder" />
      )}
    </div>
  )
}
