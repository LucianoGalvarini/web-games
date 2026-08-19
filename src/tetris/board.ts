import { COLS, ROWS } from './constants'
import { pieceCells } from './shapes'
import type { ActivePiece, Cell, PieceId } from './types'

export function emptyBoard(): (PieceId | null)[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
}

export function cloneBoard(board: (PieceId | null)[][]): (PieceId | null)[][] {
  return board.map((row) => [...row])
}

export function cellsOf(piece: ActivePiece): Cell[] {
  return pieceCells(piece.id, piece.rot, piece.x, piece.y)
}

export function collides(board: (PieceId | null)[][], piece: ActivePiece): boolean {
  for (const cell of cellsOf(piece)) {
    if (cell.x < 0 || cell.x >= COLS || cell.y >= ROWS) {
      return true
    }
    if (cell.y < 0) {
      continue
    }
    if (board[cell.y]?.[cell.x]) {
      return true
    }
  }
  return false
}

export function writePiece(board: (PieceId | null)[][], piece: ActivePiece): (PieceId | null)[][] {
  const next = cloneBoard(board)
  for (const cell of cellsOf(piece)) {
    if (cell.y < 0 || cell.y >= ROWS || cell.x < 0 || cell.x >= COLS) {
      continue
    }
    const row = next[cell.y]
    if (row) {
      row[cell.x] = piece.id
    }
  }
  return next
}

export function clearLines(board: (PieceId | null)[][]): { board: (PieceId | null)[][]; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => cell === null))
  const cleared = ROWS - kept.length
  const pad = Array.from({ length: cleared }, () => Array.from({ length: COLS }, () => null))
  return { board: [...pad, ...kept], cleared: cleared as 0 | 1 | 2 | 3 | 4 }
}

export function ghostY(board: (PieceId | null)[][], piece: ActivePiece): number {
  let y = piece.y
  while (!collides(board, { ...piece, y: y + 1 })) {
    y += 1
  }
  return y
}

export function isGrounded(board: (PieceId | null)[][], piece: ActivePiece): boolean {
  return collides(board, { ...piece, y: piece.y + 1 })
}
