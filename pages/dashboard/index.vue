<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Vue d'ensemble</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Statistiques</h2>
        <p class="text-gray-600">Contenu à venir</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>