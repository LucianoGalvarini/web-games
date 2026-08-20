# Pai Sho

Juego de jardín inspirado en el tablero de Iroh (Avatar). La serie no publica reglamento; esta mesa usa el núcleo de armonías de Skud Pai Sho, sin teselas de acento, para una partida corta y clara. Arranca contra la CPU. Se puede elegir anfitrión (claras) o invitado (oscuras).

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md), [Tetris](tetris.md) y [Ajedrez](ajedrez.md). [Arquitectura](arquitectura.md).

Tablero circular de intersecciones. Cuatro puertas en los puntos cardinales. Jardines rojo y blanco en el centro; el resto es neutro.

Cada uno tiene dos rosas, crisantemos, rododendros, jazmines, lirios y jades, y un loto blanco. El anfitrión empieza. En un turno se planta una flor en una puerta vacía o se mueve una flor del jardín.

Movimiento en cruz, sin saltar: 3, 4 o 5 según la flor (loto 2). No se termina en una puerta. Las rojas no terminan en jardín blanco; las blancas, no en rojo. El loto entra en ambos y es el único que puede posarse en el centro.

Dos flores propias alineadas en fila o columna, sin nada en el medio, armonizan si son vecinas en el círculo rosa–crisantemo–rododendro–jazmín–lirio–jade. El loto armoniza con todas las propias. El mismo número de otro color choca: esa alineación está prohibida, salvo comer cayendo encima.

Gana quien cierra un anillo de armonías alrededor del centro, sin tocarlo. Triple repetición es tablas.

Dificultades: fácil, media, difícil, **perfecta**.

## Motor (`src/paisho`)

| Archivo | Responsabilidad |
| --- | --- |
| `constants.ts` | Grilla 11×11 recortada al círculo, puertas, jardines, armonía |
| `board.ts` | Posición inicial, serialización |
| `harmony.ts` | Enlaces, choques, anillo |
| `moves.ts` | Plantar, arreglar, `applyMove` |
| `apply.ts` | `winnerOf` |
| `ai.ts` | `chooseAiMove` |

Una acción es `plant` o `arrange`. El estado es inmutable.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Ruido; a veces planta |
| Media | Minimax profundidad 1 |
| Difícil | Minimax profundidad 2 |
| Perfecta | Búsqueda iterativa con tope de ~380 ms |

Evaluación: cantidad de armonías + flores florecidas cerca del centro + loto.

## Sesión (`usePaiSho`)

La reserva debajo del tablero elige la flor a plantar. Las líneas de oro marcan armonías actuales. Si el humano juega de invitado, la CPU planta primero.

## Referencias

- Skud Pai Sho, *The Garden Gate* (núcleo de armonías y anillo)
- Avatar: The Last Airbender, Pai Sho de Iroh
