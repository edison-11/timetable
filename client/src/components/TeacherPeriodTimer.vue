<template>
  <section class="period-timer" :class="{ active: sessionInProgress, ringing: endAlert.ringing }">
    <div v-if="endAlert.visible" class="period-alert" role="status">
      <strong>{{ endAlert.title }}</strong>
      <span>{{ endAlert.message }}</span>
      <button type="button" @click="dismissEndAlert" :title="endAlert.ringing ? 'Stop alarm' : 'Dismiss alert'">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <div class="stopwatch">
      <div class="top-crown" aria-hidden="true"></div>

      <div class="watch-face">
        <div class="screen">
          <div class="screen-top">
            <strong>{{ currentLesson ? 'CURRENT' : sessionInProgress ? 'SESSION' : daySessionEnded ? 'DONE' : 'NEXT' }}</strong>
            <button
              class="alarm-toggle"
              type="button"
              :class="{ enabled: alarmEnabled }"
              :aria-pressed="alarmEnabled"
              :title="alarmEnabled ? 'Turn alarm off' : 'Turn alarm on'"
              @click="toggleAlarm"
            >
              <i :class="alarmEnabled ? 'bi bi-bell-fill' : 'bi bi-bell-slash-fill'" aria-hidden="true"></i>
              <span>{{ alarmEnabled ? 'ON' : 'OFF' }}</span>
            </button>
          </div>

          <div class="period-summary">
            <span>{{ displayDayMetric }}</span>
            <span>{{ currentSubjectMetric }}</span>
            <span>{{ displayModeLabel }}</span>
            <strong>{{ displaySubjectMetric }}</strong>
          </div>

          <div class="timer-display" :aria-label="timerAriaLabel">
            <span class="timer-zone">{{ activeTimerLabel }}</span>
            <span class="timer-local-time">{{ activeTimerValue }}</span>
          </div>

          <div class="timer-caption">{{ timerCaption }}</div>

          <div class="watch-metrics">
            <div>
              <span>{{ sessionInProgress ? 'Day left' : gmtOffsetLabel }}</span>
              <strong>{{ sessionInProgress ? sessionRemainingTimerValue : gmtTime }}</strong>
            </div>
            <div>
              <span>Class</span>
              <strong>{{ displayClassMetric }}</strong>
            </div>
            <div>
              <span>Room</span>
              <strong>{{ displayRoomMetric }}</strong>
            </div>
            <div>
              <span>Start</span>
              <strong>{{ displayStartMetric }}</strong>
            </div>
            <div>
              <span>End</span>
              <strong>{{ displayEndMetric }}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{{ displayStatusMetric }}</strong>
            </div>
          </div>

          <div v-if="loadError" class="timer-error">{{ loadError }}</div>
        </div>
      </div>

      <button
        class="mode-button"
        type="button"
        :aria-expanded="showToneMenu"
        @click="showToneMenu = !showToneMenu"
        :title="`Alarm voice: ${currentAlarmTone.label}`"
      >
        MODE
      </button>

      <div v-if="showToneMenu" class="tone-menu">
        <button
          v-for="(tone, index) in alarmTones"
          :key="tone.label"
          type="button"
          :class="{ active: index === alarmToneIndex }"
          @click="selectAlarmTone(index)"
        >
          {{ tone.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { buildTimetableRowsFromSettings } from '@/utils/fixedTimetableStructure'
import { isAcademicWeekend } from '@/utils/dayHelpers'

const authStore = useAuthStore()

const now = ref(new Date())
const lessons = ref([])
const timetableSettings = ref(null)
const alarmEnabled = ref(true)
const alarmToneIndex = ref(0)
const showToneMenu = ref(false)
const audioReady = ref(false)
const loadError = ref('')
const endAlert = reactive({
  visible: false,
  ringing: false,
  title: 'Period ended',
  message: ''
})

let clockTimer = null
let alarmRepeatTimer = null
let previousCurrentId = null
let audioContext = null
let lastDayEndedState = false

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const alarmTones = [
  {
    label: 'School bell',
    shortLabel: 'BELL',
    type: 'square',
    pulses: [
      { at: 0, from: 880, to: 1175, duration: 0.34 },
      { at: 0.42, from: 880, to: 1175, duration: 0.34 },
      { at: 0.84, from: 880, to: 1175, duration: 0.34 }
    ]
  },
  {
    label: 'Soft chime',
    shortLabel: 'CHIME',
    type: 'sine',
    pulses: [
      { at: 0, from: 660, to: 880, duration: 0.5 },
      { at: 0.56, from: 880, to: 1320, duration: 0.56 }
    ]
  },
  {
    label: 'Urgent beep',
    shortLabel: 'BEEP',
    type: 'triangle',
    pulses: [
      { at: 0, from: 1040, to: 1040, duration: 0.18 },
      { at: 0.26, from: 1040, to: 1040, duration: 0.18 },
      { at: 0.52, from: 1040, to: 1040, duration: 0.18 },
      { at: 0.78, from: 1040, to: 1040, duration: 0.18 }
    ]
  },
  {
    label: 'Digital alarm',
    shortLabel: 'ALARM',
    type: 'sawtooth',
    pulses: [
      { at: 0, from: 760, to: 980, duration: 0.24 },
      { at: 0.3, from: 980, to: 760, duration: 0.24 },
      { at: 0.6, from: 760, to: 980, duration: 0.24 },
      { at: 0.9, from: 980, to: 760, duration: 0.24 }
    ]
  },
  {
    label: 'Double ding',
    shortLabel: 'DING',
    type: 'sine',
    pulses: [
      { at: 0, from: 988, to: 988, duration: 0.42 },
      { at: 0.5, from: 1318, to: 1318, duration: 0.5 }
    ]
  },
  {
    label: 'Low buzzer',
    shortLabel: 'BUZZ',
    type: 'square',
    pulses: [
      { at: 0, from: 220, to: 260, duration: 0.42 },
      { at: 0.5, from: 220, to: 260, duration: 0.42 },
      { at: 1, from: 220, to: 260, duration: 0.42 }
    ]
  }
]

const currentAlarmTone = computed(() => alarmTones[alarmToneIndex.value] || alarmTones[0])

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

const weekendMode = computed(() => isAcademicWeekend(now.value))
const todayName = computed(() => weekendMode.value ? 'Weekend' : dayNames[now.value.getDay()])

const todayKey = computed(() => {
  const year = now.value.getFullYear()
  const month = String(now.value.getMonth() + 1).padStart(2, '0')
  const day = String(now.value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

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
  if (weekendMode.value) return []
  return lessons.value
    .filter((lesson) => lesson.start_time && lesson.end_time)
    .slice()
    .sort((a, b) => {
      const dayDiff = dayOffsetFromToday(a.day_of_week) - dayOffsetFromToday(b.day_of_week)
      return dayDiff || normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
    })
})

const timetableDayRows = computed(() => {
  return buildTimetableRowsFromSettings(timetableSettings.value)
    .filter((row) => row.start_time && row.end_time)
    .slice()
    .sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)))
})

