import { useCallback, useMemo, useState } from 'react'
import { useUno } from '../hooks/useUno'
import { COLOR_HEX, COLOR_LABELS, COLOR_OPTIONS } from '../uno/labels'
import type { Card, Color, PublicPlayer, PublicRoomState } from '../uno/types'
import { UNO_MANUAL } from '../shared/manuals'
import { CardFace } from './uno/CardFace'
import { PlayerAvatar } from './uno/PlayerAvatar'
import { VictoryOverlay } from './uno/VictoryOverlay'
import { ManualTour } from './ManualTour'
import { TableHud } from './TableHud'

type UnoGameProps = {
  onBack: () => void
}

function seatPosition(index: number, total: number): { x: number; y: number } {
  const angle = Math.PI / 2 + (index / total) * Math.PI * 2
  const rx = 44
  const ry = 40
  return { x: 50 + rx * Math.cos(angle), y: 50 + ry * Math.sin(angle) }
}

export function UnoGame({ onBack }: UnoGameProps) {
  const game = useUno()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pendingWild, setPendingWild] = useState<string | null>(null)
  const [openPopoverFor, setOpenPopoverFor] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { session, room } = game
  const you = room?.players.find((p) => p.id === session?.playerId)
  const isHost = you?.isHost ?? false
  const isMyTurn = room?.status === 'playing' && room.players[room.currentPlayerIndex]?.id === session?.playerId

  const orderedSeats = useMemo(() => {
    if (!room || !session) return []
    const players = room.players
    const youIdx = players.findIndex((p) => p.id === session.playerId)
    if (youIdx === -1) return players.map((p, i) => ({ player: p, ...seatPosition(i, players.length) }))
    const rotated = [...players.slice(youIdx), ...players.slice(0, youIdx)]
    return rotated.map((p, i) => ({ player: p, ...seatPosition(i, players.length) }))
  }, [room, session])

  function isCardPlayable(card: Card): boolean {
    if (!room || !room.topCard || !room.currentColor) return false
    if (card.color === 'wild') return true
    if (card.color === room.currentColor) return true
    if (card.value === room.topCard.value) return true
    return false
  }

  function handleCardClick(card: Card) {
    if (!isMyTurn) return
    if (!isCardPlayable(card)) return
    if (card.color === 'wild') {
      setPendingWild(card.id)
      return
    }
    game.playCard(card.id)
  }

  function handleChooseColor(color: Color) {
    if (!pendingWild) return
    const cardId = pendingWild
    setPendingWild(null)
    game.playCard(cardId, color)
  }

  const copyCode = useCallback(() => {
    if (!room) return
    navigator.clipboard?.writeText(room.id).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }, [room])

  const myHand = room?.you?.hand ?? []
  const canCallUno = !!you && myHand.length === 1 && !you.saidUno
  const statusLabel =
    room?.status === 'lobby' ? 'Esperando' : room?.status === 'playing' ? 'En juego' : room?.status === 'finished' ? 'Terminó' : 'Sala'

  return (
    <div className="app">
      <TableHud onManual={() => setRulesOpen(true)} />
      <div className="shell uno-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">Naipes</p>
            <h1>UNO</h1>
            <p className="lede">Hasta seis jugadores. Un nombre y un código corto, sin cuenta.</p>
          </header>

          {!session && (
            <>
              <div className="field">
                <span>Sala</span>
                <div className="segmented">
                  <button type="button" className={mode === 'create' ? 'is-on' : ''} onClick={() => setMode('create')}>
                    Crear
                  </button>
                  <button type="button" className={mode === 'join' ? 'is-on' : ''} onClick={() => setMode('join')}>
                    Entrar
                  </button>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void game.enter(mode, name, code)
                }}
              >
                <label className="field">
                  <span>Tu nombre</span>
                  <input
                    value={name}
                    maxLength={20}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Sam"
                    autoComplete="off"
                  />
                </label>
                {mode === 'join' && (
                  <label className="field">
                    <span>Código</span>
                    <input
                      value={code}
                      maxLength={6}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ej. X7K2Q"
                      autoComplete="off"
                      className="uno-code-input"
                    />
                  </label>
                )}
                {game.error && <p className="uno-error">{game.error}</p>}
                <div className="actions">
                  <button type="submit" className="btn btn-gold" disabled={game.busy}>
                    {game.busy ? 'Un segundo…' : mode === 'create' ? 'Crear sala' : 'Entrar'}
                  </button>
                </div>
              </form>
            </>
          )}

          {session && room && (
            <>
              <div className="field">
                <span>Sala</span>
                <div className="uno-copy-row">
                  <span className="uno-room-code">{room.id}</span>
                  <button type="button" className="btn btn-ghost" onClick={copyCode}>
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
              <p className="uno-badge">{statusLabel}</p>
              {game.error && <p className="uno-error">{game.error}</p>}
              {room.status === 'lobby' && isHost && (
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-gold"
                    disabled={room.players.length < 2 || room.players.length > 6}
                    onClick={game.start}
                  >
                    {room.players.length < 2 ? 'Faltan jugadores' : 'Empezar'}
                  </button>
                </div>
              )}
              <div className="actions">
                <button type="button" className="btn uno-leave" onClick={game.leave}>
                  Salir de la sala
                </button>
              </div>
            </>
          )}

          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table uno-table" data-manual="board">
          {!room && (
            <div className="uno-felt">
              <p className="lede">Creá una sala o entrá con el código. En la misma computadora se puede jugar entre pestañas; en la red local, con el servidor de desarrollo.</p>
            </div>
          )}

          {room?.status === 'lobby' && <Lobby room={room} isHost={isHost} onStart={game.start} />}

          {room && room.status !== 'lobby' && session && (
            <>
              <div className="uno-turn">
                {isMyTurn ? 'Tu turno' : `Turno de ${room.players[room.currentPlayerIndex]?.name ?? '…'}`}
                <span>{room.currentColor ? `Color: ${COLOR_LABELS[room.currentColor]}` : ''}</span>
              </div>

              <div className="uno-felt uno-table-ring">
                {orderedSeats.map(({ player, x, y }) => (
                  <PlayerAvatar
                    key={player.id}
                    player={player}
                    x={x}
                    y={y}
                    isYou={player.id === session.playerId}
                    isTurn={room.players[room.currentPlayerIndex]?.id === player.id}
                    bubble={game.bubbles.find((b) => b.playerId === player.id)?.phrase}
                    popoverOpen={openPopoverFor === player.id}
                    onAvatarClick={() => {
                      if (player.id !== session.playerId) return
                      setOpenPopoverFor((cur) => (cur === player.id ? null : player.id))
                    }}
                    onClosePopover={() => setOpenPopoverFor(null)}
                    onPickPhrase={(phrase) => {
                      game.sendChat(phrase)
                      setOpenPopoverFor(null)
                    }}
                    onCallout={() => game.callout(player.id)}
                    showCallout={player.id !== session.playerId && player.handCount === 1 && !player.saidUno}
                  />
                ))}

                <div className="uno-table-center">
                  <div className="uno-pile">
                    <span className="uno-pile-label">Mazo · {room.drawPileCount}</span>
                    <button
                      type="button"
                      className="uno-draw-stack"
                      disabled={!isMyTurn}
                      onClick={game.draw}
                      aria-label="Tomar una carta"
                    >
                      <span className="uno-stack-card" />
                      <span className="uno-stack-card" />
                      <span className="uno-stack-card" />
                    </button>
                  </div>

                  <div className="uno-pile">
                    <span className="uno-pile-label">Descarte</span>
                    {room.topCard && <CardFace card={room.topCard} />}
                    {room.currentColor && (
                      <span className="uno-color-ring">
                        <span className="uno-color-dot" style={{ background: COLOR_HEX[room.currentColor] }} />
                        {COLOR_LABELS[room.currentColor]}
                      </span>
                    )}
                  </div>
                </div>

                {room.status === 'playing' && (
                  <div className="uno-action-dock">
                    <button type="button" className="uno-button" disabled={!canCallUno} onClick={game.callUno}>
                      UNO!
                    </button>
                  </div>
                )}
              </div>

              {room.status === 'playing' && (
                <div className="uno-hand-dock" data-manual="hand">
                  <div className="uno-hand-fan">
                    {myHand.map((card) => {
                      const playable = isMyTurn && isCardPlayable(card)
                      return (
                        <div className="uno-hand-slot" key={card.id}>
                          <button
                            type="button"
                            className={playable ? 'is-playable' : ''}
                            disabled={!playable}
                            onClick={() => handleCardClick(card)}
                          >
                            <CardFace card={card} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="status-card">
            <p>
              {!room
                ? '2 a 6 jugadores. El anfitrión empieza cuando están todos.'
                : room.status === 'lobby'
                  ? `${room.players.length}/6 en la sala.`
                  : isMyTurn
                    ? 'Tirás una carta que coincida o tomás del mazo.'
                    : `Espera: ${room.players[room.currentPlayerIndex]?.name ?? '…'}.`}
            </p>
          </div>
          <div className="uno-log" aria-label="Mesa">
            {(room?.log ?? []).length === 0 && <p className="uno-log-row is-meta">Todavía no pasó nada.</p>}
            {(room?.log ?? []).map((entry) => (
              <p className="uno-log-row" key={entry.id}>
                {entry.text}
              </p>
            ))}
          </div>
        </aside>
      </div>

      {pendingWild && (
        <div className="modal-backdrop" onClick={() => setPendingWild(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Elegí un color</p>
            <h2>Comodín</h2>
            <div className="uno-color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.key} type="button" className={`uno-swatch ${c.key}`} onClick={() => handleChooseColor(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {game.victory && <VictoryOverlay winnerName={game.victory.winnerName} onClose={game.dismissVictory} />}

      <ManualTour open={rulesOpen} title="UNO" steps={UNO_MANUAL} onClose={() => setRulesOpen(false)} />
    </div>
  )
}

function Lobby({ room, isHost, onStart }: { room: PublicRoomState; isHost: boolean; onStart: () => void }) {
  const canStart = isHost && room.players.length >= 2 && room.players.length <= 6
  return (
    <div className="uno-lobby">
      <p className="eyebrow">Lobby · {room.players.length}/6</p>
      <h2>Esperando jugadores</h2>
      <p className="lede">Compartí el código. El anfitrión empieza con 2 a 6 jugadores.</p>
      <div className="uno-player-grid">
        {room.players.map((p: PublicPlayer) => (
          <div key={p.id} className={`uno-player-chip${p.connected ? '' : ' is-off'}`}>
            <span className="uno-dot" />
            <div>
              <div className="uno-player-name">{p.name}</div>
              <div className="uno-player-role">{p.isHost ? 'Anfitrión' : 'Jugador'}</div>
            </div>
          </div>
        ))}
      </div>
      {!isHost && <p className="lede">Esperando a que el anfitrión empiece…</p>}
      {isHost && (
        <div className="actions">
          <button type="button" className="btn btn-gold" disabled={!canStart} onClick={onStart}>
            {room.players.length < 2 ? 'Faltan jugadores' : 'Empezar'}
          </button>
        </div>
      )}
    </div>
  )
}
