# Arquitectura

Las **reglas** son funciones puras. La **sesión** vive en un hook. La **UI** solo pinta y dispara acciones.

```
src/
  App.tsx                      # Menú o juego activo
  shared/                      # Player, Point, Difficulty, textos de reglas, resultado, sonido y manuales
  game/                        # Motor Fanorona
  morris/                      # Motor Molino (variantes 6 / 9 / 12)
  damas/                       # Motor Damas (variantes inglesas / criollas)
  minesweeper/                 # Motor Buscaminas
  sudoku/                      # Motor Sudoku
  truco/                       # Motor Truco argentino
  tetris/                      # Motor Tetris
  ajedrez/                     # Motor Ajedrez
  paisho/                      # Motor Pai Sho (jardín / armonías)
  hooks/
    useFanorona.ts
    useMorris.ts
    useDamas.ts
    useMinesweeper.ts
    useSudoku.ts
    useTruco.ts
    useTetris.ts
    useAjedrez.ts
    usePaiSho.ts
    useMuted.ts
  components/
    Home.tsx
    GamePanel.tsx              # Controles y estadísticas de los juegos de tablero
    ResultOverlay.tsx
    ManualTour.tsx
    SoundToggle.tsx
    FanoronaGame.tsx
    MorrisGame.tsx
    DamasGame.tsx
    MinesweeperGame.tsx
    SudokuGame.tsx
    TrucoGame.tsx
    TetrisGame.tsx
    AjedrezGame.tsx
    PaiShoGame.tsx
    Board/                     # SVG Fanorona + piedras + motion
    morris/MorrisBoardView.tsx
    damas/DamasBoard.tsx       # Grilla 8×8, piezas en capa aparte
    minesweeper/MinesweeperBoard.tsx
    sudoku/                    # Tablero y teclado numérico
    truco/                     # Naipes SVG y mesa
    tetris/                    # Pozo, minipiezas
    ajedrez/                   # Grilla 8×8, glifos SVG
    paisho/                    # Tablero circular, reserva de flores
```

`App` solo elige el juego. Cada motor se puede importar sin montar React.

## Layout

En partida hay tres columnas: **controles** a la izquierda (título, modo, dificultad, acciones), **tablero** al centro y **estadísticas** a la derecha (turno, reloj, piezas, estado). En pantallas chicas se apilan en ese orden.

## Piezas compartidas

- `shared/point.ts` y `shared/player.ts`: coordenadas, etiquetas y `isCpuTurn`.
- `shared/types.ts`: `GameMode`, `Difficulty` (`easy` \| `medium` \| `hard` \| `perfect`), `GameId`.
- `GamePanel`: modo, dificultad, color humano, selector de tablero/variante (Molino, Damas), sonido y Manual.
- `Stone`: la misma piedra SVG en Fanorona y Molino.
- Resultado: `resultTitle` / `resultEyebrow` / `resultVariant` según modo y color humano.
- Sonido: `playSfx` en Web Audio (madera, cartas, clics, líneas). Mute en `localStorage`.
- Manual: `ManualTour` recorre pasos y resalta `data-manual` en el layout. No se abre solo.

## Decisiones de diseño

- **Motor sin React.** Las reglas se pueden importar desde un script Node/tsx. Facilita tests y la IA.
- **Turno = lista de pasos.** La CPU piensa secuencias completas, no un paso aislado: `captura+cadena` en Fanorona, `place/slide+remove` en Molino, cadena de saltos en Damas. En Ajedrez y Pai Sho el turno es una sola jugada legal.
- **Inmutabilidad.** `applyMove` clona; el deshacer guarda referencias a estados anteriores.
- **Sin enums de TypeScript.** `erasableSyntaxOnly`; los tipos son uniones.
- **Imports de tipos explícitos.** `verbatimModuleSyntax` exige `import type { ... }`.

## Cómo extenderlo

- Tests del motor Fanorona: importar `legalMovesAtTurnStart` / `applyMove`. Las cinco aperturas son un buen smoke test.
- Otra CPU: cambiar `chooseAiTurn` del juego correspondiente, sin tocar la UI.
- Variante de Molino: agregar una entrada en `VARIANTS` (puntos, molinos, `flyingEnabled`).
- Variante de Damas: agregar una entrada en `VARIANTS` (`flyingKing`); el tablero y la posición inicial son iguales en las dos.
- Variantes Fanoron-Telo (3×3) o Dimy (5×5): parametrizar `COLS`/`ROWS` y la posición inicial; la geometría de puntos fuertes se mantiene si el origen es fuerte.