const timetablePeriodRows = computed(() => timetableDayRows.value.filter((row) => row.type === 'period'))

const daySessionStartRow = computed(() => timetablePeriodRows.value[0] || null)

const daySessionEndRow = computed(() => {
  return timetablePeriodRows.value
    .slice()
    .sort((a, b) => normalizeTime(b.end_time).localeCompare(normalizeTime(a.end_time)))[0] || null
})

const todayDateForTime = (time) => {
  const minutes = parseTimeToMinutes(time)
  if (minutes === null) return null
  const date = new Date(now.value)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

const daySessionStartDate = computed(() => todayDateForTime(daySessionStartRow.value?.start_time))

const daySessionEndDate = computed(() => todayDateForTime(daySessionEndRow.value?.end_time))

const daySessionStartTime = computed(() => normalizeTime(daySessionStartRow.value?.start_time))

const daySessionEndTime = computed(() => normalizeTime(daySessionEndRow.value?.end_time))

const sessionStarted = computed(() => {
  if (weekendMode.value) return false
  if (!daySessionStartDate.value) return false
  return now.value.getTime() >= daySessionStartDate.value.getTime()
})

const sessionInProgress = computed(() => {
  if (weekendMode.value) return false
  if (!daySessionStartDate.value || !daySessionEndDate.value) return false
  const currentTime = now.value.getTime()
  return currentTime >= daySessionStartDate.value.getTime() && currentTime < daySessionEndDate.value.getTime()
})

const daySessionEnded = computed(() => {
  if (weekendMode.value) return false
  if (!daySessionEndDate.value) return false
  return now.value.getTime() >= daySessionEndDate.value.getTime()
})

const currentSlotRow = computed(() => {
  const currentMinutes = minutesSinceMidnight(now.value)
  return timetableDayRows.value.find((row) => {
    const start = parseTimeToMinutes(row.start_time)
    const end = parseTimeToMinutes(row.end_time)
    return start !== null && end !== null && currentMinutes >= start && currentMinutes < end
  }) || null
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

const currentSlotEndDate = computed(() => {
  if (!currentSlotRow.value?.end_time) return null
  return todayDateForTime(currentSlotRow.value.end_time)
})

const currentSlotStartDate = computed(() => {
  if (!currentSlotRow.value?.start_time) return null
  return todayDateForTime(currentSlotRow.value.start_time)
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

const activeSlotRemainingSeconds = computed(() => {
  if (!currentSlotEndDate.value) return 0
  return Math.max(0, Math.floor((currentSlotEndDate.value.getTime() - now.value.getTime()) / 1000))
})

const sessionStartCountdownSeconds = computed(() => {
  if (!daySessionStartDate.value) return 0
  return Math.max(0, Math.floor((daySessionStartDate.value.getTime() - now.value.getTime()) / 1000))
})

const formatDuration = (totalSeconds) => {
  const total = Math.max(0, Number(totalSeconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const sessionDurationSeconds = computed(() => {
  if (!daySessionStartDate.value || !daySessionEndDate.value) return 0
  return Math.max(0, Math.floor((daySessionEndDate.value.getTime() - daySessionStartDate.value.getTime()) / 1000))
})

const sessionElapsedSeconds = computed(() => {
  if (!daySessionStartDate.value) return 0
  if (daySessionEnded.value) return sessionDurationSeconds.value
  return Math.max(0, Math.floor((now.value.getTime() - daySessionStartDate.value.getTime()) / 1000))
})

const sessionRemainingSeconds = computed(() => {
  if (!daySessionEndDate.value || !sessionInProgress.value) return 0
  return Math.max(0, Math.floor((daySessionEndDate.value.getTime() - now.value.getTime()) / 1000))
})

const sessionRemainingTimerValue = computed(() => formatDuration(sessionRemainingSeconds.value))

const timerStatus = computed(() => currentLesson.value ? 'PERIOD TIMER' : 'NEXT PERIOD')

const activeTimerLabel = computed(() => {
  if (currentSlotRow.value) return 'Time left'
  if (nextLesson.value) return 'Starts in'
  if (sessionStarted.value) return 'Elapsed time'
  return 'Starts in'
})

const activeTimerValue = computed(() => {
  if (currentSlotRow.value) return formatDuration(activeSlotRemainingSeconds.value)
  if (nextLesson.value) return formatDuration(countdownSeconds.value)
  return sessionStarted.value
    ? formatDuration(sessionElapsedSeconds.value)
    : formatDuration(sessionStartCountdownSeconds.value)
})

const currentBreakLabel = computed(() => {
  if (currentSlotRow.value?.type !== 'break') return ''
  return currentSlotRow.value.label || currentSlotRow.value.break_name || 'Break'
})

const displayLesson = computed(() => currentLesson.value || nextLesson.value || null)

const displayDayMetric = computed(() => {
  if (currentLesson.value || currentSlotRow.value) return todayName.value
  return nextLesson.value?.day_of_week || todayName.value
})

const displayModeLabel = computed(() => {
  if (currentLesson.value) return 'Current period'
  if (currentBreakLabel.value) return 'Current break'
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period') return 'Free period'
  if (nextLesson.value) return 'Next period'
  return daySessionEnded.value ? 'Finished' : 'No period'
})

const displaySubjectMetric = computed(() => {
  if (currentLesson.value) return currentLesson.value.module_name || 'Lesson'
  if (currentBreakLabel.value) return currentBreakLabel.value
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period') return 'Free'
  return nextLesson.value?.module_name || 'None'
})

const displayClassMetric = computed(() => {
  if (currentLesson.value) return currentLesson.value.class_name || 'Class'
  if (currentBreakLabel.value) return 'Break'
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period') return 'Free'
  return nextLesson.value?.class_name || 'None'
})

const displayRoomMetric = computed(() => {
  const lesson = displayLesson.value
  if (currentBreakLabel.value) return '--'
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period' && !currentLesson.value) return '--'
  return lesson?.room_name || lesson?.room || 'TBA'
})

const displayStartMetric = computed(() => {
  if (currentSlotRow.value) return normalizeTime(currentSlotRow.value.start_time)
  return normalizeTime(nextLesson.value?.start_time) || daySessionStartTime.value || '--:--'
})

const displayEndMetric = computed(() => {
  if (currentSlotRow.value) return normalizeTime(currentSlotRow.value.end_time)
  return normalizeTime(nextLesson.value?.end_time) || daySessionEndTime.value || '--:--'
})

const displayStatusMetric = computed(() => {
  if (currentLesson.value) return 'ON'
  if (currentBreakLabel.value) return 'BREAK'
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period') return 'FREE'
  if (daySessionEnded.value) return 'DONE'
  if (nextLesson.value) return 'NEXT'
  return 'NONE'
})

const timerCaption = computed(() => {
  if (weekendMode.value) return 'Weekend break - next school week resumes Monday'
  if (currentLesson.value) {
    return `${activeTimerValue.value} left - ends at ${normalizeTime(currentLesson.value.end_time)}`
  }
  if (currentBreakLabel.value) {
    return `${activeTimerValue.value} left - ${currentBreakLabel.value} ends at ${displayEndMetric.value}`
  }
  if (sessionInProgress.value && currentSlotRow.value?.type === 'period') {
    return `${activeTimerValue.value} left - free period ends at ${displayEndMetric.value}`
  }
  if (nextLesson.value) {
    return `${nextLesson.value.class_name || 'Class'} starts at ${normalizeTime(nextLesson.value.start_time)}`
  }
  if (sessionInProgress.value) return `${sessionRemainingTimerValue.value} remaining - day ends at ${daySessionEndTime.value}`
  if (daySessionEnded.value) return `Day session ended at ${daySessionEndTime.value}`
  if (daySessionStartTime.value) return `First period starts at ${daySessionStartTime.value}`
  return 'No scheduled periods'
})

const timerAriaLabel = computed(() => `${activeTimerValue.value} ${timerCaption.value}`)

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

const currentSubjectMetric = computed(() => displayStatusMetric.value)
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

const alarmStoragePrefix = computed(() => `teacherPeriodAlarm:${currentTeacherId.value || 'unknown'}:${todayKey.value}`)

const alarmFired = (key) => localStorage.getItem(`${alarmStoragePrefix.value}:${key}`) === '1'

const markAlarmFired = (key) => {
  localStorage.setItem(`${alarmStoragePrefix.value}:${key}`, '1')
}

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch (error) {
      // Notification permission prompts can be blocked by browser policy.
    }
  }
}

const showBrowserNotification = (title, message) => {
  if (!alarmEnabled.value || !('Notification' in window) || Notification.permission !== 'granted') return

  try {
    new Notification(title, {
      body: message,
      tag: 'teacher-period-alarm',
      renotify: true,
      requireInteraction: true
    })
  } catch (error) {
    // Some browsers block notifications outside secure contexts.
  }
}

const showAlarmAlert = (title, message) => {
  endAlert.title = title
  endAlert.message = message
  endAlert.visible = true
  showBrowserNotification(title, message)
  startPersistentAlarm()
}

const showPeriodEndAlert = (lesson) => {
  const alarmKey = `period-end:${lesson?.timetable_id || `${lesson?.day_of_week}-${lesson?.end_time}`}`
  if (alarmFired(alarmKey)) return
  markAlarmFired(alarmKey)

  const nextText = nextLesson.value
    ? `Next: ${nextLesson.value.class_name || 'Class'} in ${nextLesson.value.room_name || nextLesson.value.room || 'Room TBA'}.`
    : 'No next class is scheduled.'

  showAlarmAlert(
    'Period ended',
    `${lesson?.class_name || 'Your class'} period has ended. ${nextText} Press X to stop the alarm.`
  )
}

const showPeriodStartAlert = (lesson) => {
  const alarmKey = `period-start:${lesson?.timetable_id || `${lesson?.day_of_week}-${lesson?.start_time}`}`
  if (alarmFired(alarmKey)) return
  markAlarmFired(alarmKey)

  showAlarmAlert(
    'Period started',
    `${lesson?.class_name || 'Your class'} period has started. ${lesson?.room_name || lesson?.room ? `Room: ${lesson.room_name || lesson.room}. ` : ''}Press X to stop the alarm.`
  )
}

const showDayEndedAlert = () => {
  if (!daySessionEndTime.value || alarmFired('day-ended')) return
  markAlarmFired('day-ended')

  showAlarmAlert(
    'Day ended',
    `The teaching day ended at ${daySessionEndTime.value}. Press X to stop the alarm.`
  )
}

const getAudioContext = async () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  return audioContext
}

const unlockAudio = async () => {
  const context = await getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.03)
  audioReady.value = true
}

const primeAudioFromUserGesture = () => {
  unlockAudio()
  requestNotificationPermission()
}

const playBell = async () => {
  if (!alarmEnabled.value) return

  if ('vibrate' in navigator) {
    navigator.vibrate([300, 120, 300, 120, 500])
  }

  const context = await getAudioContext()
  if (!context) return

  try {
    const startTime = context.currentTime

    currentAlarmTone.value.pulses.forEach((pulse) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = startTime + pulse.at

      oscillator.type = currentAlarmTone.value.type
      oscillator.frequency.setValueAtTime(pulse.from, start)
      oscillator.frequency.setValueAtTime(pulse.to, start + Math.min(0.18, pulse.duration / 2))
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.32, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + pulse.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + pulse.duration + 0.02)
    })
  } catch (error) {
    // Some browsers block audio until the teacher interacts with the page.
  }
}

const stopAlarm = () => {
  endAlert.ringing = false

  if (alarmRepeatTimer) {
    window.clearInterval(alarmRepeatTimer)
    alarmRepeatTimer = null
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(0)
  }
}

const startPersistentAlarm = () => {
  stopAlarm()

  if (!alarmEnabled.value) return

  endAlert.ringing = true
  playBell()
  alarmRepeatTimer = window.setInterval(() => {
    playBell()
  }, 2600)
}

const dismissEndAlert = () => {
  stopAlarm()
  endAlert.visible = false
}

const toggleAlarm = () => {
  alarmEnabled.value = !alarmEnabled.value
  localStorage.setItem('teacherPeriodAlarmEnabled', JSON.stringify(alarmEnabled.value))
  if (!alarmEnabled.value) stopAlarm()
  if (alarmEnabled.value) {
    unlockAudio()
    requestNotificationPermission()
  }
}

const selectAlarmTone = (index) => {
  alarmToneIndex.value = index
  localStorage.setItem('teacherPeriodAlarmTone', String(alarmToneIndex.value))
  showToneMenu.value = false
  unlockAudio()
  requestNotificationPermission()
  playBell()
}

const minutesUntil = (date) => (date.getTime() - now.value.getTime()) / 60000

const checkMissedAlarms = () => {
  if (weekendMode.value) return
  if (!alarmEnabled.value || !lessons.value.length) return

  if (daySessionEnded.value) {
    showDayEndedAlert()
    return
  }

  if (currentLesson.value) {
    const start = lessonStartDate(currentLesson.value)
    if (minutesUntil(start) <= 0 && minutesUntil(start) >= -10) {
      showPeriodStartAlert(currentLesson.value)
    }
    return
  }

  const endedLesson = sortedLessons.value
    .filter((lesson) => lesson.day_of_week === todayName.value)
    .filter((lesson) => {
      const end = lessonEndDate(lesson)
      return minutesUntil(end) <= 0 && minutesUntil(end) >= -10
    })
    .sort((a, b) => lessonEndDate(b).getTime() - lessonEndDate(a).getTime())[0]

  if (endedLesson) {
    showPeriodEndAlert(endedLesson)
  }
}

const tickClock = () => {
  now.value = new Date()
  window.setTimeout(checkMissedAlarms, 0)
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
    const [settingsResponse, timetableResponse] = await Promise.all([
      api.get('/settings/timetable', { showGlobalLoader: false }).catch(() => ({ data: { settings: null } })),
      api.get(`/timetable/teacher/${teacherId}`, { showGlobalLoader: false })
    ])
    timetableSettings.value = settingsResponse.data.settings || null
    lessons.value = (timetableResponse.data.timetables || []).filter(isTeacherLesson)
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

  if (lesson && previousId !== lessonId) {
    showPeriodStartAlert(lesson)
  }

  previousCurrentId = lessonId
})

watch(daySessionEnded, (ended) => {
  if (ended && !lastDayEndedState) {
    showDayEndedAlert()
  }
  lastDayEndedState = ended
})

onMounted(async () => {
  const savedAlarm = localStorage.getItem('teacherPeriodAlarmEnabled')
  if (savedAlarm !== null) {
    try {
      alarmEnabled.value = JSON.parse(savedAlarm)
    } catch (error) {
      alarmEnabled.value = true
    }
  }

  const savedTone = Number(localStorage.getItem('teacherPeriodAlarmTone'))
  if (Number.isInteger(savedTone) && savedTone >= 0 && savedTone < alarmTones.length) {
    alarmToneIndex.value = savedTone
  }

  await loadTeacherLessons()
  previousCurrentId = currentLesson.value?.timetable_id || null
  lastDayEndedState = daySessionEnded.value
  checkMissedAlarms()

  clockTimer = window.setInterval(tickClock, 1000)
  document.addEventListener('visibilitychange', tickClock)
  window.addEventListener('pointerdown', primeAudioFromUserGesture, { once: true })
  window.addEventListener('keydown', primeAudioFromUserGesture, { once: true })
  window.addEventListener('touchstart', primeAudioFromUserGesture, { once: true })
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  document.removeEventListener('visibilitychange', tickClock)
  window.removeEventListener('pointerdown', primeAudioFromUserGesture)
  window.removeEventListener('keydown', primeAudioFromUserGesture)
  window.removeEventListener('touchstart', primeAudioFromUserGesture)
  stopAlarm()
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
  width: min(100%, 176px);
  margin: 0 auto;
  padding: 0.45rem 0.26rem 0.68rem;
}

.top-crown {
  display: none;
}

.watch-face {
  position: relative;
  z-index: 1;
  padding: 0.78rem 0.58rem 3.35rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent 12%),
    linear-gradient(160deg, #273241 0%, #05080d 78%);
  border: 1px solid #0a0d10;
  border-radius: 28px;
  box-shadow:
    inset 0 3px 8px rgba(255, 255, 255, 0.12),
    inset 0 -18px 26px rgba(0, 0, 0, 0.88),
    0 14px 24px rgba(15, 23, 42, 0.24);
}

.screen {
  overflow: hidden;
  min-height: 244px;
  padding: 0.58rem 0.45rem 0.5rem;
  color: #182013;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), transparent 22%),
    #d2ddc5;
  border: 4px solid #08101a;
  border-radius: 22px;
  box-shadow:
    inset 0 2px 8px rgba(255, 255, 255, 0.42),
    inset 0 -7px 12px rgba(15, 23, 42, 0.14);
}

.screen-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 22px;
  padding-bottom: 0.42rem;
  border-bottom: 1px solid rgba(31, 42, 17, 0.5);
}

.screen-top strong {
  overflow: hidden;
  color: #111827;
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.alarm-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  min-width: 40px;
  height: 21px;
  padding: 0 0.32rem;
  border: 2px solid rgba(17, 24, 39, 0.45);
  border-radius: 7px;
  color: #4b5563;
  background: rgba(248, 250, 252, 0.58);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-size: 0.5rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
}

.alarm-toggle.enabled {
  color: #111827;
  background: #eef7df;
  border-color: rgba(31, 42, 17, 0.55);
}

.alarm-toggle:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

.alarm-toggle i {
  font-size: 0.62rem;
  line-height: 1;
}

.period-summary {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.12rem 0.4rem;
  min-height: 58px;
  padding: 0.68rem 0 0.48rem;
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
  font-size: 0.64rem;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.period-summary strong {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
  max-width: 68px;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
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
  min-height: 56px;
  padding: 0.42rem 0 0.35rem;
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
  font-size: 0.52rem;
  line-height: 1.05;
  text-transform: uppercase;
}

.timer-local-time {
  font-size: clamp(0.96rem, 10cqw, 1.18rem);
  line-height: 1;
}

.timer-caption {
  padding: 0.28rem 0 0.38rem;
  border-bottom: 5px solid #111827;
  color: #1f2a11;
  font-size: 0.52rem;
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
  min-height: 48px;
  padding: 0.58rem 0.12rem 0.32rem;
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
  font-size: 0.5rem;
  font-weight: 950;
  letter-spacing: 0.01em;
  line-height: 1.15;
  text-transform: uppercase;
}

.watch-metrics strong {
  margin-top: 0.42rem;
  color: #151b12;
  font-size: 0.62rem;
  font-weight: 950;
  line-height: 1.12;
  max-height: 2.3em;
}

.mode-button {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 0.95rem;
  width: 74px;
  height: 30px;
  border: 1px solid #050608;
  border-radius: 18px;
  color: #f8fafc;
  background: linear-gradient(180deg, #303a48 0%, #111827 68%);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.18), 0 2px 4px rgba(0, 0, 0, 0.42);
  cursor: pointer;
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0.02em;
  transform: translateX(-50%);
}

.mode-button:disabled {
  opacity: 0.76;
  cursor: default;
}

.tone-menu {
  position: absolute;
  z-index: 4;
  left: 50%;
  bottom: 3.35rem;
  display: grid;
  gap: 0.26rem;
  width: 124px;
  padding: 0.36rem;
  border: 1px solid #0f172a;
  border-radius: 10px;
  background: #f8fafc;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.3);
  transform: translateX(-50%);
}

.tone-menu button {
  min-height: 28px;
  border: 1px solid #dbe5f3;
  border-radius: 7px;
  color: #111827;
  background: #ffffff;
  cursor: pointer;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
  text-align: center;
}

.tone-menu button:hover,
.tone-menu button:focus-visible,
.tone-menu button.active {
  border-color: #2563eb;
  color: #f8fafc;
  background: #2563eb;
  outline: none;
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
