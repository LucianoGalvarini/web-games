# Juegos de mesa

Cuatro clásicos en el navegador: Fanorona, Molino, Buscaminas y Sudoku. La interfaz está en español. Al abrir se elige el juego; cada uno conserva sus reglas.

Fanorona y Molino arrancan contra la CPU y permiten elegir blancas o negras. Buscaminas y Sudoku se juegan en solitario.

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Typecheck (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run lint` | Oxlint |

Stack: Vite 8, React 19, TypeScript. CSS propio, sin librería de componentes. Tipografías Cormorant Garamond y Outfit.

Desde el panel se vuelve al menú con **Elegir juego**.

## Arquitectura

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
    GamePanel.tsx              # Panel de Fanorona y Molino
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

## Fanorona

Variante **Fanoron-Tsivy** (9×5). Empiezan las blancas. Modo por defecto: contra CPU. Se puede jugar con blancas o negras. Dificultades: fácil, media, difícil.

### Tablero y notación

Coordenadas: `x` de 0 a 8 (archivos `a`–`i`) y `y` de 0 a 4 (filas de arriba hacia abajo). El origen `(0,0)` es la esquina superior izquierda, negra. Notación algebraica: rango = `5 - y`, así que `e3` (centro) es `(4, 2)`.

Las piezas se mueven un paso por las líneas. En un punto **fuerte** (`(x + y) % 2 === 0`) también hay diagonales. En un punto **débil**, solo horizontal y vertical.

**Posición inicial.** Negras arriba, blancas abajo. Fila del medio: `B W B W · W B W B`. Centro vacío. 22 por bando. Hay exactamente cinco aperturas legales:

- `d3-e3` alejamiento
- `f3-e3` alejamiento
- `d2-e3` acercamiento
- `e2-e3` acercamiento
- `f2-e3` acercamiento

### Reglas

- **Paika.** Si no hay captura, se mueve a una intersección vacía adyacente.
- **Captura obligatoria.** Si existe al menos una captura, no se puede jugar paika.
- **Acercamiento.** Al aterrizar, la siguiente casilla en esa dirección es enemiga. Se retira esa pieza y todas las enemigas consecutivas detrás, hasta un hueco o una pieza propia.
- **Alejamiento.** La pieza estaba junto al rival y se aleja. Se captura la línea que queda atrás.
- **No las dos a la vez.** Si el mismo paso permite ambas, el jugador elige (`CaptureChoice`). Son dos `Move` con el mismo `from`/`to` y distinto `kind`.
- **Cadenas.** Tras capturar se puede seguir con la misma pieza o terminar el turno. Cada paso tiene que capturar, no se aterriza en una casilla ya visitada y no se repite la dirección del paso anterior.
- **Fin.** Gana quien captura todas las piezas rivales. Si el que toca no tiene jugadas, pierde. Tres repeticiones de la misma posición con el mismo turno dan tablas.

Una **jugada** (`Move`) es un solo paso (`from`, `to`, `kind`, `captured`). Un **turno** puede ser varios `Move` de la misma pieza. `ChainState` guarda `current`, `visited` y `lastDir`.

### Motor (`src/game`)

| Archivo | Responsabilidad |
| --- | --- |
| `geometry.ts` | `inBounds`, `isStrong`, `canStepFrom` |
| `board.ts` | `createInitialBoard`, `cloneBoard`, `countPieces`, `serializePosition` |
| `moves.ts` | `captureOptions`, `legalMoves`, `legalMovesInChain` |
| `apply.ts` | `applyMove`, `startChain`, `applyChainStep`, `applyTurn` |
| `ai.ts` | `generateTurns`, `chooseAiTurn` |

`legalMovesAtTurnStart` pide primero las capturas; si no hay, recae en paika.

### Sesión (`useFanorona`)

- Clic en pieza con jugadas legales → se resalta. Clic en destino → se aplica. Si hay dos capturas para el mismo destino, se pide elección.
- Tras una captura con continuación, la pieza queda seleccionada y aparece **Terminar turno**.
- Deshacer: pila de snapshots tomada antes de cada `playMove`.
- IA: si tocan negras, un `useEffect` calcula un turno completo y lo reproduce paso a paso (~460 ms). El último paso usa `playMove(..., { endTurn: true })` para no dejar la cadena abierta cuando la CPU decide cortar.

### Inteligencia artificial

`generateTurns` expande secuencias legales (tope de 8 capturas) e incluye parar después de cada captura.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Maximiza piezas capturadas en el turno (greedy + ruido) |
| Media | Minimax profundidad 1 |
| Difícil | Minimax profundidad 2 con poda alfa-beta |

Evaluación: diferencia de material × 120 + diferencia de movilidad × 3. Gane/pérdida inmediata vale ±10000.

### Interfaz

`BoardView` dibuja el grid en SVG. Las diagonales salen solo de puntos fuertes. `useStoneMotion` anima el viaje de la piedra (~320 ms, con alce e inclinación) y el desvanecimiento de las capturadas. La pieza seleccionada se levanta un poco. Destinos legales: anillo dorado. Capturas al pasar el mouse: rojo.

## Molino

Tres variantes en `src/morris/variants.ts`. Por defecto, molino a 9.

| Variante | Piezas | Tablero | Volar |
| --- | --- | --- | --- |
| Molino a 6 | 6 | Dos cuadrados unidos por radios | No |
| Molino a 9 | 9 | Tres cuadrados y radios | Sí, con 3 piezas |
| Molino a 12 | 12 | Igual que a 9, más molinos en diagonal | Sí, con 3 piezas |

Empiezan las blancas. Fases: colocar de a una en vacíos, luego mover a un vecino por las líneas. Tres alineadas = molino = sacar una rival (no de un molino, salvo que todas lo estén). Un movimiento que cierre dos molinos saca una sola pieza. Gana quien deja al rival con menos de 3 piezas o sin jugadas. Tablas por triple repetición.

En modo CPU se elige color (blancas o negras). Dificultades: fácil, media, difícil, **perfecta**.

### Motor (`src/morris`)

Las reglas reciben la variante. El grafo de vecinos se arma a partir de los molinos y, en el de 6, `extraAdjacency`.

| Archivo | Responsabilidad |
| --- | --- |
| `variants.ts` | Puntos, molinos y flags de cada tablero |
| `geometry.ts` | Vecinos, `formsMill`, `canFly`, `removablePieces` |
| `moves.ts` | `legalMoves` (`place` / `slide` / `remove`) |
| `apply.ts` | `applyMove`, `applyTurn`, `winnerOf` |
| `ai.ts` | `generateTurns`, `chooseAiTurn` |

Un turno de IA es `place|slide` más un `remove` opcional si se cerró molino.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Prefiere turnos que capturan, con ruido |
| Media | Minimax profundidad 1 |
| Difícil | Minimax profundidad 2 con poda alfa-beta |
| Perfecta | Búsqueda iterativa con tabla de transposición y tope de tiempo (según variante y fase) |

Evaluación: material (tablero + mano) + molinos propios/rivales + movilidad.

### Sesión (`useMorris`)

Las piedras tienen identidad (`id`) para animar colocación, deslizamiento y captura. Al cerrar un molino se iluminan las tres casillas (~600 ms) antes de elegir qué sacar. Deshacer restaura también las piedras.

## Buscaminas

Estilo Windows 7: el primer clic siempre es un vacío (esa casilla y las ocho vecinas quedan libres de minas). Solitario; no usa `GamePanel`.

| Dificultad | Tablero | Minas |
| --- | --- | --- |
| Principiante | 9×9 | 10 |
| Intermedio | 16×16 | 40 |
| Experto | 30×16 | 99 |

### Motor (`src/minesweeper`)

| Archivo | Responsabilidad |
| --- | --- |
| `generate.ts` | `placeMines` (Fisher–Yates, excluye el vecindario del primer clic) |
| `solve.ts` | `floodReveal`, `findHint`, victoria/derrota |
| `chord.ts` | Chording: si las banderas coinciden con el número, abre el resto |

Clic izquierdo abre. Clic derecho cicla bandera (y signo de pregunta si está activado). Doble clic o izquierdo+derecho a la vez sobre un número hace chord: si las banderas no coinciden, no pasa nada; si están mal, se pierde.

**Pista** (`findHint`) busca una jugada forzada alrededor de un número (casilla segura o mina). **Mismo tablero** reabre la misma disposición de minas. El mejor tiempo por dificultad se guarda en `localStorage` (`minesweeper-best`).

## Sudoku

9×9 clásico. Cada tablero se genera con solución única. Solitario; no usa `GamePanel`.

| Dificultad | Pistas dadas (aprox.) |
| --- | --- |
| Fácil | 40 |
| Media | 32 |
| Difícil | 27 |
| Experta | 23 |

### Motor (`src/sudoku`)

| Archivo | Responsabilidad |
| --- | --- |
| `solve.ts` | Backtracking con máscaras; relleno y conteo de soluciones |
| `generate.ts` | Tablero completo + huecos simétricos mientras la solución sigue única |
| `hint.ts` | Únicos desnudos y ocultos; autocompletar notas |
| `notes.ts` | Candidatos en bits y limpieza al colocar un número |

**Anotaciones.** Modo lápiz (botón o tecla `N`). Al colocar un número se borran esas notas en su fila, columna y bloque.

**Pista.** Señala un único obvio. Un segundo toque lo completa. Si no hay único, se puede revelar la casilla o autocompletar notas.

**Confort.** Resalta la casa de la selección y los mismos dígitos, marca conflictos, cuenta cuántos faltan de cada número, deshacer, mismo tablero, teclado (1-9, flechas, borrar) y mejor tiempo en `localStorage` (`sudoku-best`).

## Piezas compartidas

- `shared/point.ts` y `shared/player.ts`: coordenadas y etiquetas.
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

## Referencias de reglas

- Wikipedia, *Fanorona*
- M. P. D. Schadd et al., *Best Play in Fanorona Leads to Draw* (2008)
- ICGA, página de Fanorona (notación `a1-b2A` / `W`, cadenas, tablas)
- Wikipedia, *Nine men's morris*
- Wikipedia, *Six men's morris* y *Twelve men's morris*
- Comportamiento de Buscaminas de Windows 7 (primer clic vacío, chording)
- Wikipedia, *Sudoku*
