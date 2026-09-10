import { useEffect, useRef, useState } from 'react'
import { usePokeAlbum } from '../hooks/usePokeAlbum'
import {
  ACHIEVEMENTS,
  DUPLICATE_SELL_VALUE,
  PACK_COST,
  PACK_LEGENDARY_COST,
  PACK_RARE_COST,
  PACK_SIZE,
  POKEMON,
  RARITY_LABEL,
} from '../pokealbum'
import type { Rarity } from '../pokealbum'
import { POKEALBUM_MANUAL } from '../shared/manuals'
import {
  cycleMusicTrack,
  getMusicTrackName,
  isMusicMuted,
  playSfx,
  preloadPackOpenSound,
  startMusic,
  stopMusic,
  toggleMusicMuted,
} from '../shared/sfx'
import { AchievementsModal } from './pokealbum/AchievementsModal'
import { AchievementToast } from './pokealbum/AchievementToast'
import { AlbumGrid } from './pokealbum/AlbumGrid'
import { ChangelogModal } from './pokealbum/ChangelogModal'
import { CheatLockOverlay } from './pokealbum/CheatLockOverlay'
import { CheatWipeOverlay } from './pokealbum/CheatWipeOverlay'
import { OverworldParade } from './pokealbum/OverworldParade'
import { PackReveal } from './pokealbum/PackReveal'
import { PokedexModal } from './pokealbum/PokedexModal'
import { ShinyChallengeModal } from './pokealbum/ShinyChallengeModal'
import { RouletteModal } from './pokealbum/RouletteModal'
import { SettingsMenu } from './pokealbum/SettingsMenu'
import { TieBugBonusModal } from './pokealbum/TieBugBonusModal'
import { TriviaCard } from './pokealbum/TriviaCard'
import { TriviaModal } from './pokealbum/TriviaModal'
import { ManualTour } from './ManualTour'
import { TableHud } from './TableHud'

type PokeAlbumGameProps = {
  onBack: () => void
}

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary']

let popupSeq = 0

