# Buscaminas

Estilo Windows 7: el primer clic siempre es un vacío (esa casilla y las ocho vecinas quedan libres de minas). Solitario; no usa `GamePanel`. El reloj arranca en el primer clic.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md) y [Sudoku](sudoku.md). [Arquitectura](arquitectura.md).

| Dificultad | Tablero | Minas |
| --- | --- | --- |
| Principiante | 9×9 | 10 |
| Intermedio | 16×16 | 40 |
| Experto | 30×16 | 99 |

## Motor (`src/minesweeper`)

| Archivo | Responsabilidad |
| --- | --- |
| `generate.ts` | `placeMines` (Fisher–Yates, excluye el vecindario del primer clic) |
| `solve.ts` | `floodReveal`, `findHint`, victoria/derrota |
| `chord.ts` | Chording: si las banderas coinciden con el número, abre el resto |

Clic izquierdo abre. Clic derecho cicla bandera (y signo de pregunta si está activado). Doble clic o izquierdo+derecho a la vez sobre un número hace chord: si las banderas no coinciden, no pasa nada; si están mal, se pierde.

**Pista** (`findHint`) busca una jugada forzada alrededor de un número (casilla segura o mina). **Mismo tablero** reabre la misma disposición de minas. El mejor tiempo por dificultad se guarda en `localStorage` (`minesweeper-best`).

## Referencias

- Comportamiento de Buscaminas de Windows 7 (primer clic vacío, chording)
