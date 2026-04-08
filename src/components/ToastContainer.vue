<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()

const kindClass: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <transition-group name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-3', kindClass[t.kind]]"
        >
          <span class="flex-1 whitespace-pre-line">{{ t.message }}</span>
          <button
            type="button"
            class="text-white/80 hover:text-white"
            aria-label="Dismiss"
            @click="dismiss(t.id)"
          >
            ×
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
