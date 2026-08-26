# Liga

Alto Mando de Pokémon Esmeralda: Sixto, Fátima, Nívea, Dracón y el Campeón Máximo. Cada partida reparte seis Pokémon al azar de las generaciones 1 a 3 (dex 1–386, tipos de la tercera generación) y una mochila según la dificultad. No hay mapa del mundo: solo las salas de Ever Grande.

Los datos salen de [PokéAPI](https://pokeapi.co/) congelados en `src/liga/data/`. Nombres y sprites son de Nintendo; el motor es propio.

Documentación de [Fanorona](fanorona.md), [Molino](molino.md), [Damas](damas.md), [Buscaminas](buscaminas.md), [Sudoku](sudoku.md), [Truco](truco.md), [Tetris](tetris.md), [Ajedrez](ajedrez.md), [Pai Sho](paisho.md) y [Doom](doom.md). [Arquitectura](arquitectura.md).

## Cómo se juega

El entrenador tapa la puerta norte. Hay que hablarle (Z) y ganar el combate para seguir. En combate, flechas mueven el cursor, Z confirma y X vuelve. Si un Pokémon se debilita, primero cae y después entra el siguiente, con su propia animación. El texto y los ataques van despacio; Espacio acelera. Sonido y pantalla completa están en la esquina del recuadro. No se puede saltar un miembro. Los PS y los objetos no se reponen entre salas.

Fácil: nivel 65, IVs altos, más Restau. todo y Máx. revivir. Perfecta: nivel 50, pocos objetos, rivales más fuertes.

## Motor (`src/liga`)

| Archivo | Rol |
| --- | --- |
| `data/species.json` | Dex gen 1–3 fully evolved |
| `data/moves.json` | Movimientos de esas especies |
| `apply.ts` | Caminar, hablar, combate |
| `battle.ts` | Daño gen 3 (físico/especial por tipo), objetos, IA |
| `map.ts` | Salas, colisión, puertas |
| `team.ts` | Semilla, equipo y Alto Mando |
| `fx.ts` | Temas de sala, color de tipos y sonidos de golpe |
| `cursor.ts` | Grilla GBA: flechas, Z y X |

Combate: STAB, tabla de tipos de gen 3 (sin Hada; Acero resiste Fantasma y Siniestro), críticos 1/16, sin habilidades ni clima. Terremoto no afecta a Volador. Los movimientos de estado respetan inmunidades (Onda Trueno no paraliza Tierra). Hiperrayo y Vuelo se resuelven en un turno. Los poderes de los ataques usan los valores de Esmeralda.

Para regenerar el dex: `node scripts/fetch-liga-dex.mjs`.
