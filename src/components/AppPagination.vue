<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; limit: number; total: number }>()
const emit = defineEmits<{ (e: 'change', page: number): void }>()

const totalPages = computed(() => Math.ceil(props.total / props.limit))
</script>

<template>
  <div class="flex items-center justify-between py-3">
    <p class="text-sm text-gray-600">
      {{ (page - 1) * limit + 1 }}–{{ Math.min(page * limit, total) }} / {{ total }}
    </p>
    <div class="flex gap-2">
      <button
        :disabled="page <= 1"
        class="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        @click="emit('change', page - 1)"
      >
        Prev
      </button>
      <button
        :disabled="page >= totalPages"
        class="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        @click="emit('change', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
