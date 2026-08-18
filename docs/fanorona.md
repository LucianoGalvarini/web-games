# Fanorona

Variante **Fanoron-Tsivy** (9×5). Empiezan las blancas. Arranca contra la CPU. Se puede jugar con blancas o negras. Dificultades: fácil, media, difícil.

Documentación de [Molino](molino.md), [Buscaminas](buscaminas.md) y [Sudoku](sudoku.md). [Arquitectura](arquitectura.md).

## Tablero y notación

Coordenadas: `x` de 0 a 8 (archivos `a`–`i`) y `y` de 0 a 4 (filas de arriba hacia abajo). El origen `(0,0)` es la esquina superior izquierda, negra. Notación algebraica: rango = `5 - y`, así que `e3` (centro) es `(4, 2)`.

Las piezas se mueven un paso por las líneas. En un punto **fuerte** (`(x + y) % 2 === 0`) también hay diagonales. En un punto **débil**, solo horizontal y vertical.

**Posición inicial.** Negras arriba, blancas abajo. Fila del medio: `B W B W · W B W B`. Centro vacío. 22 por bando. Hay exactamente cinco aperturas legales:

- `d3-e3` alejamiento
- `f3-e3` alejamiento
- `d2-e3` acercamiento
- `e2-e3` acercamiento
- `f2-e3` acercamiento

## Reglas

- **Paika.** Si no hay captura, se mueve a una intersección vacía adyacente.
- **Captura obligatoria.** Si existe al menos una captura, no se puede jugar paika.
- **Acercamiento.** Al aterrizar, la siguiente casilla en esa dirección es enemiga. Se retira esa pieza y todas las enemigas consecutivas detrás, hasta un hueco o una pieza propia.
- **Alejamiento.** La pieza estaba junto al rival y se aleja. Se captura la línea que queda atrás.
- **No las dos a la vez.** Si el mismo paso permite ambas, el jugador elige (`CaptureChoice`). Son dos `Move` con el mismo `from`/`to` y distinto `kind`.
- **Cadenas.** Tras capturar se puede seguir con la misma pieza o terminar el turno. Cada paso tiene que capturar, no se aterriza en una casilla ya visitada y no se repite la dirección del paso anterior.
- **Fin.** Gana quien captura todas las piezas rivales. Si el que toca no tiene jugadas, pierde. Tres repeticiones de la misma posición con el mismo turno dan tablas.

Una **jugada** (`Move`) es un solo paso (`from`, `to`, `kind`, `captured`). Un **turno** puede ser varios `Move` de la misma pieza. `ChainState` guarda `current`, `visited` y `lastDir`.

## Motor (`src/game`)

| Archivo | Responsabilidad |
| --- | --- |
| `geometry.ts` | `inBounds`, `isStrong`, `canStepFrom` |
| `board.ts` | `createInitialBoard`, `cloneBoard`, `countPieces`, `serializePosition` |
| `moves.ts` | `captureOptions`, `legalMoves`, `legalMovesInChain` |
| `apply.ts` | `applyMove`, `startChain`, `applyChainStep`, `applyTurn` |
| `ai.ts` | `generateTurns`, `chooseAiTurn` |

`legalMovesAtTurnStart` pide primero las capturas; si no hay, recae en paika.

## Sesión (`useFanorona`)

- Clic en pieza con jugadas legales → se resalta. Clic en destino → se aplica. Si hay dos capturas para el mismo destino, se pide elección.
- Tras una captura con continuación, la pieza queda seleccionada y aparece **Terminar turno**.
- Deshacer: pila de snapshots tomada antes de cada `playMove`.
- IA: si el turno no es del humano (`isCpuTurn`), un `useEffect` calcula un turno completo y lo reproduce paso a paso (~460 ms). El último paso usa `playMove(..., { endTurn: true })` para no dejar la cadena abierta cuando la CPU decide cortar. Si el humano juega negras, la CPU mueve primero.

## Inteligencia artificial

`generateTurns` expande secuencias legales (tope de 8 capturas) e incluye parar después de cada captura.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Maximiza piezas capturadas en el turno (greedy + ruido) |
| Media | Minimax profundidad 1 |
| Difícil | Minimax profundidad 2 con poda alfa-beta |

Evaluación: diferencia de material × 120 + diferencia de movilidad × 3. Gane/pérdida inmediata vale ±10000.

## Interfaz

`BoardView` dibuja el grid en SVG. Las diagonales salen solo de puntos fuertes. `useStoneMotion` anima el viaje de la piedra (~320 ms, con alce e inclinación) y el desvanecimiento de las capturadas. La pieza seleccionada se levanta un poco. Destinos legales: anillo dorado. Capturas al pasar el mouse: rojo.

## Referencias

- Wikipedia, *Fanorona*
- M. P. D. Schadd et al., *Best Play in Fanorona Leads to Draw* (2008)
- ICGA, página de Fanorona (notación `a1-b2A` / `W`, cadenas, tablas)
