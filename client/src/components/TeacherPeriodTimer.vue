<template>
  <section class="period-timer" :class="{ active: currentLesson, idle: !currentLesson }">
    <div class="watch-lug top-lug" aria-hidden="true"></div>
    <div class="watch-button lap-button" aria-hidden="true">LAP</div>
    <div class="watch-button start-button" aria-hidden="true">START</div>

    <div class="watch-face">
      <div class="watch-header">
        <span class="watch-mode">
          <i class="bi bi-stopwatch" aria-hidden="true"></i>
          {{ watchMode }}
        </span>
        <span class="battery-icon" aria-hidden="true"><span></span></span>
      </div>

      <div class="watch-screen">
        <div class="lesson-strip">
          <span>{{ statusLabel }}</span>
          <strong>{{ lessonTitle }}</strong>
        </div>

        <div class="lcd-time" :aria-label="`${timerValue} ${timerHint}`">
          <span class="lcd-digits">{{ timerParts.main }}</span>
          <span class="lcd-seconds">{{ timerParts.seconds }}</span>
        </div>

        <div class="timer-caption">{{ timerHint }}</div>

        <div class="progress-track" aria-hidden="true">
          <span :style="{ width: `${lessonProgress}%` }"></span>
        </div>

        <div class="watch-metrics">
          <div>
            <span>Elapsed time</span>
            <strong>{{ elapsedDuration }}</strong>
          </div>
          <div>
            <span>Class</span>
            <strong>{{ classLabel }}</strong>
          </div>
          <div>
            <span>Room</span>
            <strong>{{ roomLabel }}</strong>
          </div>
          <div>
            <span>Start</span>
            <strong>{{ startLabel }}</strong>
          </div>
          <div>
            <span>End</span>
            <strong>{{ endLabel }}</strong>
          </div>
          <button
            class="vibration-toggle"
            type="button"
            :class="{ enabled: vibrationEnabled }"
            :title="vibrationTitle"
            @click="toggleVibration"
          >
            <i :class="vibrationEnabled ? 'bi bi-phone-vibrate' : 'bi bi-phone'"></i>
            <span>{{ alertLabel }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mode-button" aria-hidden="true">MODE</div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const timetableEntries = ref([])
const now = ref(new Date())
const vibrationEnabled = ref(localStorage.getItem('teacherPeriodVibration') === 'true')
let clockTimer = null
let audioContext = null
let lastCheckedTime = Date.now()

const schoolDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const currentTeacherId = computed(() => authStore.currentUser?.teacher_id || authStore.currentUser?.id || null)

const normalizeTime = (time) => String(time || '').slice(0, 5)

const isBreakEntry = (entry) => {
  return entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')
}

const toMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const minutesToTodayDate = (minutes) => {
  const date = new Date(now.value)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

const formatClock = (date) => {
  if (!date) return ''
  return [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ].map((value) => String(value).padStart(2, '0')).join(':')
}

const todayName = computed(() => {
  const day = now.value.getDay()
  return schoolDays[day - 1] || ''
})

const todayLessons = computed(() => {
  return timetableEntries.value
    .filter((entry) => {
      const isOwnLesson = String(entry.teacher_id || '') === String(currentTeacherId.value || '')
      return isOwnLesson && !isBreakEntry(entry) && entry.day_of_week === todayName.value
    })
    .map((entry) => {
      const startMinutes = toMinutes(entry.start_time)
      const endMinutes = toMinutes(entry.end_time)
      return {
        ...entry,
        startMinutes,
        endMinutes,
        startDate: startMinutes === null ? null : minutesToTodayDate(startMinutes),
        endDate: endMinutes === null ? null : minutesToTodayDate(endMinutes)
      }
    })
    .filter((entry) => entry.startDate && entry.endDate && entry.endDate > entry.startDate)
    .sort((a, b) => a.startDate - b.startDate)
})

const currentLesson = computed(() => {
  const currentTime = now.value.getTime()
  return todayLessons.value.find((lesson) => {
    return lesson.startDate.getTime() <= currentTime && lesson.endDate.getTime() > currentTime
  }) || null
})

const nextLesson = computed(() => {
  const currentTime = now.value.getTime()
  return todayLessons.value.find((lesson) => lesson.startDate.getTime() > currentTime) || null
})

const displayLesson = computed(() => currentLesson.value || nextLesson.value)

const statusLabel = computed(() => {
  if (currentLesson.value) return 'Current study period'
  if (nextLesson.value) return 'Next study period'
  return todayLessons.value.length ? 'Study periods finished' : 'No study periods today'
})

const lessonTitle = computed(() => {
  const lesson = displayLesson.value
  if (!lesson) return todayLessons.value.length ? 'All lessons complete' : 'Free day'
  return lesson.module_name || 'Lesson'
})

const lessonMeta = computed(() => {
  const lesson = displayLesson.value
  if (!lesson) return 'Your device will alert when a scheduled period starts or ends.'
  const room = lesson.room_name || lesson.room || 'TBA'
  return `${lesson.class_name || 'General'} - ${room} - ${normalizeTime(lesson.start_time)} - ${normalizeTime(lesson.end_time)}`
})

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const timerValue = computed(() => {
  if (currentLesson.value) return formatDuration(currentLesson.value.endDate.getTime() - now.value.getTime())
  if (nextLesson.value) return formatDuration(nextLesson.value.startDate.getTime() - now.value.getTime())
  return formatClock(now.value)
})

const timerParts = computed(() => {
  const parts = timerValue.value.split(':')
  if (parts.length >= 3) {
    return {
      main: `${parts[0]}:${parts[1]}`,
      seconds: parts[2]
    }
  }

  return {
    main: parts[0] || '00',
    seconds: parts[1] || '00'
  }
})

const timerHint = computed(() => {
  if (currentLesson.value) return 'remaining'
  if (nextLesson.value) return 'until start'
  return 'current time'
})

const watchMode = computed(() => {
  if (currentLesson.value) return 'TEACH'
  if (nextLesson.value) return 'READY'
  return 'CLOCK'
})

const lessonProgress = computed(() => {
  const lesson = currentLesson.value
  if (!lesson) return nextLesson.value ? 0 : 100
  const total = lesson.endDate.getTime() - lesson.startDate.getTime()
  const elapsed = now.value.getTime() - lesson.startDate.getTime()
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
})

const elapsedDuration = computed(() => {
  const lesson = currentLesson.value
  if (!lesson) return '00:00'
  return formatDuration(now.value.getTime() - lesson.startDate.getTime())
})

const classLabel = computed(() => displayLesson.value?.class_name || 'General')
const roomLabel = computed(() => displayLesson.value?.room_name || displayLesson.value?.room || 'TBA')
const startLabel = computed(() => displayLesson.value ? normalizeTime(displayLesson.value.start_time) : '--:--')
const endLabel = computed(() => displayLesson.value ? normalizeTime(displayLesson.value.end_time) : '--:--')
const alertLabel = computed(() => vibrationEnabled.value ? 'On' : 'Off')

const vibrationTitle = computed(() => {
  if (!('vibrate' in navigator)) return 'This PC will use sound alerts because vibration is not supported'
  return vibrationEnabled.value ? 'Disable period alerts' : 'Enable period alerts'
})

const vibrateDevice = (pattern) => {
  if (!vibrationEnabled.value || !('vibrate' in navigator)) return
  navigator.vibrate(pattern)
}

const getAudioContext = () => {
  const AudioCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioCtor) return null
  if (!audioContext) audioContext = new AudioCtor()
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

const playAlertTone = (type) => {
  if (!vibrationEnabled.value) return
  const context = getAudioContext()
  if (!context) return

  const tonePlan = type === 'end'
    ? [{ delay: 0, frequency: 880 }, { delay: 0.22, frequency: 740 }, { delay: 0.44, frequency: 880 }]
    : [{ delay: 0, frequency: 660 }, { delay: 0.2, frequency: 880 }]

  tonePlan.forEach(({ delay, frequency }) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startAt = context.currentTime + delay
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.30, startAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + 0.18)
  })
}

