<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="cancel">
        <section
          ref="modalRef"
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.tab.prevent="cycleFocus"
        >
          <header>
            <h2 :id="titleId">{{ title }}</h2>
            <button type="button" class="icon-close" aria-label="Close dialog" @click="cancel">x</button>
          </header>
          <p>{{ description }}</p>
          <footer>
            <button ref="cancelRef" type="button" class="cancel-btn" :disabled="loading" @click="cancel">
              {{ cancelLabel }}
            </button>
            <button
              ref="confirmRef"
              type="button"
              class="confirm-btn"
              :class="{ danger }"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              {{ loading ? loadingLabel : confirmLabel }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  description: { type: String, default: 'Are you sure you want to continue?' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  loadingLabel: { type: String, default: 'Working...' },
  loading: { type: Boolean, default: false },
  danger: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
const modalRef = ref(null)
const cancelRef = ref(null)
const confirmRef = ref(null)
const titleId = `confirm-title-${Math.random().toString(36).slice(2)}`
let previousActive = null

const cancel = () => {
  if (props.loading) return
  emit('cancel')
  emit('update:modelValue', false)
}

const onKeydown = (event) => {
  if (event.key === 'Escape' && props.modelValue) cancel()
}

const cycleFocus = (event) => {
  const focusables = [cancelRef.value, confirmRef.value].filter(Boolean)
  if (!focusables.length) return
  const currentIndex = focusables.indexOf(document.activeElement)
  const nextIndex = event.shiftKey
    ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
    : (currentIndex === focusables.length - 1 ? 0 : currentIndex + 1)
  focusables[nextIndex]?.focus()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      previousActive = document.activeElement
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      modalRef.value?.focus()
      cancelRef.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      previousActive?.focus?.()
    }
  }
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(5px);
}

.confirm-modal {
  width: min(100%, 440px);
  border: 1px solid #dbe5f3;
  border-radius: 10px;
  background: #ffffff;
  color: #172033;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
  padding: 1.2rem;
  outline: none;
}

header,
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

h2 {
  margin: 0;
  color: #172033;
  font-size: 1.18rem;
  font-weight: 850;
}

p {
  margin: 0.75rem 0 1.25rem;
  color: #64748b;
  font-weight: 650;
}

.icon-close {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 7px;
  background: #f1f5f9;
  color: #334155;
  font-weight: 900;
}

.cancel-btn,
.confirm-btn {
  min-height: 40px;
  border: 0;
  border-radius: 7px;
  padding: 0.65rem 1rem;
  font-weight: 850;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.confirm-btn {
  background: #2563eb;
  color: #ffffff;
}

.confirm-btn.danger {
  background: #dc2626;
}

button:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.3);
  outline-offset: 2px;
}

:global(body.admin-dark-mode) .confirm-modal,
:global(body.teacher-dark-mode) .confirm-modal {
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

:global(body.admin-dark-mode) .icon-close,
:global(body.teacher-dark-mode) .icon-close,
:global(body.admin-dark-mode) .cancel-btn,
:global(body.teacher-dark-mode) .cancel-btn {
  background: #243244;
  color: #e5edf7;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.16s ease;
}

.modal-fade-enter-active .confirm-modal,
.modal-fade-leave-active .confirm-modal {
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .confirm-modal,
.modal-fade-leave-to .confirm-modal {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}
</style>
