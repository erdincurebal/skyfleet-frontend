<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dronesApi } from '../api'
import { useMissions } from '../composables/useMissions'
import { useMaintenance } from '../composables/useMaintenance'
import StatusBadge from '../components/StatusBadge.vue'
import { formatDate, formatDateTime, formatHours } from '../utils/format'
import type { Drone } from '../types'
import { useToast } from '../composables/useToast'

const toast = useToast()

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const drone = ref<Drone | null>(null)
const droneLoading = ref(true)
const droneError = ref<string | null>(null)

const retiring = ref(false)
const retireError = ref<string | null>(null)
const retireConfirm = ref(false)

const { result: missionsResult, loading: missionsLoading } = useMissions(id)
const { result: maintenanceResult, loading: maintenanceLoading } = useMaintenance(id)

const activeTab = ref<'missions' | 'maintenance'>('missions')

onMounted(async () => {
  try {
    drone.value = await dronesApi.get(id)
  } catch (e) {
    droneError.value = e instanceof Error ? e.message : 'Failed to load drone'
  } finally {
    droneLoading.value = false
  }
})

async function retire() {
  retiring.value = true
  retireError.value = null
  try {
    await dronesApi.retire(id)
    toast.success(`Drone ${drone.value?.serialNumber ?? ''} retired`)
    router.push('/drones')
  } catch (e) {
    retireError.value = e instanceof Error ? e.message : 'Failed to retire drone'
    retireConfirm.value = false
  } finally {
    retiring.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/drones" class="text-sm text-blue-600 hover:underline">← Drones</RouterLink>
      <h1 class="text-2xl font-bold text-gray-900">Drone Detail</h1>
    </div>

    <div v-if="droneError" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ droneError }}</div>
    <div v-if="droneLoading" class="text-sm text-gray-500">Loading…</div>

    <div v-else-if="drone" class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-mono text-xl font-semibold text-gray-900">{{ drone.serialNumber }}</p>
          <p class="text-sm text-gray-500 mt-1">{{ drone.model.replace(/_/g, ' ') }}</p>
        </div>
        <StatusBadge :status="drone.status" />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Total Flight Hours</p>
          <p class="font-medium text-gray-900 mt-1">{{ formatHours(drone.totalFlightHours) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Last Maintenance</p>
          <p class="font-medium text-gray-900 mt-1">{{ formatDate(drone.lastMaintenanceDate) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Next Maintenance Due</p>
          <p class="font-medium text-gray-900 mt-1">{{ formatDate(drone.nextMaintenanceDueDate) }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="drone.status === 'AVAILABLE'" class="pt-2 border-t border-gray-100">
        <div v-if="retireError" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-3 whitespace-pre-line">{{ retireError }}</div>
        <div v-if="!retireConfirm">
          <button
            class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            @click="retireConfirm = true"
          >
            Retire Drone
          </button>
        </div>
        <div v-else class="flex items-center gap-3">
          <p class="text-sm text-gray-700">Retire this drone permanently?</p>
          <button
            :disabled="retiring"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            @click="retire"
          >
            {{ retiring ? 'Retiring…' : 'Confirm Retire' }}
          </button>
          <button
            class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            @click="retireConfirm = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div v-if="!droneLoading">
      <div class="flex border-b border-gray-200">
        <button
          :class="['px-4 py-2 text-sm font-medium border-b-2 -mb-px', activeTab === 'missions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
          @click="activeTab = 'missions'"
        >
          Mission History
        </button>
        <button
          :class="['px-4 py-2 text-sm font-medium border-b-2 -mb-px', activeTab === 'maintenance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
          @click="activeTab = 'maintenance'"
        >
          Maintenance History
        </button>
      </div>

      <!-- Mission History -->
      <div v-if="activeTab === 'missions'" class="mt-4">
        <div v-if="missionsLoading" class="text-sm text-gray-500">Loading…</div>
        <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Start</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">End</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="m in missionsResult?.data" :key="m.id">
                <td class="px-4 py-3">
                  <RouterLink :to="`/missions/${m.id}`" class="text-blue-600 hover:underline">{{ m.name }}</RouterLink>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ m.type.replace(/_/g, ' ') }}</td>
                <td class="px-4 py-3"><StatusBadge :status="m.status" /></td>
                <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedStart) }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedEnd) }}</td>
              </tr>
              <tr v-if="!missionsResult?.data.length">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">No missions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Maintenance History -->
      <div v-if="activeTab === 'maintenance'" class="mt-4">
        <div v-if="maintenanceLoading" class="text-sm text-gray-500">Loading…</div>
        <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Technician</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Performed At</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Flight Hrs</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="log in maintenanceResult?.data" :key="log.id">
                <td class="px-4 py-3 text-gray-900">{{ log.type.replace(/_/g, ' ') }}</td>
                <td class="px-4 py-3 text-gray-600">{{ log.technicianName }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDateTime(log.performedAt) }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatHours(log.flightHoursAtMaintenance) }}</td>
                <td class="px-4 py-3 text-gray-500">{{ log.notes ?? '—' }}</td>
              </tr>
              <tr v-if="!maintenanceResult?.data.length">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">No maintenance logs.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
