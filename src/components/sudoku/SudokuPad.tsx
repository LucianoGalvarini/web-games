type SudokuPadProps = {
  remaining: number[]
  noteMode: boolean
  disabled: boolean
  onDigit: (digit: number) => void
  onErase: () => void
  onToggleNotes: () => void
}

export function SudokuPad({
  remaining,
  noteMode,
  disabled,
  onDigit,
  onErase,
  onToggleNotes,
}: SudokuPadProps) {
  return (
    <div className="sudoku-pad">
      <div className="sudoku-digits">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
          const left = remaining[digit - 1]
          return (
            <button
              key={digit}
              type="button"
              className={`sudoku-digit ${left === 0 ? 'is-done' : ''}`}
              disabled={disabled}
              onClick={() => onDigit(digit)}
            >
              <strong>{digit}</strong>
              <span>{left}</span>
            </button>
          )
        })}
      </div>
      <div className="sudoku-pad-actions">
        <button type="button" className={`btn ${noteMode ? 'btn-gold' : ''}`} disabled={disabled} onClick={onToggleNotes}>
          {noteMode ? 'Anotando' : 'Anotar'}
        </button>
        <button type="button" className="btn" disabled={disabled} onClick={onErase}>
          Borrar
        </button>
      </div>
    </div>
  )
}
