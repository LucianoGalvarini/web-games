import type { Color } from './types'

export const COLOR_LABELS: Record<Color, string> = {
  red: 'Rojo',
  yellow: 'Amarillo',
  green: 'Verde',
  blue: 'Azul',
}

export const COLOR_HEX: Record<Color, string> = {
  red: '#e4312b',
  yellow: '#ffd400',
  green: '#46a045',
  blue: '#0072bc',
}

export const COLOR_OPTIONS: { key: Color; label: string }[] = [
  { key: 'red', label: 'Rojo' },
  { key: 'yellow', label: 'Amarillo' },
  { key: 'green', label: 'Verde' },
  { key: 'blue', label: 'Azul' },
]
