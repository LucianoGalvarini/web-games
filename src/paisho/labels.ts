import type { FlowerKind } from './types'

export const FLOWER_NAME: Record<FlowerKind, string> = {
  r3: 'Rosa',
  r4: 'Crisantemo',
  r5: 'Rododendro',
  w3: 'Jazmín',
  w4: 'Lirio',
  w5: 'Jade',
  lotus: 'Loto blanco',
}

export function flowerName(kind: FlowerKind): string {
  return FLOWER_NAME[kind]
}
