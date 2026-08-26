import { MAX_STAGE, MIN_STAGE, PHYSICAL_TYPES } from './constants'
import type { LigaStages, LigaType } from './types'

export function hpStat(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
}

export function otherStat(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5
}

export function clampStage(value: number): number {
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, value))
}

export function stageMultiplier(stage: number): number {
  const n = clampStage(stage)
  if (n >= 0) {
    return (2 + n) / 2
  }
  return 2 / (2 - n)
}

export function modifiedStat(base: number, stage: number): number {
  return Math.max(1, Math.floor(base * stageMultiplier(stage)))
}

export function isPhysical(type: LigaType): boolean {
  return PHYSICAL_TYPES.has(type)
}

export function emptyStages(): LigaStages {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
}

export function withStage(stages: LigaStages, key: keyof LigaStages, delta: number): LigaStages {
  return { ...stages, [key]: clampStage(stages[key] + delta) }
}
