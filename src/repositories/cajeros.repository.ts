import { BaseRepository } from './base.repository'
import type { Cajero } from '@/types'

class CajerosRepository extends BaseRepository<Cajero> {
  constructor() { super('cajeros') }
}

export const cajerosRepository = new CajerosRepository()
