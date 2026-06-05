<template>
  <Transition name="preloader-fade">
    <div v-if="loading" class="preloader-container" role="status" aria-live="polite" aria-label="Loading timetable">
      <div class="brand-loader">
        <div class="logo-stack">
          <img class="brand-logo" :src="logoUrl" alt="Timetable logo" />
          <span class="loader-ring" aria-hidden="true"></span>
        </div>

        <div class="loader-copy">
          <strong>Timetable</strong>
          <span class="loader-detail">{{ loadingStep }}</span>
        </div>
      </div>

      <div class="loader-footer" aria-hidden="true">
        <span>from</span>
        <strong>School Management System</strong>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`
const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  }
})

const loadingStep = ref('Loading')
let timer = null
let stepIndex = 0
const steps = ['Loading', 'Checking your session', 'Opening your workspace']

const stopCounter = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startCounter = () => {
  stopCounter()
  stepIndex = 0
  loadingStep.value = steps[stepIndex]

  timer = setInterval(() => {
    stepIndex = (stepIndex + 1) % steps.length
    loadingStep.value = steps[stepIndex]
  }, 820)
}

watch(() => props.loading, (isLoading) => {
  if (isLoading) {
    startCounter()
    return
  }

  setTimeout(() => {
    stopCounter()
    loadingStep.value = steps[0]
  }, 260)
}, { immediate: true })

onBeforeUnmount(() => {
  stopCounter()
})
</script>

<style scoped>
.preloader-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483000;
  isolation: isolate;
}

.brand-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #1c1e21;
  text-align: center;
}

.logo-stack {
  position: relative;
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
}

.brand-logo {
  position: relative;
  z-index: 2;
  width: 76px;
  height: 76px;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(24, 119, 242, 0.18));
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid #d8dadf;
  border-top-color: #1877f2;
  border-radius: 50%;
  animation: loader-spin 0.95s linear infinite;
}

.loader-copy {
  display: grid;
  gap: 8px;
}

.loader-detail {
  min-width: 180px;
  color: #65676b;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0;
}

.loader-copy strong {
  color: #1877f2;
  font-size: clamp(1.55rem, 6vw, 2rem);
  font-weight: 800;
  letter-spacing: 0;
}

.loader-footer {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 34px;
  display: grid;
  gap: 4px;
  color: #8a8d91;
  font-size: 0.78rem;
  text-align: center;
}

.loader-footer strong {
  color: #1877f2;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

:global(body.admin-dark-mode) .preloader-container,
:global(body.teacher-dark-mode) .preloader-container,
:global(.teacher-shell.dark-mode) .preloader-container {
  background: #18191a;
}

:global(body.admin-dark-mode) .loader-copy strong,
:global(body.teacher-dark-mode) .loader-copy strong,
:global(.teacher-shell.dark-mode) .loader-copy strong {
  color: #ffffff;
}

:global(body.admin-dark-mode) .loader-detail,
:global(body.teacher-dark-mode) .loader-detail,
:global(.teacher-shell.dark-mode) .loader-detail {
  color: #b0b3b8;
}

:global(body.admin-dark-mode) .loader-ring,
:global(body.teacher-dark-mode) .loader-ring,
:global(.teacher-shell.dark-mode) .loader-ring {
  border-color: #3a3b3c;
  border-top-color: #2d88ff;
}

:global(body.admin-dark-mode) .loader-footer,
:global(body.teacher-dark-mode) .loader-footer,
:global(.teacher-shell.dark-mode) .loader-footer {
  color: #8a8d91;
}

.preloader-fade-enter-active,
.preloader-fade-leave-active {
  transition: opacity 0.28s ease;
}

.preloader-fade-enter-from,
.preloader-fade-leave-to {
  opacity: 0;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-ring {
    animation: none;
  }

  .preloader-fade-enter-active,
  .preloader-fade-leave-active {
    transition: opacity 0.18s ease;
  }
}

@media (max-width: 640px) {
  .logo-stack {
    width: 94px;
    height: 94px;
  }

  .brand-logo {
    width: 68px;
    height: 68px;
  }

  .loader-footer {
    bottom: 24px;
  }
}
</style>
