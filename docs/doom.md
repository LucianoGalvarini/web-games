# Doom

Shareware de Doom 1 (1993) en el navegador: el primer episodio, Knee-Deep in the Dead. El motor es [doomgeneric](https://github.com/ozkl/doomgeneric) (GPLv2), compilado a WebAssembly. No incluye el juego registrado (`doom.wad`).

El IWAD shareware (`DOOM1.WAD`) se puede redistribuir según la licencia original de id Software. El build WASM y los datos viven en `public/doom/`.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md), [Tetris](tetris.md), [Ajedrez](ajedrez.md) y [Pai Sho](paisho.md). [Arquitectura](arquitectura.md).

## Qué corre

| Archivo | Rol |
| --- | --- |
| `public/doom/index.html` | Canvas y arranque de Emscripten |
| `public/doom/doomgeneric.js` | Glue JS |
| `public/doom/doomgeneric.wasm` | Motor |
| `public/doom/doomgeneric.data` | IWAD shareware y datos |
| `src/components/DoomGame.tsx` | Shell de la mesa (iframe) |

La UI monta el puerto en un iframe (`import.meta.env.BASE_URL + 'doom/index.html'`) para que el teclado y el audio del WASM no choquen con React. El volumen (0 a 100) está en el icono de sonido del HUD; Doom lo recibe por `postMessage`.

El motor original solo lee flechas. El iframe traduce WASD a esas teclas y el clic izquierdo a disparo (Ctrl).

## Controles

| Tecla | Acción |
| --- | --- |
| WASD / flechas | Avanzar y girar |
| Alt + A/D o Alt + flechas | Strafe |
| Clic / Ctrl | Disparar |
| Espacio | Abrir puertas e interruptores |
| Shift | Correr |
| 1–7 | Armas |
| Tab | Mapa |
| Esc | Menú |

Hace falta clic en el recuadro para darle foco. New Game en el menú arranca el episodio 1.
