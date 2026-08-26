import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiga } from '../hooks/useLiga'
import { PRESETS, TRAINER_ORDER } from '../liga/constants'
import { speciesOf } from '../liga/dex'
import { ITEM_LABELS, ROOM_LABELS, TRAINER_LABELS, TRAINER_TITLE } from '../liga/labels'
import { spriteUrl } from '../liga/sprites'
import { speciesLabel } from '../liga/team'
import { LIGA_MANUAL } from '../shared/manuals'
import { LigaBattleView } from './liga/LigaBattle'
import { LigaChrome } from './liga/LigaChrome'
import { LigaHp } from './liga/LigaHp'
import { LigaItemIcon } from './liga/LigaItemIcon'
import { LigaMap } from './liga/LigaMap'
import { LigaPad } from './liga/LigaPad'
import { LigaSpeech } from './liga/LigaSpeech'
import { LigaTypes } from './liga/LigaTypes'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'
import { TableHud } from './TableHud'

type LigaGameProps = {
  onBack: () => void
}

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

function fullscreenNode(): Element | null {
  const doc = document as FsDoc
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

export function LigaGame({ onBack }: LigaGameProps) {
  const game = useLiga()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [wide, setWide] = useState(false)
  const [portrait, setPortrait] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const nativeFs = useRef(false)
  const { state } = game
  const beaten = TRAINER_ORDER.filter((id) => state.trainers[id].beaten).length

  const lockLandscape = useCallback(async () => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> }
    try {
      await orientation.lock?.('landscape')
    } catch {
      /* el celu puede ignorar el lock si no hay fullscreen */
    }
  }, [])

  const leaveWide = useCallback(() => {
    const doc = document as FsDoc
    if (fullscreenNode()) {
      void (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.())
    }
    try {
      screen.orientation.unlock()
    } catch {
      /* noop */
    }
    nativeFs.current = false
    setWide(false)
    document.body.classList.remove('is-liga-wide')
  }, [])

  const toggleWide = useCallback(() => {
    const node = screenRef.current
    if (!node) {
      return
    }
    if (fullscreenNode() || wide) {
      leaveWide()
      return
    }
    const box = node as FsEl
    const go = box.requestFullscreen?.() ?? box.webkitRequestFullscreen?.()
    setWide(true)
    document.body.classList.add('is-liga-wide')
    void Promise.resolve(go)
      .then(() => {
        if (fullscreenNode()) {
          nativeFs.current = true
        }
        return lockLandscape()
      })
      .catch(() => lockLandscape())
  }, [leaveWide, lockLandscape, wide])

  useEffect(() => {
    const onFull = () => {
      if (fullscreenNode()) {
        nativeFs.current = true
        setWide(true)
        document.body.classList.add('is-liga-wide')
        void lockLandscape()
        return
      }
      if (!nativeFs.current) {
        return
      }
      nativeFs.current = false
      try {
        screen.orientation.unlock()
      } catch {
        /* noop */
      }
      setWide(false)
      document.body.classList.remove('is-liga-wide')
    }
    const onOrient = () => setPortrait(window.matchMedia('(orientation: portrait)').matches)
    onOrient()
    document.addEventListener('fullscreenchange', onFull)
    document.addEventListener('webkitfullscreenchange' as 'fullscreenchange', onFull)
    window.addEventListener('orientationchange', onOrient)
    window.addEventListener('resize', onOrient)
    return () => {
      document.removeEventListener('fullscreenchange', onFull)
      document.removeEventListener('webkitfullscreenchange' as 'fullscreenchange', onFull)
      window.removeEventListener('orientationchange', onOrient)
      window.removeEventListener('resize', onOrient)
      document.body.classList.remove('is-liga-wide')
    }
  }, [lockLandscape])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'f' && event.key !== 'F') {
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }
      event.preventDefault()
      toggleWide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleWide])

  return (
    <div className={`app${wide ? ' is-liga-wide' : ''}`}>
      <TableHud onManual={() => setRulesOpen(true)} />
      <div className="shell liga-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <p className="eyebrow">Alto Mando</p>
            <h1>Liga</h1>
            <p className="lede">Ever Grande, como en Esmeralda. Seis Pokémon al azar. Flechas, Z y X, como en la GBA.</p>
          </header>

          <div className="field">
            <span>Dificultad</span>
            <div className="segmented">
              {game.difficulties.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={game.difficulty === id ? 'is-on' : ''}
                  onClick={() => game.changeDifficulty(id)}
                >
                  {PRESETS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn btn-gold" onClick={() => game.resetGame()}>
              Nueva liga
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Elegir juego
            </button>
          </div>
        </aside>

        <main className="table liga-table" data-manual="board">
          <div ref={screenRef} className={`liga-screen${wide ? ' is-wide' : ''}`}>
            <LigaChrome wide={wide} onToggleWide={toggleWide} />
            {wide && portrait ? <p className="liga-rotate">Girar el celular</p> : null}
            <div className="liga-stage">
              {state.phase === 'battle' && state.battle ? (
                <LigaBattleView
                  battle={state.battle}
                  bag={game.bag}
                  itemPick={game.itemPick}
                  cursor={game.cursor}
                  animating={game.animating}
                  anim={game.anim}
                  field={game.field}
                  turbo={game.turbo}
                  hint={game.hint}
                  speechSkip={game.speechSkip}
                  onSpeechReady={game.setSpeechReady}
                />
              ) : (
                <>
                  <LigaMap state={state} walk={game.walk} walkT={game.walkT} />
                  {state.dialog ? (
                    <div className="liga-dialog">
                      <LigaSpeech
                        text={state.dialog}
                        turbo={game.turbo}
                        reveal={game.speechSkip}
                        onReady={game.setSpeechReady}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <LigaPad onDown={game.pressDown} onUp={game.pressUp} />
          </div>
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="status-card">
            <p>{game.statusText}</p>
          </div>
          <div className="scores">
            <div className="score">
              <div>
                <strong>{ROOM_LABELS[state.room]}</strong>
                <span>{beaten}/5 del Alto Mando</span>
              </div>
            </div>
          </div>
          <div className="liga-roster">
            {(state.battle?.playerParty ?? state.party).map((slot, index) => {
              const shown =
                game.field && state.battle && index === state.battle.playerActive
                  ? { ...slot, hp: game.field.player.hp }
                  : slot
              return (
              <div key={`${slot.speciesId}-${index}`} className="liga-roster-row">
                <img src={spriteUrl(shown.speciesId)} alt="" width={32} height={32} />
                <div>
                  <strong>{speciesLabel(shown)}</strong>
                  <span>
                    Nv.{shown.level} · <LigaTypes types={speciesOf(shown.speciesId).types} />
                  </span>
                  <LigaHp hp={shown.hp} max={shown.maxHp} />
                </div>
              </div>
              )
            })}
          </div>
          <div className="liga-bag-readout">
            {game.bag.length === 0 ? <p>Sin objetos.</p> : null}
            {game.bag.map((item) => (
              <span key={item.id}>
                <LigaItemIcon id={item.id} />
                {ITEM_LABELS[item.id]} ×{item.count}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <ManualTour open={rulesOpen} steps={LIGA_MANUAL} onClose={() => setRulesOpen(false)} />
      <ResultOverlay
        open={state.phase === 'won' || state.phase === 'lost'}
        eyebrow={state.phase === 'won' ? 'Liga Pokémon' : 'Alto Mando'}
        title={state.phase === 'won' ? 'Campeón' : 'Equipo debilitado'}
        detail={
          state.phase === 'won'
            ? `Venciste a ${TRAINER_TITLE.steven} ${TRAINER_LABELS.steven}. Nueva liga, otro equipo de seis.`
            : 'Se acabaron los Pokémon. Nueva liga reparte otro equipo y otra mochila.'
        }
        variant={state.phase === 'won' ? 'win' : 'loss'}
        rematchLabel="Nueva liga"
        onRematch={() => game.resetGame()}
        onMenu={onBack}
      />
    </div>
  )
}
