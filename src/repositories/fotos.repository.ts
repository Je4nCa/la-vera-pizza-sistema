import { BaseRepository } from './base.repository'
import type { FotoPantalla, FotoPantallaData } from '@/types'

/** Metadatos + miniatura — liviano, es lo que lista la página de administración */
class FotosRepository extends BaseRepository<FotoPantalla> {
  constructor() { super('fotos') }
}

/** Imagen completa — solo la carga la pantalla de fotos */
class FotosDataRepository extends BaseRepository<FotoPantallaData> {
  constructor() { super('fotosData') }
}

export const fotosRepository     = new FotosRepository()
export const fotosDataRepository = new FotosDataRepository()
