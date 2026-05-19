<template>
  <Preloader :loading="isGlobalLoading" />
  <router-view />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import Preloader from '@/components/Preloader.vue'

const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const router = useRouter()
const isGlobalLoading = computed(() => loadingStore.isLoading)

router.beforeEach((to, from, next) => {
  if (to.fullPath !== from.fullPath) loadingStore.startRoute()
  next()
})

router.afterEach(() => {
  loadingStore.finishRoute()
})

router.onError(() => {
  loadingStore.finishRoute()
})

onMounted(async () => {
  loadingStore.startBoot()
  await authStore.checkAuth()
  loadingStore.finishBoot()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fb;
}
</style>
