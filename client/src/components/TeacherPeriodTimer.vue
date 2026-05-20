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
let testAlertTimer = null
let audioContext = null
let lastCheckedTime = Date.now()

const schoolDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const dayOrder = new Map(schoolDays.map((day, index) => [day, index]))
const REMINDER_BEFORE_MS = 10 * 60 * 1000
const TEST_ALERT_DELAY_MS = 10 * 60 * 1000

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

const weeklyLessons = computed(() => {
  return timetableEntries.value
    .filter((entry) => {
      const isOwnLesson = String(entry.teacher_id || '') === String(currentTeacherId.value || '')
      return isOwnLesson && !isBreakEntry(entry) && dayOrder.has(entry.day_of_week)
    })
    .map((entry) => {
      const startMinutes = toMinutes(entry.start_time)
      const endMinutes = toMinutes(entry.end_time)
      return {
        ...entry,
        startMinutes,
        endMinutes
      }
    })
    .filter((entry) => entry.startMinutes !== null && entry.endMinutes !== null && entry.endMinutes > entry.startMinutes)
    .sort((a, b) => {
      const dayDiff = dayOrder.get(a.day_of_week) - dayOrder.get(b.day_of_week)
      return dayDiff || a.startMinutes - b.startMinutes
    })
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

const upcomingWeekLesson = computed(() => {
  if (!weeklyLessons.value.length) return null

  const todayIndex = dayOrder.get(todayName.value)
  if (todayIndex === undefined) return weeklyLessons.value[0]

  const currentMinutes = (now.value.getHours() * 60) + now.value.getMinutes()
  const upcoming = weeklyLessons.value.find((lesson) => {
    const lessonDayIndex = dayOrder.get(lesson.day_of_week)
    return lessonDayIndex > todayIndex
      || (lessonDayIndex === todayIndex && lesson.startMinutes > currentMinutes)
  })

  return upcoming || weeklyLessons.value[0]
})

const displayLesson = computed(() => currentLesson.value || nextLesson.value || upcomingWeekLesson.value)

const statusLabel = computed(() => {
  if (currentLesson.value) return 'Current study period'
  if (nextLesson.value) return 'Next study period'
  if (upcomingWeekLesson.value) return `${upcomingWeekLesson.value.day_of_week} study period`
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
  if (upcomingWeekLesson.value) return 'NEXT'
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
  return vibrationEnabled.value ? 'Disable period ringing' : 'Enable period ringing'
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

  const tonePlan = type.includes('end')
    ? [{ delay: 0, frequency: 880 }, { delay: 0.24, frequency: 740 }, { delay: 0.48, frequency: 880 }]
    : [{ delay: 0, frequency: 660 }, { delay: 0.24, frequency: 880 }, { delay: 0.48, frequency: 660 }]

  const repeats = type === 'test' ? 1 : 3
  Array.from({ length: repeats }).forEach((_, repeatIndex) => {
    const repeatDelay = repeatIndex * 0.9
    tonePlan.forEach(({ delay, frequency }) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
      const startAt = context.currentTime + repeatDelay + delay
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.48, startAt + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt)
      oscillator.stop(startAt + 0.24)
    })
  })
}

const alertText = (lesson, type) => {
  if (type === 'test') return 'Period ringing test'

  const title = lesson?.module_name || 'Study period'
  const className = lesson?.class_name || 'class'
  const room = lesson?.room_name || lesson?.room || 'room'

  if (type === 'start-reminder') return `${title} starts in 10 minutes: ${className}, ${room}`
  if (type === 'end-reminder') return `${title} ends in 10 minutes: ${className}, ${room}`
  if (type === 'end') return `${title} ended: ${className}, ${room}`
  return `${title} started: ${className}, ${room}`
}

const showBrowserNotification = (lesson, type) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification('Timetable alert', {
    body: alertText(lesson, type),
    silent: true
  })
}

const notificationKey = (lesson, type) => {
  const year = now.value.getFullYear()
  const month = String(now.value.getMonth() + 1).padStart(2, '0')
  const day = String(now.value.getDate()).padStart(2, '0')
  const dateKey = `${year}-${month}-${day}`
  const lessonId = lesson?.timetable_id || lesson?.id || 'test'
  return `teacherPeriod:${dateKey}:${lessonId}:${type}`
}

