export type SfxName =
  | 'stone'
  | 'slide'
  | 'capture'
  | 'mill'
  | 'piece'
  | 'koma'
  | 'kane'
  | 'kiru'
  | 'castle'
  | 'check'
  | 'promote'
  | 'card'
  | 'shout'
  | 'fold'
  | 'deal'
  | 'click'
  | 'flag'
  | 'boom'
  | 'ink'
  | 'pencil'
  | 'erase'
  | 'error'
  | 'rotate'
  | 'lock'
  | 'drop'
  | 'line'
  | 'tetris'
  | 'win'
  | 'lose'
  | 'draw'
  | 'ligaBeep'
  | 'ligaHit'
  | 'ligaFire'
  | 'ligaWater'
  | 'ligaSpark'
  | 'ligaBeam'
  | 'ligaGrass'
  | 'ligaHeal'
  | 'ligaFaint'
  | 'ligaWhoosh'
  | 'ligaIce'
  | 'ligaPoison'
  | 'ligaDragon'
  | 'ligaRock'
  | 'ligaPunch'
  | 'ligaSlash'
  | 'ligaGhost'
  | 'ligaText'
  | 'ligaLowHp'
  | 'ligaBall'

const MUTE_KEY = 'web-games-muted'
const VOLUME_KEY = 'web-games-volume'
const VOLUME_MAX = 100
const VOLUME_DEFAULT = 10
const MASTER_GAIN = 0.22

type MuteListener = (muted: boolean) => void
type VolumeListener = (volume: number) => void

let audio: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let volume = readVolume()
let muted = volume === 0
const listeners = new Set<MuteListener>()
const volumeListeners = new Set<VolumeListener>()
let unlocked = false
let lastFanfare = 0

function clampVolume(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > VOLUME_MAX) {
    return VOLUME_DEFAULT
  }
  return value
}

function readVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_KEY)
    if (stored !== null) {
      return clampVolume(Number(stored))
    }
    if (localStorage.getItem(MUTE_KEY) === '1') {
      return 0
    }
  } catch {
    return VOLUME_DEFAULT
  }
  return VOLUME_DEFAULT
}

function persistVolume(value: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(value))
    localStorage.setItem(MUTE_KEY, value === 0 ? '1' : '0')
  } catch {
    /* ignore quota */
  }
}

function applyMasterGain(): void {
  if (!master) {
    return
  }
  master.gain.value = volume === 0 ? 0 : MASTER_GAIN * (volume / VOLUME_MAX)
}

function context(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    return null
  }
  if (!audio) {
    audio = new Ctor()
  }
  if (!master) {
    master = audio.createGain()
    applyMasterGain()
    master.connect(audio.destination)
  }
  if (!noise && audio) {
    const buffer = audio.createBuffer(1, audio.sampleRate * 0.4, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    noise = buffer
  }
  return audio
}

