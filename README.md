# Fanorona y Molino de nueve

Dos juegos de tablero en React y TypeScript. Al abrir la app se elige cuál jugar. Fanorona (Fanoron-Tsivy, 9×5) y Molino de nueve (Nine Men's Morris) conviven con la misma interfaz de modos (dos jugadores o CPU).

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Typecheck (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run lint` | Oxlint |

La interfaz está en español. En cada juego hay dos modos: dos jugadores en el mismo dispositivo, o blancas humanas contra una CPU (fácil / media / difícil). Desde el panel se vuelve al menú con **Elegir juego**.

## Cómo se construyó

El workspace estaba vacío. El proyecto se generó con Vite y se reemplazó el template por el juego.

1. **Andamiaje.** `npm create vite@latest . -- --template react-ts` y `npm install`. Stack: Vite 8, React 19, TypeScript.
2. **Reglas primero.** Antes de la UI se escribió un motor puro (sin React) en `src/game/`. Las reglas se tomaron de Wikipedia, ICGA/Schadd y las convenciones de Fanoron-Tsivy: captura obligatoria, acercamiento/alejamiento, cadenas con cambio de dirección y casillas no repetidas.
3. **Estado en un hook.** `useFanorona` orquesta tablero, turno, cadena, deshacer e IA. Los componentes no conocen las reglas: reciben datos y disparan acciones.
4. **UI.** Tablero SVG (líneas + intersecciones + piedras), panel lateral y modal de reglas. CSS propio, sin librería de componentes.
5. **Validación.** Se comprobó que la posición inicial tiene 22 piezas por bando, el centro vacío y exactamente **cinco aperturas legales**, las mismas que cita la literatura:

   - `d3-e3` alejamiento
   - `f3-e3` alejamiento
   - `d2-e3` acercamiento
   - `e2-e3` acercamiento
   - `f2-e3` acercamiento

## Arquitectura

La idea es separar **reglas** (funciones puras) de **sesión de juego** (React) de **presentación**.

```
src/
  App.tsx                 # Menú o juego activo
  shared/                 # Player, Point, reglas de texto
  hooks/
    useFanorona.ts
    useMorris.ts
  game/                   # Motor Fanorona
  morris/                 # Motor Molino de nueve
  components/
    Home.tsx              # Selección inicial
    FanoronaGame.tsx
    MorrisGame.tsx
    GamePanel.tsx         # Panel compartido
    RulesModal.tsx
    Board/                # SVG Fanorona + piedras
    morris/MorrisBoardView.tsx
```

`App` solo elige el juego. Cada motor es puro; cada hook guarda la sesión; los tableros SVG no mutan reglas.

Flujo Fanorona:

```
BoardView.onSelect(punto)
  → useFanorona.selectPoint
    → legalMoves(board, current, chain)
    → playMove(move)
```

Molino usa el mismo esquema con `useMorris` y `legalMoves(position)`.

## Modelo de datos

Coordenadas: `x` de 0 a 8 (archivos `a`–`i` de izquierda a derecha) y `y` de 0 a 4 (filas de arriba hacia abajo). El origen `(0,0)` es la esquina superior izquierda, negra. Notación algebraica: rango = `5 - y`, así que `e3` (centro) es `(4, 2)`.

Una **jugada** (`Move`) es un solo paso:

- `from` / `to`: origen y destino (siempre adyacentes)
- `kind`: `approach` | `withdrawal` | `paika`
- `captured`: piezas que salen del tablero en ese paso

Un **turno** puede ser varios `Move` de la misma pieza (cadena). La IA busca turnos completos, no pasos sueltos, para no cortar una captura a mitad de secuencia.

`ChainState` guarda, durante una captura múltiple:

- `current`: dónde está ahora la pieza
- `visited`: casillas ya ocupadas en este turno (no se puede volver)
- `lastDir`: dirección del último paso (no se puede repetir seguida)

## Reglas implementadas

Variante: **Fanoron-Tsivy** (9×5). Empiezan las blancas.

**Tablero.** Las piezas se mueven un paso por las líneas dibujadas. En un punto **fuerte** (`(x + y) % 2 === 0`) también hay diagonales. En un punto **débil**, solo horizontal y vertical. Eso reproduce el teselado de Fanorona.

**Posición inicial.** Negras en las dos filas de arriba, blancas en las dos de abajo. Fila del medio: `B W B W · W B W B`. Centro vacío. 22 por bando.

**Paika.** Si no hay ninguna captura, se mueve una pieza a una intersección vacía adyacente.

**Captura obligatoria.** Si existe al menos una captura, no se puede jugar paika.

**Acercamiento.** La pieza avanza hacia el rival: al aterrizar, la siguiente casilla en esa misma dirección es enemiga. Se retira esa pieza y todas las enemigas consecutivas detrás, hasta un hueco o una pieza propia.

**Alejamiento.** La pieza estaba junto al rival y se aleja en la línea opuesta. Se captura la línea enemiga que queda “atrás”.

**No las dos a la vez.** Si el mismo paso permite acercamiento y alejamiento, el jugador elige. En la UI aparece `CaptureChoice`. Internamente son dos `Move` con el mismo `from`/`to` y distinto `kind`.

**Cadenas.** Tras capturar se puede seguir con la misma pieza, o terminar el turno. Restricciones:

- cada paso tiene que capturar
- no aterrizar en una casilla ya visitada en el turno
- no repetir la dirección del paso anterior

**Fin.** Gana quien se queda con todas las piezas rivales. Si el jugador que toca no tiene jugadas, pierde (criterio de Schadd). Tres repeticiones de la misma posición con el mismo turno a mover dan tablas.

## Motor (`src/game`)

Funciones puras: mismo tablero + mismos argumentos = mismo resultado. No hay estado global.

| Archivo | Responsabilidad |
| --- | --- |
| `geometry.ts` | `inBounds`, `isStrong`, `canStepFrom`, `opponent` |
| `board.ts` | `createInitialBoard`, `cloneBoard`, `countPieces`, `serializePosition` |
| `moves.ts` | `captureOptions`, `legalMoves`, `legalMovesInChain` |
| `apply.ts` | `applyMove`, `startChain`, `applyChainStep`, `applyTurn` |
| `ai.ts` | `generateTurns`, `chooseAiTurn` |

`captureOptions` mira las dos puntas de la línea de movimiento:

- acercamiento: desde el destino, seguir en `dir`
- alejamiento: desde el origen, seguir en `-dir`

`legalMovesAtTurnStart` primero pide todas las capturas; si la lista está vacía, recae en paika.

## Estado de la partida (`useFanorona`)

El hook es el único lugar con `useState` del juego. Expone:

- lectura: `board`, `current`, `targets`, `counts`, `winner`, `thinking`, …
- acciones: `selectPoint`, `chooseCapture`, `endTurn`, `undo`, `resetGame`, `changeMode`

Detalles de implementación:

- **Selección.** Clic en pieza propia con jugadas legales → se resalta. Clic en destino → se aplica. Si hay dos capturas para el mismo destino, se pide elección.
- **Cadenas humanas.** Después de un captura, si hay continuación se deja la pieza seleccionada y se habilita “Terminar turno”.
- **Deshacer.** Pila de snapshots `{ board, current, chain, winner, positions }` tomada **antes** de cada `playMove`.
- **IA.** Si el modo es `cpu` y tocan negras, un `useEffect` calcula un turno completo y lo reproduce paso a paso (~420 ms). `playMove(..., { endTurn: true })` en el último paso evita que el motor deje la cadena abierta cuando la IA decidió cortar.
- **Refs.** `boardRef` / `playMoveRef` evitan closures viejos dentro de timeouts de la CPU.

## Inteligencia artificial

La CPU no elige un paso aislado: `generateTurns` expande todas las secuencias legales (con tope de 8 capturas) e incluye la opción de parar después de cada captura, como permite la regla.

| Dificultad | Criterio |
| --- | --- |
| Fácil | Maximiza piezas capturadas en el turno (greedy + ruido) |
| Media | Minimax profundidad 1 (evalúa la posición resultante) |
| Difícil | Minimax profundidad 2 con poda alfa-beta |

Evaluación: diferencia de material × 120 + diferencia de movilidad × 3. Gane/pérdida inmediata vale ±10000.

Las blancas son siempre el humano en modo CPU.

## Interfaz

- `BoardView` dibuja el grid en SVG. Las líneas diagonales salen solo de puntos fuertes.
- Las intersecciones tienen un círculo transparente (`hit`) para clic y hover.
- Destinos legales: anillo dorado. Piezas que caerían capturadas al pasar el mouse: rojo.
- `GamePanel` muestra turno, conteo, modo y acciones.
- Estilos en `src/index.css` (madera, oro, tipografías Cormorant Garamond + Outfit).

## Decisiones de diseño

- **Motor sin React.** Las reglas se pueden importar desde un script Node/tsx sin montar la app. Facilita tests y la IA.
- **Turno = lista de pasos.** Obliga a la CPU a pensar secuencias; si buscara un paso por vez, cortaría cadenas buenas.
- **Inmutabilidad del tablero.** `applyMove` clona; el historial de deshacer guarda referencias a tableros anteriores.
- **Sin enums de TypeScript.** El `tsconfig` usa `erasableSyntaxOnly`; los tipos son uniones (`'white' | 'black'`).
- **Imports de tipos explícitos.** `verbatimModuleSyntax` exige `import type { ... }`.

## Molino de nueve

Motor en `src/morris/`, sesión en `useMorris`. Tablero de 24 puntos (tres cuadrados concéntricos, sin casilla central). Cada jugador tiene 9 piezas.

Fases:

1. **Colocar** las 18 piezas, alternando, en intersecciones vacías.
2. **Mover** a un punto vecino por las líneas.
3. **Volar** (cualquier vacío) cuando un bando se queda con 3 piezas en el tablero.

Tres alineadas = molino = sacar una pieza rival (no de un molino, salvo que todas lo estén). Un movimiento que cierre dos molinos igual saca una sola pieza. Gana quien deja al rival con 2 piezas o sin jugadas. Tablas por triple repetición.

La CPU genera turnos `place|slide` + `remove` opcional y usa el mismo esquema fácil/media/difícil.

## Cómo extenderlo

- Tests del motor: importar `legalMovesAtTurnStart` / `applyMove` y armar tableros chicos. El caso de las 5 aperturas es un buen smoke test.
- Otra CPU: cambiar `chooseAiTurn` sin tocar la UI.
- Variantes Fanoron-Telo (3×3) o Dimy (5×5): parametrizar `COLS`/`ROWS` y la posición inicial; la geometría de puntos fuertes se mantiene si el origen es fuerte.

## Referencias de reglas

- Wikipedia, *Fanorona*
- M. P. D. Schadd et al., *Best Play in Fanorona Leads to Draw* (2008)
- ICGA, página de Fanorona (notación `a1-b2A` / `W`, cadenas, tablas)
- Wikipedia, *Nine men's morris*
