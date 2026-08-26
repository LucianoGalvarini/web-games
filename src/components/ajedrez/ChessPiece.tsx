import { useId } from 'react'
import type { PieceKind } from '../../ajedrez'
import type { Player } from '../../shared/types'

type ChessPieceProps = {
  kind: PieceKind
  player: Player
}

type Tone = {
  light: string
  dark: string
  stroke: string
  ink: string
}

function tone(player: Player): Tone {
  if (player === 'white') {
    return { light: '#fff6e8', dark: '#d7b889', stroke: '#5b3918', ink: '#3d2918' }
  }
  return { light: '#3c2a1c', dark: '#140c08', stroke: '#e4b45a', ink: '#f0d59a' }
}

function Pedestal() {
  return (
    <g>
      <path d="M14.2 36.2h19.6l2.9 3.6H11.3z" />
      <rect x="10.4" y="39.5" width="27.2" height="3.6" rx="1.15" />
    </g>
  )
}

function Collar({ cy, rx }: { cy: number; rx: number }) {
  return <ellipse cx="24" cy={cy} rx={rx} ry="1.55" />
}

function Pawn() {
  return (
    <g>
      <circle cx="24" cy="12.2" r="6.1" />
      <Collar cy="18.6" rx="5.4" />
      <path d="M18.4 20.1c-1.2 5.2-2.4 10.6-3.6 15.9h18.4c-1.2-5.3-2.4-10.7-3.6-15.9-2.2 1.4-9 1.4-11.2 0z" />
      <Pedestal />
    </g>
  )
}

function Knight({ ink }: { ink: string }) {
  // Silueta Staunton de Colin M.L. Burnett (Wikimedia, CC BY-SA 3.0).
  return (
    <g transform="translate(1.5 3)" fillRule="evenodd" strokeWidth="1.5">
      <path d="M22 10C32.5 11 38.5 18 38 39H15C15 30 25 32.5 23 18" />
      <path d="M24 18C24.38 20.91 18.45 25.37 16 27C13 29 13.18 31.34 11 31C9.958 30.06 12.41 27.96 11 28C10 28 11.19 29.23 10 30C9 30 5.997 31 6 26C6 24 12 14 12 14C12 14 13.89 12.1 14 10.5C13.27 9.506 13.5 8.5 13.5 7.5C14.5 6.5 16.5 10 16.5 10H18.5C18.5 10 19.28 8.008 21 7C22 7 22 10 22 10" />
      <path d="M9.5 25.5A.5.5 0 1 1 8.5 25.5A.5.5 0 1 1 9.5 25.5z" fill={ink} stroke={ink} />
      <path
        d="M15 15.5A.5 1.5 0 1 1 14 15.5A.5 1.5 0 1 1 15 15.5z"
        transform="matrix(.866 .5 -.5 .866 9.693 -5.173)"
        fill={ink}
        stroke={ink}
      />
    </g>
  )
}

function Bishop({ ink }: { ink: string }) {
  return (
    <g>
      <circle cx="24" cy="6.6" r="2.05" />
      <path d="M24 8.8C18.2 16.4 16.4 23.6 16.8 29.4c.2 1.8 14.2 1.8 14.4 0C31.6 23.6 29.8 16.4 24 8.8z" />
      <path d="M24 12.2v13.4" fill="none" stroke={ink} strokeWidth="1.2" />
      <path d="M21.4 18.4h5.2" fill="none" stroke={ink} strokeWidth="1.05" />
      <Collar cy="31.2" rx="7.2" />
      <path d="M17.6 32.6c-.6 1.8-1.5 2.8-2.6 3.6h19.8c-1.1-.8-2-1.8-2.6-3.6z" />
      <Pedestal />
    </g>
  )
}

function Rook() {
  return (
    <g>
      <path d="M12.2 7.4h5.2v4.2h4.2V7.4h5.2v4.2h4.2V7.4h5.2v9.2H12.2z" />
      <path d="M15.4 16.8h17.2l1.6 16.2H13.8z" />
      <Collar cy="33.6" rx="10.4" />
      <Pedestal />
    </g>
  )
}

function Queen() {
  return (
    <g>
      <path d="M12.2 18.2 10.4 9.6l6.2 5.4L18 6.8l5 7.4L24 5.6l1 8.6 5-7.4 1.4 8.2 6.2-5.4-1.8 8.6z" />
      <circle cx="10.4" cy="9.2" r="1.75" />
      <circle cx="18" cy="6.5" r="1.75" />
      <circle cx="24" cy="5.2" r="2" />
      <circle cx="30" cy="6.5" r="1.75" />
      <circle cx="37.6" cy="9.2" r="1.75" />
      <Collar cy="20.4" rx="9.6" />
      <path d="M16.4 21.8c-1.1 4.8-2.1 9.6-3.2 14.4h21.6c-1.1-4.8-2.1-9.6-3.2-14.4-2.4 1.5-12.8 1.5-15.2 0z" />
      <Pedestal />
    </g>
  )
}

function King() {
  return (
    <g>
      <path d="M22.5 3.6h3v3.2h3.2v3H25.5v3.2h-3V9.8h-3.2v-3H22.5z" />
      <path d="M15.2 15.4c2.6 2.6 5.6 3.7 8.8 3.7s6.2-1.1 8.8-3.7l1.4 4.4c-2.8 2.6-6.4 3.8-10.2 3.8s-7.4-1.2-10.2-3.8z" />
      <Collar cy="24.6" rx="9.2" />
      <path d="M16.2 26c-1 3.6-2 7.2-3 10.2h21.6c-1-3-2-6.6-3-10.2-2.4 1.4-13.2 1.4-15.6 0z" />
      <Pedestal />
    </g>
  )
}

export function ChessPiece({ kind, player }: ChessPieceProps) {
  const uid = useId().replace(/:/g, '')
  const color = tone(player)
  const fill = `url(#${uid}fill)`

  return (
    <svg viewBox="0 0 48 48" className="ajedrez-glyph" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}fill`} x1="18%" y1="6%" x2="84%" y2="96%">
          <stop offset="0%" stopColor={color.light} />
          <stop offset="100%" stopColor={color.dark} />
        </linearGradient>
      </defs>
      <g
        fill={fill}
        stroke={color.stroke}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {kind === 'p' ? <Pawn /> : null}
        {kind === 'n' ? <Knight ink={color.ink} /> : null}
        {kind === 'b' ? <Bishop ink={color.ink} /> : null}
        {kind === 'r' ? <Rook /> : null}
        {kind === 'q' ? <Queen /> : null}
        {kind === 'k' ? <King /> : null}
      </g>
    </svg>
  )
}
