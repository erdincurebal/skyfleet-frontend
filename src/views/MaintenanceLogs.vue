<script setup lang="ts">
import { ref } from 'vue'
import { useMaintenance } from '../composables/useMaintenance'
import { useDrones } from '../composables/useDrones'
import { maintenanceApi, dronesApi } from '../api'
import AppPagination from '../components/AppPagination.vue'
import AppModal from '../components/AppModal.vue'
import { formatDateTime, formatHours } from '../utils/format'
import { MaintenanceType } from '../types'
import type { CreateMaintenanceLogPayload } from '../api'

const { page, limit, droneId, result, loading, error, load } = useMaintenance()
const { result: dronesResult } = useDrones()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)

const typeOptions = Object.values(MaintenanceType)

const emptyForm = (): CreateMaintenanceLogPayload & { notes: string } => ({
  droneId: '',
  type: MaintenanceType.ROUTINE_CHECK,
  technicianName: '',
  notes: '',
  performedAt: '',
  flightHoursAtMaintenance: 0,
})
const form = ref(emptyForm())

function droneSerial(dId: string): string {
  return dronesResult.value?.data.find((d) => d.id === dId)?.serialNumber ?? dId.slice(0, 8) + '…'
}

async function onDroneSelect() {
  if (!form.value.droneId) return
  try {
    const drone = await dronesApi.get(form.value.droneId)
    form.value.flightHoursAtMaintenance = Number(drone.totalFlightHours)
  } catch {
    // not blocking
  }
}

async function submitCreate() {
  creating.value = true
  createError.value = null
  try {
    const payload: CreateMaintenanceLogPayload = {
      droneId: form.value.droneId,
      type: form.value.type,
      technicianName: form.value.technicianName,
      performedAt: new Date(form.value.performedAt).toISOString(),
      flightHoursAtMaintenance: Number(String(form.value.flightHoursAtMaintenance).replace(',', '.')),
    }
    if (form.value.notes) payload.notes = form.value.notes
    await maintenanceApi.create(payload)
    showCreate.value = false
    form.value = emptyForm()
    await load()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Failed to create maintenance log'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Maintenance Logs</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        @click="showCreate = true"
      >
        + New Log
      </button>
    </div>

    <!-- Drone Filter -->
    <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
      <label class="text-sm font-medium text-gray-700">Drone:</label>
      <select
        :value="droneId ?? ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { droneId = (e.target as HTMLSelectElement).value || undefined; page = 1 }"
      >
        <option value="">All Drones</option>
        <option v-for="d in dronesResult?.data" :key="d.id" :value="d.id">{{ d.serialNumber }}</option>
      </select>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ error }}</div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 text-sm">Loading…</div>
      <table v-else class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Drone</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Technician</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Performed At</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Flight Hrs</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="log in result?.data" :key="log.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <RouterLink :to="`/drones/${log.droneId}`" class="font-mono text-blue-600 hover:underline text-xs">
                {{ droneSerial(log.droneId) }}
              </RouterLink>
            </td>
            <td class="px-4 py-3 text-gray-900">{{ log.type.replace(/_/g, ' ') }}</td>
            <td class="px-4 py-3 text-gray-600">{{ log.technicianName }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDateTime(log.performedAt) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatHours(log.flightHoursAtMaintenance) }}</td>
            <td class="px-4 py-3 text-gray-500">{{ log.notes ?? '—' }}</td>
          </tr>
          <tr v-if="!result?.data.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">No maintenance logs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination
      v-if="result && result.total > limit"
      :page="page"
      :limit="limit"
      :total="result.total"
      @change="(p) => { page = p }"
    />

    <AppModal v-if="showCreate" title="New Maintenance Log" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{{ createError }}</div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Drone</label>
          <select
            v-model="form.droneId"
            required
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="onDroneSelect"
          >
            <option value="" disabled>Select drone…</option>
            <option v-for="d in dronesResult?.data" :key="d.id" :value="d.id">{{ d.serialNumber }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select v-model="form.type" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t.replace(/_/g, ' ') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Technician Name</label>
          <input v-model="form.technicianName" type="text" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Performed At</label>
          <input v-model="form.performedAt" type="datetime-local" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Flight Hours at Maintenance</label>
          <input
            v-model="form.flightHoursAtMaintenance"
            type="number"
            step="0.1"
            min="0"
            lang="en"
            required
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">Must be within ±0.5 of drone's current total flight hours (422 if exceeded).</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea v-model="form.notes" rows="2" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50" @click="showCreate = false">Cancel</button>
          <button type="submit" :disabled="creating" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
