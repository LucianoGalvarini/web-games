import { chooseAiMove } from './ai'
import type { ChessMove, ChessPosition } from './types'
import type { Difficulty } from '../shared/types'

type AiRequest = {
  position: ChessPosition
  difficulty: Difficulty
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { position, difficulty } = event.data
  const move: ChessMove | null = chooseAiMove(position, difficulty)
  self.postMessage(move)
}
