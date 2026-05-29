<template>
  <Preloader :loading="isBlockingLoading" />
  <TopFeedback :loading="isRequestLoading" />
  <router-view />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import Preloader from '@/components/Preloader.vue'
import TopFeedback from '@/components/TopFeedback.vue'

const authStore = useAuthStore()
const loadingStore = useLoadingStore()
<<<<<<< HEAD
const router = useRouter()
const isBlockingLoading = computed(() => loadingStore.isBlockingLoading)
const isRequestLoading = computed(() => loadingStore.isRequestLoading)
=======
const isGlobalLoading = computed(() => loadingStore.isLoading)
>>>>>>> e13465b9deedc9a146303a1d3a68bd1ccfe46caf

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