const notificationKey = (lesson, type) => {
  const year = now.value.getFullYear()
  const month = String(now.value.getMonth() + 1).padStart(2, '0')
  const day = String(now.value.getDate()).padStart(2, '0')
  const dateKey = `${year}-${month}-${day}`
  return `teacherPeriod:${dateKey}:${lesson.timetable_id}:${type}`
}

const markAndAlert = (lesson, type, pattern) => {
  const key = notificationKey(lesson, type)
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, 'true')
  vibrateDevice(pattern)
  playAlertTone(type)
}

const checkPeriodBoundaries = () => {
  const currentTime = now.value.getTime()
  todayLessons.value.forEach((lesson) => {
    const startTime = lesson.startDate.getTime()
    const endTime = lesson.endDate.getTime()
    if (startTime > lastCheckedTime && startTime <= currentTime) markAndAlert(lesson, 'start', [220, 120, 220])
    if (endTime > lastCheckedTime && endTime <= currentTime) markAndAlert(lesson, 'end', [450, 160, 450, 160, 450])
  })
  lastCheckedTime = currentTime
}

const toggleVibration = () => {
  vibrationEnabled.value = !vibrationEnabled.value
  localStorage.setItem('teacherPeriodVibration', String(vibrationEnabled.value))
  if (vibrationEnabled.value) {
    getAudioContext()
    vibrateDevice([120])
    playAlertTone('start')
  }
}

