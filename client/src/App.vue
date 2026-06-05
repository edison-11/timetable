<template>
  <TopLoadingBar />
  <Preloader :loading="isBootLoading" />
  <TopFeedback :loading="isRequestLoading" />
  <router-view />
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import Preloader from '@/components/Preloader.vue'
import TopFeedback from '@/components/TopFeedback.vue'
import TopLoadingBar from '@/components/TopLoadingBar.vue'
import { watchAppLanguage } from '@/utils/language'

const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const isBootLoading = computed(() => loadingStore.bootLoading)
const isRequestLoading = computed(() => loadingStore.pendingRequests > 0 || loadingStore.routeLoading)
let languageObserver = null
const minimumBootTime = 900

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

loadingStore.startBoot()

onMounted(async () => {
  languageObserver = watchAppLanguage()
  const bootStartedAt = performance.now()

  try {
    await authStore.checkAuth()
  } finally {
    const elapsed = performance.now() - bootStartedAt
    if (elapsed < minimumBootTime) {
      await wait(minimumBootTime - elapsed)
    }
    loadingStore.finishBoot()
  }
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
