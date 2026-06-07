import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Elimina campos undefined antes de escribir en Firestore */
export function sinUndefined<T extends object>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
}

/** Formatea número como colones costarricenses */
export function fmtColones(n: number): string {
  return '₡' + Number(n).toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Formatea fecha ISO a string legible */
export function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Formatea fecha ISO a solo fecha */
export function fmtFechaSolo(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/** Retorna YYYY-MM-DD de un Date */
export function isoFecha(d = new Date()): string {
  return d.toISOString().split('T')[0]
}

/** Retorna YYYY-MM del mes actual */
export function isoMes(d = new Date()): string {
  return d.toISOString().substring(0, 7)
}
