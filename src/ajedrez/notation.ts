import { squareLabel } from './board'
import { fileOf, rankOf } from './constants'
import { applyMove, inCheck, legalMoves } from './moves'
import type { ChessMove, ChessOutcome, ChessPosition, PieceKind } from './types'

export type SanLang = 'es' | 'en'

const LETTER: Record<SanLang, Record<PieceKind, string>> = {
  es: { k: 'R', q: 'D', r: 'T', b: 'A', n: 'C', p: '' },
  en: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: '' },
}

function disambiguate(position: ChessPosition, move: ChessMove, kind: PieceKind): string {
  if (kind === 'p' || kind === 'k') {
    return ''
  }
  const others = legalMoves(position).filter((item) => {
    if (item.to !== move.to || item.from === move.from) {
      return false
    }
    return position.squares[item.from]?.kind === kind
  })
  if (others.length === 0) {
    return ''
  }
  const file = fileOf(move.from)
  const rank = rankOf(move.from)
  const sameFile = others.some((item) => fileOf(item.from) === file)
  const sameRank = others.some((item) => rankOf(item.from) === rank)
  const files = 'abcdefgh'
  if (!sameFile) {
    return files[file] ?? ''
  }
  if (!sameRank) {
    return String(8 - rank)
  }
  return `${files[file] ?? ''}${8 - rank}`
}

export function moveSan(position: ChessPosition, move: ChessMove, lang: SanLang = 'es'): string {
  let body: string
  if (move.castle === 'king') {
    body = 'O-O'
  } else if (move.castle === 'queen') {
    body = 'O-O-O'
  } else {
    const piece = position.squares[move.from]
    if (!piece) {
      return `${squareLabel(move.from)}${squareLabel(move.to)}`
    }
    const dest = squareLabel(move.to)
    const takes = move.capture || move.enPassant
    let prefix = LETTER[lang][piece.kind]
    if (piece.kind === 'p' && takes) {
      prefix = 'abcdefgh'[fileOf(move.from)] ?? ''
    } else {
      prefix += disambiguate(position, move, piece.kind)
    }
    body = `${prefix}${takes ? 'x' : ''}${dest}`
    if (move.promoteTo) {
      body += `=${LETTER[lang][move.promoteTo]}`
    }
  }
  const next = applyMove(position, move)
  if (inCheck(next.squares, next.current)) {
    body += legalMoves(next).length === 0 ? '#' : '+'
  }
  return body
}

export function pgnResult(winner: ChessOutcome): string {
  if (winner === 'white') {
    return '1-0'
  }
  if (winner === 'black') {
    return '0-1'
  }
  if (winner === 'draw') {
    return '1/2-1/2'
  }
  return '*'
}

export function pgnOf(
  sansEn: string[],
  winner: ChessOutcome,
  headers: Record<string, string>,
): string {
  const head = Object.entries(headers)
    .map(([key, value]) => `[${key} "${value}"]`)
    .join('\n')
  const parts: string[] = []
  sansEn.forEach((san, index) => {
    if (index % 2 === 0) {
      parts.push(`${index / 2 + 1}.`)
    }
    parts.push(san)
  })
  parts.push(pgnResult(winner))
  return `${head}\n\n${parts.join(' ')}`.trim()
}
