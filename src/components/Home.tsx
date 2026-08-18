import type { GameId } from '../shared/types'

type HomeProps = {
  onSelect: (game: GameId) => void
}

export function Home({ onSelect }: HomeProps) {
  return (
    <div className="app home">
      <header className="home-header">
        <p className="eyebrow">Tablero</p>
        <h1>Elegí un juego</h1>
        <p className="lede">Tres clásicos. Elegí uno y se mantienen las reglas de cada juego.</p>
      </header>

      <div className="home-grid">
        <button type="button" className="game-card" onClick={() => onSelect('fanorona')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="4" y="4" width="82" height="42" rx="4" fill="#8f5e32" />
            <g fill="none" stroke="#2d190c" strokeWidth="1.2">
              <path d="M12 12h66M12 25h66M12 38h66M12 12v26M28.5 12v26M45 12v26M61.5 12v26M78 12v26" />
              <path d="M12 12l66 26M78 12L12 38" />
            </g>
            <circle cx="28.5" cy="12" r="3" fill="#241910" />
            <circle cx="61.5" cy="38" r="3" fill="#f3e6d2" />
          </svg>
          <div>
            <p className="eyebrow">Madagascar</p>
            <h2>Fanorona</h2>
            <p>Captura por acercamiento y alejamiento en un tablero de 9×5.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('morris')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="16" y="4" width="58" height="42" rx="4" fill="#8f5e32" />
            <g fill="none" stroke="#2d190c" strokeWidth="1.3">
              <rect x="22" y="8" width="46" height="34" />
              <rect x="30" y="14" width="30" height="22" />
              <rect x="38" y="20" width="14" height="10" />
              <path d="M45 8v12M45 30v12M22 25h16M52 25h16" />
            </g>
            <circle cx="22" cy="8" r="2.6" fill="#241910" />
            <circle cx="68" cy="42" r="2.6" fill="#f3e6d2" />
          </svg>
          <div>
            <p className="eyebrow">Molino</p>
            <h2>Molino de nueve</h2>
            <p>Colocá, alineá de a tres y sacá las piezas rivales.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('minesweeper')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="16" y="4" width="58" height="42" rx="4" fill="#8f5e32" />
            {Array.from({ length: 4 }, (_, row) =>
              Array.from({ length: 6 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={20 + col * 8.4}
                  y={8 + row * 8.4}
                  width="7.4"
                  height="7.4"
                  rx="1"
                  fill={row === 1 && col === 2 ? '#5b3918' : '#c9a066'}
                  stroke="#5b3918"
                  strokeWidth="0.4"
                />
              )),
            )}
            <text x="38.6" y="23.6" fontSize="7" fill="#f0d59a" fontFamily="Outfit, sans-serif">
              1
            </text>
          </svg>
          <div>
            <p className="eyebrow">Clásico</p>
            <h2>Buscaminas</h2>
            <p>Primer clic vacío, chording y pista. Sin la apertura a ciegas de XP.</p>
          </div>
        </button>
      </div>
    </div>
  )
}
