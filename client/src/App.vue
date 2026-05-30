<template>
  <TopLoadingBar />
  <Preloader :loading="isGlobalLoading" />
  <router-view />
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import Preloader from '@/components/Preloader.vue'
import TopLoadingBar from '@/components/TopLoadingBar.vue'
import { watchAppLanguage } from '@/utils/language'

const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const isGlobalLoading = computed(() => loadingStore.isLoading)
let languageObserver = null

onMounted(async () => {
  languageObserver = watchAppLanguage()
  loadingStore.startBoot()
  await authStore.checkAuth()
  loadingStore.finishBoot()
})

onUnmounted(() => {
  languageObserver?.disconnect()
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
