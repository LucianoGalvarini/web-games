import type { DamasVariant } from '../damas/variants'
import type { MorrisVariant } from '../morris/variants'
import type { ManualStep } from './manual'

export const FANORONA_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'Tablero de 9×5. Las blancas empiezan. Gana quien captura todas las piezas rivales.',
    spot: 'board',
  },
  {
    title: 'Mover',
    body: 'Tocá una pieza propia y un punto vecino por las líneas. En los puntos fuertes también se puede ir en diagonal, un paso.',
    tryIt: 'Elegí una pieza y un destino marcado.',
    spot: 'board',
  },
  {
    title: 'Capturar',
    body: 'Si hay captura, es obligatoria. Acercamiento: te movés hacia rivales en la misma línea. Alejamiento: te alejás de rivales que estaban pegadas. Se comen todas las consecutivas hasta un hueco o una pieza propia.',
    spot: 'board',
  },
  {
    title: 'Cadena',
    body: 'Después de comer podés seguir con la misma pieza, cambiando de dirección y sin repetir casilla. Si un paso permite acercamiento y alejamiento, hay que elegir uno. Terminar turno cierra la cadena.',
    spot: 'controls',
  },
]

export function morrisManual(variant: MorrisVariant): ManualStep[] {
  const steps: ManualStep[] = [
    {
      title: 'Objetivo',
      body: `Cada uno tiene ${variant.piecesPerPlayer} piezas. Las blancas empiezan. Gana quien deja al rival con dos piezas o sin jugadas.`,
      spot: 'board',
    },
    {
      title: 'Colocar',
      body: 'Primero se apoyan de a una en intersecciones vacías. Tres propias alineadas forman un molino y permiten sacar una pieza rival.',
      tryIt: 'Apoyá una pieza en un punto vacío.',
      spot: 'board',
    },
    {
      title: 'Sacar y mover',
      body: 'No se puede sacar una pieza que está en molino, salvo que todas las rivales lo estén. Cuando no quedan por colocar, se mueve a un vecino por las líneas.',
      spot: 'board',
    },
  ]
  if (variant.flyingEnabled) {
    steps.push({
      title: 'Volar',
      body: 'Si te quedan tres piezas, podés ir a cualquier intersección vacía.',
      spot: 'board',
    })
  }
  return steps
}

export function damasManual(variant: DamasVariant): ManualStep[] {
  return [
    {
      title: 'Objetivo',
      body: 'Tablero de 8×8, doce piezas por bando en las oscuras. Las blancas empiezan. Gana quien deja al rival sin piezas o sin jugadas. Triple repetición es tablas.',
      tryIt: 'Tocá una pieza y un destino marcado.',
      spot: 'board',
    },
    {
      title: 'Movimiento',
      body: 'Las piezas simples avanzan y comen en diagonal, un paso, siempre hacia adelante. Si hay un salto disponible hay que usarlo. Después de comer, si la misma pieza puede seguir, hay que continuar.',
      spot: 'board',
    },
    {
      title: 'Dama',
      body: variant.flyingKing
        ? 'Al llegar al fondo se corona. Si coronó comiendo, el turno termina ahí. La dama vuela: se mueve y come a distancia en diagonal.'
        : 'Al llegar al fondo se corona. Si coronó comiendo, el turno termina ahí. La dama se mueve y come de a una casilla, en las cuatro diagonales.',
      spot: 'board',
    },
  ]
}

export const MINESWEEPER_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'El primer clic siempre abre un vacío y sus ocho vecinas. Hay que marcar las minas y descubrir el resto.',
    tryIt: 'Abrí una casilla con clic izquierdo.',
    spot: 'board',
  },
  {
    title: 'Números y banderas',
    body: 'Clic derecho pone o saca una bandera. El número dice cuántas minas tocan esa casilla, incluso en diagonal.',
    spot: 'board',
  },
  {
    title: 'Chording',
    body: 'Doble clic, o izquierdo y derecho a la vez, sobre un número abre las vecinas que faltan si las banderas coinciden. Si están mal, perdés.',
    spot: 'board',
  },
  {
    title: 'Pista',
    body: 'Pista señala una jugada deducible. Tras perder se puede repetir el mismo tablero. Principiante 9×9 / 10 minas, intermedio 16×16 / 40, experto 30×16 / 99.',
    spot: 'controls',
  },
]

export const SUDOKU_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'Cada fila, cada columna y cada bloque de 3×3 debe tener los números del 1 al 9, sin repetir. Las casillas oscuras son pistas fijas.',
    tryIt: 'Elegí una casilla clara y poné un número.',
    spot: 'board',
  },
  {
    title: 'Teclado',
    body: 'Los dígitos, borrar y anotaciones están abajo. N alterna el lápiz. Autocompletar notas calcula todos los candidatos legales.',
    spot: 'pad',
  },
  {
    title: 'Ayudas',
    body: 'Pista señala un único obvio; tocá de nuevo para llenarlo. Revelar casilla completa la seleccionada. Los conflictos de fila, columna o bloque se marcan en rojo.',
    spot: 'controls',
  },
]

