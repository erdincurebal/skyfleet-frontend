<script setup lang="ts">
import { ref } from 'vue'
import { useMissions } from '../composables/useMissions'
import { useDrones } from '../composables/useDrones'
import { missionsApi } from '../api'
import StatusBadge from '../components/StatusBadge.vue'
import AppPagination from '../components/AppPagination.vue'
import AppModal from '../components/AppModal.vue'
import { formatDateTime } from '../utils/format'
import { MissionStatus, MissionType } from '../types'
import type { CreateMissionPayload } from '../api'

const { page, limit, status, filterDroneId, from, to, result, loading, error, load } = useMissions()
const { result: dronesResult } = useDrones()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)

const statusOptions = Object.values(MissionStatus)
const typeOptions = Object.values(MissionType)

const emptyForm = (): CreateMissionPayload => ({
  name: '',
  type: MissionType.WIND_TURBINE_INSPECTION,
  droneId: '',
  pilotName: '',
  siteLocation: '',
  plannedStart: '',
  plannedEnd: '',
})
const form = ref<CreateMissionPayload>(emptyForm())

const availableDrones = () => (dronesResult.value?.data ?? []).filter((d) => d.status === 'AVAILABLE')

async function submitCreate() {
  creating.value = true
  createError.value = null
  try {
    await missionsApi.create({
      ...form.value,
      plannedStart: new Date(form.value.plannedStart).toISOString(),
      plannedEnd: new Date(form.value.plannedEnd).toISOString(),
    })
    showCreate.value = false
    form.value = emptyForm()
    await load()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Failed to create mission'
  } finally {
    creating.value = false
  }
}

function droneSerial(droneId: string) {
  return dronesResult.value?.data.find((d) => d.id === droneId)?.serialNumber ?? droneId.slice(0, 8) + '…'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Missions</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        @click="showCreate = true"
      >
        + New Mission
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <select
        :value="status ?? ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { status = ((e.target as HTMLSelectElement).value as MissionStatus) || undefined; page = 1 }"
      >
        <option value="">All Statuses</option>
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s.replace(/_/g, ' ') }}</option>
      </select>
      <select
        :value="filterDroneId ?? ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { filterDroneId = (e.target as HTMLSelectElement).value || undefined; page = 1 }"
      >
        <option value="">All Drones</option>
        <option v-for="d in dronesResult?.data" :key="d.id" :value="d.id">{{ d.serialNumber }}</option>
      </select>
      <input
        type="date"
        :value="from ? from.slice(0, 10) : ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { from = (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).toISOString() : undefined; page = 1 }"
      />
      <input
        type="date"
        :value="to ? to.slice(0, 10) : ''"
        class="border border-gray-300 rounded px-3 py-1.5 text-sm"
        @change="(e) => { to = (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).toISOString() : undefined; page = 1 }"
      />
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ error }}</div>

    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 text-sm">Loading…</div>
      <table v-else class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Name</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Drone</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Start</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">End</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="m in result?.data" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ m.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ m.type.replace(/_/g, ' ') }}</td>
            <td class="px-4 py-3 font-mono text-gray-600 text-xs">{{ m.drone?.serialNumber ?? droneSerial(m.droneId) }}</td>
            <td class="px-4 py-3"><StatusBadge :status="m.status" /></td>
            <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedStart) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedEnd) }}</td>
            <td class="px-4 py-3 text-right">
              <RouterLink :to="`/missions/${m.id}`" class="text-blue-600 hover:underline text-xs">View</RouterLink>
            </td>
          </tr>
          <tr v-if="!result?.data.length">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">No missions found.</td>
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

    <AppModal v-if="showCreate" title="New Mission" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{{ createError }}</div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input data-testid="mission-name" v-model="form.name" type="text" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select data-testid="mission-type" v-model="form.type" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t.replace(/_/g, ' ') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Drone (AVAILABLE only)</label>
          <select data-testid="mission-drone" v-model="form.droneId" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="" disabled>Select drone…</option>
            <option v-for="d in availableDrones()" :key="d.id" :value="d.id">{{ d.serialNumber }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pilot Name</label>
          <input data-testid="mission-pilot" v-model="form.pilotName" type="text" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
          <input data-testid="mission-site" v-model="form.siteLocation" type="text" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Planned Start</label>
            <input data-testid="mission-start" v-model="form.plannedStart" type="datetime-local" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Planned End</label>
            <input data-testid="mission-end" v-model="form.plannedEnd" type="datetime-local" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50" @click="showCreate = false">Cancel</button>
          <button type="submit" :disabled="creating" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
