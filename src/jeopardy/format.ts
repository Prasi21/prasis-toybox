export function money(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-US')
  return `${n < 0 ? '−' : ''}$${formatted}`
}
