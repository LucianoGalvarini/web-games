import { createDeck, isWildCard, shuffle } from './deck'
import type { Card, Color, LogEntry, Player, RoomState } from './types'

const HAND_SIZE = 7

export class GameError extends Error {}

function log(room: RoomState, text: string) {
  const entry: LogEntry = { id: `l${room.log.length}-${Date.now()}`, text, ts: Date.now() }
  room.log.push(entry)
  if (room.log.length > 60) room.log.shift()
}

function reshuffleIfNeeded(room: RoomState) {
  if (room.drawPile.length > 0) return
  if (room.discardPile.length <= 1) return
  const top = room.discardPile[room.discardPile.length - 1]
  const rest = room.discardPile.slice(0, -1).map((c) => (isWildCard(c) ? { ...c, color: 'wild' as const } : c))
  room.drawPile = shuffle(rest)
  room.discardPile = [top]
  log(room, 'Se acabó el mazo: se mezcló el descarte.')
}

function drawOne(room: RoomState, player: Player): Card | null {
  reshuffleIfNeeded(room)
  const card = room.drawPile.pop()
  if (!card) return null
  player.hand.push(card)
  return card
}

export function drawN(room: RoomState, player: Player, n: number) {
  for (let i = 0; i < n; i++) {
    if (!drawOne(room, player)) break
  }
  if (player.hand.length !== 1) player.saidUno = false
}

function topCard(room: RoomState): Card {
  return room.discardPile[room.discardPile.length - 1]
}

function nextIndex(room: RoomState, from: number, steps = 1): number {
  const n = room.players.length
  let idx = from
  for (let i = 0; i < steps; i++) {
    idx = (idx + room.direction + n) % n
  }
  return idx
}

export function isPlayable(card: Card, top: Card, currentColor: Color): boolean {
  if (card.color === 'wild') return true
  if (card.color === currentColor) return true
  if (card.value === top.value) return true
  return false
}

export function startGame(room: RoomState) {
  if (room.status !== 'lobby') throw new GameError('La partida ya empezó.')
  if (room.players.length < 2) throw new GameError('Hacen falta al menos 2 jugadores.')
  if (room.players.length > 6) throw new GameError('Como máximo 6 jugadores.')

  let deck = shuffle(createDeck())
  for (const p of room.players) {
    p.hand = deck.splice(0, HAND_SIZE)
    p.saidUno = false
  }

  let first: Card | undefined
  const safety = deck.length + 5
  let tries = 0
  while (tries < safety) {
    tries += 1
    first = deck.shift()
    if (!first) break
    if (first.value === 'wild4') {
      deck.push(first)
      deck = shuffle(deck)
      continue
    }
    break
  }
  if (!first) throw new GameError('No se pudo repartir la carta inicial.')

  room.drawPile = deck
  room.discardPile = [first]
  room.status = 'playing'
  room.currentPlayerIndex = 0
  room.direction = 1
  room.winnerId = null
  room.drawStreak = { playerId: null, pendingDraw: 0 }

  const colors: Color[] = ['red', 'yellow', 'green', 'blue']
  room.currentColor = first.color === 'wild' ? colors[Math.floor(Math.random() * 4)] : (first.color as Color)

  log(room, `Empezó la partida. Primera carta: ${describeCard(first)}.`)

  if (first.value === 'skip') {
    log(room, `${room.players[0].name} pierde el turno por la carta inicial.`)
    room.currentPlayerIndex = nextIndex(room, 0)
  } else if (first.value === 'reverse') {
    room.direction = -1
    log(room, 'La carta inicial invierte el sentido.')
  } else if (first.value === 'draw2') {
    const victim = room.players[0]
    drawN(room, victim, 2)
    log(room, `${victim.name} toma 2 por la carta inicial y pierde el turno.`)
    room.currentPlayerIndex = nextIndex(room, 0)
  }
}

export function describeCard(card: Card): string {
  const colorLabel = card.color === 'wild' ? 'Comodín' : capitalize(card.color)
  const valueMap: Record<string, string> = {
    skip: 'Salta',
    reverse: 'Reversa',
    draw2: '+2',
    wild: 'Comodín',
    wild4: '+4',
  }
  if (card.value === 'wild' || card.value === 'wild4') return valueMap[card.value]
  const valueLabel = valueMap[card.value] ?? card.value
  return `${colorLabel} ${valueLabel}`
}

function capitalize(s: string) {
  const names: Record<string, string> = {
    red: 'Rojo',
    yellow: 'Amarillo',
    green: 'Verde',
    blue: 'Azul',
  }
  return names[s] ?? s.charAt(0).toUpperCase() + s.slice(1)
}

