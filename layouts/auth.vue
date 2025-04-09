<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Prospeo
        </h1>
        <p class="mt-2 text-gray-600">Votre assistant immobilier intelligent</p>
      </div>

      <slot />
    </div>
  </div>
</template>