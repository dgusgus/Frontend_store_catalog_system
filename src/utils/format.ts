// Prisma Decimal llega como string desde el JSON, lo convertimos aquí
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return Number(value).toFixed(2)
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Number(value)
}