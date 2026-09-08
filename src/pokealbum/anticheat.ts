// A non-cryptographic fingerprint (cyrb53) for saved data. This can't stop someone who reads this
// source and recomputes it — nothing client-side can — but it does catch the common case this was
// built for: hand-editing coins/streak values from the browser console without touching the app,
// which silently breaks the signature and gets flagged as tampering.
const SALT = 'pokealbum-no-hardcodees-esto-desde-la-consola-v1'

function cyrb53(str: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function signPayload(payload: string): string {
  return cyrb53(payload + SALT).toString(36)
}

export function verifyPayload(payload: string, sig: string | undefined): boolean {
  return typeof sig === 'string' && sig.length > 0 && sig === signPayload(payload)
}
