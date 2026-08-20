import type { PieceKind } from './types'

export const PIECE_NAME: Record<PieceKind, string> = {
  k: 'Rey',
  q: 'Dama',
  r: 'Torre',
  b: 'Alfil',
  n: 'Caballo',
  p: 'Peón',
}

export function pieceName(kind: PieceKind): string {
  return PIECE_NAME[kind]
}
