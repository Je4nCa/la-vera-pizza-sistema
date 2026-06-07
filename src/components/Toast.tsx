import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={cn(
            'flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium shadow-xl cursor-pointer',
            'animate-fade-in-up transition-all',
            t.tipo === 'ok'      && 'bg-[#1E2D24] text-[#F2ECE3]',
            t.tipo === 'error'   && 'bg-[#C4432D] text-white',
            t.tipo === 'warning' && 'bg-[#D4A35A] text-[#222]',
          )}
        >
          {t.mensaje}
        </div>
      ))}
    </div>
  )
}
