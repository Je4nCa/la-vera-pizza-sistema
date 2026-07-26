import { runTransaction } from 'firebase/firestore'
import { firestore, hDoc } from './firebase'
import { isoFecha } from './utils'

interface ContadorDoc {
  fecha:  string  // YYYY-MM-DD local
  ultimo: number
}

/**
 * Devuelve el siguiente número de orden del día (1, 2, 3…), atómico entre
 * cajeros/dispositivos vía transacción de Firestore. Se reinicia solo en
 * cuanto cambia la fecha local (Costa Rica).
 */
export async function siguienteNumeroOrden(): Promise<number> {
  const ref = hDoc('contadores', 'ordenes-diarias')
  return runTransaction(firestore, async (tx) => {
    const snap  = await tx.get(ref)
    const hoy   = isoFecha()
    const data  = snap.exists() ? (snap.data() as ContadorDoc) : null
    const ultimo    = data && data.fecha === hoy ? data.ultimo : 0
    const siguiente = ultimo + 1
    tx.set(ref, { fecha: hoy, ultimo: siguiente })
    return siguiente
  })
}

/** "0001", "0027", etc. */
export function formatearNumOrden(n: number): string {
  return String(n).padStart(4, '0')
}
