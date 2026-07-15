import { BaseRepository } from './base.repository'
import type { Orden } from '@/types'

class OrdenesRepository extends BaseRepository<Orden> {
  constructor() { super('ordenes') }
}

export const ordenesRepository = new OrdenesRepository()
