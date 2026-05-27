<template>
  <section class="app-state app-state-empty" aria-live="polite">
    <div class="state-mark" aria-hidden="true"></div>
    <div class="state-copy">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: 'Data will appear here once it is available.' }
})
</script>

<style scoped>
.app-state {
  display: grid;
  justify-items: center;
  gap: 0.7rem;
  min-height: 190px;
  padding: 2rem 1.25rem;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #ffffff;
  color: #172033;
  text-align: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  animation: state-enter 0.18s ease both;
}

.state-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 1px solid #bfdbfe;
}

h2 {
  margin: 0;
  color: #172033;
  font-size: 1.12rem;
  font-weight: 850;
}

p {
  max-width: 520px;
  margin: 0;
  color: #64748b;
  font-weight: 650;
}

:global(body.admin-dark-mode) .app-state,
:global(body.teacher-dark-mode) .app-state {
  background: #111827;
  border-color: #243244;
}

:global(body.admin-dark-mode) h2,
:global(body.teacher-dark-mode) h2 {
  color: #f8fafc;
}

:global(body.admin-dark-mode) p,
:global(body.teacher-dark-mode) p {
  color: #cbd5e1;
}

@keyframes state-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
