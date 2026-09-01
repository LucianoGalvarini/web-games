# UNO

Hasta **seis jugadores**. Mazo de 108. Un nombre y un código de sala, sin cuenta. El anfitrión empieza con 2 a 6.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md), [Tetris](tetris.md), [Ajedrez](ajedrez.md), [Pai Sho](paisho.md), [Doom](doom.md), [Shogi](shogi.md) y [Liga](liga.md). [Arquitectura](arquitectura.md).

Las cartas son propias (óvalo blanco, comodín en cuadrantes). No hay API externa.

## Reglas que implementa

- Mazo de 108: 0–9 por color, Salta, Reversa, +2, cuatro comodines y cuatro +4.
- Se reparte 7. El +4 nunca es la carta inicial.
- Hay que tirar color, número o símbolo. El comodín y el +4 piden color.
- Salta pierde el turno. Reversa cambia el sentido; con 2 jugadores actúa como Salta.
- +2 y +4 hacen tomar y saltan al siguiente.
- Si se acaba el mazo, se mezcla el descarte (menos la de arriba).
- Con una carta hay que apretar **UNO**. Un rival puede delatar si no lo hizo: toma 2.

## Motor (`src/uno`)

| Archivo | Responsabilidad |
| --- | --- |
| `deck.ts` | Mazo de 108, shuffle, comodines |
| `gameEngine.ts` | Empezar, tirar, tomar, UNO, delatar, salir |
| `store.ts` | Salas en memoria, vista pública (sin cartas ajenas) |
| `dispatch.ts` | Mensajes de la sala (empezar, jugar, chat) |
| `protocol.ts` | Frases rápidas y forma de los mensajes |

El estado de la sala se muta en el motor, igual que en el juego original. Cada cliente solo ve su mano.

## Sesión (`useUno`)

Crear o entrar a una sala. Con `npm run dev` las salas viven en el servidor de Vite y se puede jugar en la red local. Si no hay servidor (sitio estático), la sala queda en la pestaña anfitriona y otras pestañas del mismo origen se unen con el código.

## Cómo se juega

El anfitrión comparte el código. Cuando hay al menos dos, empieza. En tu turno, las cartas que entran se levantan. El botón **UNO!** late cuando te queda una. Tocá tu avatar para una frase rápida.
