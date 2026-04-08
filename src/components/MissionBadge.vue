<script setup lang="ts">
import type { MissionStatus } from '../types'

defineProps<{ status: MissionStatus }>()

const classes: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  PRE_FLIGHT_CHECK: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ABORTED: 'bg-red-100 text-red-800',
}
</script>

<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', classes[status]]">
    {{ status.replace(/_/g, ' ') }}
  </span>
</template>
