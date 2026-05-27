<template>
  <ConfirmModal
    :model-value="modelValue"
    :title="title"
    :description="description"
    confirm-label="Got it"
    cancel-label="Close"
    @update:modelValue="$emit('update:modelValue', $event)"
    @confirm="$emit('update:modelValue', false)"
  />
</template>

<script setup>
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Feature in Development' },
  description: {
    type: String,
    default: 'This feature is currently under active development and will be available soon.'
  }
})

defineEmits(['update:modelValue'])
</script>
