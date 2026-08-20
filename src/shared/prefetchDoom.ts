let started = false

export function prefetchDoom(): void {
  if (started) {
    return
  }
  started = true
  const base = import.meta.env.BASE_URL
  ;['doomgeneric.js', 'doomgeneric.wasm', 'doomgeneric.data'].forEach((file) => {
    void fetch(`${base}doom/${file}`)
  })
}
