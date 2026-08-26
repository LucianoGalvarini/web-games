import type { LigaItemId } from '../../liga/types'

type LigaItemIconProps = {
  id: LigaItemId
}

function bottle(body: string, shine: string) {
  return (
    <>
      <rect x="6" y="1" width="4" height="2" fill="#d8c898" />
      <rect x="7" y="3" width="2" height="2" fill="#efe4c8" />
      <rect x="4" y="5" width="8" height="10" fill={body} />
      <rect x="5" y="6" width="2" height="5" fill={shine} />
    </>
  )
}

function spray(body: string, shine: string) {
  return (
    <>
      <rect x="5" y="1" width="6" height="2" fill="#c8b890" />
      <rect x="7" y="3" width="2" height="2" fill="#8a8070" />
      <rect x="3" y="5" width="10" height="10" fill={body} />
      <rect x="4" y="6" width="3" height="4" fill={shine} />
    </>
  )
}

function orb(body: string, core: string) {
  return (
    <>
      <rect x="5" y="2" width="6" height="12" fill={body} />
      <rect x="3" y="4" width="10" height="8" fill={body} />
      <rect x="6" y="5" width="3" height="3" fill={core} />
    </>
  )
}

function xItem(body: string) {
  return (
    <>
      <rect x="3" y="3" width="10" height="10" fill={body} />
      <rect x="4" y="4" width="8" height="8" fill="#f8f0d8" />
      <rect x="7" y="5" width="2" height="6" fill={body} />
      <rect x="5" y="7" width="6" height="2" fill={body} />
    </>
  )
}

function glyph(id: LigaItemId) {
  switch (id) {
    case 'potion':
      return bottle('#e07090', '#f4b8c8')
    case 'super-potion':
      return bottle('#e8c040', '#f8e090')
    case 'hyper-potion':
      return spray('#6a90d8', '#b0c8f0')
    case 'full-restore':
      return spray('#4050c8', '#98a8f0')
    case 'revive':
      return orb('#e0b040', '#fff0b0')
    case 'max-revive':
      return orb('#f0d060', '#fff8d8')
    case 'full-heal':
      return bottle('#f0d050', '#fff4b0')
    case 'x-attack':
      return xItem('#d04040')
    case 'x-sp-atk':
      return xItem('#4068d0')
    case 'x-speed':
      return xItem('#d0a028')
  }
}

export function LigaItemIcon({ id }: LigaItemIconProps) {
  return (
    <svg className="liga-item-icon" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
      {glyph(id)}
    </svg>
  )
}
