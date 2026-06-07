import { BaseRepository } from './base.repository'
import type { ConfigNegocio } from '@/types'

class ConfigRepository extends BaseRepository<ConfigNegocio> {
  constructor() { super('config') }

  async obtenerConfig(): Promise<ConfigNegocio | undefined> {
    return this.obtenerPorId('config')
  }

  async guardarConfig(cfg: ConfigNegocio): Promise<void> {
    return this.crear({ ...cfg, id: 'config' })
  }
}

export const configRepository = new ConfigRepository()
