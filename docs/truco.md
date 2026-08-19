# Truco

**Truco argentino** mano a mano, **sin flor**, partida a 30. Arranca contra la CPU. Se puede jugar de mano o de pie.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Buscaminas](buscaminas.md) y [Sudoku](sudoku.md). [Arquitectura](arquitectura.md).

Las cartas son SVG propias (oros, copas, espadas y bastos). No hay API externa.

## Reglas que implementa

- Mazo español de 40 (1–7, 10 sota, 11 caballo, 12 rey).
- Jerarquía de bazas: 1 de espadas, 1 de bastos, 7 de espadas, 7 de oros, los 3, los 2, anchos falsos (1 de oros y de copas), 12, 11, 10, 7 falsos, 6, 5 y 4. Misma altura = parda.
- Tres cartas. El mano sale. Gana la mano quien hace dos bazas.
- Primera parda: define la segunda. Primera ganada y segunda parda: gana quien hizo la primera. Si la tercera empata, gana quien hizo la primera no parda; si las tres son pardas, gana el mano.
- Envido (2), envido-envido (4), real envido (+3) y falta envido. La falta vale lo que le falta al que va ganando para las 15 (ambos en malas) o para las 30. No quiero deja 1 o el valor anterior. Empate de tantos: gana el mano. Solo en la primera baza, antes de que caigan las dos cartas. El envido tiene prioridad si ya se cantó truco.
- Truco 2, retruco 3, vale cuatro 4. No quiero cierra la mano con el valor anterior (truco no querido = 1). Quien canta no puede volver a subir hasta que el otro lo haga.
- Al mazo entrega el valor actual de la mano.
- El mano se alterna cada mano.

## Motor (`src/truco`)

| Archivo | Responsabilidad |
| --- | --- |
| `deck.ts` | Mazo de 40, shuffle, identidad de carta |
| `ranking.ts` | Poder de baza y valor de envido de una carta |
| `envido.ts` | Tantos de la mano, falta, cadena de cantos |
| `legal.ts` | Acciones legales y actor del momento |
| `apply.ts` | Reparto, `applyAction`, siguiente mano |
| `ai.ts` | Una acción por turno según dificultad |

Una acción es `play` \| `envido` \| `real` \| `falta` \| `truco` \| `quiero` \| `no-quiero` \| `mazo`. El estado es inmutable.

## Sesión (`useTruco`)

Modo CPU por defecto. Dificultades fácil, media y difícil. La CPU responde con ~520 ms. Tras cada mano se reparte la siguiente; al llegar a 30 aparece el resultado.

En dos jugadores la mano de abajo es siempre la de quien tiene que actuar (las del otro quedan tapadas).

## Inteligencia artificial

| Dificultad | Criterio |
| --- | --- |
| Fácil | Casi siempre tira una carta al azar; acepta cantos a veces |
| Media | Envido desde 25–27; truco con dos cartas altas; responde la baza con la más baja que mate |
| Difícil | Falta o real con tantos fuertes; retruco con matadora; algún farol |

## Interfaz

`SpanishCard` dibuja el naipe. `TrucoTable` arma mesa, baza y botones de canto. El panel derecho muestra malas/buenas y el diario de la mano.

## Referencias

- Wikipedia, *Truco*
- Uso habitual de café / partida a 30, sin flor
