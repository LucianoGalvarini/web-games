// Hand-authored trivia about Kanto's trainers, gym leaders and the anime — there's no public API
// for this (PokeAPI only covers species/move/type data), so unlike the rest of the trivia system
// this bank is static content instead of something fetched live. Only surfaced at higher "doble o
// nada" difficulty tiers, since it demands specific franchise knowledge rather than just reading
// a number off a stat comparison.
export type TrainerTriviaItem = {
  prompt: string
  options: string[]
  correctIndex: number
}

export const TRAINER_TRIVIA: TrainerTriviaItem[] = [
  {
    prompt: '¿Cuál es el Pokémon insignia de Ash Ketchum en el anime?',
    options: ['Pikachu', 'Charizard', 'Greninja', 'Pidgeot'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué tipo de gimnasio lidera Brock en Ciudad Plateada?',
    options: ['Roca', 'Tierra', 'Acero', 'Lucha'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué tipo de gimnasio lidera Misty en Ciudad Celeste?',
    options: ['Agua', 'Hielo', 'Volador', 'Dragón'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del gimnasio de Ciudad Azafrán, especialista en tipo Psíquico?',
    options: ['Sabrina', 'Erika', 'Koga', 'Blaine'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del gimnasio de Ciudad Fucsia, especialista en tipo Veneno?',
    options: ['Koga', 'Giovanni', 'Lt. Surge', 'Blaine'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del gimnasio de Isla Canela, especialista en tipo Fuego?',
    options: ['Blaine', 'Koga', 'Erika', 'Sabrina'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del gimnasio de Ciudad Verde, especialista en tipo Planta?',
    options: ['Erika', 'Misty', 'Sabrina', 'Blaine'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del gimnasio de Ciudad Trigal, especialista en tipo Eléctrico?',
    options: ['Lt. Surge', 'Brock', 'Giovanni', 'Koga'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el líder del último gimnasio de Kanto, en Ciudad Carmín, y también líder del Equipo Rocket?',
    options: ['Giovanni', 'Blaine', 'Lance', 'Koga'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el Campeón de la Liga Pokémon de Kanto?',
    options: ['Lance', 'Bruno', 'Agatha', 'Lorelei'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué tipo de Pokémon usa Lorelei, del Alto Mando de Kanto?',
    options: ['Hielo', 'Fantasma', 'Lucha', 'Dragón'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué tipo de Pokémon usa Bruno, del Alto Mando de Kanto?',
    options: ['Lucha', 'Hielo', 'Fantasma', 'Psíquico'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué tipo de Pokémon usa Agatha, del Alto Mando de Kanto?',
    options: ['Fantasma', 'Lucha', 'Agua', 'Dragón'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué Pokémon usa Lance, Campeón de Kanto y especialista en tipo Dragón, como uno de sus principales?',
    options: ['Dragonite', 'Gyarados', 'Aerodactyl', 'Charizard'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cómo se llama la organización criminal que aparece en los juegos y el anime de Kanto?',
    options: ['Equipo Rocket', 'Equipo Magma', 'Equipo Plasma', 'Equipo Flare'],
    correctIndex: 0,
  },
  {
    prompt: '¿Quién es el profesor que entrega el primer Pokémon en los juegos de Kanto?',
    options: ['Profesor Oak', 'Profesor Elm', 'Profesor Birch', 'Profesor Rowan'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cuál es el pueblo natal de Ash Ketchum?',
    options: ['Pueblo Paleta', 'Pueblo Lavanda', 'Ciudad Celeste', 'Pueblo Primavera'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cuál de estos NO es uno de los tres Pokémon iniciales que entrega el Profesor Oak?',
    options: ['Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cuál era originalmente el Pokémon rival de Ash en los juegos/anime de Kanto?',
    options: ['Gary (Green)', 'Paul', 'Silver', 'Blue Oak (el mismo Gary)'],
    correctIndex: 0,
  },
  {
    prompt: '¿En qué ciudad se encuentra la Liga Pokémon de Kanto (Meseta Añil)?',
    options: ['Meseta Añil', 'Ciudad Azafrán', 'Ciudad Carmín', 'Pueblo Paleta'],
    correctIndex: 0,
  },
  {
    prompt: '¿Qué Pokémon legendario protagoniza la primera película de la franquicia junto a Mewtwo?',
    options: ['Mew', 'Lugia', 'Celebi', 'Ho-Oh'],
    correctIndex: 0,
  },
  {
    prompt: '¿Con qué apodo se conoce popularmente al trío Jessie, James y Meowth?',
    options: ['El Equipo Rocket', 'Los Cazadores de Sombra', 'La Élite Cuatro', 'Los Hermanos Kimono'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cuál de estos gimnasios de Kanto es del tipo Tierra?',
    options: ['Ninguno: Kanto no tiene gimnasio de tipo Tierra', 'Ciudad Plateada', 'Ciudad Azafrán', 'Ciudad Verde'],
    correctIndex: 0,
  },
  {
    prompt: '¿Cuántas medallas de gimnasio se necesitan para entrar a la Liga Pokémon de Kanto?',
    options: ['8', '6', '10', '4'],
    correctIndex: 0,
  },
]
