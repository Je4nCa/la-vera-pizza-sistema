import { BaseRepository } from './base.repository'
import type { Cliente } from '@/types'

class ClientesRepository extends BaseRepository<Cliente> {
  constructor() { super('clientes') }
}

export const clientesRepository = new ClientesRepository()
