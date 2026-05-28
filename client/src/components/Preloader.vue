<template>
  <Transition name="preloader-fade">
    <div v-if="loading" class="preloader-container" role="status" aria-live="polite" aria-label="Loading page">
      <div class="skeleton-shell" aria-hidden="true">
        <span class="skeleton-line title"></span>
        <span class="skeleton-line"></span>
        <div class="skeleton-grid">
          <span v-for="index in 6" :key="index" class="skeleton-card"></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    required: true
  }
})
</script>

<style scoped>
.preloader-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(245, 249, 255, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.skeleton-shell {
  width: min(760px, calc(100vw - 2rem));
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
}

.skeleton-line,
.skeleton-card {
  display: block;
  border-radius: 7px;
  background: linear-gradient(90deg, #e8eef6 25%, #f8fafc 45%, #e8eef6 65%);
  background-size: 220% 100%;
  animation: skeleton 1.35s ease-in-out infinite;
}

.skeleton-line {
  width: 52%;
  height: 18px;
}

.skeleton-line.title {
  width: 34%;
  height: 28px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.skeleton-card {
  height: 84px;
}

.preloader-fade-enter-active,
.preloader-fade-leave-active {
  transition: opacity 0.42s ease, transform 0.42s ease;
}

.preloader-fade-enter-from,
.preloader-fade-leave-to {
  opacity: 0;
  transform: scale(1.01);
}

@keyframes skeleton {
  to {
    background-position: -220% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-card {
    animation: none;
  }

  .preloader-fade-enter-active,
  .preloader-fade-leave-active {
    transition: opacity 0.18s ease;
  }
}

@media (max-width: 640px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
