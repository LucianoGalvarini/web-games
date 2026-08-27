import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiga } from '../hooks/useLiga'
import { TRAINER_ORDER } from '../liga/constants'
import { TRAINER_LABELS, TRAINER_TITLE } from '../liga/labels'
import { LIGA_MANUAL } from '../shared/manuals'
import { LigaBattleView } from './liga/LigaBattle'
import { LigaChrome } from './liga/LigaChrome'
import { LigaFieldMenu } from './liga/LigaFieldMenu'
import { LigaMap } from './liga/LigaMap'
import { LigaPad } from './liga/LigaPad'
import { LigaPartyDock } from './liga/LigaPartyDock'
import { LigaSpeech } from './liga/LigaSpeech'
import { ManualTour } from './ManualTour'
import { ResultOverlay } from './ResultOverlay'

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

const FS_HIDE: FullscreenOptions = { navigationUI: 'hide' }

function fullscreenNode(): Element | null {
  const doc = document as FsDoc
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

export function LigaGame({ onBack }: LigaGameProps) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const game = useLiga({
    onBack,
    onHelp: () => setRulesOpen(true),
  })
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
    const root = document.documentElement
    const go = root.requestFullscreen?.(FS_HIDE) ?? box.requestFullscreen?.(FS_HIDE) ?? box.webkitRequestFullscreen?.()
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
    <div className={`app is-liga-play${wide ? ' is-liga-wide' : ''}`}>
      <div className="shell liga-shell">
        <main className="table liga-table" data-manual="board">
          <div
            ref={screenRef}
            className={`liga-screen${wide ? ' is-wide' : ''}${
              game.fieldMenu === 'party' || game.fieldMenu === 'bag' ? ' is-menu' : ''
            }`}
          >
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
                  {!game.fieldMenu ? <LigaPartyDock party={state.party} /> : null}
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
              {game.fieldMenu ? (
                <LigaFieldMenu
                  screen={game.fieldMenu}
                  cursor={game.cursor}
                  swapFrom={game.swapFrom}
                  party={state.party}
                  bag={game.bag}
                  itemPick={game.itemPick}
                  difficulty={game.difficulty}
                  difficulties={game.difficulties}
                  room={state.room}
                  beaten={beaten}
                />
              ) : null}
            </div>
            <LigaPad turbo={game.turbo} onDown={game.pressDown} onUp={game.pressUp} />
          </div>
        </main>
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
