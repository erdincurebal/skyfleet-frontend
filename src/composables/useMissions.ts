import { ref, watch } from 'vue'
import { missionsApi, type ListMissionsParams } from '../api'
import type { Mission, Paginated, MissionStatus } from '../types'

export function useMissions(droneId?: string) {
  const page = ref(1)
  const limit = ref(20)
  const status = ref<MissionStatus | undefined>()
  const filterDroneId = ref<string | undefined>(droneId)
  const from = ref<string | undefined>()
  const to = ref<string | undefined>()
  const result = ref<Paginated<Mission> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const params: ListMissionsParams = { page: page.value, limit: limit.value }
      if (status.value) params.status = status.value
      if (filterDroneId.value) params.droneId = filterDroneId.value
      if (from.value) params.from = from.value
      if (to.value) params.to = to.value
      result.value = await missionsApi.list(params)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load missions'
    } finally {
      loading.value = false
    }
  }

  watch([page, status, filterDroneId, from, to], load, { immediate: true })

  return { page, limit, status, filterDroneId, from, to, result, loading, error, load }
}
