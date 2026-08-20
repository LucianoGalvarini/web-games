import type { GameId } from '../shared/types'

type HomeProps = {
  onSelect: (game: GameId) => void
}

export function Home({ onSelect }: HomeProps) {
  return (
    <div className="app home">
      <header className="home-header">
        <p className="eyebrow">Juegos de mesa</p>
        <h1>Elegí un juego</h1>
        <p className="lede">Nueve clásicos. Elegí uno y se mantienen las reglas de cada juego.</p>
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
            <h2>Molino</h2>
            <p>Colocá, alineá de a tres y sacá las piezas rivales. A 6, 9 o 12 piezas.</p>
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

        <button type="button" className="game-card" onClick={() => onSelect('sudoku')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="22" y="4" width="46" height="42" rx="4" fill="#8f5e32" />
            {Array.from({ length: 9 }, (_, row) =>
              Array.from({ length: 9 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={25 + col * 4.4}
                  y={7 + row * 4.4}
                  width="4"
                  height="4"
                  fill={row === 2 && col === 4 ? '#5b3918' : '#e4d3b4'}
                  stroke="#8f5e32"
                  strokeWidth="0.3"
                />
              )),
            )}
            <text x="34.2" y="14.6" fontSize="3.4" fill="#1a120c" fontFamily="Outfit, sans-serif" fontWeight="700">
              5
            </text>
            <text x="47.4" y="23.4" fontSize="3.4" fill="#1a120c" fontFamily="Outfit, sans-serif" fontWeight="700">
              2
            </text>
            <text x="56.2" y="41" fontSize="3.4" fill="#1a120c" fontFamily="Outfit, sans-serif" fontWeight="700">
              9
            </text>
          </svg>
          <div>
            <p className="eyebrow">Números</p>
            <h2>Sudoku</h2>
            <p>Anotaciones, pistas lógicas y tableros de solución única.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('damas')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="16" y="4" width="58" height="42" rx="4" fill="#8f5e32" />
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 6 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={20 + col * 8.4}
                  y={8 + row * 5.9}
                  width="8.4"
                  height="5.9"
                  fill={(row + col) % 2 === 0 ? '#c9a066' : '#5b3918'}
                />
              )),
            )}
            <circle cx="28.2" cy="10.9" r="2.6" fill="#241910" />
            <circle cx="44.9" cy="10.9" r="2.6" fill="#241910" />
            <circle cx="36.6" cy="16.9" r="2.6" fill="#241910" />
            <circle cx="53.3" cy="39" r="2.6" fill="#f3e6d2" />
            <circle cx="61.7" cy="39" r="2.6" fill="#f3e6d2" />
            <circle cx="45" cy="33.1" r="2.6" fill="#f3e6d2" />
          </svg>
          <div>
            <p className="eyebrow">Tablero</p>
            <h2>Damas</h2>
            <p>Capturá saltando en diagonal. Reglas inglesas o criollas, con dama voladora.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('truco')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="4" y="4" width="82" height="42" rx="4" fill="#8f5e32" />
            <g transform="translate(18 8) rotate(-12)">
              <rect width="22" height="34" rx="3" fill="#f3e6d2" stroke="#5b3918" />
              <circle cx="11" cy="17" r="4" fill="#b8860b" />
            </g>
            <g transform="translate(34 7)">
              <rect width="22" height="34" rx="3" fill="#7a4a1f" stroke="#e4b45a" />
              <path d="M11 10l5 5-5 5-5-5z" fill="none" stroke="#f0d59a" strokeWidth="1.2" />
            </g>
            <g transform="translate(50 8) rotate(12)">
              <rect width="22" height="34" rx="3" fill="#f3e6d2" stroke="#5b3918" />
              <path d="M11 8l4 9c1 2 1 4 0 5l-4 2-4-2c-1-1-1-3 0-5z" fill="#1c3147" />
            </g>
          </svg>
          <div>
            <p className="eyebrow">Naipes</p>
            <h2>Truco</h2>
            <p>Mano a mano, sin flor, a 30. Envido, truco y mazo español.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('tetris')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="28" y="4" width="34" height="42" rx="3" fill="#8f5e32" />
            <rect x="31" y="7" width="28" height="36" fill="#5b3918" />
            <rect x="31" y="31" width="7" height="12" fill="#4a9b8e" />
            <rect x="38" y="31" width="7" height="12" fill="#4a9b8e" />
            <rect x="45" y="31" width="7" height="12" fill="#4a9b8e" />
            <rect x="52" y="31" width="7" height="12" fill="#4a9b8e" />
            <rect x="38" y="19" width="7" height="12" fill="#e4b45a" />
            <rect x="45" y="19" width="7" height="12" fill="#e4b45a" />
            <rect x="38" y="7" width="7" height="12" fill="#e4b45a" />
            <rect x="45" y="7" width="7" height="12" fill="#e4b45a" />
          </svg>
          <div>
            <p className="eyebrow">Caída</p>
            <h2>Tetris</h2>
            <p>Completá líneas. Bolsa de 7, giros SRS, reserva y fantasma.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('ajedrez')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="16" y="4" width="58" height="42" rx="4" fill="#8f5e32" />
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 6 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={20 + col * 8.4}
                  y={8 + row * 5.9}
                  width="8.4"
                  height="5.9"
                  fill={(row + col) % 2 === 0 ? '#e4d3b4' : '#5b3918'}
                />
              )),
            )}
            <circle cx="24.2" cy="11" r="2.2" fill="#f3e6d2" />
            <rect x="56" y="34.5" width="5" height="6" rx="0.6" fill="#241910" />
          </svg>
          <div>
            <p className="eyebrow">Tablero</p>
            <h2>Ajedrez</h2>
            <p>Enroque, al paso y coronación. Blancas o negras contra la CPU.</p>
          </div>
        </button>

        <button type="button" className="game-card" onClick={() => onSelect('paisho')}>
          <svg className="game-card-board" viewBox="0 0 90 50" aria-hidden="true">
            <rect x="16" y="4" width="58" height="42" rx="4" fill="#8f5e32" />
            <circle cx="45" cy="25" r="18" fill="#c9a066" stroke="#5b3918" strokeWidth="1.4" />
            <circle cx="45" cy="25" r="6" fill="none" stroke="#8b2a1c" strokeWidth="1" />
            <circle cx="45" cy="25" r="2" fill="#e4b45a" />
            <circle cx="45" cy="9" r="2.2" fill="#8b2a1c" />
            <circle cx="61" cy="25" r="2.2" fill="#8b2a1c" />
            <circle cx="45" cy="41" r="2.2" fill="#8b2a1c" />
            <circle cx="29" cy="25" r="2.2" fill="#8b2a1c" />
            <circle cx="38" cy="18" r="3" fill="#f3e6d2" stroke="#5b3918" strokeWidth="0.6" />
            <circle cx="53" cy="31" r="3" fill="#241910" stroke="#e4b45a" strokeWidth="0.6" />
          </svg>
          <div>
            <p className="eyebrow">Jardín</p>
            <h2>Pai Sho</h2>
            <p>Flores, armonías y el anillo del loto. El juego de Iroh.</p>
          </div>
        </button>
      </div>
    </div>
  )
}
