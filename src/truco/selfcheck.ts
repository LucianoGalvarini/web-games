import { chooseAiAction } from './ai'
import { applyAction, createMatch, nextHand } from './apply'
import { fullDeck, mulberry32 } from './deck'
import { envidoOf, faltaValue } from './envido'
import { actorOf, legalActions } from './legal'
import { compareTruco, trucoPower } from './ranking'
import type { Card } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const anchoEspadas: Card = { suit: 'espadas', rank: 1 }
const anchoBastos: Card = { suit: 'bastos', rank: 1 }
const sieteEspadas: Card = { suit: 'espadas', rank: 7 }
const sieteOros: Card = { suit: 'oros', rank: 7 }
const tres: Card = { suit: 'copas', rank: 3 }
const cuatro: Card = { suit: 'oros', rank: 4 }

assert(fullDeck().length === 40, 'El mazo español tiene 40 cartas.')
assert(trucoPower(anchoEspadas) > trucoPower(anchoBastos), 'El ancho de espadas es la más alta.')
assert(trucoPower(sieteEspadas) > trucoPower(sieteOros), 'El 7 de espadas mata al 7 de oros.')
assert(trucoPower(tres) > trucoPower({ suit: 'bastos', rank: 2 }), 'Los 3 matan a los 2.')
assert(compareTruco({ suit: 'oros', rank: 1 }, { suit: 'copas', rank: 1 }) === 0, 'Los anchos falsos empatan.')
assert(trucoPower(cuatro) === 1, 'El 4 es la más baja.')

assert(envidoOf([sieteOros, { suit: 'oros', rank: 6 }, { suit: 'copas', rank: 1 }]) === 33, '7 y 6 de oros valen 33.')
assert(
  envidoOf([
    { suit: 'espadas', rank: 12 },
    { suit: 'copas', rank: 11 },
    { suit: 'bastos', rank: 10 },
  ]) === 0,
  'Figuras sueltas valen 0.',
)
assert(
  envidoOf([
    { suit: 'copas', rank: 12 },
    { suit: 'copas', rank: 11 },
    { suit: 'copas', rank: 7 },
  ]) === 27,
  'Figuras con 7 del palo valen 27.',
)
assert(faltaValue({ white: 10, black: 8 }) === 5, 'Falta en malas vale lo que falta a 15.')
assert(faltaValue({ white: 16, black: 10 }) === 14, 'Falta en buenas vale lo que falta a 30.')

let dealt = createMatch(mulberry32(7), 'white')
assert(dealt.hands.white.length === 3 && dealt.hands.black.length === 3, 'Se reparte de a tres.')
assert(dealt.toPlay === 'white', 'Sale el mano.')

const first = dealt.hands.white[0]
assert(first, 'El mano tiene cartas.')
dealt = applyAction(dealt, 'white', { kind: 'play', card: first })
assert(dealt.current.plays.length === 1, 'Queda una carta en la mesa.')
assert(
  legalActions(dealt, 'black').some((action) => action.kind === 'envido'),
  'El pie todavía puede cantar envido.',
)
const tantosMano = envidoOf(dealt.dealt.white)
dealt = applyAction(dealt, 'black', { kind: 'envido' })
dealt = applyAction(dealt, 'white', { kind: 'quiero' })
assert(dealt.envidoReveal?.white === tantosMano, 'El envido usa las tres cartas del mano, aunque ya haya tirado.')

let trucoHand = createMatch(mulberry32(3), 'white')
trucoHand = applyAction(trucoHand, 'white', { kind: 'truco' })
trucoHand = applyAction(trucoHand, 'black', { kind: 'no-quiero' })
assert(trucoHand.handWinner === 'white' && trucoHand.scores.white === 1, 'Truco no querido vale 1.')

let finished = 0
for (let game = 0; game < 80; game += 1) {
  const random = mulberry32(1000 + game * 17)
  let match = createMatch(random, game % 2 === 0 ? 'white' : 'black')
  let steps = 0
  while (!match.matchWinner && steps < 5000) {
    if (match.handWinner) {
      match = nextHand(match, random)
      continue
    }
    const actor = actorOf(match)
    assert(actor, `Partida ${game} sin actor en el paso ${steps}.`)
    const action = chooseAiAction(match, actor, steps % 3 === 0 ? 'easy' : 'hard', random)
    assert(action, `Partida ${game} sin jugada de CPU.`)
    match = applyAction(match, actor, action)
    steps += 1
  }
  assert(match.matchWinner, `La partida ${game} no terminó.`)
  assert(match.scores[match.matchWinner] >= 30, 'El ganador llegó a 30.')
  finished += 1
}

assert(finished === 80, `Solo terminaron ${finished} de 80 partidas.`)

console.log('truco selfcheck ok')
