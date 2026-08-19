# Tetris

Pozo de 10×20. Siete tetrominós, bolsa de 7, giros SRS, reserva y pieza fantasma. Arranca solo; la dificultad fija el nivel inicial.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md) y [Truco](truco.md). [Arquitectura](arquitectura.md).

## Reglas que implementa

- Piezas I, O, T, S, Z, J y L. Cada bolsa mezcla las siete y no vuelve a salir una hasta agotarla.
- Líneas completas se borran. 1/2/3/4 líneas valen 100/300/500/800 por el nivel.
- Bajar suave: +1 por celda. Tirar (espacio): clava y +2 por celda de caída.
- Giros con patadas SRS (wall kicks). La O no se patea.
- Hold una vez por pieza. El fantasma marca la caída.
- Cada 10 líneas sube el nivel (tope 15) y la gravedad se acelera.
- Si la pieza nueva no entra, se llena el pozo.

Fácil arranca en nivel 1, media en 5, difícil en 10. El mejor puntaje por dificultad queda en `localStorage` (`tetris-best`).

## Motor (`src/tetris`)

| Archivo | Responsabilidad |
| --- | --- |
| `shapes.ts` | Celdas de cada rotación |
| `kicks.ts` | Patadas SRS (eje Y hacia abajo) |
| `bag.ts` | Bolsa de 7 |
| `board.ts` | Colisión, escritura, borrado, fantasma |
| `apply.ts` | `createGame`, `applyAction` |

Acciones: `left`, `right`, `soft`, `hard`, `cw`, `ccw`, `hold`, `tick`.

## Sesión (`useTetris`)

Gravedad por `requestAnimationFrame`. Retraso de encastre ~520 ms, se reinicia si la pieza se mueve estando apoyada. DAS/ARR en izquierda y derecha. Pausa con P o Esc.

## Controles

| Tecla | Acción |
| --- | --- |
| ← → | Mover |
| ↑ / X | Girar horario |
| Z / Ctrl | Girar antihorario |
| ↓ | Bajar suave |
| Espacio | Tirar |
| C / Shift | Reserva |
| P / Esc | Pausa |

En pantalla hay botones para el mismo set.

## Referencias

- Tetris Guideline (bolsa de 7, SRS, hold)
- Wikipedia, *Tetris*
