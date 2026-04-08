<script setup lang="ts">
import type { DroneStatus } from '../types'

defineProps<{ status: DroneStatus }>()

const classes: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_MISSION: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  RETIRED: 'bg-red-100 text-red-800',
}
</script>

<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', classes[status]]">
    {{ status.replace(/_/g, ' ') }}
  </span>
</template>
