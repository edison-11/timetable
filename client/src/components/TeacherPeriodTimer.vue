<template>
  <section class="period-timer" :class="{ active: currentLesson, idle: !currentLesson }">
    <div class="timer-head">
      <div class="timer-icon" aria-hidden="true">
        <i class="bi bi-stopwatch"></i>
      </div>

      <div class="timer-copy">
        <span class="timer-kicker">{{ watchMode }}</span>
        <strong>{{ lessonTitle }}</strong>
        <small>{{ lessonMeta }}</small>
      </div>

      <button
        class="alert-toggle"
        type="button"
        :aria-pressed="alertEnabled"
        :title="alertEnabled ? 'Disable alerts' : 'Enable alerts'"
        @click="toggleAlert"
      >
        <i :class="alertEnabled ? 'bi bi-bell-fill' : 'bi bi-bell'"></i>
      </button>
    </div>

    <div class="timer-body">
      <div class="timer-status">
        <span>{{ statusLabel }}</span>
        <strong>{{ timerText }}</strong>
        <small>{{ timerHint }}</small>
      </div>

      <div class="timer-details">
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
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const alertEnabled = ref(localStorage.getItem('teacherPeriodAlerts') !== 'false')
const timetableEntries = ref([])
const now = ref(new Date())

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const currentTeacherId = computed(() => authStore.currentUser?.teacher_id || authStore.currentUser?.id || null)

const normalizeTime = (value) => String(value || '').slice(0, 5)

const toMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const todayName = computed(() => days[now.value.getDay() - 1] || '')

const todayLessons = computed(() => timetableEntries.value
  .filter((entry) => String(entry.teacher_id || '') === String(currentTeacherId.value || '') && entry.day_of_week === todayName.value)
  .map((entry) => {
    const startMinutes = toMinutes(entry.start_time)
    const endMinutes = toMinutes(entry.end_time)
    return {
      ...entry,
      startDate: startMinutes === null ? null : new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate(), Math.floor(startMinutes / 60), startMinutes % 60, 0, 0),
      endDate: endMinutes === null ? null : new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate(), Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)
    }
  })
  .filter((entry) => entry.startDate && entry.endDate && entry.endDate > entry.startDate)
  .sort((a, b) => a.startDate - b.startDate))

const currentLesson = computed(() => todayLessons.value.find((lesson) => lesson.startDate.getTime() <= now.value.getTime() && lesson.endDate.getTime() > now.value.getTime()) || null)
const nextLesson = computed(() => todayLessons.value.find((lesson) => lesson.startDate.getTime() > now.value.getTime()) || null)
const displayLesson = computed(() => currentLesson.value || nextLesson.value)

const watchMode = computed(() => {
  if (currentLesson.value) return 'TEACH'
  if (nextLesson.value) return 'READY'
  return 'CLOCK'
})

const lessonTitle = computed(() => displayLesson.value?.module_name || (todayLessons.value.length ? 'All lessons complete' : 'Free day'))

const lessonMeta = computed(() => {
  const lesson = displayLesson.value
  if (!lesson) return 'Minimal lesson tracker'
  return `${lesson.class_name || 'General'} · ${lesson.room_name || lesson.room || 'TBA'}`
})

const statusLabel = computed(() => {
  if (currentLesson.value) return 'Current period'
  if (nextLesson.value) return 'Next period'
  return todayLessons.value.length ? 'Today complete' : 'No periods today'
})

const timerText = computed(() => {
  const lesson = currentLesson.value || nextLesson.value
  if (!lesson) return '--:--'
  const target = currentLesson.value ? lesson.endDate : lesson.startDate
  const diff = Math.max(0, Math.floor((target.getTime() - now.value.getTime()) / 1000))
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const timerHint = computed(() => currentLesson.value ? 'remaining' : nextLesson.value ? 'until start' : 'idle')
const classLabel = computed(() => displayLesson.value?.class_name || 'General')
const roomLabel = computed(() => displayLesson.value?.room_name || displayLesson.value?.room || 'TBA')
const startLabel = computed(() => displayLesson.value ? normalizeTime(displayLesson.value.start_time) : '--:--')
const endLabel = computed(() => displayLesson.value ? normalizeTime(displayLesson.value.end_time) : '--:--')

const toggleAlert = () => {
  alertEnabled.value = !alertEnabled.value
  localStorage.setItem('teacherPeriodAlerts', String(alertEnabled.value))
}

const loadTimetable = async () => {
  await authStore.checkAuth()
  if (!currentTeacherId.value) return
  const response = await api.get(`/timetable/teacher/${currentTeacherId.value}`)
  timetableEntries.value = response.data.timetables || []
}

onMounted(() => {
  loadTimetable().catch(() => {})
  setInterval(() => {
    now.value = new Date()
  }, 1000)
})
</script>

<style scoped>
.period-timer {
  margin: 1rem 0.75rem 0;
  padding: 0.8rem;
  border: 1px solid #dbe5f3;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.period-timer.active {
  border-color: #22c55e;
}

.timer-head {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.timer-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  flex: 0 0 36px;
}

.timer-copy {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 0.15rem;
}

.timer-kicker {
  color: #64748b;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.timer-copy strong,
.timer-copy small,
.timer-status strong,
.timer-status small,
.timer-details strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timer-copy strong {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.timer-copy small {
  color: #64748b;
  font-size: 0.72rem;
}

.alert-toggle {
  width: 34px;
  height: 34px;
  border: 1px solid #dbe5f3;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
}

.alert-toggle[aria-pressed="true"] {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.timer-body {
  display: grid;
  gap: 0.7rem;
  margin-top: 0.7rem;
}

.timer-status {
  display: grid;
  gap: 0.1rem;
  padding: 0.7rem;
  border-radius: 12px;
  background: #0f172a;
  color: #f8fafc;
}

.timer-status span,
.timer-status small,
.timer-details span {
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #cbd5e1;
}

.timer-status strong {
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 900;
}

.timer-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.timer-details > div {
  padding: 0.55rem 0.65rem;
  border-radius: 12px;
  background: #f8fafc;
}

.timer-details strong {
  display: block;
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 900;
}

@media (max-width: 900px) {
  .period-timer {
    margin-inline: 0.5rem;
  }
}
</style>
