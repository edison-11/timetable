<template>
  <section class="period-timer time-only">
    <div class="timer-panel">
      <div class="timer-top">
        <span class="timer-status">CURRENT TIME</span>
        <span class="timer-code">GENBN401</span>
      </div>

      <div class="timer-display" :aria-label="`${timerValue} ${timerHint}`">
        <span class="timer-digits">{{ timerParts.main }}</span>
        <span class="timer-seconds">:{{ timerParts.seconds }}</span>
      </div>

      <div class="timer-caption">{{ timerHint }}</div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const now = ref(new Date())
let clockTimer = null

const formatClock = (date) => {
  if (!date) return ''
  return [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ].map((value) => String(value).padStart(2, '0')).join(':')
}

const timerValue = computed(() => formatClock(now.value))

const timerParts = computed(() => {
  const parts = timerValue.value.split(':')
  return {
    main: `${parts[0] || '00'}:${parts[1] || '00'}`,
    seconds: parts[2] || '00'
  }
})

const timerHint = computed(() => 'CURRENT TIME')

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<style scoped>
.period-timer {
  width: min(100%, 340px);
  margin: 0.55rem auto 0;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.period-timer.active,
.period-timer.idle {
  border: none;
}

.watch-lug {
  position: absolute;
  left: 50%;
  top: -10px;
  width: 68px;
  height: 16px;
  border-radius: 16px 16px 6px 6px;
  background: linear-gradient(180deg, #2563eb, #0f2f7f);
  transform: translateX(-50%);
  z-index: -1;
}

.watch-button {
  position: absolute;
  top: 16px;
  width: 42px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  background: linear-gradient(145deg, #2563eb 0%, #08205f 100%);
  border: 1px solid #1e3a8a;
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 1px #000;
  z-index: -1;
}

.lap-button {
  left: -10px;
  border-radius: 18px 8px 12px 20px;
  transform: rotate(-35deg);
}

.start-button {
  right: -10px;
  border-radius: 8px 18px 20px 12px;
  transform: rotate(35deg);
}

.watch-face {
  padding: clamp(0.26rem, 1.9cqw, 0.45rem);
  background:
    radial-gradient(circle at 50% 16%, rgba(147, 197, 253, 0.26), transparent 22%),
    linear-gradient(150deg, #1e40af 0%, #06133c 100%);
  border: 2px solid #0b1b52;
  border-radius: 20px 20px 28px 28px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 16px rgba(0, 0, 0, 0.78);
}

.watch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 clamp(0.18rem, 1.8cqw, 0.46rem) 0.28rem;
  color: #e0f2fe;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.watch-mode {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
}

.battery-icon {
  position: relative;
  width: 25px;
  height: 12px;
  border: 2px solid currentColor;
  border-radius: 2px;
  box-shadow: inset -4px 0 0 rgba(219, 228, 207, 0.22);
}

.battery-icon::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 3px;
  width: 3px;
  height: 4px;
  background: currentColor;
  border-radius: 0 2px 2px 0;
}

.battery-icon span {
  display: block;
  width: 62%;
  height: 100%;
  background: currentColor;
  opacity: 0.72;
}

.watch-screen {
  overflow: hidden;
  padding: clamp(0.38rem, 2.1cqw, 0.54rem) clamp(0.34rem, 2.2cqw, 0.52rem) clamp(0.36rem, 2cqw, 0.5rem);
  background:
    linear-gradient(180deg, rgba(219, 234, 254, 0.34), transparent 24%),
    #dbeafe;
  border: 2px solid #082f49;
  border-radius: 14px 14px 22px 22px;
  box-shadow:
    inset 0 2px 8px rgba(255, 255, 255, 0.38),
    inset 0 -4px 10px rgba(15, 23, 42, 0.16);
}

.timer-panel {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  padding: 1rem 1rem 0.9rem;
  background: #dbe8cd;
  border: 2px solid #2c3b1e;
  border-radius: 24px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), 0 8px 20px rgba(18, 40, 16, 0.22);
}

.timer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  color: #1f2a16;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.timer-status {
  color: #12210f;
}

