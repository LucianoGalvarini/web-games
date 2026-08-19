export const FANORONA_RULES = [
  'Tablero de 9×5. Las blancas empiezan. Gana quien captura todas las piezas rivales.',
  'Las piezas se mueven un paso por las líneas. En puntos fuertes también en diagonal.',
  'Si hay captura posible, es obligatoria. Si no, se hace un movimiento paika.',
  'Acercamiento: te movés hacia una pieza rival que queda en la misma línea.',
  'Alejamiento: te alejás de una pieza rival que estaba junto a la tuya.',
  'Se capturan todas las rivales consecutivas en esa línea, hasta un hueco o una pieza propia.',
  'Si un paso permite las dos capturas, hay que elegir una. No se pueden hacer las dos.',
  'Después de capturar podés seguir con la misma pieza, cambiando de dirección y sin repetir casilla.',
]

import type { MorrisVariant } from '../morris/variants'

export function morrisRulesFor(variant: MorrisVariant): string[] {
  const rules = [
    `Cada jugador tiene ${variant.piecesPerPlayer} piezas. Las blancas empiezan.`,
    'Primero se colocan, de a una, en intersecciones vacías.',
    'Tres piezas propias alineadas forman un molino y permiten sacar una pieza rival.',
    'No se puede sacar una pieza que está en un molino, salvo que todas las rivales lo estén.',
    'Cuando ya no quedan piezas por colocar, se mueve una pieza a un punto vecino por las líneas.',
  ]
  if (variant.flyingEnabled) {
    rules.push('Si te quedan 3 piezas, podés volar: ir a cualquier intersección vacía.')
  }
  rules.push('Gana quien deja al rival con 2 piezas o sin movimientos legales.')
  return rules
}

export const MINESWEEPER_RULES = [
  'Estilo Windows 7. El primer clic siempre es un vacío: abre esa casilla y las ocho vecinas.',
  'Clic izquierdo abre. Clic derecho pone o saca una bandera. El signo de pregunta es opcional.',
  'Un número indica cuántas minas tocan esa casilla (incluso en diagonal).',
  'Doble clic o clic izquierdo y derecho a la vez sobre un número abre el resto (chording).',
  'Si el chording no coincide con las banderas, no pasa nada. Si las banderas están mal puestas, perdés.',
  'Pista señala una jugada deducible. Tras perder podés repetir el mismo tablero.',
  'Principiante 9×9 / 10 minas, Intermedio 16×16 / 40, Experto 30×16 / 99.',
]

import type { DamasVariant } from '../damas/variants'

export function damasRulesFor(variant: DamasVariant): string[] {
  const rules = [
    'Tablero de 8×8, 12 piezas por bando en las casillas oscuras. Las blancas empiezan.',
    'Las piezas simples se mueven y comen en diagonal, un paso, siempre hacia adelante.',
    'Si hay al menos una captura disponible, es obligatorio jugarla (podés elegir cuál).',
    'Después de comer, si esa misma pieza puede seguir comiendo, es obligatorio continuar.',
    'Una pieza simple que llega a la última fila se corona dama. Si fue comiendo, el turno termina ahí.',
  ]
  rules.push(
    variant.flyingKing
      ? 'La dama "vuela": se mueve cualquier cantidad de casillas vacías en diagonal, y come a distancia.'
      : 'La dama se mueve y come de a una casilla en diagonal, en cualquiera de las 4 direcciones.',
  )
  rules.push('Gana quien deja al rival sin piezas o sin movimientos legales. Triple repetición es tablas.')
  return rules
}

export const SUDOKU_RULES = [
  'Cada fila, cada columna y cada bloque de 3×3 debe tener los números del 1 al 9, sin repetir.',
  'Las casillas oscuras son pistas fijas. Las demás las llenás vos.',
  'Anotar (N) marca candidatos en lápiz. Autocompletar notas calcula todos los legales.',
  'Pista señala un único obvio (casilla o número forzado). Tocá de nuevo para llenarla.',
  'Revelar casilla completa la seleccionada, o la primera vacía si no hay selección.',
  'Los conflictos de fila, columna o bloque se marcan en rojo. El teclado acepta 1-9, flechas y borrar.',
  'Fácil ~40 pistas, Media ~32, Difícil ~27, Experta ~23. Cada tablero tiene solución única.',
]

export const TRUCO_RULES = [
  'Mano a mano, sin flor, partida a 30 (malas hasta 15, después buenas).',
  'Mazo español de 40. Jerarquía de bazas: 1 de espadas, 1 de bastos, 7 de espadas, 7 de oros, los 3, los 2, anchos falsos, 12, 11, 10, 7 falsos, 6, 5 y 4.',
  'Gana la mano quien hace dos bazas. Si la primera es parda, define la segunda. Si la tercera empata, gana quien hizo la primera; si todas son pardas, gana el mano.',
  'Envido, real envido y falta envido se cantan en la primera baza, antes de que caigan las dos cartas. Empate de tantos: gana el mano.',
  'La falta vale lo que le falta al que va ganando para las 15 (si ambos están en malas) o para las 30.',
  'Truco vale 2, retruco 3, vale cuatro 4. No quiero deja el valor anterior (el truco no querido vale 1).',
  'Irse al mazo entrega el valor actual de la mano. El mano sale en la primera baza y se alterna cada mano.',
]
