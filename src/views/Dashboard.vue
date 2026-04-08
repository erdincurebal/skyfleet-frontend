<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fleetHealthApi } from '../api'
import { missionsApi } from '../api'
import StatusBadge from '../components/StatusBadge.vue'
import { formatDateTime, formatDate, formatHours } from '../utils/format'
import type { FleetHealthResponse, Mission, DroneStatus } from '../types'

const health = ref<FleetHealthResponse | null>(null)
const healthLoading = ref(true)
const healthError = ref<string | null>(null)

const upcomingMissions = ref<Mission[]>([])
const recentMissions = ref<Mission[]>([])
const missionsLoading = ref(true)

const statusOrder: DroneStatus[] = ['AVAILABLE', 'IN_MISSION', 'MAINTENANCE', 'RETIRED']

onMounted(async () => {
  try {
    health.value = await fleetHealthApi.get()
  } catch (e) {
    healthError.value = e instanceof Error ? e.message : 'Failed to load fleet health'
  } finally {
    healthLoading.value = false
  }

  try {
    const [planned, completed] = await Promise.all([
      missionsApi.list({ status: 'PLANNED', limit: 5 }),
      missionsApi.list({ status: 'COMPLETED', limit: 5 }),
    ])
    upcomingMissions.value = planned.data
    recentMissions.value = completed.data
  } catch {
    // missions are non-critical for the dashboard
  } finally {
    missionsLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

    <div v-if="healthError" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ healthError }}</div>

    <!-- Fleet Overview -->
    <section>
      <h2 class="text-lg font-semibold text-gray-700 mb-3">Fleet Overview</h2>
      <div v-if="healthLoading" class="text-sm text-gray-500">Loading…</div>
      <div v-else-if="health" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="s in statusOrder"
          :key="s"
          class="bg-white rounded-lg border border-gray-200 p-4 text-center"
        >
          <p class="text-3xl font-bold text-gray-900">{{ health.totals.byStatus[s] ?? 0 }}</p>
          <StatusBadge :status="s" class="mt-1" />
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p class="text-3xl font-bold text-gray-900">{{ health.missionsNext24h }}</p>
          <p class="text-xs text-gray-500 mt-1">Missions next 24h</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p class="text-3xl font-bold text-gray-900">{{ Number(health.averageFlightHoursPerDrone).toFixed(1) }}</p>
          <p class="text-xs text-gray-500 mt-1">Avg hrs/drone</p>
        </div>
      </div>
    </section>

    <!-- Maintenance Alerts -->
    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-700">Maintenance Alerts</h2>
      <div v-if="healthLoading" class="text-sm text-gray-500">Loading…</div>

      <template v-else>
        <!-- Overdue -->
        <div>
          <h3 class="text-sm font-medium text-red-700 mb-2">Overdue</h3>
          <div v-if="!health?.overdueMaintenanceDrones.length" class="text-sm text-gray-500">All clear.</div>
          <div v-else class="bg-white rounded-lg border border-red-200 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-red-50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Serial</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Model</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Next Due</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Flight Hrs</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="drone in health.overdueMaintenanceDrones" :key="drone.id" class="bg-red-50">
                  <td class="px-4 py-3">
                    <RouterLink :to="`/drones/${drone.id}`" class="font-mono text-red-700 hover:underline font-medium">
                      {{ drone.serialNumber }}
                    </RouterLink>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ drone.model.replace(/_/g, ' ') }}</td>
                  <td class="px-4 py-3"><StatusBadge :status="drone.status" /></td>
                  <td class="px-4 py-3 font-medium text-red-700">{{ formatDate(drone.nextMaintenanceDueDate) }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ formatHours(drone.totalFlightHours) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Due within 7 days -->
        <div>
          <h3 class="text-sm font-medium text-amber-700 mb-2">Due within 7 days</h3>
          <div v-if="!health?.dueSoonDrones?.length" class="text-sm text-gray-500">All clear.</div>
          <div v-else class="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-amber-50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Serial</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Model</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Time Remaining</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-600">Next Due Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="drone in health.dueSoonDrones" :key="drone.id" class="bg-amber-50">
                  <td class="px-4 py-3">
                    <RouterLink :to="`/drones/${drone.id}`" class="font-mono text-amber-700 hover:underline font-medium">
                      {{ drone.serialNumber }}
                    </RouterLink>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ drone.model.replace(/_/g, ' ') }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      {{ drone.reason }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-amber-700 font-medium">
                    <span v-if="drone.daysUntilDue != null">{{ drone.daysUntilDue }}d</span>
                    <span v-if="drone.daysUntilDue != null && drone.hoursUntilDue != null"> / </span>
                    <span v-if="drone.hoursUntilDue != null">{{ Number(drone.hoursUntilDue).toFixed(1) }}h left</span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ formatDate(drone.nextMaintenanceDueDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </section>

    <!-- Upcoming Missions -->
    <section>
      <h2 class="text-lg font-semibold text-gray-700 mb-3">Upcoming Missions</h2>
      <div v-if="missionsLoading" class="text-sm text-gray-500">Loading…</div>
      <div v-else-if="!upcomingMissions.length" class="text-sm text-gray-500">No planned missions.</div>
      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Start</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="m in upcomingMissions" :key="m.id">
              <td class="px-4 py-3">
                <RouterLink :to="`/missions/${m.id}`" class="text-blue-600 hover:underline">{{ m.name }}</RouterLink>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ m.type.replace(/_/g, ' ') }}</td>
              <td class="px-4 py-3"><StatusBadge :status="m.status" /></td>
              <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedStart) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Recent Completed Missions -->
    <section>
      <h2 class="text-lg font-semibold text-gray-700 mb-3">Recent Missions</h2>
      <div v-if="missionsLoading" class="text-sm text-gray-500">Loading…</div>
      <div v-else-if="!recentMissions.length" class="text-sm text-gray-500">No completed missions.</div>
      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">End</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="m in recentMissions" :key="m.id">
              <td class="px-4 py-3">
                <RouterLink :to="`/missions/${m.id}`" class="text-blue-600 hover:underline">{{ m.name }}</RouterLink>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ m.type.replace(/_/g, ' ') }}</td>
              <td class="px-4 py-3"><StatusBadge :status="m.status" /></td>
              <td class="px-4 py-3 text-gray-600">{{ formatDateTime(m.plannedEnd) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
