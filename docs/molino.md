# Molino

Tres variantes en `src/morris/variants.ts`. Por defecto, molino a 9. Arranca contra la CPU. Se puede elegir blancas o negras.

Documentación de [Fanorona](fanorona.md), [Buscaminas](buscaminas.md) y [Sudoku](sudoku.md). [Arquitectura](arquitectura.md).

| Variante | Piezas | Tablero | Volar |
| --- | --- | --- | --- |
| Molino a 6 | 6 | Dos cuadrados unidos por radios | No |
| Molino a 9 | 9 | Tres cuadrados y radios | Sí, con 3 piezas |
| Molino a 12 | 12 | Igual que a 9, más molinos en diagonal | Sí, con 3 piezas |

Empiezan las blancas. Fases: colocar de a una en vacíos, luego mover a un vecino por las líneas. Tres alineadas = molino = sacar una rival (no de un molino, salvo que todas lo estén). Un movimiento que cierre dos molinos saca una sola pieza. Gana quien deja al rival con menos de 3 piezas o sin jugadas. Tablas por triple repetición.

Dificultades: fácil, media, difícil, **perfecta**.

## Motor (`src/morris`)

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

## Sesión (`useMorris`)

Las piedras tienen identidad (`id`) para animar colocación, deslizamiento y captura. Al cerrar un molino se iluminan las tres casillas (~600 ms) antes de elegir qué sacar. Deshacer restaura también las piedras.

Si el humano juega negras, la CPU coloca primero.

## Referencias

- Wikipedia, *Nine men's morris*
- Wikipedia, *Six men's morris* y *Twelve men's morris*
