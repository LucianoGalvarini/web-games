import { hasNote, sameHouse } from '../../sudoku'
import type { SudokuHint, SudokuPoint } from '../../sudoku'

type SudokuBoardProps = {
  givens: number[][]
  values: number[][]
  notes: number[][]
  selected: SudokuPoint | null
  conflicts: Set<string>
  hint: SudokuHint | null
  disabled: boolean
  onSelect: (point: SudokuPoint) => void
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

export function SudokuBoard({
  givens,
  values,
  notes,
  selected,
  conflicts,
  hint,
  disabled,
  onSelect,
}: SudokuBoardProps) {
  const selectedValue = selected ? values[selected.row][selected.col] : 0

  return (
    <div className="sudoku-field" role="grid" aria-label="Tablero de Sudoku">
      {values.map((line, row) =>
        line.map((value, col) => {
          const given = givens[row][col] !== 0
          const isSelected = Boolean(selected && selected.row === row && selected.col === col)
          const inHouse = selected ? sameHouse(selected, { row, col }) : false
          const sameDigit = selectedValue !== 0 && value === selectedValue
          const isConflict = conflicts.has(cellKey(row, col))
          const isHint = Boolean(hint && hint.row === row && hint.col === col)
          const className = [
            'sudoku-cell',
            given ? 'is-given' : '',
            isSelected ? 'is-selected' : '',
            inHouse && !isSelected ? 'is-house' : '',
            sameDigit && !isSelected ? 'is-same' : '',
            isConflict ? 'is-conflict' : '',
            isHint ? 'is-hint' : '',
            col % 3 === 2 && col !== 8 ? 'is-box-right' : '',
            row % 3 === 2 && row !== 8 ? 'is-box-bottom' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={cellKey(row, col)}
              type="button"
              className={className}
              disabled={disabled}
              aria-label={`Fila ${row + 1}, columna ${col + 1}${value ? `, ${value}` : ''}`}
              onClick={() => onSelect({ row, col })}
            >
              {value ? (
                <span className="sudoku-value">{value}</span>
              ) : (
                <span className="sudoku-notes" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <span key={digit} className={hasNote(notes[row][col], digit) ? 'is-on' : ''}>
                      {hasNote(notes[row][col], digit) ? digit : ''}
                    </span>
                  ))}
                </span>
              )}
            </button>
          )
        }),
      )}
    </div>
  )
}
