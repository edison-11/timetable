<template>
  <Preloader :loading="isGlobalLoading" />
  <router-view />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Preloader from '@/components/Preloader.vue'

const authStore = useAuthStore()
const router = useRouter()
const isGlobalLoading = ref(true)
let hideLoaderTimer = null

const showLoader = () => {
  if (hideLoaderTimer) {
    clearTimeout(hideLoaderTimer)
    hideLoaderTimer = null
  }

  isGlobalLoading.value = true
}

const hideLoader = (delay = 550) => {
  if (hideLoaderTimer) clearTimeout(hideLoaderTimer)

  hideLoaderTimer = setTimeout(() => {
    isGlobalLoading.value = false
    hideLoaderTimer = null
  }, delay)
}

router.beforeEach((to, from, next) => {
  if (to.fullPath !== from.fullPath) showLoader()
  next()
})

router.afterEach(() => {
  hideLoader()
})

router.onError(() => {
  hideLoader(150)
})

onMounted(() => {
  authStore.checkAuth()
  hideLoader(700)
})

onBeforeUnmount(() => {
  if (hideLoaderTimer) clearTimeout(hideLoaderTimer)
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
