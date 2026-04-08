import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const toasts = ref<Toast[]>([])
let nextId = 1

function push(kind: ToastKind, message: string, durationMs = 3500): void {
  const id = nextId++
  toasts.value.push({ id, kind, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, durationMs)
}

export function useToast() {
  return {
    toasts,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    dismiss: (id: number) => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    },
  }
}