.timer-code {
  color: #2f4e1f;
  background: rgba(34, 52, 21, 0.12);
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.timer-display {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 0.4rem 0.3rem;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.55), transparent 32%), #f8fbeb;
  border: 2px solid #4a5e2c;
  border-radius: 18px;
  box-shadow: inset 0 2px 8px rgba(255,255,255,0.8);
}

.timer-digits {
  font-size: clamp(2.4rem, 12vw, 4.1rem);
  font-weight: 900;
  color: #1a210d;
  font-family: 'Digital-7', 'Arial Narrow', 'Roboto Condensed', sans-serif;
  letter-spacing: 0.02em;
}

.timer-seconds {
  font-size: clamp(1.1rem, 5.5vw, 1.65rem);
  font-weight: 900;
  color: #1f2a11;
  align-self: flex-start;
  padding-top: 0.45rem;
}

.timer-caption {
  margin-top: 0.7rem;
  text-align: center;
  color: #2d3b19;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}


.progress-track {
  height: 4px;
  margin: 0.32rem 0 0.24rem;
  overflow: hidden;
  background: rgba(30, 64, 175, 0.13);
  border: 1px solid rgba(30, 64, 175, 0.28);
}

.progress-track span {
  display: block;
  height: 100%;
  background: #2563eb;
  transition: width 0.3s ease;
}

.watch-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(30, 64, 175, 0.34);
  border-left: 1px solid rgba(30, 64, 175, 0.34);
}

.watch-metrics > div,
.vibration-toggle {
  min-width: 0;
  min-height: clamp(38px, 15cqw, 46px);
  padding: 0.26rem 0.18rem;
  border: 0;
  border-right: 1px solid rgba(30, 64, 175, 0.34);
  border-bottom: 1px solid rgba(30, 64, 175, 0.34);
  background: transparent;
  text-align: center;
}

.watch-metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.22rem;
  color: #111827;
  font-size: clamp(0.68rem, 4.1cqw, 0.86rem);
  font-weight: 950;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vibration-toggle {
  display: grid;
  place-items: center;
  gap: 0.08rem;
  cursor: pointer;
  color: #111827;
  font: inherit;
}

.vibration-toggle i {
  font-size: clamp(0.8rem, 4cqw, 1rem);
}

.vibration-toggle span {
  color: #111827;
  font-size: clamp(0.68rem, 4.1cqw, 0.86rem);
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
}

.vibration-toggle.enabled {
  background: rgba(37, 99, 235, 0.16);
}

.mode-button {
  width: 94px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.42rem auto 0;
  color: #f8fafc;
  background: linear-gradient(180deg, #3b82f6 0%, #123a8c 100%);
  border: 2px solid #0b1b52;
  border-radius: 12px 12px 16px 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 2px 2px rgba(0, 0, 0, 0.45);
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 1px #000;
}

@media (max-width: 900px) {
  .period-timer {
    margin: 1rem auto 0;
  }

  .watch-button {
    display: none;
  }
}

@container (max-width: 245px) {
  .watch-button,
  .watch-lug {
    display: none;
  }

  .watch-header {
    font-size: 0.66rem;
  }

  .lesson-strip {
    gap: 0.35rem;
  }

  .lesson-strip span,
  .timer-caption,
  .watch-metrics span {
    font-size: 0.54rem;
  }

  .lcd-digits {
    font-size: 2.2rem;
  }

  .lcd-seconds {
    font-size: 1.18rem;
  }

  .watch-metrics strong {
    font-size: 0.76rem;
  }

  .mode-button {
    width: 86px;
    height: 30px;
    margin-top: 0.5rem;
    font-size: 0.76rem;
  }
}
</style>
