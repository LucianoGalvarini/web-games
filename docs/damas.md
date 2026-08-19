# Damas

Dos variantes en `src/damas/variants.ts`. Por defecto, reglas inglesas. Arranca contra la CPU. Se puede elegir blancas o negras.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Buscaminas](buscaminas.md) y [Sudoku](sudoku.md). [Arquitectura](arquitectura.md).

| Variante | Dama | Captura a distancia |
| --- | --- | --- |
| Inglesas | Se mueve y come de a una casilla, en las 4 diagonales | No |
| Criollas | "Vuela": cualquier cantidad de casillas vacías en diagonal | Sí, hasta la primera pieza rival en la línea |

Tablero de 8×8, 12 piezas por bando en las casillas oscuras. Empiezan las blancas. Las piezas simples mueven y comen en diagonal, un paso, siempre hacia adelante (nunca hacia atrás, en ninguna de las dos variantes). Si hay captura disponible es obligatoria, aunque se puede elegir con qué pieza empezar. Si después de comer la misma pieza puede seguir comiendo, es obligatorio continuar la cadena. Una pieza que llega a la última fila se corona dama; si fue comiendo, el turno termina ahí aunque la nueva dama pudiera seguir capturando.

Gana quien deja al rival sin piezas o sin movimientos legales. Tablas por triple repetición.

Dificultades: fácil, media, difícil, **perfecta**.

## Motor (`src/damas`)

Las casillas oscuras son las 32 donde `(x + y) % 2 === 1`. Una pieza comida en medio de una cadena queda marcada como "fantasma" (no se borra del tablero real hasta terminar el turno completo), para que no se pueda recomer ni volar a través de esa casilla en la misma jugada — es la única sutileza real de las reglas oficiales.

| Archivo | Responsabilidad |
| --- | --- |
| `variants.ts` | `flyingKing` de cada variante |
| `geometry.ts` | Direcciones, casillas oscuras, fila de coronación |
| `moves.ts` | Pasos por pieza (simple/dama, corto/volador), con el set de "fantasmas" |
| `apply.ts` | `applyMove` (un paso), `applyTurn` (cadena completa, cambia el turno al final) |
| `ai.ts` | `generateTurns` (cadenas completas), `chooseAiTurn` |

Un turno de IA es una cadena de pasos `slide`/`jump`. `generateTurns` la arma recursivamente: después de cada captura busca continuaciones con la misma pieza (respetando fantasmas) y corta si coronó.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Prefiere turnos que capturan, con ruido |
| Media | Minimax profundidad 1 |
| Difícil | Minimax profundidad 2 con poda alfa-beta |
| Perfecta | Búsqueda iterativa con tabla de transposición y tope de tiempo (más alto en criollas por la dama voladora) |

Evaluación: material (peón 100, dama 140) + avance de los peones hacia la coronación + movilidad.

## Sesión (`useDamas`)

A diferencia de Molino y Fanorona, acá el humano juega la cadena de capturas paso a paso: el hook mantiene una captura "en curso" (`activeChain`) que fija la pieza y solo acepta continuar esa misma cadena hasta que se agotan las capturas obligatorias o corona. Las piezas tienen identidad (`id`) para animar el movimiento; la posición se ubica con `left`/`top` en porcentaje sobre una grilla de casillas, no en SVG.

Si el humano juega negras, la CPU mueve primero.

## Referencias

- Wikipedia, *English draughts* y *International draughts*
- FMJD, reglamento de captura y coronación
