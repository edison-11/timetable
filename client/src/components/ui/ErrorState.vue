<template>
  <section class="app-state app-state-error" role="alert" aria-live="polite">
    <div class="state-mark" aria-hidden="true">!</div>
    <div class="state-copy">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <button v-if="actionLabel" type="button" class="state-action" @click="$emit('retry')">
      {{ actionLabel }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Unable to Load Data' },
  description: {
    type: String,
    default: "We're having trouble retrieving this information right now. Please check your internet connection or try again."
  },
  actionLabel: { type: String, default: 'Retry' }
})

defineEmits(['retry'])
</script>

<style scoped>
.app-state {
  display: grid;
  justify-items: center;
  gap: 0.7rem;
  min-height: 220px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 1.45rem;
  font-weight: 900;
}

.state-copy {
  display: grid;
  gap: 0.3rem;
}

h2 {
  margin: 0;
  color: #172033;
  font-size: 1.15rem;
  font-weight: 850;
}

p {
  max-width: 520px;
  margin: 0;
  color: #64748b;
  font-weight: 650;
}

.state-action {
  min-height: 40px;
  border: 0;
  border-radius: 7px;
  padding: 0.65rem 1rem;
  background: #2563eb;
  color: #fff;
  font-weight: 850;
  cursor: pointer;
}

.state-action:hover,
.state-action:focus-visible {
  background: #1d4ed8;
  outline: none;
}

:global(body.admin-dark-mode) .app-state,
:global(body.teacher-dark-mode) .app-state {
  background: #111827;
  border-color: #243244;
  color: #e5edf7;
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