const markAndAlert = (lesson, type, pattern) => {
  const key = notificationKey(lesson, type)
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, 'true')
  vibrateDevice(pattern)
  playAlertTone(type)
  showBrowserNotification(lesson, type)
}

const checkPeriodBoundaries = () => {
  const currentTime = now.value.getTime()
  todayLessons.value.forEach((lesson) => {
    const startTime = lesson.startDate.getTime()
    const endTime = lesson.endDate.getTime()
    const startReminderTime = startTime - REMINDER_BEFORE_MS
    const endReminderTime = endTime - REMINDER_BEFORE_MS
    if (startReminderTime > lastCheckedTime && startReminderTime <= currentTime) markAndAlert(lesson, 'start-reminder', [180, 90, 180])
    if (startTime > lastCheckedTime && startTime <= currentTime) markAndAlert(lesson, 'start', [220, 120, 220])
    if (endReminderTime > lastCheckedTime && endReminderTime <= currentTime) markAndAlert(lesson, 'end-reminder', [260, 100, 260])
    if (endTime > lastCheckedTime && endTime <= currentTime) markAndAlert(lesson, 'end', [450, 160, 450, 160, 450])
  })
  lastCheckedTime = currentTime
}

const clearTestAlert = () => {
  if (!testAlertTimer) return
  window.clearTimeout(testAlertTimer)
  testAlertTimer = null
}

const scheduleTenMinuteTest = () => {
  clearTestAlert()
  testAlertTimer = window.setTimeout(() => {
    markAndAlert(displayLesson.value, 'test', [220, 120, 220])
    testAlertTimer = null
  }, TEST_ALERT_DELAY_MS)
}

const toggleVibration = () => {
  vibrationEnabled.value = !vibrationEnabled.value
  localStorage.setItem('teacherPeriodVibration', String(vibrationEnabled.value))
  if (vibrationEnabled.value) {
    getAudioContext()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    vibrateDevice([120])
    playAlertTone('start')
    scheduleTenMinuteTest()
  } else {
    clearTestAlert()
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
  clearTestAlert()
  })
</script>

<style scoped>
.period-timer {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  container-type: inline-size;
  width: min(100%, 310px);
  margin: 0.55rem auto 0;
  padding: clamp(0.48rem, 3.2cqw, 0.78rem) clamp(0.42rem, 2.8cqw, 0.7rem) clamp(0.5rem, 2.8cqw, 0.72rem);
  color: #111827;
  background:
    radial-gradient(circle at 50% 4%, rgba(125, 211, 252, 0.4), transparent 28%),
    linear-gradient(145deg, #2563eb 0%, #123a8c 44%, #071a4f 100%);
  border: 1px solid #1d4ed8;
  border-radius: 26px 26px 34px 34px;
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.22),
    inset 0 -10px 18px rgba(5, 18, 54, 0.55),
    0 12px 28px rgba(37, 99, 235, 0.24);
}

.period-timer.active {
  border-color: #38bdf8;
}

.period-timer.idle {
  border-color: #1e40af;
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

.lesson-strip {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  padding-bottom: 0.24rem;
  border-bottom: 2px solid rgba(30, 64, 175, 0.52);
}

.lesson-strip span,
.timer-caption,
.watch-metrics span {
  color: rgba(17, 24, 39, 0.76);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.lesson-strip strong {
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-size: 0.8rem;
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
  padding: 0.28rem 0 0.12rem;
  color: #141a1b;
  font-family: "Arial Narrow", "Bahnschrift Condensed", "Roboto Condensed", Impact, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.18);
}

.lcd-digits {
  font-size: clamp(1.8rem, 15cqw, 3.15rem);
  font-weight: 900;
  letter-spacing: 0;
}

.lcd-seconds {
  min-width: 1.15em;
  font-size: clamp(0.95rem, 6.8cqw, 1.6rem);
  font-weight: 900;
}

.timer-caption {
  padding-bottom: 0.24rem;
  text-align: center;
  border-bottom: 1px solid rgba(30, 64, 175, 0.38);
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
