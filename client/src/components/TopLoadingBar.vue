<template>
  <Teleport to="body">
    <Transition name="top-loading">
      <div v-if="isVisible" class="top-loading-bar" role="progressbar" aria-label="Loading">
        <span class="top-loading-bar__track">
          <span class="top-loading-bar__fill"></span>
        </span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()

const isVisible = computed(() => loadingStore.visible)
</script>

<style scoped>
.top-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100001;
  height: 3px;
  pointer-events: none;
}

.top-loading-bar__track {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(37, 99, 235, 0.12);
}

.top-loading-bar__fill {
  display: block;
  width: 44%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #14b8a6, #22c55e);
  box-shadow: 0 0 18px rgba(20, 184, 166, 0.38);
  animation: top-loading-slide 1.05s ease-in-out infinite;
}

.top-loading-enter-active,
.top-loading-leave-active {
  transition: opacity 0.18s ease;
}

.top-loading-enter-from,
.top-loading-leave-to {
  opacity: 0;
}

@keyframes top-loading-slide {
  0% {
    transform: translateX(-110%);
  }

  50% {
    transform: translateX(90%);
  }

  100% {
    transform: translateX(230%);
  }
}
</style>
