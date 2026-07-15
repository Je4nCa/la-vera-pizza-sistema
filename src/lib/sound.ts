// Sonido de "orden lista" generado con Web Audio API — no depende de archivos
// externos, así que siempre está disponible y no hay nada que hostear.

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctor()
  }
  return audioCtx
}

/**
 * Los navegadores bloquean el audio hasta que haya un gesto del usuario en
 * ese documento (aplica también a AudioContext, no solo a <audio>/<video>).
 * Llamar esto dentro de un onClick "destraba" el audio para el resto de la sesión.
 */
export async function desbloquearAudio(): Promise<void> {
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {})
}

function tono(ctx: AudioContext, freq: number, inicio: number, duracion: number, volumen: number) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, inicio)
  gain.gain.linearRampToValueAtTime(volumen, inicio + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracion)
  osc.connect(gain).connect(ctx.destination)
  osc.start(inicio)
  osc.stop(inicio + duracion + 0.05)
}

/**
 * Campanita brillante y fuerte, repetida 3 veces con pausas, pensada para
 * notarse en un ambiente ruidoso (centro gastronómico).
 */
export function sonarOrdenLista(): void {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime
    const acorde = [880, 1108.73, 1318.51] // A5, C#6, E6
    const volumen = 1.0
    ;[0, 0.85, 1.7].forEach((offset) => {
      acorde.forEach((freq, i) => tono(ctx, freq, now + offset + i * 0.1, 0.55, volumen))
    })
  } catch (err) {
    console.error('[sonido] Error al reproducir:', err)
  }
}
