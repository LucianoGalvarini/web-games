# Backgammon

Tablero de 24 puntos, quince fichas por bando. Arranca contra la CPU. Se puede elegir blancas o negras.

Documentación de [Damas](damas.md), [Ajedrez](ajedrez.md) y [Shogi](shogi.md). [Arquitectura](arquitectura.md).

Las blancas recorren del punto 24 al 1; las negras, del 1 al 24. Cada bando saca sus fichas por su propio extremo del tablero (bear off) una vez que las quince están en su cuadro de casa (los últimos seis puntos). Gana quien retira las quince primero.

No hay tablas: siempre hay un ganador. Tampoco hay dado doblador (cubo de doblaje): esta versión juega partidas simples, sin apostar puntos extra.

Dificultades: fácil, media, difícil, **perfecta**.

## Reglas

- **Tirar y mover.** Cada tirada trae dos dados; cada valor se juega como un movimiento independiente de esa cantidad de puntos, en la dirección propia. Un doble (por ejemplo 4-4) se juega cuatro veces. Es obligatorio usar los dos dados si hay alguna secuencia legal que lo permita; si solo se puede jugar uno de los dos números, hay que jugar el mayor cuando sea posible.
- **Blots y la barra.** Un punto con una sola ficha rival es un *blot*: caer ahí la manda a la barra. Con fichas en la barra, hay que reingresarlas (en el cuadro de casa del rival) antes de cualquier otro movimiento. Un punto con dos o más fichas rivales está bloqueado.
- **Bear off.** Con las quince fichas en el cuadro de casa, un dado que coincide con el punto exacto retira esa ficha. Si no hay ficha en ese punto exacto pero tampoco hay ninguna más atrás (en un punto que necesite un dado mayor), el dado sobrante retira la ficha más atrasada.
- **Simplificaciones deliberadas**: sin cubo de doblaje y sin puntaje de gammon/backgammon (retirar todas antes de que el rival saque una, o con una en la barra); esta versión juega partidas simples hasta el bear-off completo, más simple y consistente con el resto de los juegos del sitio, que tampoco llevan puntaje entre partidas.

## Motor (`src/backgammon`)

| Archivo | Responsabilidad |
| --- | --- |
| `constants.ts` | Dirección de cada bando, cuadro de casa, distancia a la salida, punto de reingreso |
| `board.ts` | Posición inicial, clonado, conteo de fichas, serialización |
| `moves.ts` | Jugadas legales para un dado (`legalSingleMoves`) y `generateTurns`, que arma toda tirada legal completa |
| `apply.ts` | `applyMove` (un paso, con captura si corresponde), `applyTurn`, `winnerOf` |
| `ai.ts` | Heurística de evaluación y `chooseAiTurn` por dificultad |

`generateTurns` explora recursivamente todas las formas de usar los dados disponibles (ambos órdenes si no son dobles, las cuatro repeticiones si lo son), y se queda solo con las secuencias que usan la mayor cantidad de dados posible — y, si con dados distintos solo se puede jugar uno, con las que usan el mayor. La sesión (`useBackgammon`) recorta esa lista jugada a jugada a medida que el humano elige piezas y destinos, así que la interfaz nunca permite una secuencia que desperdicie un dado jugable.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Turno al azar, con preferencia liviana por comer blots y avanzar |
| Media | Evalúa la posición resultante de cada turno posible, con ruido alto |
| Difícil | Igual que media, con menos ruido |
| Perfecta | Evalúa los mejores candidatos por heurística y, para cada uno, promedia la mejor respuesta del rival sobre las 21 tiradas posibles (expectiminimax de una capa), con tope de tiempo |

Evaluación: diferencia de pips (cuenta de distancia total a la salida), fichas retiradas, fichas en la barra, puntos hechos (dos o más fichas propias, doble peso en el cuadro de casa) y exposición de blots (aproximación de cuántas combinaciones de dados del rival podrían comerlos). Como el resultado de cada turno depende de una tirada futura desconocida, no hay minimax puro hasta un final determinista como en Damas o Ajedrez: la IA nunca "ve" una victoria forzada, solo juega la posición que mejor le conviene en expectativa.

## Sesión (`useBackgammon`)

Cada ficha tiene identidad propia (`id`) para animar su movimiento; no se derivan de la posición en cada render, sino que se actualizan a mano en cada jugada (igual que en Damas), incluyendo mandar a la barra la ficha rival comida. El tablero se puede dar vuelta (`flipped`) cuando el humano juega con negras, para que su cuadro de casa quede siempre abajo a la derecha.

Si el humano juega negras, la CPU mueve primero.

## Referencias

- Wikipedia, *Backgammon* (reglas de movimiento, barra y bear off)
- United States Backgammon Federation, reglamento básico
