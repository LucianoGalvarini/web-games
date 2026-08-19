import { pieceCells } from '../../tetris'
import type { PieceId } from '../../tetris'
import { PIECE_CLASS } from './pieceClass'

type MiniPieceProps = {
  id: PieceId | null
}

export function MiniPiece({ id }: MiniPieceProps) {
  const cells = id ? pieceCells(id, 0, 0, 0) : []
  const filled = new Set(cells.map((cell) => `${cell.x}-${cell.y}`))

  return (
    <div className="tetris-mini" aria-hidden={id ? undefined : true}>
      {Array.from({ length: 8 }, (_, index) => {
        const x = index % 4
        const y = Math.floor(index / 4)
        const on = filled.has(`${x}-${y}`)
        return (
          <span
            key={`${x}-${y}`}
            className={`tetris-mini-cell${on && id ? ` ${PIECE_CLASS[id]}` : ''}`}
          />
        )
      })}
    </div>
  )
}
