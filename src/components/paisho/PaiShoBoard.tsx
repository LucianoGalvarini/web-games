import { CENTER, GRID, PLAYABLE, flowerName, gardenOf, isGate } from '../../paisho'
import type { PaiTile } from '../../paisho'
import { PaiShoTileFace } from './PaiShoTileFace'

type PaiShoBoardProps = {
  tiles: PaiTile[]
  selected: { x: number; y: number } | null
  targets: { x: number; y: number }[]
  last: { x: number; y: number } | null
  links: { ax: number; ay: number; bx: number; by: number }[]
  disabled: boolean
  onSelect: (x: number, y: number) => void
}

const SIZE = 100
const STEP = SIZE / (GRID - 1)

function pos(x: number, y: number): { x: number; y: number } {
  return { x: x * STEP, y: y * STEP }
}

export function PaiShoBoard({ tiles, selected, targets, last, links, disabled, onSelect }: PaiShoBoardProps) {
  const center = pos(CENTER, CENTER)
  const radius = CENTER * STEP

  return (
    <svg className={`paisho-board ${disabled ? 'is-disabled' : ''}`} viewBox={`-6 -6 ${SIZE + 12} ${SIZE + 12}`} role="img">
      <circle cx={center.x} cy={center.y} r={radius + 5.2} fill="#8f5e32" />
      <circle cx={center.x} cy={center.y} r={radius + 3.6} fill="none" stroke="#5b3918" strokeWidth="1.6" />
      <circle cx={center.x} cy={center.y} r={radius + 2.2} fill="#c9a066" />

      {PLAYABLE.map((point) => {
        const garden = gardenOf(point.x, point.y)
        const here = pos(point.x, point.y)
        if (garden === 'neutral' || garden === 'gate' || (point.x === CENTER && point.y === CENTER)) {
          return null
        }
        return (
          <circle
            key={`g-${point.x}-${point.y}`}
            cx={here.x}
            cy={here.y}
            r={STEP * 0.42}
            fill={garden === 'red' ? 'rgba(139, 42, 28, 0.35)' : 'rgba(244, 232, 214, 0.45)'}
          />
        )
      })}

      <circle cx={center.x} cy={center.y} r={STEP * 1.15} fill="none" stroke="#e4b45a" strokeWidth="0.7" />
      <circle cx={center.x} cy={center.y} r={STEP * 0.35} fill="#e4b45a" />

      {PLAYABLE.map((point) => {
        const here = pos(point.x, point.y)
        const neighbors = [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ]
        return neighbors.map((dir) => {
          const nx = point.x + dir.x
          const ny = point.y + dir.y
          if (!PLAYABLE.some((item) => item.x === nx && item.y === ny)) {
            return null
          }
          const there = pos(nx, ny)
          return (
            <line
              key={`l-${point.x}-${point.y}-${nx}-${ny}`}
              x1={here.x}
              y1={here.y}
              x2={there.x}
              y2={there.y}
              stroke="#5b3918"
              strokeWidth="0.35"
            />
          )
        })
      })}

      {links.map((link) => {
        const a = pos(link.ax, link.ay)
        const b = pos(link.bx, link.by)
        return (
          <line
            key={`h-${link.ax}-${link.ay}-${link.bx}-${link.by}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#e4b45a"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.85"
          />
        )
      })}

      {PLAYABLE.map((point) => {
        const here = pos(point.x, point.y)
        const gate = isGate(point.x, point.y)
        const target = targets.some((item) => item.x === point.x && item.y === point.y)
        const isLast = last?.x === point.x && last?.y === point.y
        const isSelected = selected?.x === point.x && selected?.y === point.y
        return (
          <g key={`p-${point.x}-${point.y}`}>
            <circle
              cx={here.x}
              cy={here.y}
              r={gate ? 2.1 : 1.15}
              fill={gate ? '#8b2a1c' : '#3d2918'}
              stroke={target || isLast || isSelected ? '#e4b45a' : 'none'}
              strokeWidth={target ? 0.9 : 0.55}
            />
            <circle
              cx={here.x}
              cy={here.y}
              r={STEP * 0.42}
              fill="transparent"
              className="paisho-hit"
              onClick={() => !disabled && onSelect(point.x, point.y)}
            />
          </g>
        )
      })}

      {targets.map((point) => {
        const here = pos(point.x, point.y)
        return (
          <circle
            key={`t-${point.x}-${point.y}`}
            cx={here.x}
            cy={here.y}
            r={2.7}
            fill="none"
            stroke="#e4b45a"
            strokeWidth="0.75"
          />
        )
      })}

      {tiles.map((tile) => {
        const here = pos(tile.x, tile.y)
        const isSelected = selected?.x === tile.x && selected?.y === tile.y
        return (
          <g
            key={tile.id}
            className={`paisho-tile ${isSelected ? 'is-selected' : ''}`}
            transform={`translate(${here.x} ${here.y}) scale(0.24) translate(-20 -20)`}
            onClick={() => !disabled && onSelect(tile.x, tile.y)}
          >
            <title>{flowerName(tile.kind)}</title>
            <PaiShoTileFace kind={tile.kind} player={tile.player} />
          </g>
        )
      })}
    </svg>
  )
}
