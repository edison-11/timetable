<template>
  <section class="period-timer" :class="{ active: currentLesson, ringing: endAlert.visible }">
    <div v-if="endAlert.visible" class="period-alert" role="status">
      <strong>Period ended</strong>
      <span>{{ endAlert.message }}</span>
      <button type="button" @click="dismissEndAlert" title="Dismiss alert">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <div class="stopwatch">
      <div class="top-crown" aria-hidden="true"></div>
      <button class="case-button lap-button" type="button" title="Test ring now" @click="playBell">LAP</button>
      <button class="case-button start-button" type="button" title="Test ring in 2 minutes" @click="startTwoMinuteRingTest">
        START/STOP
      </button>

      <div class="watch-face">
        <div class="screen">
          <div class="screen-top">
            <strong>{{ currentLesson ? 'CURRENT' : 'NEXT' }}</strong>
            <span class="battery-icon" aria-hidden="true"><span></span></span>
          </div>

          <div class="period-summary">
            <span>{{ nextLesson?.day_of_week || todayName }}</span>
            <span>{{ currentSubjectMetric }}</span>
            <span>{{ currentLesson ? 'Period' : 'Next period' }}</span>
            <strong>{{ nextSubjectMetric }}</strong>
          </div>

          <div class="timer-display" :aria-label="`${gmtOffsetLabel} ${gmtTime}`">
            <span class="timer-zone">{{ gmtOffsetLabel }}</span>
            <span class="timer-local-time">{{ gmtTime }}</span>
          </div>

          <div class="timer-caption">{{ timerCaption }}</div>

          <div class="watch-metrics">
            <div>
              <span>{{ gmtOffsetLabel }}</span>
              <strong>{{ gmtTime }}</strong>
            </div>
            <div>
              <span>Class</span>
              <strong>{{ currentLesson ? currentClassMetric : nextClassMetric }}</strong>
            </div>
            <div>
              <span>Room</span>
              <strong>{{ currentLesson ? currentRoomMetric : nextRoomMetric }}</strong>
            </div>
            <div>
              <span>Start</span>
              <strong>{{ normalizeTime((currentLesson || nextLesson)?.start_time) || '--:--' }}</strong>
            </div>
            <div>
              <span>End</span>
              <strong>{{ normalizeTime((currentLesson || nextLesson)?.end_time) || '--:--' }}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{{ currentLesson ? 'ON' : 'NEXT' }}</strong>
            </div>
          </div>

          <div v-if="loadError" class="timer-error">{{ loadError }}</div>
        </div>
      </div>

      <button
        class="mode-button"
        type="button"
        :disabled="!nextLesson"
        @click="goToNextLesson"
        title="Open next class in timetable"
      >
        MODE
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const now = ref(new Date())
const lessons = ref([])
const loadError = ref('')
const endAlert = reactive({
  visible: false,
  message: ''
})

let clockTimer = null
let alertTimer = null
let testRingTimer = null
let refreshTimer = null
let previousCurrentId = null
let audioContext = null

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const currentTeacherId = computed(() => {
  let cachedTeacher = null
  try {
    cachedTeacher = JSON.parse(localStorage.getItem('teacher') || 'null')
  } catch (error) {
    cachedTeacher = null
  }

  const teacher = authStore.currentUser || cachedTeacher
  return teacher?.teacher_id || teacher?.id || null
})

const todayName = computed(() => dayNames[now.value.getDay()])

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const minutesSinceMidnight = (date) => date.getHours() * 60 + date.getMinutes() + (date.getSeconds() / 60)

const normalizeTime = (time) => String(time || '').slice(0, 5)

const isBreakEntry = (entry) => {
  const label = String(entry?.module_name || '').toLowerCase()
  return entry?.entry_type === 'break' || label.includes('break') || label.includes('lunch')
}

const isTeacherLesson = (entry) => {
  return String(entry.teacher_id || '') === String(currentTeacherId.value || '') && !isBreakEntry(entry)
}

const dayOffsetFromToday = (targetDay) => {
  const targetIndex = dayNames.indexOf(targetDay)
  const currentIndex = now.value.getDay()
  if (targetIndex === -1) return 99
  return (targetIndex - currentIndex + 7) % 7
}

const lessonStartDate = (lesson) => {
  const startMinutes = parseTimeToMinutes(lesson.start_time)
  const date = new Date(now.value)
  date.setDate(now.value.getDate() + dayOffsetFromToday(lesson.day_of_week))
  date.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
  return date
}

