export type ChangelogEntry = { version: string; date?: string; changes: string[] }

export const CURRENT_VERSION = '1.20.0'

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.20.0',
    date: '2026-09-09',
    changes: [
      'El desafío Shiny ahora tiene un enfriamiento de 20 minutos entre intentos (de cualquier Pokémon), para que no se pueda desbloquear todo el dex shiny de una sola sentada. Si no querés esperar, podés pagar 100000 monedas para intentarlo al instante.',
    ],
  },
  {
    version: '1.19.0',
    date: '2026-09-09',
    changes: [
      'Se cambió la tipografía pixelada de todo el álbum por una letra normal mucho más legible (se mantiene un toque retro solo en los títulos). La anterior, además de costar de leer, dibujaba el número "5" casi idéntico a una "S".',
    ],
  },
  {
    version: '1.18.0',
    date: '2026-09-09',
    changes: [
      'La trivia normal (no el desafío shiny) ahora aparece en una ventana grande, con la pregunta y las respuestas en letra mucho más grande — antes era una tarjetita chica en el costado difícil de leer.',
      'Más tiempo para responder las preguntas normales: 25s en la más fácil (antes 15s), bajando menos abruptamente en las apuestas más difíciles.',
    ],
  },
  {
    version: '1.17.0',
    date: '2026-09-09',
    changes: [
      'Desafío Shiny: al juntar 5 repetidas de un mismo Pokémon aparece "✨ Intentar Shiny" en su figurita. Respondiendo 5 preguntas específicas de esa especie (tipos, ventajas, evoluciones, movimientos, entrenadores, y más), cada vez más difíciles y con menos tiempo para responder, desbloqueás su versión shiny para siempre.',
      'Si fallás cualquiera de las 5 preguntas (o se acaba el tiempo), perdés el desafío: las 5 repetidas usadas se pierden y hay que juntar 5 nuevas para reintentar.',
    ],
  },
  {
    version: '1.16.0',
    date: '2026-09-09',
    changes: [
      'Nuevos sobres premium: sobre de raras (10000 monedas, solo figuritas raras y legendarias) y sobre de legendarias (50000 monedas, solo legendarias).',
      'La ruleta ahora se puede girar cada 30 minutos en vez de cada 4 horas.',
      'Snorlax, Voltorb y Electrode en la ruleta ahora muestran su sprite real en vez de un emoji.',
      'La trivia con apuestas ya no avisa qué dificultad viene antes de responder: solo se ve la racha actual.',
      'La tira de Pokémon caminando ahora aparece arriba del álbum en vez de abajo.',
      'Se corrigió "Ir a pegar" (y "Ir a repetidas"): con el filtro de rareza activo no llevaba a ningún lado salvo que estuvieran todas las casillas tildadas. Ahora funciona sin importar el filtro.',
    ],
  },
  {
    version: '1.15.0',
    date: '2026-09-09',
    changes: [
      'Se solucionó que algunas figuritas no cargaran, o cargaran la imagen fija en vez de la animada: las imágenes se pedían a un servidor externo que se satura seguido. Ahora viven en el propio juego, así que cargan rápido y siempre andan.',
    ],
  },
  {
    version: '1.14.0',
    date: '2026-09-08',
    changes: [
      'Cada Pokémon ahora tiene su cry real: suena al abrir su ficha en la Pokédex y al sacarlo nuevo de un sobre.',
      'La ruleta usa íconos de objetos reales en vez de emojis donde correspondía (Master Ball para el premio mayor, Moneda Amuleto para "todo o nada", etc.).',
      'Nueva tira decorativa de Pokémon caminando (sprites overworld) debajo del álbum, con las especies que ya conseguiste.',
    ],
  },
  {
    version: '1.13.0',
    date: '2026-09-08',
    changes: [
      '"Doble o nada" ahora se pone más difícil cuanto más seguido lo jugás: la primera apuesta es fácil, y cada apuesta consecutiva sube un nivel (Fácil → Normal → Difícil → ¡Extrema!), con menos tiempo para responder. Un cartel te avisa qué dificultad te toca antes de apostar.',
      'Si tenés más de 3000 monedas y hacés una apuesta, la pregunta sale directo en dificultad Extrema.',
      'Nueva modalidad de trivia sobre entrenadores, gimnasios, la Liga Pokémon y el anime de Kanto — aparece solo en las apuestas más difíciles.',
      'En dificultad alta, las preguntas de "quién tiene más/menos" comparan Pokémon menos obvios, y las de movimientos usan señuelos más creíbles (movimientos reales de otro Pokémon en vez de una lista genérica).',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-09-08',
    changes: [
      'Se arregló un bug en las preguntas de "¿quién tiene más/menos?": cuando los dos Pokémon empataban en esa estadística, el juego igual marcaba una respuesta como incorrecta y podías perder monedas sin poder acertar. Ahora esas preguntas nunca salen empatadas.',
      'Regalo de disculpas: los jugadores que ya tenían una partida reciben 2000 monedas una única vez por el percance.',
      'Se corrigió que el sonido de abrir sobre a veces se quedara mudo en algunos navegadores (como Brave); ahora se reintenta solo en la siguiente interacción si eso pasa.',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-09-08',
    changes: [
      'Racha de trivia: acertar preguntas seguidas da un bonus de monedas creciente, y se corta apenas fallás una.',
      'Nuevos logros (🏆 Logros en la barra lateral): de trivia (rachas, totales acertados, cada modalidad) y de álbum (primera figurita, página completa, mitad del dex, cada rareza completa, dex completo, sobres abiertos, reciclajes). Cada uno da monedas y algunos también preguntas de bonus o el multiplicador "todo o nada".',
      'Un cartel avisa apenas se desbloquea un logro nuevo.',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-09-08',
    changes: [
      'Nuevo filtro por rareza en el álbum: tildá común, poco común, rara y/o legendaria para mostrar solo esas figuritas.',
      'Letra más grande y legible en toda la app (monto a apostar, nombres de figuritas, textos de trivia y menús), y barras de desplazamiento personalizadas en vez de las del navegador.',
      'Seguridad: se detecta si se abren las herramientas de desarrollador o si se edita a mano el guardado (monedas, racha) y se bloquea el juego unas horas con un cartel de aviso.',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-09-08',
    changes: [
      'La ruleta ahora muestra el nombre y la explicación del premio antes de dártelo, con un botón "Reclamar recompensa" que confirma qué ganaste recién al presionarlo.',
      'La ruleta es un círculo perfecto en cualquier tamaño de pantalla, con más brillo y detalle visual.',
      'Se solucionó que una figurita nueva todavía sin pegar volviera a salir como "¡Nueva!" en otro sobre en vez de contar como repetida.',
      'Se solucionó que pegar una figurita repetida pendiente necesitara dos clics.',
      'Música de fondo y sonido de abrir sobre reemplazados por los audios reales subidos por el usuario.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-09-07',
    changes: [
      'Ruleta de la fortuna: un giro gratis cada 4 horas que puede dar monedas, un sobre gratis, una pregunta de bonus, un multiplicador para apuestas, un giro extra o (raramente) un jackpot.',
      'Recompensa diaria por iniciar sesión: una racha de 7 días con monedas crecientes y un sobre especial el día 7.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-09-07',
    changes: [
      'Botón para vender todas las repetidas de una sola vez.',
      'Tipografía retro con números más legibles (ya no se confunde el 5 con la S).',
      'Límite de 20 preguntas de trivia gratis por día: superado el límite, solo se puede seguir jugando apostando monedas.',
      'Límite de tiempo para responder cada pregunta de trivia.',
      'Nombres de movimientos de Pokémon traducidos al español en la trivia.',
      'Historial de versiones visible dentro del juego.',
    ],
  },
  {
    version: '1.6.0',
    changes: [
      'Las figuritas del álbum tienen ahora un tamaño relativo según la altura real del Pokémon.',
      'Reciclar repetidas ya no exige 3 copias del mismo Pokémon: alcanza con 5 repetidas de cualquiera.',
      'El fondo animado de la tarjeta Pokédex es más intenso cuanto más rara es la figurita; las comunes quedan estáticas.',
    ],
  },
  {
    version: '1.5.0',
    changes: ['El slot de "Pegar" ahora se ve con la silueta del Pokémon y un signo de interrogación bien visible.'],
  },
  {
    version: '1.4.0',
    changes: [
      'El marco y la animación de la tarjeta Pokédex varían según la rareza de la figurita.',
      'Botón para ir directo a las figuritas repetidas.',
      'Botones para mutear la música y cambiar de tono.',
      'Apertura de sobres más épica cuando sale una figurita rara o legendaria, con sonido y animación propios.',
    ],
  },
  {
    version: '1.3.0',
    changes: [
      'Trivia con apuestas: doble o nada además de la pregunta gratis.',
      'El código de respaldo ya no se muestra: solo copiar/importar, con confirmación visual.',
      'Reskin completo de la interfaz con estilo 16 bits inspirado en Pokémon Rojo Fuego.',
      'Música de fondo original tipo chiptune.',
    ],
  },
  {
    version: '1.2.0',
    changes: ['Tarjeta estilo Pokédex al hacer clic en una figurita, con datos oficiales en vivo desde la PokeAPI.'],
  },
  {
    version: '1.1.0',
    changes: [
      'Sprites animados en el álbum, iguales a los de los sobres.',
      'Sonidos originales estilo Game Boy en toda la interfaz.',
      'Más color y animación en general.',
    ],
  },
  {
    version: '1.0.0',
    changes: ['Lanzamiento del Álbum Pokémon: migración del álbum de Excel/VBA a sobres, álbum y código de respaldo.'],
  },
]
