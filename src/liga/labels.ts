import type { LigaItemId, LigaRoomId, LigaStatus, LigaTrainerId, LigaType } from './types'

export const TYPE_LABELS: Record<LigaType, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
}

export const ITEM_LABELS: Record<LigaItemId, string> = {
  potion: 'Poción',
  'super-potion': 'Superpoción',
  'hyper-potion': 'Hiperpoción',
  'full-restore': 'Restau. todo',
  revive: 'Revivir',
  'max-revive': 'Máx. revivir',
  'full-heal': 'Cura total',
  'x-attack': 'Ataque X',
  'x-sp-atk': 'Especial X',
  'x-speed': 'Velocidad X',
}

export const TRAINER_LABELS: Record<LigaTrainerId, string> = {
  sidney: 'Sixto',
  phoebe: 'Fátima',
  glacia: 'Nívea',
  drake: 'Dracón',
  steven: 'Máximo',
}

export const TRAINER_TITLE: Record<LigaTrainerId, string> = {
  sidney: 'Alto Mando',
  phoebe: 'Alto Mando',
  glacia: 'Alto Mando',
  drake: 'Alto Mando',
  steven: 'Campeón',
}

export const ROOM_LABELS: Record<LigaRoomId, string> = {
  sidney: 'Sala de Sixto',
  phoebe: 'Sala de Fátima',
  glacia: 'Sala de Nívea',
  drake: 'Sala de Dracón',
  steven: 'Sala del Campeón',
  hall: 'Hall de la Fama',
}

export const TRAINER_INTRO: Record<LigaTrainerId, string> = {
  sidney: '¡Soy Sixto del Alto Mando! Me gustan los ataques siniestros. ¡Vamos allá!',
  phoebe: 'Soy Fátima. Los espíritus de Hoenn pelean conmigo. ¡Demostrame tu valor!',
  glacia: 'Soy Nívea. El hielo de Hoenn va a congelar tu ímpetu.',
  drake: '¡Soy Dracón! Los dragones no perdonan. ¡Mostrame tu equipo!',
  steven: 'Soy Máximo, el Campeón. Las piedras raras y el acero son mi camino. ¡Que empiece la final!',
}

export const TRAINER_OUTRO: Record<LigaTrainerId, string> = {
  sidney: 'Bien. La siguiente sala está abierta.',
  phoebe: 'Tus Pokémon tienen espíritu. Seguí adelante.',
  glacia: 'El hielo se rompió. Pasá.',
  drake: 'Los dragones se rinden. El Campeón te espera.',
  steven: 'Ganaste la Liga. El Hall de la Fama está al fondo.',
}

export const STATUS_LABELS: Record<LigaStatus, string> = {
  paralyze: 'PAR',
  burn: 'QUE',
  poison: 'VEN',
  sleep: 'DOR',
}

export function effectivenessLine(factor: number, target?: string): string | null {
  if (factor <= 0) {
    return target ? `No afecta a ${target}...` : 'No afecta...'
  }
  if (factor >= 2) {
    return '¡Es muy eficaz!'
  }
  if (factor > 0 && factor < 1) {
    return 'No es muy eficaz...'
  }
  return 'Es eficaz.'
}
