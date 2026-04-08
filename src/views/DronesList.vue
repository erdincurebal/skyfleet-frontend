<script setup lang="ts">
import { ref } from 'vue'
import { useDrones } from '../composables/useDrones'
import { dronesApi } from '../api'
import StatusBadge from '../components/StatusBadge.vue'
import AppPagination from '../components/AppPagination.vue'
import AppModal from '../components/AppModal.vue'
import { formatDate, formatHours } from '../utils/format'
import { DroneModel, DroneStatus } from '../types'
import type { CreateDronePayload } from '../api'

const { page, limit, status, result, loading, error, load } = useDrones()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const form = ref<CreateDronePayload>({ serialNumber: '', model: DroneModel.PHANTOM_4 })

const modelOptions = Object.values(DroneModel)
const statusFilterOptions: Array<{ label: string; value: DroneStatus | '' }> = [
  { label: 'All', value: '' },
  ...Object.values(DroneStatus).map((s) => ({ label: s.replace(/_/g, ' '), value: s })),
]

async function submitCreate() {
  creating.value = true
  createError.value = null
  try {
    await dronesApi.create(form.value)
    showCreate.value = false
    form.value = { serialNumber: '', model: DroneModel.PHANTOM_4 }
    await load()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Failed to create drone'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Drones</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        @click="showCreate = true"
      >
        + New Drone
      </button>
    </div>

    <!-- Status Filter -->
    <div class="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
      <label class="text-sm font-medium text-gray-700">Status:</label>
      <select
        :value="status ?? ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { status = ((e.target as HTMLSelectElement).value as DroneStatus) || undefined; page = 1 }"
      >
        <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ error }}</div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 text-sm">Loading…</div>
      <table v-else class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Serial Number</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Model</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Flight Hours</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Next Maintenance</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="drone in result?.data" :key="drone.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-gray-900">{{ drone.serialNumber }}</td>
            <td class="px-4 py-3 text-gray-600">{{ drone.model.replace(/_/g, ' ') }}</td>
            <td class="px-4 py-3"><StatusBadge :status="drone.status" /></td>
            <td class="px-4 py-3 text-gray-600">{{ formatHours(drone.totalFlightHours) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(drone.nextMaintenanceDueDate) }}</td>
            <td class="px-4 py-3 text-right">
              <RouterLink :to="`/drones/${drone.id}`" class="text-blue-600 hover:underline text-xs">View</RouterLink>
            </td>
          </tr>
          <tr v-if="!result?.data.length">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">No drones found.</td>
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

    <AppModal v-if="showCreate" title="New Drone" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm whitespace-pre-line">{{ createError }}</div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input
            v-model="form.serialNumber"
            type="text"
            placeholder="SKY-XXXX-XXXX"
            required
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">Format: SKY-XXXX-XXXX (alphanumeric)</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            v-model="form.model"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="m in modelOptions" :key="m" :value="m">{{ m.replace(/_/g, ' ') }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50" @click="showCreate = false">
            Cancel
          </button>
          <button type="submit" :disabled="creating" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