const lessonEndDate = (lesson) => {
  const endMinutes = parseTimeToMinutes(lesson.end_time)
  const date = new Date(now.value)
  date.setDate(now.value.getDate() + dayOffsetFromToday(lesson.day_of_week))
  date.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)
  return date
}

const sortedLessons = computed(() => {
  return lessons.value
    .filter((lesson) => lesson.start_time && lesson.end_time)
    .slice()
    .sort((a, b) => {
      const dayDiff = dayOffsetFromToday(a.day_of_week) - dayOffsetFromToday(b.day_of_week)
      return dayDiff || normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
    })
})

const currentLesson = computed(() => {
  const currentMinutes = minutesSinceMidnight(now.value)
  return sortedLessons.value.find((lesson) => {
    if (lesson.day_of_week !== todayName.value) return false
    const start = parseTimeToMinutes(lesson.start_time)
    const end = parseTimeToMinutes(lesson.end_time)
    return start !== null && end !== null && currentMinutes >= start && currentMinutes < end
  }) || null
})

const nextLesson = computed(() => {
  const referenceTime = currentLesson.value ? lessonEndDate(currentLesson.value) : now.value
  return sortedLessons.value.find((lesson) => lessonStartDate(lesson).getTime() >= referenceTime.getTime()) || null
})

const countdownSeconds = computed(() => {
  const target = currentLesson.value
    ? lessonEndDate(currentLesson.value)
    : nextLesson.value
      ? lessonStartDate(nextLesson.value)
      : null

  if (!target) return 0
  return Math.max(0, Math.floor((target.getTime() - now.value.getTime()) / 1000))
})

const countdownParts = computed(() => {
  const total = countdownSeconds.value
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  return {
    main: hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    seconds: hours > 0 ? String(seconds).padStart(2, '0') : ''
  }
})

const timerStatus = computed(() => currentLesson.value ? 'PERIOD TIMER' : 'NEXT PERIOD')

const timerCaption = computed(() => {
  if (currentLesson.value) return `${currentLesson.value.class_name || 'Class'} ends at ${normalizeTime(currentLesson.value.end_time)}`
  if (nextLesson.value) return `${nextLesson.value.class_name || 'Class'} starts at ${normalizeTime(nextLesson.value.start_time)}`
  return 'No scheduled periods'
})

const timerAriaLabel = computed(() => `${countdownParts.value.main}:${countdownParts.value.seconds} ${timerCaption.value}`)

const gmtTime = computed(() => now.value.toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}))

const gmtOffsetLabel = computed(() => {
  const offsetMinutes = -now.value.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')
  const minutes = String(absoluteMinutes % 60).padStart(2, '0')
  return `GMT${sign}${hours}:${minutes}`
})

const formatLesson = (lesson) => {
  if (!lesson) return 'Free'
  const subject = lesson.module_name || 'Lesson'
  const className = lesson.class_name || 'Class'
  const room = lesson.room_name || lesson.room || 'Room TBA'
  return `${subject} - ${className} - ${room}`
}

const currentLessonLabel = computed(() => formatLesson(currentLesson.value))

const nextLessonLabel = computed(() => {
  if (!nextLesson.value) return 'No next class'
  const dayPrefix = nextLesson.value.day_of_week === todayName.value ? '' : `${nextLesson.value.day_of_week} `
  return `${dayPrefix}${formatLesson(nextLesson.value)}`
})

const nextRouteLabel = computed(() => {
  if (!nextLesson.value) return 'No next room'
  return `${nextLesson.value.class_name || 'Next class'} - ${nextLesson.value.room_name || nextLesson.value.room || 'Room TBA'}`
})

const currentSubjectMetric = computed(() => currentLesson.value?.module_name || 'Free')
const currentClassMetric = computed(() => currentLesson.value?.class_name || 'Free')
const currentRoomMetric = computed(() => currentLesson.value?.room_name || currentLesson.value?.room || 'TBA')
const nextSubjectMetric = computed(() => nextLesson.value?.module_name || 'None')
const nextClassMetric = computed(() => nextLesson.value?.class_name || 'None')
const nextRoomMetric = computed(() => nextLesson.value?.room_name || nextLesson.value?.room || 'TBA')
const nextTimeMetric = computed(() => {
  if (!nextLesson.value) return '--:--'
  const dayPrefix = nextLesson.value.day_of_week === todayName.value ? '' : `${nextLesson.value.day_of_week.slice(0, 3)} `
  return `${dayPrefix}${normalizeTime(nextLesson.value.start_time)}`
})