export function PokeAlbumGame({ onBack }: PokeAlbumGameProps) {
  const game = usePokeAlbum()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [coinPopups, setCoinPopups] = useState<{ id: number; delta: number }[]>([])
  const [pokedexId, setPokedexId] = useState<number | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const [musicMuted, setMusicMuted] = useState(() => isMusicMuted())
  const [trackName, setTrackName] = useState(() => getMusicTrackName())
  const [clearFilterSignal, setClearFilterSignal] = useState(0)
  const prevCoins = useRef(game.coins)

  // "Ir a pegar"/"Ir a repetidas" jump to a page in the *unfiltered* album, but AlbumGrid pages
  // through its own filtered list whenever a rarity checkbox is off — so the jump silently did
  // nothing unless every checkbox happened to be checked. Clearing the filter first guarantees
  // the target page lines up with what these buttons actually navigate.
  const goToNextPending = () => {
    setClearFilterSignal((n) => n + 1)
    game.goToNextPending()
  }

  const goToNextDuplicate = () => {
    setClearFilterSignal((n) => n + 1)
    game.goToNextDuplicate()
  }

  const toggleMusic = () => {
    setMusicMuted(toggleMusicMuted())
    playSfx('hover')
  }

  const nextTrack = () => {
    setTrackName(cycleMusicTrack())
    playSfx('hover')
  }

  const copyCode = () => {
    navigator.clipboard
      ?.writeText(game.exportCode())
      .then(() => {
        setJustCopied(true)
        window.setTimeout(() => setJustCopied(false), 1600)
      })
      .catch(() => {})
  }


  useEffect(() => {
    playSfx('enter')
    startMusic()
    preloadPackOpenSound()
    return () => stopMusic()
  }, [])

  useEffect(() => {
    const delta = game.coins - prevCoins.current
    prevCoins.current = game.coins
    if (delta === 0) {
      return
    }
    const id = (popupSeq += 1)
    setCoinPopups((prev) => [...prev, { id, delta }])
    window.setTimeout(() => {
      setCoinPopups((prev) => prev.filter((popup) => popup.id !== id))
    }, 900)
  }, [game.coins])

  const rarityCounts = RARITIES.map((rarity) => {
    const ofRarity = POKEMON.filter((p) => p.rarity === rarity)
    const owned = ofRarity.filter((p) => game.entries[p.id]?.owned).length
    return { rarity, owned, total: ofRarity.length }
  })

  const totalDuplicateValue = POKEMON.reduce((sum, p) => {
    const duplicates = game.entries[p.id]?.duplicates ?? 0
    return sum + duplicates * DUPLICATE_SELL_VALUE[p.rarity]
  }, 0)

  const ownedIds = POKEMON.filter((p) => game.entries[p.id]?.owned).map((p) => p.id)

  return (
    <div className="app pokealbum-app">
      {game.cheatWiped && <CheatWipeOverlay onDismiss={game.dismissCheatWiped} />}
      {!game.cheatWiped && game.cheatLocked && <CheatLockOverlay remainingMs={game.cheatLockRemainingMs} />}
      <AchievementToast queue={game.achievementQueue} onDismiss={game.dismissAchievement} />
      <TableHud onManual={() => setRulesOpen(true)} />
      <OverworldParade ownedIds={ownedIds} />
      <div className="shell pokealbum-shell">
        <aside className="panel panel-controls" data-manual="controls">
          <header className="panel-header">
            <div className="pokealbum-header-top">
              <div>
                <p className="eyebrow">Kanto</p>
                <h1>Álbum Pokémon</h1>
              </div>
              <button
                type="button"
                className="pokealbum-menu-btn"
                onMouseEnter={() => playSfx('hover')}
                onClick={() => setMenuOpen(true)}
                aria-label="Menú"
                title="Menú"
              >
                ☰
              </button>
            </div>
            <p className="lede">Migrado del álbum de Excel: sobres, trivia y las 151 figuritas de Kanto.</p>
          </header>

          <div className="pokealbum-balance">
            <span>Saldo de monedas:</span>
            <strong>{game.coins}</strong>
            {coinPopups.map((popup) => (
              <span
                key={popup.id}
                className={`pokealbum-coin-popup${popup.delta > 0 ? ' is-gain' : ' is-loss'}`}
                aria-hidden="true"
              >
                {popup.delta > 0 ? `+${popup.delta}` : popup.delta}
              </span>
            ))}
          </div>

          <div className="field">
            <span>Costo por sobre: {PACK_COST} · Figuritas por sobre: {PACK_SIZE}</span>
            <button
              type="button"
              className="btn btn-gold"
              onMouseEnter={() => game.canOpenPack && playSfx('hover')}
              onClick={game.openBooster}
              disabled={!game.canOpenPack}
            >
              Abrir sobre
            </button>
          </div>

          <div className="field">
            <span>Sobre de raras: {PACK_RARE_COST} monedas · solo figuritas raras y legendarias</span>
            <button
              type="button"
              className="btn btn-gold pokealbum-premium-pack"
              onMouseEnter={() => game.canOpenRarePack && playSfx('hover')}
              onClick={game.openRarePack}
              disabled={!game.canOpenRarePack}
            >
              Abrir sobre de raras
            </button>
          </div>

          <div className="field">
            <span>Sobre de legendarias: {PACK_LEGENDARY_COST} monedas · solo legendarias</span>
            <button
              type="button"
              className="btn btn-gold pokealbum-premium-pack is-legendary"
              onMouseEnter={() => game.canOpenLegendaryPack && playSfx('hover')}
              onClick={game.openLegendaryPack}
              disabled={!game.canOpenLegendaryPack}
            >
              Abrir sobre de legendarias
            </button>
          </div>

          <TriviaCard
            active={game.trivia.status !== 'idle'}
            coins={game.coins}
            freeTriviaUsed={game.freeTriviaUsed}
            freeTriviaLimit={game.freeTriviaLimit}
            bonusQuestions={game.bonusQuestions}
            wagerBoost={game.wagerBoost}
            triviaStreak={game.triviaStreak}
            bestTriviaStreak={game.bestTriviaStreak}
            onStart={game.startTrivia}
          />

          <button
            type="button"
            className="btn btn-gold pokealbum-roulette-open"
            onMouseEnter={() => playSfx('hover')}
            onClick={() => setRouletteOpen(true)}
          >
            🎰 Ruleta y recompensas
            {game.canClaimDailyLogin && <span className="pokealbum-menu-dot" aria-hidden="true" />}
          </button>

          <button
            type="button"
            className="btn pokealbum-achievements-open"
            onMouseEnter={() => playSfx('hover')}
            onClick={() => setAchievementsOpen(true)}
          >
            🏆 Logros ({game.unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </button>
        </aside>

        <main className="table pokealbum-table" data-manual="board">
          {game.pending.length > 0 && (
            <div className="pokealbum-pending-banner">
              <span>
                Tenés {game.pending.length} figurita{game.pending.length === 1 ? '' : 's'} por pegar en el álbum.
              </span>
              <button
                type="button"
                className="btn btn-gold"
                onMouseEnter={() => playSfx('hover')}
                onClick={goToNextPending}
              >
                Ir a pegar
              </button>
            </div>
          )}
          <AlbumGrid
            entries={game.entries}
            page={game.page}
            pageCount={game.pageCount}
            pageSize={game.pageSize}
            pendingCounts={game.pendingCounts}
            clearFilterSignal={clearFilterSignal}
            coins={game.coins}
            shinyAttemptReadyAt={game.shinyAttemptReadyAt}
            shinyAttemptSkipCost={game.shinyAttemptSkipCost}
            onPageChange={game.goToPage}
            onSell={game.sellDuplicate}
            onStick={game.stickPending}
            onOpenPokedex={setPokedexId}
            onAttemptShiny={game.startShinyChallenge}
          />
        </main>

        <aside className="panel panel-stats" data-manual="stats">
          <div className="scores">
            <div className="score">
              <div>
                <strong>Figuritas obtenidas</strong>
                <span>
                  {game.stats.owned} / {game.stats.total}
                </span>
              </div>
            </div>
            <div className="score">
              <div>
                <strong>Total de repetidas</strong>
                <span>{game.stats.duplicates}</span>
              </div>
              {game.stats.duplicates > 0 && (
                <button
                  type="button"
                  className="btn"
                  onMouseEnter={() => playSfx('hover')}
                  onClick={goToNextDuplicate}
                >
                  Ir a repetidas
                </button>
              )}
              {game.stats.duplicates >= game.recycleCost && (
                <button
                  type="button"
                  className="btn btn-gold"
                  onMouseEnter={() => playSfx('hover')}
                  onClick={game.recycleDuplicates}
                >
                  Reciclar {game.recycleCost} repetidas → sobre
                </button>
              )}
              {game.stats.duplicates > 0 && (
                <button
                  type="button"
                  className="btn"
                  onMouseEnter={() => playSfx('hover')}
                  onClick={game.sellAllDuplicates}
                >
                  Vender todas (+{totalDuplicateValue})
                </button>
              )}
            </div>
            <div className="score">
              <div>
                <strong>Progreso</strong>
                <span>{Math.round((game.stats.owned / game.stats.total) * 100)}%</span>
              </div>
            </div>
          </div>
          <div className="pokealbum-progress-bar">
            <div
              className="pokealbum-progress-fill"
              style={{ width: `${(game.stats.owned / game.stats.total) * 100}%` }}
            />
          </div>
          <ul className="pokealbum-rarity-list">
            {rarityCounts.map(({ rarity, owned, total }) => (
              <li key={rarity}>
                <span>{RARITY_LABEL[rarity]}</span>
                <span>
                  {owned} / {total}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <ManualTour open={rulesOpen} steps={POKEALBUM_MANUAL} onClose={() => setRulesOpen(false)} />
      <PackReveal reveal={game.reveal} onClose={game.dismissReveal} />
      <PokedexModal
        id={pokedexId}
        isShinyUnlocked={pokedexId !== null && !!game.entries[pokedexId]?.shiny}
        onClose={() => setPokedexId(null)}
      />
      <TriviaModal
        trivia={game.trivia}
        triviaStreak={game.triviaStreak}
        bestTriviaStreak={game.bestTriviaStreak}
        onRetry={() => game.startTrivia(0)}
        onNewQuestion={game.resetTrivia}
        onExpire={game.expireTrivia}
        onAnswerStatPair={game.answerStatPair}
        onAnswerTrueFalse={game.answerTrueFalse}
        onAnswerMultipleChoice={game.answerMultipleChoice}
        onAnswerTrainer={game.answerTrainer}
      />
      <ShinyChallengeModal
        challenge={game.shinyChallenge}
        onAnswer={game.answerShinyQuestion}
        onExpire={game.expireShinyQuestion}
        onContinue={game.continueShinyChallenge}
        onClose={game.closeShinyChallenge}
        onRetryLoad={game.startShinyChallenge}
      />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      <SettingsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        musicMuted={musicMuted}
        trackName={trackName}
        onToggleMusic={toggleMusic}
        onNextTrack={nextTrack}
        justCopied={justCopied}
        onCopyCode={copyCode}
        confirmingReset={game.confirmingReset}
        onRequestReset={game.requestReset}
        onConfirmReset={game.confirmReset}
        onCancelReset={game.cancelReset}
        onOpenChangelog={() => {
          setMenuOpen(false)
          setChangelogOpen(true)
        }}
        onBack={onBack}
      />
      <RouletteModal
        open={rouletteOpen}
        onClose={() => setRouletteOpen(false)}
        streak={game.dailyLoginStreak}
        nextDay={game.dailyLoginNextDay}
        canClaim={game.canClaimDailyLogin}
        rewards={game.dailyLoginRewards}
        streakLength={game.dailyLoginStreakLength}
        onClaimDailyLogin={game.claimDailyLogin}
        spinReadyAt={game.spinReadyAt}
        pendingSpin={game.pendingSpin}
        lastSpinResult={game.lastSpinResult}
        onSpin={game.spin}
        onClaimSpin={game.claimSpin}
      />
      <AchievementsModal
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        unlockedAchievements={game.unlockedAchievements}
      />
      <TieBugBonusModal
        open={game.tieBugBonusGranted}
        amount={game.tieBugBonusAmount}
        onClose={game.dismissTieBugBonus}
      />
    </div>
  )
}
