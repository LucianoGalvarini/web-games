# Ajedrez

Reglas FIDE de partida informal: enroque, al paso, coronación, jaque mate, ahogado, triple repetición, 50 jugadas y material insuficiente (posición muerta). Arranca contra la CPU. Se puede elegir blancas o negras.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md) y [Tetris](tetris.md). [Arquitectura](arquitectura.md).

Tablero de 8×8. Las blancas empiezan. Cada bando tiene rey, dama, dos torres, dos alfiles, dos caballos y ocho peones.

El rey se mueve una casilla; la dama en cualquier dirección; la torre en fila o columna; el alfil en diagonal; el caballo en L y puede saltar. El peón avanza una casilla (o dos desde su fila inicial) y come en diagonal. Si un peón rival acaba de avanzar dos y queda al lado, se puede comer al paso. Un peón que llega a la última fila se corona: dama, torre, alfil o caballo.

Enroque: el rey salta dos hacia la torre y la torre pasa a su lado, si ninguno se movió, el camino está vacío y el rey no pasa por jaque.

Hay que salir del jaque. Jaque mate gana. Ahogado, triple repetición, 50 jugadas sin peón ni captura, o material insuficiente, son tablas. El overlay dice el motivo.

Dificultades: fácil, media, difícil, **perfecta**.

## Motor (`src/ajedrez`)

Índice de casilla `rank * 8 + file`. El rango 0 es la octava fila (a8 = 0); el rango 7 es la primera (e1 = 60). El peón blanco avanza en `y-`.

| Archivo | Responsabilidad |
| --- | --- |
| `constants.ts` | Tamaño, direcciones, valores, enroque |
| `board.ts` | Posición inicial, rey, serialización, etiquetas |
| `moves.ts` | Pseudo-legales, jaque, `legalMoves`, `applyMove` |
| `apply.ts` | Material, capturas, tablas, `resultOf` / `winnerOf` |
| `notation.ts` | SAN en castellano y PGN en inglés |
| `perft.ts` | Conteo de nodos legales |
| `ai.ts` | `chooseAiMove` |
| `ai.worker.ts` | Búsqueda de Perfecta fuera del hilo de la UI |

Una acción es un único `ChessMove` (`from`, `to`, captura, enroque, al paso, coronación). El estado es inmutable.

Material insuficiente (posición muerta): rey vs rey, rey+caballo vs rey, rey+alfil vs rey, y alfil vs alfil del mismo color de casilla. Alfil vs caballo y alfiles de distinto color siguen.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Ruido; a veces prioriza capturas |
| Media | Minimax profundidad 2 con poda alfa-beta |
| Difícil | Libro de apertura corto + minimax profundidad 3, capturas primero, TT con flags |
| Perfecta | Libro + búsqueda iterativa con quietud, TT con flags y tope de ~420 ms (hasta profundidad 4), en un Worker |

Evaluación: material (peón 100, caballo 320, alfil 330, torre 500, dama 900) + tablas de casillas + jaque. En difícil/perfecta las hojas hacen búsqueda de quietud (capturas).

Notación en pantalla: castellano (`C` caballo, `A` alfil, `T` torre, `D` dama, `R` rey). El PGN copiable usa SAN inglés.

## Sesión (`useAjedrez`)

Las piezas tienen identidad (`id`) para animar el deslizamiento; la posición se ubica con `left`/`top` en porcentaje. Una captura deja la pieza comida ~240 ms antes de sacarla. Si el peón puede coronar a más de una pieza, el tablero abre el selector (se cancela con Escape, clic fuera o Cancelar). El enroque mueve rey y torre en el mismo turno. Se puede arrastrar o jugar con clic; flechas + Enter mueven el cursor.

Si el humano juega negras, el tablero se da vuelta y la CPU mueve primero.

Contra la CPU, **Deshacer** vuelve un turno completo (jugada humana + respuesta). En local, un ply. El panel derecho muestra capturas con glifos, ventaja en peones e historial SAN.

## Referencias

- FIDE, *Laws of Chess*
- Wikipedia, *Ajedrez*