export const TRUCO_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'Mano a mano, sin flor, a 30 (malas hasta 15, después buenas). Mazo español de 40. Jerarquía: 1 de espadas, 1 de bastos, 7 de espadas, 7 de oros, los 3, los 2, anchos falsos, 12, 11, 10, 7 falsos, 6, 5 y 4.',
    spot: 'hand',
  },
  {
    title: 'Bazas',
    body: 'Tocá una carta propia para tirarla. Gana la mano quien hace dos bazas. Si la primera es parda, define la segunda. Si la tercera empata, gana quien hizo la primera; si todas son pardas, gana el mano.',
    tryIt: 'Si es tu turno, tirás una carta de abajo.',
    spot: 'hand',
  },
  {
    title: 'Envido',
    body: 'Envido, real envido y falta se cantan en la primera baza, antes de que caigan las dos cartas. Empate de tantos: gana el mano. La falta vale lo que le falta al que va ganando para las 15 (ambos en malas) o para las 30.',
    spot: 'hand',
  },
  {
    title: 'Truco',
    body: 'Truco vale 2, retruco 3, vale cuatro 4. No quiero deja el valor anterior (truco no querido vale 1). Irse al mazo entrega el valor actual de la mano.',
    spot: 'hand',
  },
]

export const TETRIS_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'Pozo de 10×20. Caen las siete piezas en bolsas de 7, sin repetir hasta agotar la bolsa. Completá líneas horizontales para borrarlas. Si la pieza nueva no entra, se llena el pozo.',
    tryIt: 'Mové con las flechas o los botones de abajo.',
    spot: 'board',
  },
  {
    title: 'Controles',
    body: 'Izquierda y derecha mueven. Arriba o X gira. Z gira al revés. Abajo baja suave. Espacio tira. C reserva. Pausa con P o Esc.',
    spot: 'pad',
  },
  {
    title: 'Puntos',
    body: 'Una, dos, tres o cuatro líneas valen 100, 300, 500 u 800 por el nivel. Bajar suave suma 1 por celda. Tirar clava la pieza y suma 2 por celda. Cada diez líneas sube el nivel. El fantasma marca dónde va a caer.',
    spot: 'stats',
  },
]

export const AJEDREZ_MANUAL: ManualStep[] = [
  {
    title: 'Piezas',
    body: 'Tablero de 8×8. Las blancas empiezan. El rey se mueve una casilla; la dama en cualquier dirección; la torre en fila o columna; el alfil en diagonal; el caballo en L y puede saltar.',
    tryIt: 'Tocá una pieza y una casilla marcada.',
    spot: 'board',
  },
  {
    title: 'Peones',
    body: 'El peón avanza una casilla (o dos desde su fila inicial) y come en diagonal. Si el rival acaba de avanzar dos y queda al lado, se puede comer al paso. En la última fila se corona: dama, torre, alfil o caballo.',
    spot: 'board',
  },
  {
    title: 'Enroque',
    body: 'El rey salta dos hacia la torre y la torre pasa a su lado, si ninguno se movió, el camino está vacío y el rey no pasa por jaque.',
    spot: 'board',
  },
  {
    title: 'Jaque y tablas',
    body: 'Hay que salir del jaque. Jaque mate gana. Ahogado, triple repetición, cincuenta jugadas sin peón ni captura, o material insuficiente, son tablas.',
    spot: 'board',
  },
]

export const PAISHO_MANUAL: ManualStep[] = [
  {
    title: 'Objetivo',
    body: 'Gana quien cierra un anillo de armonías alrededor del centro, sin tocarlo. El anfitrión (fichas claras) empieza.',
    spot: 'board',
  },
  {
    title: 'Plantar',
    body: 'En tu turno podés plantar una flor de la reserva en una puerta vacía: los cuatro puntos rojos del borde.',
    tryIt: 'Elegí una flor abajo y tocá una puerta.',
    spot: 'pad',
  },
  {
    title: 'Arreglar',
    body: 'O mové una flor ya plantada. Rosa y jazmín caminan 3, crisantemo y lirio 4, rododendro y jade 5, el loto 2. Solo en cruz, sin saltar. No se termina en una puerta.',
    tryIt: 'Tocá una flor del jardín y un punto marcado.',
    spot: 'board',
  },
  {
    title: 'Armonía',
    body: 'Dos flores propias en la misma fila o columna, sin nada en el medio, armonizan si son vecinas en el círculo: rosa, crisantemo, rododendro, jazmín, lirio, jade. El loto armoniza con todas las propias. Las líneas de oro marcan esas armonías.',
    spot: 'board',
  },
  {
    title: 'Choque y jardines',
    body: 'Rosa choca con jazmín, crisantemo con lirio, rododendro con jade. No puede haber dos flores chocando alineadas. Podés comer la que choca cayendo encima. Las rojas no terminan en jardín blanco del centro, ni las blancas en el rojo. El loto entra en ambos y es el único que se posa en el punto central.',
    spot: 'board',
  },
]

export const DOOM_MANUAL: ManualStep[] = [
  {
    title: 'Qué es',
    body: 'Es el shareware de Doom 1 (1993): el primer episodio, Knee-Deep in the Dead. El motor es doomgeneric, el código que id publicó. No incluye el juego registrado.',
    spot: 'board',
  },
  {
    title: 'Empezar',
    body: 'Tocá el recuadro negro para darle foco. Esc abre el menú. New Game, episodio 1, una dificultad, y listo.',
    tryIt: 'Hacé clic en el recuadro e Enter en el menú.',
    spot: 'board',
  },
  {
    title: 'Mover y disparar',
    body: 'WASD o flechas avanzan y giran. Alt + A/D (o Alt + flechas) va de costado. Clic o Ctrl dispara. Espacio abre puertas e interruptores. Shift corre.',
    spot: 'board',
  },
  {
    title: 'Armas y mapa',
    body: 'Teclas 1 a 7 cambian de arma. Tab abre el mapa. El volumen está en el icono de sonido, arriba a la derecha: clic y una barra de 0 a 100.',
    spot: 'board',
  },
]