const loadTeacherTimetable = async () => {
  await authStore.checkAuth()
  if (!currentTeacherId.value) return
  const response = await api.get(`/timetable/teacher/${currentTeacherId.value}`)
  timetableEntries.value = response.data.timetables || []
}

onMounted(async () => {
  lastCheckedTime = Date.now()
  try {
    await loadTeacherTimetable()
  } catch (error) {
    timetableEntries.value = []
    }

  clockTimer = window.setInterval(() => {
    now.value = new Date()
    checkPeriodBoundaries()
  }, 1000)
  })

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  })
</script>

<style scoped>
.period-timer {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  container-type: inline-size;
  width: min(100%, 430px);
  margin: 1rem 2rem 0;
  padding: clamp(0.85rem, 5cqw, 1.45rem) clamp(0.65rem, 4cqw, 1.2rem) clamp(0.8rem, 4cqw, 1.15rem);
  color: #111827;
  background:
    linear-gradient(145deg, #4b5563 0%, #181c22 42%, #050608 100%);
  border: 1px solid #0f172a;
  border-radius: 34px 34px 48px 48px;
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.22),
    inset 0 -12px 22px rgba(0, 0, 0, 0.58),
    0 18px 38px rgba(15, 23, 42, 0.22);
}

.period-timer.active {
  border-color: #14532d;
}

.period-timer.idle {
  border-color: #334155;
}

