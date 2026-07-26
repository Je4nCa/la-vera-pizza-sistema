import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Elimina campos undefined antes de escribir en Firestore (recursivo) */
export function sinUndefined<T extends object>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (Array.isArray(v)) {
      result[k] = v.map((item) =>
        item !== null && typeof item === 'object' ? sinUndefined(item) : item
      )
    } else if (v !== null && typeof v === 'object') {
      result[k] = sinUndefined(v as object)
    } else {
      result[k] = v
    }
  }
  return result
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

/**
 * Retorna YYYY-MM-DD en la zona horaria LOCAL del navegador (Costa Rica).
 * OJO: toISOString() usa UTC — con CR a UTC-6, cualquier venta después de
 * las 6pm caía bajo la fecha del día siguiente y desalineaba "hoy" en
 * Dashboard, Cierre de Caja, Pantalla Cocina, Órdenes y los filtros de
 * Historial/Reportes. Por eso esto arma la fecha con getters locales.
 */
export function isoFecha(d = new Date()): string {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Retorna YYYY-MM del mes actual, en zona horaria LOCAL */
export function isoMes(d = new Date()): string {
  return isoFecha(d).slice(0, 7)
}

/**
 * Convierte una fecha ISO guardada (ej. venta.fecha, siempre en UTC) a su
 * YYYY-MM-DD en hora LOCAL. Usar esto (no .startsWith()/.slice(0,10) sobre
 * el string ISO crudo) para comparar contra isoFecha()/isoMes() — así
 * "hoy" significa lo mismo para el cajero que para el filtro.
 */
export function fechaLocalDeIso(fechaIso: string): string {
  return isoFecha(new Date(fechaIso))
}
