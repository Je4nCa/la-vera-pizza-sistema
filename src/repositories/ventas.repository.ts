import { BaseRepository } from './base.repository'
import type { Venta } from '@/types'

class VentasRepository extends BaseRepository<Venta> {
  constructor() { super('ventas') }
}

export const ventasRepository = new VentasRepository()
