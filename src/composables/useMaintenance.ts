import { ref, watch } from 'vue'
import { maintenanceApi, type ListMaintenanceParams } from '../api'
import type { MaintenanceLog, Paginated } from '../types'

export function useMaintenance(initialDroneId?: string) {
  const page = ref(1)
  const limit = ref(20)
  const droneId = ref<string | undefined>(initialDroneId)
  const result = ref<Paginated<MaintenanceLog> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const params: ListMaintenanceParams = { page: page.value, limit: limit.value }
      if (droneId.value) params.droneId = droneId.value
      result.value = await maintenanceApi.list(params)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load maintenance logs'
    } finally {
      loading.value = false
    }
  }

  watch([page, droneId], load, { immediate: true })

  return { page, limit, droneId, result, loading, error, load }
}
