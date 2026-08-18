import { useRef } from 'react'
import type { MouseEvent } from 'react'
import { neighbors } from '../../minesweeper'
import type { Hint, MsBoard, MsPoint } from '../../minesweeper'

type MinesweeperBoardProps = {
  board: MsBoard
  exploded: MsPoint | null
  hint: Hint | null
  pressed: MsPoint[]
  disabled: boolean
  onReveal: (x: number, y: number) => void
  onFlag: (x: number, y: number) => void
  onChord: (x: number, y: number) => void
  onPress: (points: MsPoint[]) => void
}

function same(a: MsPoint | null, x: number, y: number): boolean {
  return Boolean(a && a.x === x && a.y === y)
}

function isPressed(list: MsPoint[], x: number, y: number): boolean {
  return list.some((point) => point.x === x && point.y === y)
}

function closedNeighbors(board: MsBoard, x: number, y: number): MsPoint[] {
  return neighbors(board, x, y).filter((point) => !board[point.y][point.x].revealed && board[point.y][point.x].mark !== 'flag')
}

function FlagIcon() {
  return (
    <svg className="ms-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2v12" stroke="#1a120c" strokeWidth="1.8" />
      <path d="M5 3.2l8 2.4-8 2.4V3.2z" fill="#d32f2f" stroke="#1a120c" strokeWidth="0.7" />
    </svg>
  )
}

function MineIcon() {
  return (
    <svg className="ms-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="4.2" fill="#1a120c" />
      <path
        d="M8 2v2.2M8 11.8V14M2 8h2.2M11.8 8H14M4.1 4.1l1.5 1.5M10.4 10.4l1.5 1.5M4.1 11.9l1.5-1.5M10.4 5.6l1.5-1.5"
        stroke="#1a120c"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="6.6" cy="6.4" r="1.1" fill="#f3e6d2" />
    </svg>
  )
}

export function MinesweeperBoard({
  board,
  exploded,
  hint,
  pressed,
  disabled,
  onReveal,
  onFlag,
  onChord,
  onPress,
}: MinesweeperBoardProps) {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const buttons = useRef(0)
  const chordLock = useRef(false)
  const lost = exploded !== null

  return (
    <div
      className={`ms-field is-${cols}x${rows}`}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        ['--ms-cols' as string]: String(cols),
      }}
    >
      {board.flatMap((row, y) =>
        row.map((cell, x) => {
          const open = cell.revealed
          const wrongFlag = lost && cell.mark === 'flag' && !cell.mine
          const showFlag = cell.mark === 'flag' && !wrongFlag && (!open || cell.mine)
          const showMine = open && cell.mine && cell.mark !== 'flag'
          const showNumber = open && !cell.mine && cell.adjacent > 0

          const className = [
            'ms-cell',
            open ? 'is-open' : 'is-closed',
            showNumber ? `n${cell.adjacent}` : '',
            same(exploded, x, y) ? 'is-exploded' : '',
            showMine ? 'is-mine' : '',
            wrongFlag ? 'is-wrong' : '',
            hint && hint.point.x === x && hint.point.y === y ? `is-hint is-hint-${hint.action}` : '',
            isPressed(pressed, x, y) ? 'is-pressed' : '',
          ]
            .filter(Boolean)
            .join(' ')

          const startPress = (event: MouseEvent<HTMLButtonElement>) => {
            if (disabled) {
              return
            }
            buttons.current = event.buttons
            if (cell.revealed && ((event.buttons & 3) === 3 || event.button === 0)) {
              onPress(closedNeighbors(board, x, y))
            }
          }

          const endPress = (event: MouseEvent<HTMLButtonElement>) => {
            onPress([])
            if (disabled) {
              return
            }
            if (chordLock.current) {
              if (event.buttons === 0) {
                chordLock.current = false
              }
              buttons.current = event.buttons
              return
            }
            const both = (buttons.current & 3) === 3
            buttons.current = event.buttons
            if (both) {
              chordLock.current = true
              onChord(x, y)
              return
            }
            if (event.button === 2) {
              onFlag(x, y)
              return
            }
            if (event.button === 0 && !cell.revealed) {
              onReveal(x, y)
            }
          }

          return (
            <button
              key={`${x}-${y}`}
              type="button"
              className={className}
              disabled={disabled}
              aria-label={`Casilla ${x + 1},${y + 1}`}
              onMouseDown={startPress}
              onMouseUp={endPress}
              onMouseLeave={() => onPress([])}
              onDoubleClick={() => {
                if (!disabled && cell.revealed) {
                  onChord(x, y)
                }
              }}
            >
              {wrongFlag ? (
                <span className="ms-wrong">
                  <MineIcon />
                  <span className="ms-x">X</span>
                </span>
              ) : null}
              {showFlag ? <FlagIcon /> : null}
              {!open && cell.mark === 'question' ? <span className="ms-q">?</span> : null}
              {showMine ? <MineIcon /> : null}
              {showNumber ? cell.adjacent : null}
            </button>
          )
        }),
      )}
    </div>
  )
}
