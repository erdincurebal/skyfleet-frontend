import { ref, watch } from 'vue'
import { dronesApi, type ListDronesParams } from '../api'
import type { Drone, Paginated, DroneStatus } from '../types'

export function useDrones(initialStatus?: DroneStatus) {
  const page = ref(1)
  const limit = ref(20)
  const status = ref<DroneStatus | undefined>(initialStatus)
  const result = ref<Paginated<Drone> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const params: ListDronesParams = { page: page.value, limit: limit.value }
      if (status.value) params.status = status.value
      result.value = await dronesApi.list(params)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load drones'
    } finally {
      loading.value = false
    }
  }

  watch([page, status], load, { immediate: true })

  return { page, limit, status, result, loading, error, load }
}
