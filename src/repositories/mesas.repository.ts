import { BaseRepository } from './base.repository'
import type { Mesa } from '@/types'

class MesasRepository extends BaseRepository<Mesa> {
  constructor() { super('mesas') }
}

export const mesasRepository = new MesasRepository()
