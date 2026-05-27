<template>
  <section class="loading-state" aria-live="polite" aria-busy="true">
    <span v-for="index in rows" :key="index" class="skeleton-row"></span>
  </section>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 4 }
})
</script>

<style scoped>
.loading-state {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #ffffff;
}

.skeleton-row {
  height: 48px;
  border-radius: 7px;
  background: linear-gradient(90deg, #edf2f7 25%, #f8fafc 45%, #edf2f7 65%);
  background-size: 220% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

:global(body.admin-dark-mode) .loading-state,
:global(body.teacher-dark-mode) .loading-state {
  background: #111827;
  border-color: #243244;
}

:global(body.admin-dark-mode) .skeleton-row,
:global(body.teacher-dark-mode) .skeleton-row {
  background: linear-gradient(90deg, #172033 25%, #243244 45%, #172033 65%);
  background-size: 220% 100%;
}

@keyframes skeleton {
  to {
    background-position: -220% 0;
  }
}
</style>
