<template>
  <section class="period-timer" :class="{ active: currentLesson, idle: !currentLesson }">
    <div class="timer-main">
      <div class="timer-icon" aria-hidden="true">
        <i class="bi bi-alarm"></i>
      </div>
      <div class="timer-copy">
        <span class="timer-label">{{ statusLabel }}</span>
        <strong>{{ lessonTitle }}</strong>
        <small>{{ lessonMeta }}</small>
      </div>
    </div>

    <div class="timer-count">
      <span>{{ timerValue }}</span>
      <small>{{ timerHint }}</small>
    </div>

    <button
      class="vibration-toggle"
      type="button"
      :class="{ enabled: vibrationEnabled }"
      :title="vibrationTitle"
      @click="toggleVibration"
    >
      <i :class="vibrationEnabled ? 'bi bi-phone-vibrate' : 'bi bi-phone'"></i>
      <span>{{ vibrationEnabled ? 'Alerts on' : 'Enable alerts' }}</span>
    </button>

    <button
      class="test-alert-button"
      type="button"
      title="Play a test period alert"
      @click="testAlert"
    >
      <i class="bi bi-volume-up"></i>
      <span>Test alert</span>
    </button>

    <button
      class="test-alert-button"
      type="button"
      title="Start a one minute test period"
      @click="startOneMinuteTest"
    >
      <i class="bi bi-stopwatch"></i>
      <span>1 min test</span>
    </button>
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
const testPeriodEndTime = ref(null)
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

const minutesToTodayGmtDate = (minutes) => {
  const date = new Date(now.value)
  date.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

const formatClock = (date) => {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

const todayName = computed(() => {
  const day = now.value.getUTCDay()
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
        startDate: startMinutes === null ? null : minutesToTodayGmtDate(startMinutes),
        endDate: endMinutes === null ? null : minutesToTodayGmtDate(endMinutes)
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

const testPeriodActive = computed(() => {
  return testPeriodEndTime.value && testPeriodEndTime.value > now.value.getTime()
})

const statusLabel = computed(() => {
  if (testPeriodActive.value) return 'Test period running'
  if (currentLesson.value) return 'Current study period'
  if (nextLesson.value) return 'Next study period'
  return todayLessons.value.length ? 'Study periods finished' : 'No study periods today'
})

const lessonTitle = computed(() => {
  if (testPeriodActive.value) return 'One minute test'
  const lesson = displayLesson.value
  if (!lesson) return todayLessons.value.length ? 'All lessons complete' : 'Free day'
  return lesson.module_name || 'Lesson'
})

const lessonMeta = computed(() => {
  if (testPeriodActive.value) return 'This will alert when the one minute countdown ends.'
  const lesson = displayLesson.value
  if (!lesson) return 'Your device will alert when a scheduled period starts or ends.'
  const room = lesson.room_name || lesson.room || 'TBA'
  return `${lesson.class_name || 'General'} - ${room} - ${normalizeTime(lesson.start_time)} - ${normalizeTime(lesson.end_time)} GMT`
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
  if (testPeriodActive.value) return formatDuration(testPeriodEndTime.value - now.value.getTime())
  if (currentLesson.value) return formatDuration(currentLesson.value.endDate.getTime() - now.value.getTime())
  if (nextLesson.value) return formatDuration(nextLesson.value.startDate.getTime() - now.value.getTime())
  return formatClock(now.value)
})

const timerHint = computed(() => {
  if (testPeriodActive.value) return 'test remaining'
  if (currentLesson.value) return 'remaining'
  if (nextLesson.value) return 'until GMT start'
  return 'current GMT'
})

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
    gain.gain.exponentialRampToValueAtTime(0.14, startAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + 0.18)
  })
}

const notificationKey = (lesson, type) => {
  const dateKey = now.value.toISOString().slice(0, 10)
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

const testAlert = () => {
  if (!vibrationEnabled.value) {
    vibrationEnabled.value = true
    localStorage.setItem('teacherPeriodVibration', 'true')
  }
  getAudioContext()
  vibrateDevice([220, 120, 220])
  playAlertTone('end')
}

const startOneMinuteTest = () => {
  if (!vibrationEnabled.value) {
    vibrationEnabled.value = true
    localStorage.setItem('teacherPeriodVibration', 'true')
  }
  getAudioContext()
  testPeriodEndTime.value = Date.now() + 60000
  vibrateDevice([120])
  playAlertTone('start')
}

const checkTestPeriod = (currentTime) => {
  if (!testPeriodEndTime.value) return
  if (testPeriodEndTime.value > lastCheckedTime && testPeriodEndTime.value <= currentTime) {
    testPeriodEndTime.value = null
    vibrateDevice([450, 160, 450, 160, 450])
    playAlertTone('end')
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
    checkTestPeriod(now.value.getTime())
    checkPeriodBoundaries()
  }, 1000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<style scoped>
.period-timer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1rem;
  margin: 1rem 2rem 0;
  padding: 0.9rem 1rem;
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-left: 5px solid #2563eb;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.period-timer.active {
  border-left-color: #16a34a;
  background: #f7fef9;
}

.period-timer.idle {
  border-left-color: #94a3b8;
}

.timer-main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.timer-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #dbeafe;
  color: #1d4ed8;
  flex: 0 0 42px;
}

.timer-copy {
  min-width: 0;
}

.timer-copy span,
.timer-copy strong,
.timer-copy small,
.timer-count span,
.timer-count small {
  display: block;
}

.timer-label,
.timer-copy small,
.timer-count small {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 750;
}

.timer-copy strong {
  color: #0f172a;
  font-size: 0.98rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timer-copy small {
  margin-top: 0.15rem;
  overflow-wrap: anywhere;
}

.timer-count {
  min-width: 108px;
  text-align: right;
}

.timer-count span {
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.vibration-toggle,
.test-alert-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.8rem;
}

.vibration-toggle.enabled {
  border-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.test-alert-button {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

@media (max-width: 900px) {
  .period-timer {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    margin: 1rem 1rem 0;
  }

  .timer-count {
    text-align: left;
  }

  .vibration-toggle,
  .test-alert-button {
    width: 100%;
  }
}
</style>