const showPeriodEndAlert = (lesson) => {
  const nextText = nextLesson.value
    ? `Next: ${nextLesson.value.class_name || 'Class'} in ${nextLesson.value.room_name || nextLesson.value.room || 'Room TBA'}.`
    : 'No next class is scheduled.'

  endAlert.message = `${lesson?.class_name || 'Your class'} period has ended. ${nextText}`
  endAlert.visible = true

  if (alertTimer) window.clearTimeout(alertTimer)
  alertTimer = window.setTimeout(() => {
    endAlert.visible = false
  }, 15000)

  playBell()
}

const getAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

const unlockAudio = () => {
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.03)
}

const playBell = () => {
  const context = getAudioContext()
  if (!context) return

  try {
    const startTime = context.currentTime
    const pulses = [0, 0.42, 0.84]

    pulses.forEach((offset) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = startTime + offset

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(880, start)
      oscillator.frequency.setValueAtTime(1175, start + 0.15)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.32, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.34)
    })
  } catch (error) {
    // Some browsers block audio until the teacher interacts with the page.
  }
}

const dismissEndAlert = () => {
  endAlert.visible = false
}

const startTwoMinuteRingTest = () => {
  unlockAudio()

  if (testRingTimer) window.clearTimeout(testRingTimer)

  endAlert.message = 'Test started. The timer will ring in 2 minutes.'
  endAlert.visible = true

  testRingTimer = window.setTimeout(() => {
    endAlert.message = 'Test period has ended. This is the same alert teachers will see after a real period.'
    endAlert.visible = true
    playBell()

    if (alertTimer) window.clearTimeout(alertTimer)
    alertTimer = window.setTimeout(() => {
      endAlert.visible = false
    }, 15000)
  }, 120000)
}

const goToNextLesson = () => {
  if (!nextLesson.value) return
  router.push({
    name: 'TeacherTimetable',
    query: {
      day: nextLesson.value.day_of_week,
      class: nextLesson.value.class_name || ''
    }
  })
}

const loadTeacherLessons = async () => {
  loadError.value = ''
  await authStore.checkAuth()
  const teacherId = currentTeacherId.value
  if (!teacherId) {
    lessons.value = []
    loadError.value = 'Teacher profile not loaded'
    return
  }

  try {
    const response = await api.get(`/timetable/teacher/${teacherId}`, { showGlobalLoader: false })
    lessons.value = (response.data.timetables || []).filter(isTeacherLesson)
  } catch (error) {
    lessons.value = []
    loadError.value = 'Timer could not load timetable'
  }
}

watch(currentLesson, (lesson, previousLesson) => {
  const lessonId = lesson?.timetable_id || null
  const previousId = previousLesson?.timetable_id || previousCurrentId

  if (previousLesson && previousId && previousId !== lessonId) {
    showPeriodEndAlert(previousLesson)
  }

  previousCurrentId = lessonId
})

