# Arquitectura

Las **reglas** son funciones puras. La **sesión** vive en un hook. La **UI** solo pinta y dispara acciones.

```
src/
  App.tsx                      # Menú o juego activo
  shared/                      # Player, Point, Difficulty, textos de reglas y resultado
  game/                        # Motor Fanorona
  morris/                      # Motor Molino (variantes 6 / 9 / 12)
  minesweeper/                 # Motor Buscaminas
  sudoku/                      # Motor Sudoku
  hooks/
    useFanorona.ts
    useMorris.ts
    useMinesweeper.ts
    useSudoku.ts
  components/
    Home.tsx
    GamePanel.tsx              # Controles y estadísticas de Fanorona y Molino
    ResultOverlay.tsx
    RulesModal.tsx
    FanoronaGame.tsx
    MorrisGame.tsx
    MinesweeperGame.tsx
    SudokuGame.tsx
    Board/                     # SVG Fanorona + piedras + motion
    morris/MorrisBoardView.tsx
    minesweeper/MinesweeperBoard.tsx
    sudoku/                    # Tablero y teclado numérico
```

`App` solo elige el juego. Cada motor se puede importar sin montar React.

## Layout

En partida hay tres columnas: **controles** a la izquierda (título, modo, dificultad, acciones), **tablero** al centro y **estadísticas** a la derecha (turno, reloj, piezas, estado). En pantallas chicas se apilan en ese orden.

## Piezas compartidas

- `shared/point.ts` y `shared/player.ts`: coordenadas, etiquetas y `isCpuTurn`.
- `shared/types.ts`: `GameMode`, `Difficulty` (`easy` \| `medium` \| `hard` \| `perfect`), `GameId`.
- `GamePanel`: modo, dificultad, color humano y selector de tablero (Molino).
- `Stone`: la misma piedra SVG en Fanorona y Molino.
- Resultado: `resultTitle` / `resultEyebrow` / `resultVariant` según modo y color humano.

## Decisiones de diseño

- **Motor sin React.** Las reglas se pueden importar desde un script Node/tsx. Facilita tests y la IA.
- **Turno = lista de pasos.** En Fanorona y Molino la CPU piensa secuencias (`captura+cadena` o `place/slide+remove`), no un paso aislado.
- **Inmutabilidad.** `applyMove` clona; el deshacer guarda referencias a estados anteriores.
- **Sin enums de TypeScript.** `erasableSyntaxOnly`; los tipos son uniones.
- **Imports de tipos explícitos.** `verbatimModuleSyntax` exige `import type { ... }`.

## Cómo extenderlo

- Tests del motor Fanorona: importar `legalMovesAtTurnStart` / `applyMove`. Las cinco aperturas son un buen smoke test.
- Otra CPU: cambiar `chooseAiTurn` del juego correspondiente, sin tocar la UI.
- Variante de Molino: agregar una entrada en `VARIANTS` (puntos, molinos, `flyingEnabled`).
- Variantes Fanoron-Telo (3×3) o Dimy (5×5): parametrizar `COLS`/`ROWS` y la posición inicial; la geometría de puntos fuertes se mantiene si el origen es fuerte.
