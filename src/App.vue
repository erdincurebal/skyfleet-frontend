<script setup lang="ts">
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 overflow-x-auto">
      <div class="max-w-7xl mx-auto px-4 flex items-center gap-4 sm:gap-6 h-14 whitespace-nowrap">
        <span class="font-semibold text-gray-900">SkyOps</span>
        <RouterLink to="/" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</RouterLink>
        <RouterLink to="/drones" class="text-sm text-gray-600 hover:text-gray-900">Drones</RouterLink>
        <RouterLink to="/missions" class="text-sm text-gray-600 hover:text-gray-900">Missions</RouterLink>
        <RouterLink to="/maintenance" class="text-sm text-gray-600 hover:text-gray-900">Maintenance</RouterLink>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>
