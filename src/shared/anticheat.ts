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

// Starts (or restarts) the penalty timer, LOCK_HOURS from now. This is the SOFT response to a
// mere suspicion signal (DevTools looks open) — not proof anyone touched saved data, so it's
// temporary and reversible by waiting it out, unlike wipeAccountForCheating below.
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

// ---- Hard response: confirmed tampering wipes the account ----
//
// This is the ceiling of what a browser-only game can enforce: there is no server to hold an
// unforgeable signing key, so a sufficiently technical attacker (or anyone who reads this file's
// source, e.g. from the public repo) can still forge a signature. What signing DOES catch — and
// what this responds to — is any save/counter that was edited without going through the app, which
// covers hand-editing localStorage from DevTools and pasting a doctored/AI-edited code back in.
// On that confirmed signal, the whole pokealbum-* account is wiped rather than temporarily locked.
let wipedThisLoad = false
const WIPE_NOTICE_KEY = 'pokealbum-cheat-wipe-notice'

export const CHEAT_TAUNTS = [
  'JAJAJAJ DALE PAJERO',
  'QUERÉS MONEDITAS PELOTUDIN?',
  'JAAAAAAAAAAAAAAAAAAAA, DALE SOS BUENISIMO',
  'JAJAJ POR QUÉ CHITEAS PAJERO?',
]

export function randomCheatTaunt(): string {
  return CHEAT_TAUNTS[Math.floor(Math.random() * CHEAT_TAUNTS.length)]
}

export function wipeAccountForCheating(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith('pokealbum-')) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch {
    /* ignore quota / privacy mode */
  }
  wipedThisLoad = true
  try {
    localStorage.setItem(WIPE_NOTICE_KEY, '1')
  } catch {
    /* ignore quota */
  }
}

// One-shot: true the first time it's called after a wipe (this load, or a still-pending notice
// left over from a wipe that happened without a full page reload in between).
export function consumeCheatWipeNotice(): boolean {
  if (wipedThisLoad) {
    wipedThisLoad = false
    return true
  }
  try {
    if (localStorage.getItem(WIPE_NOTICE_KEY) === '1') {
      localStorage.removeItem(WIPE_NOTICE_KEY)
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}
