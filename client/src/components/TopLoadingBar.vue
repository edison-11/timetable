<template>
  <div v-if="isLoading" class="top-loading" aria-hidden="true">
    <span class="track"></span>
    <span class="beam beam-a"></span>
    <span class="beam beam-b"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
const isLoading = computed(() => loadingStore.pendingRequests > 0 || loadingStore.routeLoading || loadingStore.bootLoading)
</script>

<style scoped>
.top-loading {
  position: fixed;
  inset: 0 0 auto;
  width: 100%;
  height: 5px;
  z-index: 2147483001;
  overflow: hidden;
  background: rgba(8, 42, 74, 0.12);
  pointer-events: none;
}

.track,
.beam {
  position: absolute;
  inset: 0;
}

.track {
  background: linear-gradient(90deg, #159bd7, #1fb35d, #159bd7);
  opacity: 0.34;
}

.beam {
  width: 34%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #ffffff, #2bd371, transparent);
  box-shadow: 0 0 18px rgba(43, 211, 113, 0.72);
  animation: loading-beam 1.2s ease-in-out infinite;
}

.beam-b {
  width: 22%;
  background: linear-gradient(90deg, transparent, #ffffff, #34b7ff, transparent);
  animation-duration: 1.8s;
  animation-delay: 0.25s;
  opacity: 0.72;
}

@keyframes loading-beam {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(340%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .beam {
    animation: none;
  }
}
</style>
