<template>
  <Teleport to="body">
    <div class="top-feedback" aria-live="polite" aria-atomic="true">
      <Transition name="progress">
        <div v-if="loading" class="top-progress" aria-hidden="true">
          <span></span>
        </div>
      </Transition>

      <TransitionGroup
        name="notice"
        tag="div"
        class="notification-stack"
        :style="notificationStackStyle"
      >
        <article
          v-for="item in notifications.items"
          :key="item.id"
          class="notification"
          :class="item.type"
        >
          <div>
            <strong>{{ item.complete ? item.title : progressTitle(item) }}</strong>
            <p>{{ item.complete ? item.message : `Progress ${item.progress}%` }}</p>
          </div>
          <button type="button" aria-label="Dismiss notification" @click="notifications.remove(item.id)">
            x
          </button>
          <span class="notification-progress" aria-hidden="true">
            <span :style="{ width: `${item.progress}%` }"></span>
          </span>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notifications'

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const notifications = useNotificationStore()

const notificationStackStyle = {
  position: 'fixed',
  top: '5.25rem',
  right: '1rem',
  left: 'auto',
  transform: 'none'
}

const progressTitle = (item) => {
  if (item.type === 'error') return 'Checking failed action...'
  if (item.type === 'success') return 'Saving changes...'
  if (item.type === 'warning') return 'Checking action...'
  return 'Processing...'
}
</script>

<style scoped>
.top-feedback {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100000;
  pointer-events: none;
}

.top-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  background: rgba(37, 99, 235, 0.14);
}

.top-progress span {
  display: block;
  width: 42%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #22c55e);
  animation: progress-slide 1.05s ease-in-out infinite;
}

.notification-stack {
  position: fixed;
  top: 5.25rem;
  right: 1rem;
  left: auto;
  transform: none;
  display: grid;
  gap: 0.65rem;
  width: min(420px, calc(100vw - 2rem));
}

.notification {
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.05rem;
  border: 1px solid #dbe5f3;
  border-left-width: 5px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
  color: #172033;
}

.notification strong {
  display: block;
  margin-bottom: 0.15rem;
  font-size: 0.9rem;
}

.notification p {
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.35;
}

.notification button {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-weight: 900;
  line-height: 1;
}

.notification.success {
  border-color: #bbf7d0;
  border-left-color: #16a34a;
  background: #f0fdf4;
}

.notification.error {
  border-color: #fecaca;
  border-left-color: #dc2626;
  background: #fef2f2;
}

.notification.info {
  border-color: #bfdbfe;
  border-left-color: #2563eb;
  background: #eff6ff;
}

.notification.warning {
  border-color: #fde68a;
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.notification-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 4px;
  background: rgba(15, 23, 42, 0.08);
}

.notification-progress span {
  display: block;
  width: 1%;
  height: 100%;
  transition: width 0.08s linear;
}

.notification.success .notification-progress span {
  background: #16a34a;
}

.notification.error .notification-progress span {
  background: #dc2626;
}

.notification.info .notification-progress span {
  background: #2563eb;
}

.notification.warning .notification-progress span {
  background: #f59e0b;
}

:global(body.admin-dark-mode) .notification {
  border-color: #334155;
  background: #172033;
  color: #f8fafc;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
}

:global(body.admin-dark-mode) .notification p,
:global(body.admin-dark-mode) .notification button {
  color: #cbd5e1;
}

.notice-enter-active,
.notice-leave-active,
.notice-move {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.progress-enter-active,
.progress-leave-active {
  transition: opacity 0.18s ease;
}

.progress-enter-from,
.progress-leave-to {
  opacity: 0;
}

@keyframes progress-slide {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(260%);
  }
}

@media (max-width: 640px) {
  .notification-stack {
    top: 76px;
    right: 10px;
    left: 10px;
    transform: none;
    width: auto;
  }
}
</style>
