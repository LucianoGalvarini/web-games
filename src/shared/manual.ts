export type ManualSpot = 'controls' | 'board' | 'stats' | 'pad' | 'hand'

export type ManualStep = {
  title: string
  body: string
  tryIt?: string
  spot?: ManualSpot
}
