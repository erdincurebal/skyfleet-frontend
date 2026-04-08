<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { missionsApi } from '../api'
import StatusBadge from '../components/StatusBadge.vue'
import { formatDateTime } from '../utils/format'
import type { Mission, MissionStatus } from '../types'

const route = useRoute()
const id = route.params.id as string

const mission = ref<Mission | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const transitioning = ref(false)
const transitionError = ref<string | null>(null)

const loggedFlightHours = ref<number>(0)
const abortReason = ref('')
const pendingTarget = ref<MissionStatus | null>(null)

const nextTransitions = computed<MissionStatus[]>(() => {
  const map: Record<string, MissionStatus[]> = {
    PLANNED: ['PRE_FLIGHT_CHECK', 'ABORTED'],
    PRE_FLIGHT_CHECK: ['IN_PROGRESS', 'ABORTED'],
    IN_PROGRESS: ['COMPLETED', 'ABORTED'],
    COMPLETED: [],
    ABORTED: [],
  }
  return mission.value ? (map[mission.value.status] ?? []) : []
})

async function loadMission() {
  loading.value = true
  error.value = null
  try {
    mission.value = await missionsApi.get(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load mission'
  } finally {
    loading.value = false
  }
}

function startTransition(target: MissionStatus) {
  pendingTarget.value = target
  transitionError.value = null
  loggedFlightHours.value = 0
  abortReason.value = ''
}

async function confirmTransition() {
  if (!pendingTarget.value) return
  transitioning.value = true
  transitionError.value = null
  try {
    const payload: { targetStatus: MissionStatus; loggedFlightHours?: number; abortReason?: string } = {
      targetStatus: pendingTarget.value,
    }
    if (pendingTarget.value === 'COMPLETED') payload.loggedFlightHours = loggedFlightHours.value
    if (pendingTarget.value === 'ABORTED') payload.abortReason = abortReason.value
    mission.value = await missionsApi.transition(id, payload)
    pendingTarget.value = null
  } catch (e) {
    transitionError.value = e instanceof Error ? e.message : 'Transition failed'
  } finally {
    transitioning.value = false
  }
}

onMounted(loadMission)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/missions" class="text-sm text-blue-600 hover:underline">← Missions</RouterLink>
      <h1 class="text-2xl font-bold text-gray-900">Mission Detail</h1>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">{{ error }}</div>
    <div v-if="loading" class="text-sm text-gray-500">Loading…</div>

    <template v-else-if="mission">
      <!-- Info Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ mission.name }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ mission.type.replace(/_/g, ' ') }}</p>
          </div>
          <StatusBadge :status="mission.status" />
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Pilot</p>
            <p class="font-medium text-gray-900 mt-1">{{ mission.pilotName }}</p>
          </div>
          <div>
            <p class="text-gray-500">Site</p>
            <p class="font-medium text-gray-900 mt-1">{{ mission.siteLocation }}</p>
          </div>
          <div>
            <p class="text-gray-500">Planned Start</p>
            <p class="font-medium text-gray-900 mt-1">{{ formatDateTime(mission.plannedStart) }}</p>
          </div>
          <div>
            <p class="text-gray-500">Planned End</p>
            <p class="font-medium text-gray-900 mt-1">{{ formatDateTime(mission.plannedEnd) }}</p>
          </div>
          <div v-if="mission.loggedFlightHours != null">
            <p class="text-gray-500">Logged Flight Hours</p>
            <p class="font-medium text-gray-900 mt-1">{{ mission.loggedFlightHours }} h</p>
          </div>
          <div v-if="mission.abortReason">
            <p class="text-gray-500">Abort Reason</p>
            <p class="font-medium text-red-700 mt-1">{{ mission.abortReason }}</p>
          </div>
        </div>
        <div v-if="mission.drone">
          <p class="text-gray-500 text-sm">Drone</p>
          <div class="flex items-center gap-2 mt-1">
            <RouterLink :to="`/drones/${mission.droneId}`" class="font-mono text-blue-600 hover:underline text-sm">
              {{ mission.drone.serialNumber }}
            </RouterLink>
            <StatusBadge :status="mission.drone.status" />
          </div>
        </div>
      </div>

      <!-- State Transitions -->
      <div v-if="nextTransitions.length" class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">State Transition</h3>
        <div v-if="transitionError" class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-3 whitespace-pre-line">{{ transitionError }}</div>

        <div v-if="!pendingTarget" class="flex gap-2 flex-wrap">
          <button
            v-for="target in nextTransitions"
            :key="target"
            :data-testid="`transition-${target}`"
            class="px-4 py-2 text-sm rounded border font-medium"
            :class="target === 'ABORTED' ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-blue-300 text-blue-700 hover:bg-blue-50'"
            @click="startTransition(target)"
          >
            → {{ target.replace(/_/g, ' ') }}
          </button>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm text-gray-700">
            Transition to <strong>{{ pendingTarget.replace(/_/g, ' ') }}</strong>
          </p>
          <div v-if="pendingTarget === 'COMPLETED'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Logged Flight Hours</label>
            <input
              data-testid="flight-hours-input"
              v-model.number="loggedFlightHours"
              type="number"
              step="0.1"
              min="0"
              required
              class="border border-gray-300 rounded px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div v-if="pendingTarget === 'ABORTED'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Abort Reason</label>
            <input
              v-model="abortReason"
              type="text"
              required
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              @click="pendingTarget = null"
            >
              Cancel
            </button>
            <button
              data-testid="confirm-transition"
              :disabled="transitioning"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              @click="confirmTransition"
            >
              {{ transitioning ? 'Processing…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
