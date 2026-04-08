import { ref, onMounted } from 'vue'
import { fleetHealthApi } from '../api'
import type { FleetHealthResponse } from '../types'

export function useFleetHealth() {
  const data = ref<FleetHealthResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      data.value = await fleetHealthApi.get()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load fleet health'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { data, loading, error, load }
}
