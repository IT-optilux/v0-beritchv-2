/**
 * Formatea un valor numérico como moneda en formato español pero usando dólares ($)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea un valor numérico como porcentaje
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Formatea un valor numérico como número entero
 */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value)
}

/**
 * Formatea una fecha en formato español
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
