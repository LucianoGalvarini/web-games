import { cloneGrid, conflictKeys, isComplete } from './board'
import { SIZE } from './constants'
import { hasNote, toggleNote } from './notes'
import { candidateDigits, countSolutions, createSolvedGrid } from './solve'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(SIZE === 9, 'Sudoku es 9×9.')

const solved = createSolvedGrid()
assert(isComplete(solved), 'createSolvedGrid llena las 81 casillas.')
assert(conflictKeys(solved).size === 0, 'La grilla resuelta no tiene conflictos.')
assert(countSolutions(solved, 2) === 1, 'Una grilla completa tiene una solución.')

const puzzle = cloneGrid(solved)
const given = solved[0]?.[0]
assert(given, 'Hay un dígito en a1.')
puzzle[0][0] = 0
assert(countSolutions(puzzle, 2) === 1, 'Al vaciar una casilla sigue habiendo solución única.')
assert(candidateDigits(puzzle, 0, 0).includes(given), 'El dígito original sigue siendo candidato.')

const marked = toggleNote(0, 5)
assert(hasNote(marked, 5), 'toggleNote marca el 5.')
assert(!hasNote(toggleNote(marked, 5), 5), 'El segundo toggle saca la nota.')

console.log('sudoku selfcheck ok')
