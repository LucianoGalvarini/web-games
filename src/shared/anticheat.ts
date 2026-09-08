import { signPayload, verifyPayload } from '../pokealbum'

const LOCK_KEY = 'pokealbum-cheat-lock'
export const CHEAT_LOCK_HOURS = 3
const CHEAT_LOCK_MS = CHEAT_LOCK_HOURS * 60 * 60 * 1000

type LockRecord = { until: number; sig: string }

function readLockRecord(): LockRecord | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<LockRecord>
    if (typeof parsed.until !== 'number') {
      return null
    }
    return { until: parsed.until, sig: parsed.sig ?? '' }
  } catch {
    return null
  }
}

function writeLockRecord(until: number): void {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ until, sig: signPayload(String(until)) }))
  } catch {
    /* ignore quota */
  }
}

// Starts (or restarts) the penalty timer, LOCK_HOURS from now.
export function triggerCheatLock(): void {
  writeLockRecord(Date.now() + CHEAT_LOCK_MS)
}

// Milliseconds remaining on an active lock, or 0 if there isn't one. A lock record whose signature
// doesn't match (someone tried to erase or shorten the penalty from the console) is treated as a
// fresh violation and re-locked from now, instead of just being ignored.
export function getCheatLockRemainingMs(): number {
  const record = readLockRecord()
  if (!record) {
    return 0
  }
  if (!verifyPayload(String(record.until), record.sig)) {
    triggerCheatLock()
    return CHEAT_LOCK_MS
  }
  return Math.max(0, record.until - Date.now())
}

// Docked DevTools reserve real screen space, so the outer (browser chrome) and inner (viewport)
// window dimensions drift apart by more than any normal browser chrome/toolbar would account for.
// This only catches docked panels, not detached DevTools windows — a deliberate trade-off to avoid
// false positives from unrelated window resizing.
const SIZE_THRESHOLD = 170

function looksLikeDevToolsOpen(): boolean {
  if (typeof window === 'undefined' || window.outerWidth <= 0 || window.outerHeight <= 0) {
    return false
  }
  const widthDiff = window.outerWidth - window.innerWidth
  const heightDiff = window.outerHeight - window.innerHeight
  return widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD
}

export function startDevToolsWatch(onDetect: () => void): () => void {
  let detected = false
  const check = () => {
    if (detected) {
      return
    }
    if (looksLikeDevToolsOpen()) {
      detected = true
      onDetect()
    }
  }
  check()
  const intervalId = window.setInterval(check, 1000)
  window.addEventListener('resize', check)
  return () => {
    window.clearInterval(intervalId)
    window.removeEventListener('resize', check)
  }
}
