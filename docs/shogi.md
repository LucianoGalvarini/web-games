# Shogi

Ajedrez japonés, tablero de 9×9. Arranca contra la CPU. Se puede elegir blancas (先手/sente) o negras (後手/gote).

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md), [Tetris](tetris.md) y [Ajedrez](ajedrez.md). [Arquitectura](arquitectura.md).

Cada bando tiene rey, torre, alfil, dos oros, dos platas, dos caballos, dos lanzas y nueve peones. Las blancas empiezan.

| Pieza | Movimiento | Promovida |
| --- | --- | --- |
| Rey (王/玉) | 1 casilla, cualquier dirección | — |
| Torre (飛) | Cualquier distancia, ortogonal | Dragón (龍): + 1 diagonal |
| Alfil (角) | Cualquier distancia, diagonal | Caballo dragón (馬): + 1 ortogonal |
| Oro (金) | 1 ortogonal + 1 diagonal adelante (6 destinos) | No promociona |
| Plata (銀) | 1 diagonal (4) + 1 recto adelante | Se mueve como Oro (全) |
| Caballo (桂) | Salta 2 adelante + 1 al costado | Se mueve como Oro (圭) |
| Lanza (香) | Cualquier distancia, recto adelante | Se mueve como Oro (杏) |
| Peón (歩) | 1 casilla recto adelante (mueve y come igual) | Tokin (と), se mueve como Oro |

## Mano y tirada

Una pieza capturada pasa a la mano de quien la comió, siempre sin promoción, y se puede tirar en cualquier casilla vacía en vez de mover. Restricciones:

- **Nifu**: no se puede tirar un peón en una columna donde ya hay uno propio sin promocionar.
- No se puede tirar una pieza en una casilla donde quedaría sin jugadas futuras (peón o lanza en la última fila, caballo en las últimas dos).
- **Uchi-fu-zume**: no se puede tirar un peón si da jaque mate en el acto. Esta restricción es solo del peón — se puede dar mate tirando cualquier otra pieza.

## Promoción

Las últimas 3 filas propias son la zona de promoción. Si el movimiento empieza, termina o pasa por la zona, la promoción es opcional — salvo que sea obligatoria porque la pieza quedaría sin movimientos: peón o lanza en la última fila, caballo en las últimas dos.

## Fin de la partida

A diferencia del ajedrez, el Shogi no tiene tablas por ahogado: si al jugador que le toca mover no le queda ninguna jugada legal (mover, comer o tirar), pierde, esté o no en jaque. Triple repetición es tablas (simplificación del *sennichite* real, que es a cuatro repeticiones con una excepción de jaque perpetuo — no implementada). Tampoco se implementa *jishogi* (impasse por reyes en territorio rival).

Dificultades: fácil, media, difícil, **perfecta**.

## Motor (`src/shogi`)

| Archivo | Responsabilidad |
| --- | --- |
| `constants.ts` | Tamaño, direcciones, deltas por pieza, zona de promoción, valores |
| `board.ts` | Posición inicial, rey, conteo, serialización |
| `moves.ts` | Pseudo-jugadas, tiradas (nifu/uchi-fu-zume), jaque, `legalMoves`, `applyMove` |
| `apply.ts` | Material y `winnerOf` |
| `labels.ts` | Kanji y nombre en español por pieza |
| `ai.ts` | `chooseAiMove` |

Una jugada es un único `ShogiMove`: mover (con `promote` opcional) o tirar una pieza de la mano. El estado es inmutable.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Ruido; a veces prioriza capturas |
| Media | Minimax profundidad 2 |
| Difícil | Minimax profundidad 3 con tabla de transposición |
| Perfecta | Búsqueda iterativa con tabla de transposición y tope de ~900 ms (hasta profundidad 4) |

Evaluación: material (piezas en el tablero y en la mano, con valores de Shogi) + jaque. Como con Molino, Damas y Ajedrez, "Perfecta" es el motor más fuerte posible sin herramientas externas — no una base de datos de finales.

## Sesión (`useShogi`)

Las piezas tienen identidad (`id`) para animar el movimiento y la tirada; la posición se ubica con `left`/`top` en porcentaje. Si un movimiento permite elegir promocionar o no, el tablero muestra un cartel Sí/No. Si el humano juega negras, el tablero se da vuelta y la CPU mueve primero.

## Ambientación

A diferencia de los demás juegos, las piezas no se distinguen por color sino por forma y orientación: son del mismo tono de madera para los dos bandos, con forma de cuña (pentágono) apuntando hacia el rival, y el kanji de cada pieza en tinta negra (roja si está promovida). Es el único juego del proyecto con texto en japonés — usa la tipografía Noto Serif JP, cargada solo para esto. El tablero no tiene casillas de colores, como un shogiban real.

## Referencias

- Wikipedia, *Shogi*
- 81Dojo, *Rules and Manners of Shogi*
- SgpShogi, reglas de tirada y promoción
