import { createDeck, isWildCard, shuffle } from './deck'
import {
  GameError,
  callUno,
  calloutPlayer,
  describeCard,
  drawCard,
  isPlayable,
  playCard,
  startGame,
} from './gameEngine'
import { createRoom, joinRoom, toPublic } from './store'
import type { Card, Color, RoomState } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const deck = createDeck()
assert(deck.length === 108, 'El mazo de UNO tiene 108 cartas.')
assert(deck.filter((c) => c.value === 'wild').length === 4, 'Hay 4 comodines.')
assert(deck.filter((c) => c.value === 'wild4').length === 4, 'Hay 4 +4.')
assert(deck.filter((c) => c.color === 'red' && c.value === '0').length === 1, 'Hay un 0 por color.')
assert(deck.filter((c) => c.color === 'blue' && c.value === '7').length === 2, 'Hay dos 7 por color.')
assert(deck.filter((c) => c.value === 'skip').length === 8, 'Hay 8 Salta.')
assert(isWildCard({ id: 'w', color: 'wild', value: 'wild' }), 'El comodín es wild.')

const mixed = shuffle(deck)
assert(mixed.length === 108, 'Shuffle conserva la cantidad.')
assert(mixed !== deck, 'Shuffle no muta el original.')

const red5: Card = { id: 'r5', color: 'red', value: '5' }
const blue5: Card = { id: 'b5', color: 'blue', value: '5' }
const green9: Card = { id: 'g9', color: 'green', value: '9' }
const wild: Card = { id: 'w', color: 'wild', value: 'wild' }
assert(isPlayable(red5, blue5, 'blue'), 'Mismo número es jugable.')
assert(isPlayable(red5, green9, 'red'), 'Mismo color es jugable.')
assert(!isPlayable(red5, green9, 'blue'), 'Color y número distintos no entran.')
assert(isPlayable(wild, green9, 'green'), 'El comodín siempre entra.')

const { room: lobby } = createRoom('Ana')
assert(lobby.players.length === 1 && lobby.players[0].isHost, 'Quien crea es anfitrión.')

let threw = false
try {
  startGame(lobby)
} catch (err) {
  threw = err instanceof GameError
}
assert(threw, 'No se empieza con un solo jugador.')

joinRoom(lobby.id, 'Beto')
startGame(lobby)
assert(lobby.players.every((p) => p.hand.length === 7), 'Se reparte de a 7.')
assert(lobby.discardPile.length === 1, 'Hay una carta inicial.')
assert(lobby.discardPile[0].value !== 'wild4', 'El +4 no abre.')
assert(lobby.drawPile.length === 108 - 14 - 1, 'El resto queda en el mazo.')

const publicView = toPublic(lobby, lobby.players[0].id)
assert(publicView.you?.hand.length === 7, 'El espectador ve su mano.')
assert(
  publicView.players.every((p) => p.handCount === 7 && !('hand' in p) && !('token' in p)),
  'Los demás no ven cartas ni tokens.',
)

function roomWithTop(top: Card, color: Color, extra?: Card): RoomState {
  const { room } = createRoom('Ana')
  joinRoom(room.id, 'Beto')
  startGame(room)
  room.discardPile = [top]
  room.currentColor = color
  room.currentPlayerIndex = 0
  room.direction = 1
  if (extra) {
    room.players[0].hand = [extra, { id: `${extra.id}-keep`, color: 'red', value: '0' }]
  }
  room.players[0].saidUno = false
  room.players[1].saidUno = false
  return room
}

const skipRoom = roomWithTop({ id: 't', color: 'red', value: '3' }, 'red', {
  id: 's',
  color: 'red',
  value: 'skip',
})
const skipVictim = skipRoom.players[1].id
playCard(skipRoom, skipRoom.players[0], 's')
assert(skipRoom.players[skipRoom.currentPlayerIndex].id === skipRoom.players[0].id, 'Salta en 2 jugadores vuelve al que tiró.')
assert(skipRoom.players[1].id === skipVictim, 'El rival sigue en la mesa.')

const reverseRoom = roomWithTop({ id: 't', color: 'blue', value: '1' }, 'blue', {
  id: 'rv',
  color: 'blue',
  value: 'reverse',
})
playCard(reverseRoom, reverseRoom.players[0], 'rv')
assert(
  reverseRoom.players[reverseRoom.currentPlayerIndex].id === reverseRoom.players[0].id,
  'Reversa con 2 jugadores actúa como Salta.',
)

const drawRoom = roomWithTop({ id: 't', color: 'green', value: '4' }, 'green', {
  id: 'd2',
  color: 'green',
  value: 'draw2',
})
const before = drawRoom.players[1].hand.length
playCard(drawRoom, drawRoom.players[0], 'd2')
assert(drawRoom.players[1].hand.length === before + 2, 'El +2 hace tomar 2.')

const unoRoom = roomWithTop({ id: 't', color: 'yellow', value: '8' }, 'yellow', {
  id: 'last',
  color: 'yellow',
  value: '8',
})
unoRoom.players[0].hand = [
  { id: 'keep', color: 'yellow', value: '2' },
  { id: 'last', color: 'yellow', value: '8' },
]
playCard(unoRoom, unoRoom.players[0], 'last')
assert(unoRoom.players[0].hand.length === 1, 'Queda una carta.')
assert(!unoRoom.players[0].saidUno, 'Todavía no cantó UNO.')
callUno(unoRoom, unoRoom.players[0])
assert(unoRoom.players[0].saidUno, 'Cantar UNO queda marcado.')

const calloutRoom = roomWithTop({ id: 't', color: 'red', value: '1' }, 'red', {
  id: 'n1',
  color: 'red',
  value: '1',
})
calloutRoom.players[1].hand = [{ id: 'only', color: 'blue', value: '3' }]
calloutRoom.players[1].saidUno = false
calloutRoom.currentPlayerIndex = 0
const handBefore = calloutRoom.players[1].hand.length
calloutPlayer(calloutRoom, calloutRoom.players[0], calloutRoom.players[1].id)
assert(calloutRoom.players[1].hand.length === handBefore + 2, 'Delatar hace tomar 2.')

const passRoom = roomWithTop({ id: 't', color: 'blue', value: '9' }, 'blue')
passRoom.players[0].hand = [{ id: 'mismatch', color: 'red', value: '0' }]
const drawn = drawCard(passRoom, passRoom.players[0])
assert(drawn, 'Se puede tomar del mazo.')
if (drawn && !isPlayable(drawn, { id: 't', color: 'blue', value: '9' }, 'blue')) {
  assert(passRoom.currentPlayerIndex === 1, 'Si no entra, pasa el turno.')
}

assert(describeCard(wild) === 'Comodín', 'El comodín se nombra.')
assert(describeCard({ id: 'x', color: 'red', value: 'skip' }) === 'Rojo Salta', 'Salta lleva color.')

console.log('uno selfcheck: ok')
