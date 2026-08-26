export function spriteUrl(id: number, back = false): string {
  const file = back ? `back/${id}.png` : `${id}.png`
  const base = import.meta.env.BASE_URL
  return `${base}liga/sprites/${file}`
}
