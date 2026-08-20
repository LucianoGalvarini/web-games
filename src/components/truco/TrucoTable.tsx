import type { Player } from '../../shared/types'
import { cardKey, nextTrucoLabel, sameCard, tableShout } from '../../truco'
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

const PILE = [
  { rot: -18, x: -16, y: -8 },
  { rot: 16, x: 14, y: 10 },
  { rot: -11, x: 6, y: -16 },
  { rot: 21, x: -12, y: 12 },
  { rot: -7, x: 18, y: -4 },
  { rot: 12, x: -6, y: 16 },
]

const HAND_SLOTS = 3

function pileCards(state: TrucoState) {
  const cards: { card: Card; key: string }[] = []
  for (const trick of state.tricks) {
    for (const play of trick.plays) {
      cards.push({ card: play.card, key: `${cardKey(play.card)}-${cards.length}` })
    }
  }
  for (const play of state.current.plays) {
    cards.push({ card: play.card, key: `${cardKey(play.card)}-live-${cards.length}` })
  }
  return cards
}

function slotsOf(hand: Card[]): (Card | null)[] {
  return Array.from({ length: HAND_SLOTS }, (_, index) => hand[index] ?? null)
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
  const pile = pileCards(state)
  const shout = tableShout(state)
  const waitingYou = Boolean(shout?.waiting && shout.who !== viewing)

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
        <div className="truco-hand is-opp">
          {slotsOf(state.hands[opponent]).map((card, index) => (
            <div key={card ? cardKey(card) : `opp-empty-${index}`} className="truco-hand-slot">
              {card ? (
                <SpanishCard card={card} faceDown={!reveal} size="sm" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="truco-felt">
        {shout ? (
          <div
            key={`${shout.title}-${shout.who}-${state.log.length}`}
            className={`truco-shout is-${shout.kind}${shout.who === viewing ? ' is-you' : ' is-them'}${shout.waiting ? ' is-waiting' : ''}`}
          >
            <p className="truco-shout-who">{nameOf(shout.who)}</p>
            <p className="truco-shout-title">{shout.title}</p>
            {shout.sub ? <p className="truco-shout-sub">{shout.sub}</p> : null}
            {waitingYou ? <p className="truco-shout-wait">Te toca responder</p> : null}
          </div>
        ) : null}

        <div className="truco-pile">
          {pile.length === 0 ? <p className="truco-pile-empty">La mesa está libre</p> : null}
          {pile.map((item, index) => {
            const pose = PILE[index] ?? PILE[index % PILE.length]
            if (!pose) {
              return null
            }
            return (
              <div
                key={item.key}
                className="truco-pile-card"
                style={{
                  zIndex: index + 1,
                  transform: `translate(-50%, -50%) translate(${pose.x}%, ${pose.y}%) rotate(${pose.rot}deg)`,
                }}
              >
                <SpanishCard card={item.card} size="md" />
              </div>
            )
          })}
        </div>
      </div>

      <p className={`truco-envido-banner${state.envidoReveal ? '' : ' is-empty'}`}>
        {state.envidoReveal
          ? `Tantos: ${nameOf('white')} ${state.envidoReveal.white} — ${nameOf('black')} ${state.envidoReveal.black}. Se llevó ${nameOf(state.envidoReveal.winner)} (${state.envidoReveal.points}).`
          : '\u00a0'}
      </p>

      <div className="truco-row">
        <p className="truco-seat">{nameOf(viewing)}</p>
        <div className="truco-hand is-you">
          {slotsOf(state.hands[viewing]).map((card, index) => (
            <div key={card ? cardKey(card) : `you-empty-${index}`} className="truco-hand-slot">
              {card ? (
                <SpanishCard
                  card={card}
                  size="md"
                  playable={canPlay(card)}
                  disabled={!canPlay(card)}
                  onClick={canPlay(card) ? () => onPlayCard(card) : undefined}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className={`truco-cants${waitingYou ? ' is-urgent' : ''}${cants.length === 0 ? ' is-empty' : ''}`}>
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
    </div>
  )
}
