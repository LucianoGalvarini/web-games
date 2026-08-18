import { COLS, ROWS, isStrong } from '../../game'
import { toSvg } from './geometry'

function lineKey(prefix: string, x: number, y: number): string {
  return `${prefix}-${x}-${y}`
}

export function BoardLines() {
  const lines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = []

  for (let y = 0; y < ROWS; y += 1) {
    const start = toSvg({ x: 0, y })
    const end = toSvg({ x: COLS - 1, y })
    lines.push({ key: lineKey('h', 0, y), x1: start.x, y1: start.y, x2: end.x, y2: end.y })
  }

  for (let x = 0; x < COLS; x += 1) {
    const start = toSvg({ x, y: 0 })
    const end = toSvg({ x, y: ROWS - 1 })
    lines.push({ key: lineKey('v', x, 0), x1: start.x, y1: start.y, x2: end.x, y2: end.y })
  }

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!isStrong(x, y)) {
        continue
      }
      if (x + 1 < COLS && y + 1 < ROWS) {
        const from = toSvg({ x, y })
        const to = toSvg({ x: x + 1, y: y + 1 })
        lines.push({ key: lineKey('se', x, y), x1: from.x, y1: from.y, x2: to.x, y2: to.y })
      }
      if (x - 1 >= 0 && y + 1 < ROWS) {
        const from = toSvg({ x, y })
        const to = toSvg({ x: x - 1, y: y + 1 })
        lines.push({ key: lineKey('sw', x, y), x1: from.x, y1: from.y, x2: to.x, y2: to.y })
      }
    }
  }

  return (
    <g className="board-lines">
      {lines.map((line) => (
        <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
      ))}
    </g>
  )
}
