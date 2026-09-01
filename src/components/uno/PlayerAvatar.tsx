import type { PublicPlayer } from '../../uno/types'
import { QuickPhrasePopover } from './QuickPhrasePopover'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

type PlayerAvatarProps = {
  player: PublicPlayer
  x: number
  y: number
  isYou: boolean
  isTurn: boolean
  bubble?: string
  popoverOpen: boolean
  onAvatarClick: () => void
  onClosePopover: () => void
  onPickPhrase: (phrase: string) => void
  onCallout: () => void
  showCallout: boolean
}

export function PlayerAvatar({
  player,
  x,
  y,
  isYou,
  isTurn,
  bubble,
  popoverOpen,
  onAvatarClick,
  onClosePopover,
  onPickPhrase,
  onCallout,
  showCallout,
}: PlayerAvatarProps) {
  return (
    <div
      className={`uno-avatar-seat${isTurn ? ' is-turn' : ''}${isYou ? ' is-you' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {bubble && <div className="uno-avatar-bubble">{bubble}</div>}

      <button type="button" className="uno-avatar-circle" onClick={onAvatarClick} aria-label={`Asiento de ${player.name}`}>
        <span>{initials(player.name) || '?'}</span>
        <span className={`uno-avatar-status${player.connected ? '' : ' is-off'}`} />
        {player.handCount === 1 && player.saidUno && <span className="uno-flag">UNO!</span>}
      </button>

      <div className="uno-avatar-name">
        {player.name}
        {player.isHost && <span className="uno-avatar-host">Anfitrión</span>}
      </div>
      <div className="uno-avatar-hand">
        {player.handCount} {player.handCount === 1 ? 'carta' : 'cartas'}
      </div>

      {showCallout && (
        <button type="button" className="uno-callout" onClick={onCallout}>
          {player.name} no dijo UNO!
        </button>
      )}

      {popoverOpen && <QuickPhrasePopover onPick={onPickPhrase} onClose={onClosePopover} />}
    </div>
  )
}
