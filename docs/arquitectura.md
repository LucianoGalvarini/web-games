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
  shogi/                       # Motor Shogi
  liga/                        # Motor Liga (Alto Mando Esmeralda)
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
    useShogi.ts
    useLiga.ts
    useMuted.ts
    useVolume.ts
  components/
    Home.tsx
    GamePanel.tsx              # Controles y estadísticas de los juegos de tablero
    ResultOverlay.tsx
    ManualTour.tsx
    SoundToggle.tsx
    TableHud.tsx
    FanoronaGame.tsx
    MorrisGame.tsx
    DamasGame.tsx
    MinesweeperGame.tsx
    SudokuGame.tsx
    TrucoGame.tsx
    TetrisGame.tsx
    AjedrezGame.tsx
    PaiShoGame.tsx
    DoomGame.tsx               # Iframe del puerto WASM (shareware)
    ShogiGame.tsx
    LigaGame.tsx
    liga/                      # Mapa canvas y combate
    Board/                     # SVG Fanorona + piedras + motion
    morris/MorrisBoardView.tsx
    damas/DamasBoard.tsx       # Grilla 8×8, piezas en capa aparte
    minesweeper/MinesweeperBoard.tsx
    sudoku/                    # Tablero y teclado numérico
    truco/                     # Naipes SVG y mesa
    tetris/                    # Pozo, minipiezas
    ajedrez/                   # Grilla 8×8, glifos SVG
    paisho/                    # Tablero circular, reserva de flores
    shogi/                     # Grilla 9×9, piezas de madera con kanji
```

`App` solo elige el juego. Cada motor de mesa se puede importar sin montar React. Doom no tiene motor TypeScript: el puerto WASM está en `public/doom/` y la UI lo embebe en un iframe. Liga sí: mapa y combate en `src/liga`, sprites en `public/liga/sprites/`.

## Layout

En partida hay tres columnas: **controles** a la izquierda (título, modo, dificultad, acciones), **tablero** al centro y **estadísticas** a la derecha (turno, reloj, piezas, estado). El ancho del panel de controles lo fija cada juego (`--controls-col`) según cuántas opciones tenga. En pantallas chicas se apilan en ese orden.

## Piezas compartidas

- `shared/point.ts` y `shared/player.ts`: coordenadas, etiquetas y `isCpuTurn`.
- `shared/types.ts`: `GameMode`, `Difficulty` (`easy` \| `medium` \| `hard` \| `perfect`), `GameId`.
- `GamePanel`: modo, dificultad, color humano, selector de tablero/variante (Molino, Damas).
- `TableHud`: iconos fijos de manual y sonido, con etiqueta, arriba a la derecha, en todos los juegos. El de sonido abre una barra de 0 a 100.
- `Stone`: la misma piedra SVG en Fanorona y Molino.
- Resultado: `resultTitle` / `resultEyebrow` / `resultVariant` según modo y color humano.
- Sonido: `playSfx` en Web Audio (madera, cartas, clics, líneas). Volumen 0–100 en `localStorage`.
- Manual: `ManualTour` recorre pasos y resalta `data-manual` en el layout. No se abre solo.

## Decisiones de diseño

- **Motor sin React.** Las reglas se pueden importar desde un script Node/tsx. Facilita tests y la IA.
- **Turno = lista de pasos.** La CPU piensa secuencias completas, no un paso aislado: `captura+cadena` en Fanorona, `place/slide+remove` en Molino, cadena de saltos en Damas. En Ajedrez, Pai Sho y Shogi el turno es una sola jugada legal (mover o, en Shogi, tirar una pieza de la mano).
- **Inmutabilidad.** `applyMove` clona; el deshacer guarda referencias a estados anteriores.
- **Sin enums de TypeScript.** `erasableSyntaxOnly`; los tipos son uniones.
- **Imports de tipos explícitos.** `verbatimModuleSyntax` exige `import type { ... }`.

## Cómo extenderlo

- Tests del motor Fanorona: importar `legalMovesAtTurnStart` / `applyMove`. Las cinco aperturas son un buen smoke test.
- Otra CPU: cambiar `chooseAiTurn` del juego correspondiente, sin tocar la UI.
- Variante de Molino: agregar una entrada en `VARIANTS` (puntos, molinos, `flyingEnabled`).
- Variante de Damas: agregar una entrada en `VARIANTS` (`flyingKing`); el tablero y la posición inicial son iguales en las dos.
- Shogi es el único juego con texto en kanji (fuente Noto Serif JP, cargada en `index.html`). Las piezas son de madera para los dos bandos, en dos tonos (`is-white`/`is-black`, como el resto) y además rotadas (`is-rotated`) apuntando hacia el rival, como en un tablero real.
- Variantes Fanoron-Telo (3×3) o Dimy (5×5): parametrizar `COLS`/`ROWS` y la posición inicial; la geometría de puntos fuertes se mantiene si el origen es fuerte.
