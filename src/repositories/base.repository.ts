import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { firestore, hCol, hDoc } from '@/lib/firebase'
import { sinUndefined } from '@/lib/utils'
import type { ID } from '@/types'

// Timeout de seguridad: con persistencia activa, cada write resuelve en <200ms.
// Si llega a 15s es señal de un problema grave — rechaza para que el catch lo muestre.
function withTimeout<T>(promise: Promise<T>, label: string, ms = 15_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`[Firestore] ${label}: sin respuesta después de ${ms / 1000}s`)),
        ms
      )
    ),
  ])
}

export class BaseRepository<T extends { id: ID }> {
  constructor(protected readonly colName: string) {}

  async obtenerPorId(id: ID): Promise<T | undefined> {
    const snap = await getDoc(hDoc(this.colName, id))
    return snap.exists() ? (snap.data() as T) : undefined
  }

  async obtenerTodos(): Promise<T[]> {
    const snap = await getDocs(hCol(this.colName))
    return snap.docs.map((d) => d.data() as T)
  }

  async crear(item: T): Promise<void> {
    console.log(`[Repo] crear → ${this.colName}/${item.id}`)
    await withTimeout(
      setDoc(hDoc(this.colName, item.id), sinUndefined(item)),
      `crear ${this.colName}`
    )
    console.log(`[Repo] ✓ creado ${this.colName}/${item.id}`)
  }

  async crearBulk(items: T[]): Promise<void> {
    console.log(`[Repo] crearBulk → ${this.colName} (${items.length})`)
    const batch = writeBatch(firestore)
    items.forEach((item) =>
      batch.set(hDoc(this.colName, item.id), sinUndefined(item))
    )
    await withTimeout(batch.commit(), `crearBulk ${this.colName}`)
    console.log(`[Repo] ✓ crearBulk ${this.colName}`)
  }

  async actualizar(id: ID, cambios: Partial<T>): Promise<void> {
    console.log(`[Repo] actualizar → ${this.colName}/${id}`)
    await withTimeout(
      updateDoc(hDoc(this.colName, id), sinUndefined(cambios as object)),
      `actualizar ${this.colName}`
    )
    console.log(`[Repo] ✓ actualizado ${this.colName}/${id}`)
  }

  async eliminar(id: ID): Promise<void> {
    console.log(`[Repo] eliminar → ${this.colName}/${id}`)
    await withTimeout(
      deleteDoc(hDoc(this.colName, id)),
      `eliminar ${this.colName}`
    )
    console.log(`[Repo] ✓ eliminado ${this.colName}/${id}`)
  }

  async contar(): Promise<number> {
    const snap = await getDocs(hCol(this.colName))
    return snap.size
  }
}