onMounted(async () => {
  await loadTeacherLessons()
  previousCurrentId = currentLesson.value?.timetable_id || null

  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)

  refreshTimer = window.setInterval(() => {
    loadTeacherLessons()
  }, 60000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  if (alertTimer) window.clearTimeout(alertTimer)
  if (testRingTimer) window.clearTimeout(testRingTimer)
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<style scoped>
.period-timer {
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.period-alert {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.15rem 0.55rem;
  align-items: start;
  margin-bottom: 0.65rem;
  padding: 0.7rem 0.75rem;
  color: #7f1d1d;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  box-shadow: 0 10px 22px rgba(127, 29, 29, 0.12);
}

.period-alert strong,
.period-alert span {
  min-width: 0;
}

.period-alert strong {
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.period-alert span {
  grid-column: 1;
  color: #991b1b;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.3;
}

.period-alert button {
  grid-row: 1 / span 2;
  grid-column: 2;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  color: #991b1b;
  background: rgba(255, 255, 255, 0.65);
  cursor: pointer;
}

.stopwatch {
  position: relative;
  width: min(100%, 210px);
  margin: 0 auto;
  padding: 0.65rem 0.34rem 0.86rem;
}

.top-crown {
  display: none;
}

.case-button {
  display: none;
}

.watch-face {
  position: relative;
  z-index: 1;
  padding: 1rem 0.78rem 4.1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent 12%),
    linear-gradient(160deg, #273241 0%, #05080d 78%);
  border: 1px solid #0a0d10;
  border-radius: 34px;
  box-shadow:
    inset 0 3px 8px rgba(255, 255, 255, 0.12),
    inset 0 -18px 26px rgba(0, 0, 0, 0.88),
    0 14px 24px rgba(15, 23, 42, 0.24);
}

.screen {
  overflow: hidden;
  min-height: 300px;
  padding: 0.72rem 0.55rem 0.62rem;
  color: #182013;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent 22%),
    #d2ddc5;
  border: 4px solid #08101a;
  border-radius: 26px;
  box-shadow:
    inset 0 2px 8px rgba(255, 255, 255, 0.42),
    inset 0 -7px 12px rgba(15, 23, 42, 0.14);
}

.screen-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 25px;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgba(31, 42, 17, 0.5);
}

.screen-top strong {
  overflow: hidden;
  color: #111827;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.battery-icon {
  position: relative;
  width: 32px;
  height: 18px;
  border: 3px solid #e7efdf;
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px rgba(17, 24, 39, 0.42);
}

.battery-icon::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 4px;
  width: 4px;
  height: 8px;
  background: #e7efdf;
  border-radius: 0 3px 3px 0;
}

.battery-icon span {
  display: block;
  width: 74%;
  height: 100%;
  background: #e7efdf;
}

.period-summary {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.12rem 0.4rem;
  min-height: 76px;
  padding: 0.9rem 0 0.65rem;
  border-bottom: 3px solid rgba(31, 42, 17, 0.5);
}

.period-summary span,
.period-summary strong {
  min-width: 0;
  color: #1f2937;
  font-weight: 950;
  line-height: 1.18;
  text-transform: uppercase;
}

.period-summary span {
  grid-column: 1;
  overflow: hidden;
  font-size: 0.76rem;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.period-summary strong {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
  max-width: 82px;
  overflow-wrap: anywhere;
  font-size: 1rem;
  text-align: right;
}

.gmt-chip {
  justify-self: end;
  color: #1f2a11;
  font-size: 0.42rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
  white-space: nowrap;
}

.timer-display {
  display: grid;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
  min-height: 72px;
  padding: 0.58rem 0 0.46rem;
  border-bottom: 1px solid rgba(31, 42, 17, 0.42);
  text-align: center;
}

.timer-zone,
.timer-local-time {
  color: #151b12;
  font-family: 'Arial Narrow', 'Roboto Condensed', sans-serif;
  font-weight: 950;
  letter-spacing: 0;
}

.timer-zone {
  font-size: 0.62rem;
  line-height: 1.05;
  text-transform: uppercase;
}

.timer-local-time {
  font-size: clamp(1.08rem, 12cqw, 1.42rem);
  line-height: 1;
}

.timer-caption {
  padding: 0.34rem 0 0.5rem;
  border-bottom: 7px solid #111827;
  color: #1f2a11;
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0.02em;
  line-height: 1.15;
  text-align: center;
  text-transform: uppercase;
}

.watch-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.watch-metrics div {
  min-width: 0;
  min-height: 60px;
  padding: 0.8rem 0.16rem 0.4rem;
  border-right: 1px solid rgba(31, 42, 17, 0.4);
  border-bottom: 1px solid rgba(31, 42, 17, 0.4);
  text-align: center;
}

.watch-metrics div:nth-child(3n) {
  border-right: 0;
}

.watch-metrics div:nth-last-child(-n + 3) {
  border-bottom: 0;
}

.watch-metrics span,
.watch-metrics strong {
  display: block;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.watch-metrics span {
  color: #26301f;
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0.01em;
  line-height: 1.15;
  text-transform: uppercase;
}

.watch-metrics strong {
  margin-top: 0.58rem;
  color: #151b12;
  font-size: 0.76rem;
  font-weight: 950;
  line-height: 1.12;
  max-height: 2.3em;
}

.mode-button {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 1.2rem;
  width: 88px;
  height: 36px;
  border: 1px solid #050608;
  border-radius: 18px;
  color: #f8fafc;
  background: linear-gradient(180deg, #303a48 0%, #111827 68%);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.18), 0 2px 4px rgba(0, 0, 0, 0.42);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.02em;
  transform: translateX(-50%);
}

.mode-button:disabled {
  opacity: 0.76;
  cursor: default;
}

.timer-error {
  margin-top: 0.55rem;
  color: #991b1b;
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
}

.period-timer.ringing .watch-face {
  animation: timer-ring 0.7s ease-in-out 3;
}

@keyframes timer-ring {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

</style>
