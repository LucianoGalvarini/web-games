# Sudoku

9×9 clásico. Cada tablero se genera con solución única. Solitario; no usa `GamePanel`. El reloj arranca al poner un número, anotar o usar una ayuda, no al entrar al juego.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md) y [Buscaminas](buscaminas.md). [Arquitectura](arquitectura.md).

| Dificultad | Pistas dadas (aprox.) |
| --- | --- |
| Fácil | 40 |
| Media | 32 |
| Difícil | 27 |
| Experta | 23 |

## Motor (`src/sudoku`)

| Archivo | Responsabilidad |
| --- | --- |
| `solve.ts` | Backtracking con máscaras; relleno y conteo de soluciones |
| `generate.ts` | Tablero completo + huecos simétricos mientras la solución sigue única |
| `hint.ts` | Únicos desnudos y ocultos; autocompletar notas |
| `notes.ts` | Candidatos en bits y limpieza al colocar un número |

**Anotaciones.** Modo lápiz (botón o tecla `N`). Al colocar un número se borran esas notas en su fila, columna y bloque.

**Pista.** Señala un único obvio. Un segundo toque lo completa. Si no hay único, se puede revelar la casilla o autocompletar notas.

**Confort.** Resalta la casa de la selección y los mismos dígitos, marca conflictos, cuenta cuántos faltan de cada número, deshacer, mismo tablero, teclado (1-9, flechas, borrar) y mejor tiempo en `localStorage` (`sudoku-best`).

Estados: `loading` (armando el tablero), `ready` (se puede jugar, el reloj está quieto), `playing` (el tiempo corre), `won`.

## Referencias

- Wikipedia, *Sudoku*