export function playCard(room: RoomState, player: Player, cardId: string, chosenColor?: Color) {
  if (room.status !== 'playing') throw new GameError('La partida no está en juego.')
  const player_ = room.players[room.currentPlayerIndex]
  if (player_.id !== player.id) throw new GameError('No es tu turno.')

  const cardIdx = player.hand.findIndex((c) => c.id === cardId)
  if (cardIdx === -1) throw new GameError('No tenés esa carta.')
  const card = player.hand[cardIdx]
  const top = topCard(room)

  if (!isPlayable(card, top, room.currentColor)) {
    throw new GameError('Esa carta no coincide con el color, número o símbolo.')
  }
  if (isWildCard(card) && !chosenColor) {
    throw new GameError('Elegí un color para el comodín.')
  }

  player.hand.splice(cardIdx, 1)
  room.discardPile.push(card)

  if (isWildCard(card)) {
    room.currentColor = chosenColor as Color
  } else {
    room.currentColor = card.color as Color
  }

  log(
    room,
    `${player.name} jugó ${describeCard(card)}${isWildCard(card) ? ` y eligió ${capitalize(room.currentColor)}` : ''}.`,
  )

  if (player.hand.length !== 1) {
    player.saidUno = false
  }

  if (player.hand.length === 0) {
    room.status = 'finished'
    room.winnerId = player.id
    log(room, `${player.name} jugó la última carta y ganó.`)
    return
  }

  let steps = 1
  let skipMessage: string | null = null

  if (card.value === 'reverse') {
    if (room.players.length === 2) {
      steps = 2
    } else {
      room.direction = room.direction === 1 ? -1 : 1
    }
  } else if (card.value === 'skip') {
    steps = 2
    const skipped = room.players[nextIndex(room, room.currentPlayerIndex)]
    skipMessage = `${skipped.name} pierde el turno.`
  } else if (card.value === 'draw2') {
    const victimIdx = nextIndex(room, room.currentPlayerIndex)
    const victim = room.players[victimIdx]
    drawN(room, victim, 2)
    log(room, `${victim.name} toma 2 cartas y pierde el turno.`)
    steps = 2
  } else if (card.value === 'wild4') {
    const victimIdx = nextIndex(room, room.currentPlayerIndex)
    const victim = room.players[victimIdx]
    drawN(room, victim, 4)
    log(room, `${victim.name} toma 4 cartas y pierde el turno.`)
    steps = 2
  }

  room.currentPlayerIndex = nextIndex(room, room.currentPlayerIndex, steps)
  if (skipMessage) log(room, skipMessage)
}

export function drawCard(room: RoomState, player: Player): Card | null {
  if (room.status !== 'playing') throw new GameError('La partida no está en juego.')
  const current = room.players[room.currentPlayerIndex]
  if (current.id !== player.id) throw new GameError('No es tu turno.')

  const card = drawOne(room, player)
  if (!card) {
    log(room, 'No quedan cartas para tomar.')
  } else {
    log(room, `${player.name} tomó una carta.`)
  }
  if (player.hand.length !== 1) player.saidUno = false

  const top = topCard(room)
  if (!card || !isPlayable(card, top, room.currentColor)) {
    room.currentPlayerIndex = nextIndex(room, room.currentPlayerIndex)
  }
  return card
}

export function passTurn(room: RoomState, player: Player) {
  if (room.status !== 'playing') throw new GameError('La partida no está en juego.')
  const current = room.players[room.currentPlayerIndex]
  if (current.id !== player.id) throw new GameError('No es tu turno.')
  room.currentPlayerIndex = nextIndex(room, room.currentPlayerIndex)
  log(room, `${player.name} pasó.`)
}

export function callUno(room: RoomState, player: Player) {
  if (room.status !== 'playing') throw new GameError('La partida no está en juego.')
  if (player.hand.length !== 1) {
    throw new GameError('Solo podés cantar UNO con exactamente una carta.')
  }
  player.saidUno = true
  log(room, `${player.name} gritó ¡UNO!`)
}

export function removePlayer(room: RoomState, playerId: string): Player {
  const idx = room.players.findIndex((p) => p.id === playerId)
  if (idx === -1) throw new GameError('No se encontró al jugador.')
  const [removed] = room.players.splice(idx, 1)

  if (removed.hand.length) {
    room.drawPile = shuffle([...room.drawPile, ...removed.hand])
    removed.hand = []
  }
  log(room, `${removed.name} salió de la sala.`)

  if (removed.isHost && room.players.length > 0) {
    room.players[0].isHost = true
  }

  if (room.status === 'playing') {
    if (room.players.length < 2) {
      room.status = 'finished'
      room.winnerId = room.players.length === 1 ? room.players[0].id : null
      if (room.winnerId) {
        log(room, `${room.players[0].name} gana: no quedan rivales.`)
      } else {
        log(room, 'La partida terminó: no quedan jugadores.')
      }
    } else {
      const n = room.players.length
      if (idx < room.currentPlayerIndex) {
        room.currentPlayerIndex -= 1
      }
      room.currentPlayerIndex = ((room.currentPlayerIndex % n) + n) % n
    }
  }

  return removed
}

export function calloutPlayer(room: RoomState, accuser: Player, targetId: string) {
  if (room.status !== 'playing') throw new GameError('La partida no está en juego.')
  const target = room.players.find((p) => p.id === targetId)
  if (!target) throw new GameError('No se encontró al jugador.')
  if (target.id === accuser.id) throw new GameError('No te podés delatar a vos mismo.')
  if (target.hand.length !== 1 || target.saidUno) {
    throw new GameError(`${target.name} no tiene que ser delatado.`)
  }
  drawN(room, target, 2)
  target.saidUno = false
  log(room, `${accuser.name} delató a ${target.name} por no decir UNO: ${target.name} toma 2 cartas.`)
}
