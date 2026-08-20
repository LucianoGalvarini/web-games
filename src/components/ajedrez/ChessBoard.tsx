import {
  BOARD_SIZE,
  fileOf,
  isLightSquare,
  pieceName,
  rankOf,
  squareLabel,
} from '../../ajedrez'
import type { PieceKind } from '../../ajedrez'
import type { Player } from '../../shared/types'
import { ChessPiece } from './ChessPiece'
import { PromotionPicker } from './PromotionPicker'

export type BoardPiece = {
  id: number
  index: number
  player: Player
  kind: PieceKind
  capturing?: boolean
}

type ChessBoardProps = {
  pieces: BoardPiece[]
  selected: number | null
  targets: number[]
  lastFrom: number | null
  lastTo: number | null
  checkIndex: number | null
  flipped: boolean
  disabled: boolean
  promoting: { from: number; to: number; player: Player } | null
  onSelect: (index: number) => void
  onPromote: (kind: PieceKind) => void
}

const CELLS = Array.from({ length: 64 }, (_, index) => index)

function displayIndex(index: number, flipped: boolean): { x: number; y: number } {
  const file = fileOf(index)
  const rank = rankOf(index)
  if (!flipped) {
    return { x: file, y: rank }
  }
  return { x: 7 - file, y: 7 - rank }
}

export function ChessBoard({
  pieces,
  selected,
  targets,
  lastFrom,
  lastTo,
  checkIndex,
  flipped,
  disabled,
  promoting,
  onSelect,
  onPromote,
}: ChessBoardProps) {
  return (
    <div className={`ajedrez-field ${disabled ? 'is-disabled' : ''}`}>
      <div className="ajedrez-cells">
        {CELLS.map((index) => {
          const light = isLightSquare(index)
          const pose = displayIndex(index, flipped)
          const target = targets.includes(index)
          const last = index === lastFrom || index === lastTo
          const check = index === checkIndex
          return (
            <button
              key={index}
              type="button"
              className={[
                'ajedrez-cell',
                light ? 'is-light' : 'is-dark',
                target ? 'is-target' : '',
                last ? 'is-last' : '',
                check ? 'is-check' : '',
                selected === index ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                gridColumn: pose.x + 1,
                gridRow: pose.y + 1,
              }}
              disabled={disabled}
              aria-label={squareLabel(index)}
              onClick={() => onSelect(index)}
            >
              {pose.y === 7 ? <span className="ajedrez-coord is-file">{'abcdefgh'[fileOf(index)]}</span> : null}
              {pose.x === 0 ? <span className="ajedrez-coord is-rank">{8 - rankOf(index)}</span> : null}
            </button>
          )
        })}
      </div>

      <div className="ajedrez-pieces">
        {pieces.map((piece) => {
          const pose = displayIndex(piece.index, flipped)
          return (
            <div
              key={piece.id}
              className={[
                'ajedrez-piece',
                `is-${piece.player}`,
                piece.index === selected ? 'is-selected' : '',
                targets.includes(piece.index) ? 'is-target' : '',
                piece.index === checkIndex ? 'is-check' : '',
                piece.capturing ? 'is-capturing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${(pose.x / BOARD_SIZE) * 100}%`,
                top: `${(pose.y / BOARD_SIZE) * 100}%`,
              }}
              onClick={() => !disabled && onSelect(piece.index)}
            >
              <ChessPiece kind={piece.kind} player={piece.player} />
              <span className="visually-hidden">{pieceName(piece.kind)}</span>
            </div>
          )
        })}
      </div>

      {promoting ? <PromotionPicker player={promoting.player} onPick={onPromote} /> : null}
    </div>
  )
}