.watch-lug {
  position: absolute;
  left: 50%;
  top: -10px;
  width: 84px;
  height: 22px;
  border-radius: 16px 16px 6px 6px;
  background: linear-gradient(180deg, #292f38, #090b0f);
  transform: translateX(-50%);
  z-index: -1;
}

.watch-button {
  position: absolute;
  top: 19px;
  width: 54px;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  background: linear-gradient(145deg, #374151 0%, #0b0f14 100%);
  border: 1px solid #020617;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 1px #000;
  z-index: -1;
}

.lap-button {
  left: -16px;
  border-radius: 18px 8px 12px 20px;
  transform: rotate(-35deg);
}

.start-button {
  right: -16px;
  border-radius: 8px 18px 20px 12px;
  transform: rotate(35deg);
}

.watch-face {
  padding: clamp(0.38rem, 2.6cqw, 0.65rem);
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.2), transparent 22%),
    linear-gradient(150deg, #0f141a 0%, #05070a 100%);
  border: 2px solid #111827;
  border-radius: 24px 24px 36px 36px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 16px rgba(0, 0, 0, 0.78);
}

.watch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 clamp(0.2rem, 2.6cqw, 0.65rem) 0.45rem;
  color: #dbe4cf;
  font-size: 0.76rem;
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
  padding: clamp(0.5rem, 3.1cqw, 0.8rem) clamp(0.42rem, 3.1cqw, 0.8rem) clamp(0.48rem, 2.8cqw, 0.7rem);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 22%),
    #cdd8bf;
  border: 2px solid #0c1113;
  border-radius: 16px 16px 28px 28px;
  box-shadow:
    inset 0 2px 8px rgba(255, 255, 255, 0.38),
    inset 0 -4px 10px rgba(15, 23, 42, 0.16);
}

.lesson-strip {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  padding-bottom: 0.35rem;
  border-bottom: 2px solid rgba(23, 31, 29, 0.55);
}

.lesson-strip span,
.timer-caption,
.watch-metrics span {
  color: rgba(17, 24, 39, 0.76);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.lesson-strip strong {
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-size: 0.86rem;
  font-weight: 950;
  text-align: right;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.lcd-time {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: clamp(0.12rem, 1.2cqw, 0.3rem);
  padding: 0.45rem 0 0.2rem;
  color: #141a1b;
  font-family: "Arial Narrow", "Bahnschrift Condensed", "Roboto Condensed", Impact, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.18);
}

.lcd-digits {
  font-size: clamp(2.05rem, 19cqw, 4.55rem);
  font-weight: 900;
  letter-spacing: 0;
}

.lcd-seconds {
  min-width: 1.15em;
  font-size: clamp(1.15rem, 8.5cqw, 2.35rem);
  font-weight: 900;
}

.timer-caption {
  padding-bottom: 0.35rem;
  text-align: center;
  border-bottom: 1px solid rgba(23, 31, 29, 0.45);
}

.progress-track {
  height: 5px;
  margin: 0.5rem 0 0.35rem;
  overflow: hidden;
  background: rgba(17, 24, 39, 0.15);
  border: 1px solid rgba(17, 24, 39, 0.3);
}

.progress-track span {
  display: block;
  height: 100%;
  background: #172033;
  transition: width 0.3s ease;
}

.watch-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(23, 31, 29, 0.38);
  border-left: 1px solid rgba(23, 31, 29, 0.38);
}

.watch-metrics > div,
.vibration-toggle {
  min-width: 0;
  min-height: clamp(48px, 22cqw, 58px);
  padding: 0.38rem 0.24rem;
  border: 0;
  border-right: 1px solid rgba(23, 31, 29, 0.38);
  border-bottom: 1px solid rgba(23, 31, 29, 0.38);
  background: transparent;
  text-align: center;
}

.watch-metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.22rem;
  color: #111827;
  font-size: clamp(0.78rem, 5.3cqw, 0.98rem);
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
  font-size: clamp(0.95rem, 5cqw, 1.18rem);
}

.vibration-toggle span {
  color: #111827;
  font-size: clamp(0.78rem, 5.3cqw, 0.98rem);
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
}

.vibration-toggle.enabled {
  background: rgba(22, 101, 52, 0.14);
}

.mode-button {
  width: 112px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.72rem auto 0;
  color: #f8fafc;
  background: linear-gradient(180deg, #343a43 0%, #11151a 100%);
  border: 2px solid #050608;
  border-radius: 14px 14px 20px 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 2px 2px rgba(0, 0, 0, 0.45);
  font-size: 0.9rem;
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
