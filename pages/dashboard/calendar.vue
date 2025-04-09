<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Calendrier</h1>
    <p class="text-gray-600">Calendrier à venir</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>