<template>
  <Transition name="preloader-fade">
    <div v-if="loading" class="preloader-container" role="status" aria-live="polite" aria-label="Loading system">
      <div class="loader-background" aria-hidden="true">
        <span class="grid-line line-a"></span>
        <span class="grid-line line-b"></span>
        <span class="grid-line line-c"></span>
      </div>

      <div class="brand-loader">
        <div class="brand-mark-wrap">
          <span class="orbit orbit-a"></span>
          <span class="orbit orbit-b"></span>
          <img class="brand-logo" :src="logoUrl" alt="Timetable logo" />
        </div>

        <div class="loader-copy">
          <strong>WELCOME TO YOUR DASHBOARD</strong>
          <span class="loader-detail">Preparing dashboard data</span>
        </div>

        <div class="counter-row">
          <span class="counter-value">{{ progress }}%</span>
        </div>

        <div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
          <span class="progress-fill" :style="{ width: `${progress}%` }"></span>
        </div>

        <div class="module-dots" aria-hidden="true">
          <span v-for="index in 5" :key="index" :style="{ '--dot-index': index }"></span>
        </div>
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

const progress = ref(0)
let timer = null

const stopCounter = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startCounter = () => {
  stopCounter()
  progress.value = 0

  timer = setInterval(() => {
    if (progress.value < 72) {
      progress.value += 4
    } else if (progress.value < 90) {
      progress.value += 2
    } else if (progress.value < 96) {
      progress.value += 1
    }
  }, 95)
}

watch(() => props.loading, (isLoading) => {
  if (isLoading) {
    startCounter()
    return
  }

  progress.value = 100
  setTimeout(() => {
    stopCounter()
    progress.value = 0
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
  background:
    radial-gradient(circle at 18% 18%, rgba(41, 171, 226, 0.28), transparent 32%),
    radial-gradient(circle at 82% 22%, rgba(40, 184, 96, 0.22), transparent 30%),
    linear-gradient(135deg, #082a4a 0%, #0e5a8a 46%, #0ea35d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483000;
  isolation: isolate;
}

.loader-background {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
}

.grid-line {
  position: absolute;
  left: -20%;
  width: 140%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
  transform: rotate(-12deg);
  animation: scan-line 3.4s ease-in-out infinite;
}

.line-a {
  top: 24%;
}

.line-b {
  top: 52%;
  animation-delay: 0.8s;
  opacity: 0.72;
}

.line-c {
  top: 78%;
  animation-delay: 1.6s;
  opacity: 0.52;
}

.brand-loader {
  width: min(430px, calc(100vw - 2rem));
  min-height: 360px;
  padding: 38px 34px 32px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 30px 90px rgba(4, 22, 41, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #0f2c46;
  text-align: center;
}

.brand-mark-wrap {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  margin-bottom: 28px;
}

.brand-logo {
  position: relative;
  z-index: 2;
  width: 92px;
  height: 92px;
  object-fit: contain;
  padding: 8px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 36px rgba(8, 42, 74, 0.18);
}

.orbit {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
}

.orbit-a {
  border-top-color: #18a2df;
  border-right-color: rgba(24, 162, 223, 0.28);
  animation: loader-spin 1.18s linear infinite;
}

.orbit-b {
  inset: 14px;
  border-bottom-color: #21b15f;
  border-left-color: rgba(33, 177, 95, 0.28);
  animation: loader-spin 1.55s linear infinite reverse;
}

.loader-copy {
  display: grid;
  gap: 6px;
}

.loader-detail {
  color: #15824b;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0;
}

.loader-copy strong {
  color: #0f2c46;
  font-size: clamp(1.25rem, 4vw, 1.65rem);
  font-weight: 900;
  letter-spacing: 0;
}

.counter-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-top: 22px;
}

.counter-value {
  min-width: 72px;
  color: #0d7ec0;
  font-size: 2rem;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.progress-track {
  position: relative;
  width: min(300px, 100%);
  height: 8px;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #d9e8ee;
}

.progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #139bd7, #1fb35d);
  box-shadow: 0 0 22px rgba(31, 179, 93, 0.45);
  transition: width 0.18s ease;
}

.module-dots {
  display: flex;
  justify-content: center;
  gap: 9px;
  margin-top: 24px;
}

.module-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #139bd7;
  animation: dot-pulse 1s ease-in-out infinite;
  animation-delay: calc(var(--dot-index) * 0.11s);
}

.module-dots span:nth-child(even) {
  background: #1fb35d;
}

.preloader-fade-enter-active,
.preloader-fade-leave-active {
  transition: opacity 0.28s ease;
}

.preloader-fade-enter-from,
.preloader-fade-leave-to {
  opacity: 0;
}

@keyframes scan-line {
  0%,
  100% {
    transform: translateX(-10%) rotate(-12deg);
    opacity: 0.16;
  }
  50% {
    transform: translateX(10%) rotate(-12deg);
    opacity: 0.58;
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    transform: translateY(0) scale(0.78);
    opacity: 0.48;
  }
  50% {
    transform: translateY(-6px) scale(1);
    opacity: 1;
  }
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit,
  .module-dots span,
  .grid-line {
    animation: none;
  }

  .preloader-fade-enter-active,
  .preloader-fade-leave-active {
    transition: opacity 0.18s ease;
  }
}

@media (max-width: 640px) {
  .brand-loader {
    min-height: 330px;
    padding: 32px 22px 28px;
  }

  .brand-mark-wrap {
    width: 116px;
    height: 116px;
  }

  .brand-logo {
    width: 82px;
    height: 82px;
  }
}
</style>
