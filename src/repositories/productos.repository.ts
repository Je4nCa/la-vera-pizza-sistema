import { BaseRepository } from './base.repository'
import type { Producto } from '@/types'

class ProductosRepository extends BaseRepository<Producto> {
  constructor() { super('productos') }
}

export const productosRepository = new ProductosRepository()