export function unlockSfx(): void {
  const ctx = context()
  if (!ctx) {
    return
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  unlocked = true
}

export function installSfxUnlock(): void {
  const once = () => {
    unlockSfx()
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

export function isMuted(): boolean {
  return muted
}

export function getVolume(): number {
  return volume
}

export function setVolume(value: number): void {
  const next = Math.max(0, Math.min(VOLUME_MAX, Math.round(value)))
  volume = next
  muted = next === 0
  persistVolume(next)
  applyMasterGain()
  for (const listener of volumeListeners) {
    listener(volume)
  }
  for (const listener of listeners) {
    listener(muted)
  }
}

export function setMuted(value: boolean): void {
  if (value) {
    setVolume(0)
    return
  }
  if (volume === 0) {
    setVolume(VOLUME_DEFAULT)
  }
}

export function subscribeMuted(listener: MuteListener): () => void {
  listeners.add(listener)
  listener(muted)
  return () => listeners.delete(listener)
}

export function subscribeVolume(listener: VolumeListener): () => void {
  volumeListeners.add(listener)
  listener(volume)
  return () => volumeListeners.delete(listener)
}

function out(): GainNode | null {
  if (muted) {
    return null
  }
  const ctx = context()
  if (!ctx || !master) {
    return null
  }
  if (ctx.state === 'suspended' && unlocked) {
    void ctx.resume()
  }
  return master
}

function env(ctx: AudioContext, peak: number, attack: number, decay: number, at = ctx.currentTime): GainNode {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  return gain
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  duration: number,
  peak = 0.8,
  slideTo?: number,
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration)
  }
  const gain = env(ctx, peak, 0.008, duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.04)
}

function burst(
  ctx: AudioContext,
  dest: AudioNode,
  duration: number,
  peak: number,
  freq: number,
  q = 1.2,
): void {
  if (!noise) {
    return
  }
  const src = ctx.createBufferSource()
  src.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q
  const gain = env(ctx, peak, 0.004, duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  src.start()
  src.stop(ctx.currentTime + duration + 0.03)
}

function thud(ctx: AudioContext, dest: AudioNode, freq: number, duration: number): void {
  burst(ctx, dest, duration * 0.45, 0.55, 180, 0.7)
  tone(ctx, dest, 'triangle', freq, duration, 0.7, freq * 0.55)
}

function chord(ctx: AudioContext, dest: AudioNode, freqs: number[], gap: number, duration: number): void {
  freqs.forEach((freq, index) => {
    window.setTimeout(() => tone(ctx, dest, 'triangle', freq, duration, 0.45), index * gap * 1000)
  })
}

export function playSfx(name: SfxName): void {
  const dest = out()
  const ctx = audio
  if (!dest || !ctx) {
    return
  }
  if ((name === 'win' || name === 'lose' || name === 'draw') && ctx.currentTime - lastFanfare < 0.2) {
    return
  }

  switch (name) {
    case 'stone':
      thud(ctx, dest, 210, 0.12)
      break
    case 'slide':
      burst(ctx, dest, 0.08, 0.22, 900, 0.4)
      thud(ctx, dest, 190, 0.1)
      break
    case 'piece':
      thud(ctx, dest, 160, 0.11)
      burst(ctx, dest, 0.05, 0.2, 1200, 0.8)
      break
    case 'koma':
      burst(ctx, dest, 0.028, 0.65, 2700, 2.4)
      window.setTimeout(() => burst(ctx, dest, 0.022, 0.4, 1900, 2.6), 16)
      tone(ctx, dest, 'triangle', 340, 0.05, 0.4, 190)
      break
    case 'kane':
      tone(ctx, dest, 'sine', 660, 0.55, 0.4, 630)
      tone(ctx, dest, 'sine', 1320, 0.4, 0.16, 1250)
      burst(ctx, dest, 0.05, 0.3, 2600, 3.2)
      break
    case 'kiru':
      burst(ctx, dest, 0.05, 0.68, 3200, 3.4)
      tone(ctx, dest, 'sawtooth', 210, 0.07, 0.3, 60)
      break
    case 'capture':
      burst(ctx, dest, 0.09, 0.7, 420, 0.8)
      tone(ctx, dest, 'square', 140, 0.09, 0.28, 90)
      break
    case 'mill':
      tone(ctx, dest, 'sine', 520, 0.12, 0.35)
      tone(ctx, dest, 'sine', 780, 0.16, 0.28)
      break
    case 'castle':
      thud(ctx, dest, 180, 0.1)
      window.setTimeout(() => thud(ctx, dest, 240, 0.1), 70)
      break
    case 'check':
      tone(ctx, dest, 'square', 660, 0.08, 0.22)
      tone(ctx, dest, 'square', 880, 0.12, 0.18)
      break
    case 'promote':
      chord(ctx, dest, [392, 523, 659], 0.06, 0.14)
      break
    case 'card':
      burst(ctx, dest, 0.07, 0.55, 1800, 2.4)
      burst(ctx, dest, 0.11, 0.28, 420, 0.6)
      break
    case 'shout':
      burst(ctx, dest, 0.08, 0.5, 220, 0.5)
      tone(ctx, dest, 'sawtooth', 240, 0.16, 0.22, 180)
      tone(ctx, dest, 'triangle', 360, 0.18, 0.2)
      break
    case 'fold':
      burst(ctx, dest, 0.14, 0.4, 280, 0.5)
      tone(ctx, dest, 'sine', 140, 0.18, 0.2, 90)
      break
    case 'deal':
      burst(ctx, dest, 0.05, 0.35, 1600, 2)
      window.setTimeout(() => burst(ctx, dest, 0.05, 0.3, 1400, 2), 55)
      window.setTimeout(() => burst(ctx, dest, 0.06, 0.28, 1200, 2), 110)
      break
    case 'click':
      burst(ctx, dest, 0.04, 0.35, 2400, 3)
      tone(ctx, dest, 'triangle', 980, 0.04, 0.18)
      break
    case 'flag':
      tone(ctx, dest, 'square', 740, 0.05, 0.2)
      tone(ctx, dest, 'square', 980, 0.06, 0.14)
      break
    case 'boom':
      burst(ctx, dest, 0.45, 0.9, 120, 0.4)
      tone(ctx, dest, 'sawtooth', 90, 0.4, 0.35, 40)
      break
    case 'ink':
      tone(ctx, dest, 'sine', 420, 0.07, 0.22)
      burst(ctx, dest, 0.04, 0.18, 1100, 1.5)
      break
    case 'pencil':
      burst(ctx, dest, 0.05, 0.22, 3200, 4)
      break
    case 'erase':
      burst(ctx, dest, 0.08, 0.28, 900, 1.1)
      break
    case 'error':
      tone(ctx, dest, 'square', 220, 0.12, 0.22, 140)
      break
    case 'rotate':
      tone(ctx, dest, 'square', 480, 0.05, 0.16, 620)
      break
    case 'lock':
      thud(ctx, dest, 130, 0.1)
      break
    case 'drop':
      tone(ctx, dest, 'triangle', 320, 0.08, 0.18, 90)
      thud(ctx, dest, 110, 0.14)
      break
    case 'line':
      chord(ctx, dest, [330, 440, 554], 0.05, 0.12)
      break
    case 'tetris':
      chord(ctx, dest, [392, 494, 587, 784], 0.07, 0.16)
      break
    case 'win':
      lastFanfare = ctx.currentTime
      chord(ctx, dest, [392, 523, 659, 784], 0.09, 0.22)
      break
    case 'lose':
      lastFanfare = ctx.currentTime
      chord(ctx, dest, [392, 311, 247], 0.12, 0.28)
      break
    case 'draw':
      lastFanfare = ctx.currentTime
      chord(ctx, dest, [330, 392, 330], 0.1, 0.2)
      break
    case 'ligaBeep':
      tone(ctx, dest, 'square', 880, 0.04, 0.16)
      break
    case 'ligaWhoosh':
      burst(ctx, dest, 0.12, 0.4, 700, 0.8)
      tone(ctx, dest, 'triangle', 280, 0.12, 0.18, 140)
      break
    case 'ligaHit':
      burst(ctx, dest, 0.1, 0.7, 380, 0.9)
      thud(ctx, dest, 150, 0.12)
      break
    case 'ligaFire':
      burst(ctx, dest, 0.22, 0.65, 240, 0.5)
      tone(ctx, dest, 'sawtooth', 220, 0.2, 0.22, 90)
      break
    case 'ligaWater':
      burst(ctx, dest, 0.16, 0.45, 900, 1.4)
      tone(ctx, dest, 'sine', 420, 0.18, 0.22, 180)
      break
    case 'ligaSpark':
      tone(ctx, dest, 'square', 980, 0.05, 0.2)
      tone(ctx, dest, 'square', 1320, 0.06, 0.16)
      burst(ctx, dest, 0.08, 0.4, 2800, 3)
      break
    case 'ligaBeam':
      tone(ctx, dest, 'sawtooth', 360, 0.22, 0.2, 720)
      burst(ctx, dest, 0.18, 0.35, 1600, 1.2)
      break
    case 'ligaGrass':
      burst(ctx, dest, 0.12, 0.4, 1400, 2)
      tone(ctx, dest, 'triangle', 520, 0.14, 0.2, 260)
      break
    case 'ligaHeal':
      chord(ctx, dest, [392, 523, 659], 0.05, 0.12)
      break
    case 'ligaFaint':
      tone(ctx, dest, 'triangle', 240, 0.28, 0.22, 80)
      burst(ctx, dest, 0.2, 0.3, 180, 0.5)
      break
    case 'ligaIce':
      burst(ctx, dest, 0.14, 0.4, 2400, 3.2)
      tone(ctx, dest, 'triangle', 880, 0.12, 0.2, 1400)
      tone(ctx, dest, 'sine', 1320, 0.1, 0.14)
      break
    case 'ligaPoison':
      burst(ctx, dest, 0.16, 0.4, 480, 0.8)
      tone(ctx, dest, 'sine', 180, 0.2, 0.22, 90)
      tone(ctx, dest, 'triangle', 260, 0.18, 0.16)
      break
    case 'ligaDragon':
      tone(ctx, dest, 'sawtooth', 140, 0.28, 0.28, 420)
      burst(ctx, dest, 0.22, 0.5, 220, 0.6)
      tone(ctx, dest, 'square', 90, 0.2, 0.18, 60)
      break
    case 'ligaRock':
      thud(ctx, dest, 90, 0.18)
      burst(ctx, dest, 0.16, 0.7, 160, 0.5)
      thud(ctx, dest, 70, 0.14)
      break
    case 'ligaPunch':
      burst(ctx, dest, 0.08, 0.85, 220, 0.7)
      thud(ctx, dest, 110, 0.12)
      tone(ctx, dest, 'square', 160, 0.08, 0.2, 80)
      break
    case 'ligaSlash':
      burst(ctx, dest, 0.1, 0.55, 1800, 2.4)
      tone(ctx, dest, 'sawtooth', 720, 0.08, 0.16, 180)
      burst(ctx, dest, 0.08, 0.35, 900, 1.2)
      break
    case 'ligaGhost':
      tone(ctx, dest, 'sine', 220, 0.28, 0.18, 90)
      tone(ctx, dest, 'triangle', 420, 0.22, 0.14, 180)
      burst(ctx, dest, 0.2, 0.28, 700, 0.7)
      break
    case 'ligaText':
      tone(ctx, dest, 'square', 620, 0.02, 0.08)
      break
    case 'ligaLowHp':
      tone(ctx, dest, 'square', 520, 0.06, 0.12)
      break
    case 'ligaBall':
      burst(ctx, dest, 0.08, 0.45, 1400, 2)
      tone(ctx, dest, 'square', 540, 0.07, 0.18, 880)
      tone(ctx, dest, 'triangle', 720, 0.1, 0.16)
      break
  }
}
