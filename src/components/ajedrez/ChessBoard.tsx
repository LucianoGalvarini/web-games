import { useEffect, useRef, useState } from 'react'
import {
  BOARD_SIZE,
  fileOf,
  isLightSquare,
  pieceName,
  rankOf,
  squareIndex,
  squareLabel,
} from '../../ajedrez'
import type { PieceKind } from '../../ajedrez'
import { playerLabel } from '../../shared/player'
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
  cursor: number
  current: Player
  targets: number[]
  captures: number[]
  lastFrom: number | null
  lastTo: number | null
  checkIndex: number | null
  flipped: boolean
  disabled: boolean
  promoting: { from: number; to: number; player: Player } | null
  announce: string
  onSelect: (index: number) => void
  onPromote: (kind: PieceKind) => void
  onCancelPromote: () => void
  onClear: () => void
  onCursor: (index: number) => void
  onUndo: () => void
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

function indexFromDisplay(x: number, y: number, flipped: boolean): number {
  if (!flipped) {
    return squareIndex(x, y)
  }
  return squareIndex(7 - x, 7 - y)
}

function cellLabel(index: number, pieces: BoardPiece[], checkIndex: number | null): string {
  const piece = pieces.find((item) => item.index === index && !item.capturing)
  const square = squareLabel(index)
  if (!piece) {
    return square
  }
  const color = piece.player === 'white' ? 'blanco' : 'negro'
  const check = index === checkIndex ? ', jaque' : ''
  return `${pieceName(piece.kind)} ${color} en ${square}${check}`
}

function stepCursor(index: number, dx: number, dy: number, flipped: boolean): number {
  const pose = displayIndex(index, flipped)
  const x = Math.min(7, Math.max(0, pose.x + dx))
  const y = Math.min(7, Math.max(0, pose.y + dy))
  return indexFromDisplay(x, y, flipped)
}

type DragState = {
  id: number
  from: number
  left: number
  top: number
}

export function ChessBoard({
  pieces,
  selected,
  cursor,
  current,
  targets,
  captures,
  lastFrom,
  lastTo,
  checkIndex,
  flipped,
  disabled,
  promoting,
  announce,
  onSelect,
  onPromote,
  onCancelPromote,
  onClear,
  onCursor,
  onUndo,
}: ChessBoardProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (promoting) {
          onCancelPromote()
        } else {
          onClear()
        }
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        onUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [promoting, onCancelPromote, onClear, onUndo])

  const squareAt = (clientX: number, clientY: number): number | null => {
    const layer = layerRef.current
    if (!layer) {
      return null
    }
    const rect = layer.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) {
      return null
    }
    const vx = Math.min(7, Math.max(0, Math.floor((x / rect.width) * BOARD_SIZE)))
    const vy = Math.min(7, Math.max(0, Math.floor((y / rect.height) * BOARD_SIZE)))
    return indexFromDisplay(vx, vy, flipped)
  }

  const moveDrag = (clientX: number, clientY: number, id: number, from: number) => {
    const layer = layerRef.current
    if (!layer) {
      return
    }
    const rect = layer.getBoundingClientRect()
    const next = {
      id,
      from,
      left: ((clientX - rect.left) / rect.width) * 100 - 6.25,
      top: ((clientY - rect.top) / rect.height) * 100 - 6.25,
    }
    dragRef.current = next
    setDrag(next)
  }

  return (
    <div
      className={`ajedrez-field ${disabled ? 'is-disabled' : ''} ${drag ? 'is-dragging' : ''}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (promoting) {
            onCancelPromote()
          } else {
            onClear()
          }
          return
        }
        if (disabled) {
          return
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onCursor(stepCursor(cursor, -1, 0, flipped))
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          onCursor(stepCursor(cursor, 1, 0, flipped))
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          onCursor(stepCursor(cursor, 0, -1, flipped))
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          onCursor(stepCursor(cursor, 0, 1, flipped))
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(cursor)
        }
      }}
    >
      <div className="visually-hidden" aria-live="polite">
        {announce}
      </div>
      <div className="ajedrez-cells">
        {CELLS.map((index) => {
          const light = isLightSquare(index)
          const pose = displayIndex(index, flipped)
          const target = targets.includes(index)
          const capture = captures.includes(index)
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
                capture ? 'is-capture' : '',
                last ? 'is-last' : '',
                check ? 'is-check' : '',
                selected === index ? 'is-selected' : '',
                cursor === index ? 'is-cursor' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                gridColumn: pose.x + 1,
                gridRow: pose.y + 1,
              }}
              disabled={disabled}
              aria-label={cellLabel(index, pieces, checkIndex)}
              onClick={() => onSelect(index)}
            >
              {pose.y === 7 ? <span className="ajedrez-coord is-file">{'abcdefgh'[fileOf(index)]}</span> : null}
              {pose.x === 0 ? <span className="ajedrez-coord is-rank">{8 - rankOf(index)}</span> : null}
            </button>
          )
        })}
      </div>

      <div ref={layerRef} className="ajedrez-pieces">
        {pieces.map((piece) => {
          const pose = displayIndex(piece.index, flipped)
          const dragging = drag?.id === piece.id
          return (
            <div
              key={piece.id}
              className={[
                'ajedrez-piece',
                `is-${piece.player}`,
                piece.index === selected ? 'is-selected' : '',
                captures.includes(piece.index) ? 'is-capture' : '',
                piece.index === checkIndex ? 'is-check' : '',
                piece.capturing ? 'is-capturing' : '',
                dragging ? 'is-dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                dragging
                  ? {
                      left: `${drag.left}%`,
                      top: `${drag.top}%`,
                      zIndex: 5,
                      transition: 'none',
                    }
                  : {
                      left: `${(pose.x / BOARD_SIZE) * 100}%`,
                      top: `${(pose.y / BOARD_SIZE) * 100}%`,
                    }
              }
              onPointerDown={(event) => {
                if (disabled || piece.capturing) {
                  return
                }
                if (captures.includes(piece.index) || piece.player !== current) {
                  onSelect(piece.index)
                  return
                }
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                onSelect(piece.index)
                moveDrag(event.clientX, event.clientY, piece.id, piece.index)
              }}
              onPointerMove={(event) => {
                const active = dragRef.current
                if (!active || active.id !== piece.id) {
                  return
                }
                moveDrag(event.clientX, event.clientY, piece.id, active.from)
              }}
              onPointerUp={(event) => {
                const active = dragRef.current
                if (!active || active.id !== piece.id) {
                  return
                }
                const drop = squareAt(event.clientX, event.clientY)
                dragRef.current = null
                setDrag(null)
                if (drop !== null && drop !== active.from) {
                  onSelect(drop)
                }
              }}
              onPointerCancel={() => {
                if (dragRef.current?.id === piece.id) {
                  dragRef.current = null
                  setDrag(null)
                }
              }}
            >
              <ChessPiece kind={piece.kind} player={piece.player} />
              <span className="visually-hidden">
                {pieceName(piece.kind)} {playerLabel(piece.player).toLowerCase()}
              </span>
            </div>
          )
        })}
      </div>

      {promoting ? (
        <PromotionPicker player={promoting.player} onPick={onPromote} onCancel={onCancelPromote} />
      ) : null}
    </div>
  )
}
