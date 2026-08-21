import type { Player } from '../shared/types'
import type { PieceKind } from './types'

const KANJI: Record<PieceKind, string> = {
  k: '玉',
  r: '飛',
  b: '角',
  g: '金',
  s: '銀',
  n: '桂',
  l: '香',
  p: '歩',
}

const PROMOTED_KANJI: Partial<Record<PieceKind, string>> = {
  r: '龍',
  b: '馬',
  s: '全',
  n: '圭',
  l: '杏',
  p: 'と',
}

const NAME: Record<PieceKind, string> = {
  k: 'Rey',
  r: 'Torre',
  b: 'Alfil',
  g: 'Oro',
  s: 'Plata',
  n: 'Caballo',
  l: 'Lanza',
  p: 'Peón',
}

const PROMOTED_NAME: Partial<Record<PieceKind, string>> = {
  r: 'Dragón',
  b: 'Caballo dragón',
  s: 'Plata promovida',
  n: 'Caballo promovido',
  l: 'Lanza promovida',
  p: 'Tokin',
}

export function pieceKanji(kind: PieceKind, promoted: boolean, player?: Player): string {
  if (kind === 'k') {
    return player === 'white' ? '王' : '玉'
  }
  if (promoted) {
    return PROMOTED_KANJI[kind] ?? KANJI[kind]
  }
  return KANJI[kind]
}

export function pieceName(kind: PieceKind, promoted: boolean): string {
  if (promoted) {
    return PROMOTED_NAME[kind] ?? NAME[kind]
  }
  return NAME[kind]
}
