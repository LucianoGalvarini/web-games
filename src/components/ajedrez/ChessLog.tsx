import type { ChessLogEntry } from '../../hooks/useAjedrez'

type ChessLogProps = {
  log: ChessLogEntry[]
  onCopy: () => void
}

export function ChessLog({ log, onCopy }: ChessLogProps) {
  const rows: { n: number; white: string; black?: string }[] = []
  for (let index = 0; index < log.length; index += 2) {
    rows.push({ n: index / 2 + 1, white: log[index]?.san ?? '', black: log[index + 1]?.san })
  }

  return (
    <div className="ajedrez-log">
      <div className="ajedrez-log-head">
        <span>Jugadas</span>
        <button type="button" className="btn" onClick={onCopy} disabled={log.length === 0}>
          Copiar PGN
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="ajedrez-log-empty">Todavía no hay jugadas.</p>
      ) : (
        <ol className="ajedrez-log-list">
          {rows.map((row) => (
            <li key={row.n}>
              <span className="ajedrez-log-n">{row.n}.</span>
              <span>{row.white}</span>
              {row.black ? <span>{row.black}</span> : <span />}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
