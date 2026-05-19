<template>
  <Transition name="preloader-fade">
    <div v-if="loading" class="preloader-container" role="status" aria-live="polite" aria-label="Loading page">
      <div class="animation-wrapper" aria-hidden="true">
        <span class="dot dot-blue"></span>
        <span class="dot dot-pink"></span>
        <span class="dot dot-amber"></span>
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
  background:
    radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.5), transparent 28%),
    linear-gradient(135deg, #dbeafe 0%, #eff6ff 45%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.animation-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: 148px;
  min-height: 72px;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  transform: scale(0);
  animation: bloom 1.35s infinite ease-in-out;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
}

.dot-blue {
  background: #2563eb;
  animation-delay: 0s;
}

.dot-pink {
  background: #ec4899;
  animation-delay: 0.18s;
}

.dot-amber {
  background: #f59e0b;
  animation-delay: 0.36s;
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

@keyframes bloom {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0);
  }

  48% {
    opacity: 1;
    transform: scale(2.45);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    opacity: 1;
    transform: scale(1);
  }

  .preloader-fade-enter-active,
  .preloader-fade-leave-active {
    transition: opacity 0.18s ease;
  }
}
</style>
