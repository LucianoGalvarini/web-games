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

export const SHOGI_MANUAL: ManualStep[] = [
  {
    title: '¿Qué es el Shogi?',
    body: 'La versión japonesa del ajedrez: tablero de 9×9, sin casillas de colores. Gana quien acorrala al rey rival. La gran diferencia con el ajedrez: acá las piezas que le comés al rival pasan a ser tuyas y las podés volver a poner en juego.',
    spot: 'board',
  },
  {
    title: 'Quién es quién',
    body: 'Las piezas son de madera para los dos bandos y se distinguen por el tono (clara la tuya, oscura la del rival cuando jugás blancas) y porque apuntan hacia el otro lado del tablero. Cada bando arranca con rey, torre, alfil, dos oros, dos platas, dos caballos, dos lanzas y nueve peones. Empiezan las blancas.',
    spot: 'board',
  },
  {
    title: 'Cómo se mueve cada pieza',
    body: 'Rey: una casilla en cualquier dirección. Oro: una casilla ortogonal o en diagonal hacia adelante (no hacia atrás en diagonal). Plata: en diagonal, o un paso derecho adelante. Caballo: salta dos adelante y uno al costado, siempre hacia adelante. Lanza: derecho hacia adelante, la distancia que quieras. Torre: en línea recta, cualquier distancia. Alfil: en diagonal, cualquier distancia. Peón: una casilla derecho adelante, y come igual que mueve (no en diagonal como en ajedrez).',
    tryIt: 'Tocá una pieza propia: se marcan sus casillas posibles. Tocá una marcada para jugarla.',
    spot: 'board',
  },
  {
    title: 'La mano: tu arma secreta',
    body: 'Cuando le comés una pieza al rival, no desaparece: pasa a tu mano (siempre "despromovida") y en cualquier turno futuro la podés tirar en una casilla vacía en vez de mover una pieza del tablero. Eso hace que el material nunca "se pierda" y que el ataque pueda venir de cualquier lado.',
    tryIt: 'Con una pieza en la mano, tocala y después tocá una casilla vacía para tirarla.',
    spot: 'hand',
  },
  {
    title: 'Tirar tiene sus límites',
    body: 'No podés tirar un peón en una columna donde ya tenés otro peón propio sin promocionar (nifu). Tampoco podés tirar una pieza en una casilla donde quedaría trabada para siempre (un peón o una lanza en la última fila, un caballo en las últimas dos). Y no podés tirar un peón si esa tirada da jaque mate en el acto — con cualquier otra pieza sí se puede.',
    spot: 'hand',
  },
  {
    title: 'Promoción',
    body: 'Si tu pieza entra, se mueve dentro o sale de tus últimas tres filas, se puede promocionar: se da vuelta y queda con más movimiento (tinta roja en el kanji). Es obligatorio solo cuando, si no promocionás, la pieza queda sin ninguna jugada futura: peón o lanza en la última fila, caballo en las últimas dos.',
    spot: 'board',
  },
  {
    title: 'Cómo termina',
    body: 'Gana quien deja al rival sin ninguna jugada legal (mover, comer o tirar), esté o no en jaque — a diferencia del ajedrez, en Shogi no existen las tablas por ahogado: sin jugadas siempre se pierde. Triple repetición de la misma posición sí es tablas.',
    spot: 'board',
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

export const LIGA_MANUAL: ManualStep[] = [
  {
    title: 'Liga',
    body: 'Es el Alto Mando de Esmeralda: Sixto, Fátima, Nívea, Dracón y el Campeón Máximo. Cada liga arranca con seis Pokémon al azar de las generaciones 1 a 3, a un nivel según la dificultad.',
    spot: 'board',
  },
  {
    title: 'Caminar',
    body: 'WASD o flechas mueven. Enter abre el menú de la GBA. El equipo aparece a la izquierda, con nivel y barra de PS. Z habla y confirma, X cancela. Espacio acelera el texto. F pone el recuadro en pantalla completa.',
    tryIt: 'Enter, mirá el equipo de la izquierda y subí a hablar con Sixto.',
    spot: 'board',
  },
  {
    title: 'Menú',
    body: 'POKÉMON cambia el orden y los ataques. Z abre CAMBIAR o ATAQUES. ATAQUES deja cuatro poderes de lo que ese Pokémon puede aprender en Esmeralda; se busca escribiendo y Z lo asigna. MOCHILA cura o revive fuera de combate; Ataque X queda para la pelea. OPCIÓN cambia dificultad, abre la ayuda o vuelve a elegir juego. REINICIAR empieza otra liga.',
    spot: 'board',
  },
  {
    title: 'Combate',
    body: 'Cajas de diálogo y menú al estilo Esmeralda. Flechas mueven el cursor, Z elige, X vuelve. HUIR no sirve en la Liga. Espacio acelera ataques, caminar y texto. Sonido y pantalla completa están en el recuadro.',
    spot: 'board',
  },
  {
    title: 'Dificultad',
    body: 'Fácil trae más nivel, mejores stats y más curas. Perfecta recorta el equipo y la mochila. Se cambia desde OPCIÓN en el menú. Reiniciar siempre reparte otros seis.',
    spot: 'board',
  },
]

export const UNO_MANUAL: ManualStep[] = [
  {
    title: 'Sala',
    body: 'Creá una sala y compartí el código de 5 letras, o entrá con el código de un amigo. De 2 a 6 jugadores. El anfitrión empieza cuando están todos.',
    tryIt: 'Poné tu nombre y creá una sala.',
    spot: 'controls',
  },
  {
    title: 'Jugar',
    body: 'En tu turno tirás una carta del mismo color, número o símbolo. Si no tenés, tomás del mazo: si entra, la podés jugar; si no, pasa el turno. El comodín y el +4 piden color.',
    tryIt: 'Cuando sea tu turno, tocá una carta marcada.',
    spot: 'board',
  },
  {
    title: 'Especiales',
    body: 'Salta pierde el turno. Reversa cambia el sentido (con 2 jugadores actúa como Salta). +2 y +4 hacen tomar cartas y saltan al siguiente. El mazo se remezcla del descarte cuando se acaba.',
    spot: 'board',
  },
  {
    title: 'UNO',
    body: 'Cuando te queda una carta hay que apretar UNO. Si no lo hiciste, cualquier rival puede delatarte y tomás 2 de penalidad. Tocá tu avatar para mandar una frase rápida.',
    spot: 'hand',
  },
]
