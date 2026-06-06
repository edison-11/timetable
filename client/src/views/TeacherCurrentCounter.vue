<template>
  <TeacherLayout>
    <div class="current-counter-page">
      <section class="counter-hero">
        <div>
          <span class="eyebrow">Current Counter</span>
          <h1>Live Period Counter</h1>
          <p>Track the current lesson, next class, room, and remaining time.</p>
        </div>
      </section>

      <section id="current-counter" class="counter-stage" aria-label="Current period counter">
        <TeacherPeriodTimer />
      </section>
    </div>
  </TeacherLayout>
</template>

<script setup>
import TeacherLayout from '@/components/TeacherLayout.vue'
import TeacherPeriodTimer from '@/components/TeacherPeriodTimer.vue'
</script>

<style scoped>
.current-counter-page {
  min-height: 100vh;
  padding: 1.5rem;
  color: #0f172a;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
}

.counter-hero,
.counter-stage {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.counter-hero {
  padding: 1.35rem;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
}

.eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.counter-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.8rem;
  font-weight: 900;
}

.counter-hero p {
  margin: 0.35rem 0 0;
  color: #52627a;
}

.counter-stage {
  display: grid;
  place-items: center;
  margin-top: 1rem;
  padding: 1.25rem;
}

.counter-stage :deep(.stopwatch) {
  width: min(100%, 340px);
}

.counter-stage :deep(.watch-face) {
  border-radius: 34px;
}

.counter-stage :deep(.screen) {
  min-height: 360px;
}

:global(body.teacher-dark-mode) .current-counter-page {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .counter-hero,
:global(body.teacher-dark-mode) .counter-stage {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

:global(.teacher-shell.dark-mode) .current-counter-page {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%) !important;
  color: #e5edf7 !important;
}

:global(.teacher-shell.dark-mode) .counter-hero,
:global(.teacher-shell.dark-mode) .counter-stage {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .counter-hero h1,
:global(.teacher-shell.dark-mode) .counter-hero h1 {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .counter-hero p,
:global(.teacher-shell.dark-mode) .counter-hero p {
  color: #cbd5e1 !important;
}
</style>
