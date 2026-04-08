<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
        <span class="font-semibold text-gray-900">SkyOps</span>
        <RouterLink to="/" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</RouterLink>
        <RouterLink to="/drones" class="text-sm text-gray-600 hover:text-gray-900">Drones</RouterLink>
        <RouterLink to="/missions" class="text-sm text-gray-600 hover:text-gray-900">Missions</RouterLink>
        <RouterLink to="/maintenance" class="text-sm text-gray-600 hover:text-gray-900">Maintenance</RouterLink>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
