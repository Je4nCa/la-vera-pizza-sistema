/**
 * Compresión de imágenes en el navegador para poder guardarlas en Firestore.
 *
 * Firestore admite 1 MiB (1.048.576 bytes) por documento. Una data URL en
 * base64 es ASCII puro, así que su largo en caracteres == su peso en bytes.
 * Se apunta bastante por debajo del límite para dejar lugar al resto de los
 * campos del documento y no quedar al filo.
 */

const MAX_DATAURL  = 700_000  // imagen completa
const MAX_THUMB    = 60_000   // miniatura del panel de administración

// Se prueban de mayor a menor hasta que el resultado entre en el límite
const DIMENSIONES = [1920, 1600, 1280, 1024, 800, 640]
const CALIDADES   = [0.82, 0.72, 0.62, 0.5, 0.4, 0.3]

export interface ImagenComprimida {
  dataUrl: string
  thumb:   string
  peso:    number
}

/** Carga el archivo respetando la orientación EXIF (fotos de celular). */
async function cargarImagen(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Algunos navegadores no soportan la opción — se cae al <img>
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}

function dibujar(
  src: ImageBitmap | HTMLImageElement,
  maxDim: number,
  calidad: number,
): string {
  const anchoOriginal = 'width'  in src ? src.width  : 0
  const altoOriginal  = 'height' in src ? src.height : 0
  const escala = Math.min(1, maxDim / Math.max(anchoOriginal, altoOriginal))
  const ancho  = Math.max(1, Math.round(anchoOriginal * escala))
  const alto   = Math.max(1, Math.round(altoOriginal  * escala))

  const canvas = document.createElement('canvas')
  canvas.width  = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('El navegador no soporta canvas 2D')

  // Fondo blanco: si el original es PNG con transparencia, al pasar a JPEG
  // el alfa quedaría negro
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src as CanvasImageSource, 0, 0, ancho, alto)

  return canvas.toDataURL('image/jpeg', calidad)
}

/**
 * Comprime hasta que la data URL entre en `limite`. Devuelve null si ni con
 * la configuración más agresiva se logra (imagen absurdamente grande).
 */
function comprimirHasta(
  src: ImageBitmap | HTMLImageElement,
  limite: number,
  dimensiones: number[],
): string | null {
  let ultimo: string | null = null
  for (const dim of dimensiones) {
    for (const q of CALIDADES) {
      const dataUrl = dibujar(src, dim, q)
      ultimo = dataUrl
      if (dataUrl.length <= limite) return dataUrl
    }
  }
  // Ninguna combinación entró: se devuelve null para que el llamador avise
  return ultimo && ultimo.length <= limite ? ultimo : null
}

export async function comprimirImagen(file: File): Promise<ImagenComprimida> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen')
  }

  const src = await cargarImagen(file)

  const dataUrl = comprimirHasta(src, MAX_DATAURL, DIMENSIONES)
  if (!dataUrl) {
    throw new Error('La imagen es demasiado grande incluso comprimida al máximo')
  }

  const thumb = comprimirHasta(src, MAX_THUMB, [480, 360, 240, 160])
  if (!thumb) {
    throw new Error('No se pudo generar la miniatura')
  }

  if ('close' in src && typeof src.close === 'function') src.close()

  return { dataUrl, thumb, peso: dataUrl.length }
}

/** "1,2 MB" / "340 KB" */
export function fmtPeso(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  return `${Math.round(bytes / 1000)} KB`
}
