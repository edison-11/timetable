<template>
  <div v-if="isLoading" class="top-loading" aria-hidden="true">
    <!-- Main gradient bar with glow -->
    <div class="bar-container">
      <div class="bar bar-primary" />
      <div class="bar bar-secondary" />
      <div class="bar bar-tertiary" />
    </div>
    
    <!-- Floating particles -->
    <div class="particles">
      <div v-for="i in 5" :key="i" class="particle" :style="{ '--particle-index': i }" />
    </div>

    <!-- Fun loading text -->
    <div class="loading-text">
      <span v-for="(char, idx) in loadingChars" :key="idx" class="char" :style="{ '--char-index': idx }">
        {{ char }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
const isLoading = computed(() => loadingStore.pendingRequests > 0 || loadingStore.routeLoading || loadingStore.bootLoading)
const loadingChars = ref('Loading...'.split(''))
</script>

<style scoped>
.top-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  z-index: 9999999;
  pointer-events: none;
  box-shadow: 0 0 25px rgba(57, 153, 255, 0.8);
  background: rgba(0, 0, 0, 0.08);
}

.bar-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  background: transparent;
}

.bar {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0px;
  box-shadow: 0 0 20px rgba(57, 153, 255, 0.9), 0 0 40px rgba(0, 212, 255, 0.6);
}

.bar-primary {
  width: 0%;
  background: linear-gradient(90deg, 
    #3399ff 0%, 
    #00d4ff 25%, 
    #00ffff 50%, 
    #00d4ff 75%, 
    #3399ff 100%);
  animation: loading-primary 1.5s ease-in-out infinite;
}

.bar-secondary {
  width: 0%;
  background: linear-gradient(90deg, 
    rgba(255, 100, 255, 0.4) 0%, 
    rgba(100, 200, 255, 0.4) 50%, 
    rgba(255, 100, 255, 0.4) 100%);
  animation: loading-secondary 2s ease-in-out infinite;
  opacity: 0.8;
}

.bar-tertiary {
  width: 0%;
  background: linear-gradient(90deg, 
    rgba(255, 200, 100, 0.6) 0%, 
    rgba(100, 255, 200, 0.6) 100%);
  animation: loading-tertiary 2.5s ease-in-out infinite;
  opacity: 0.6;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.particle {
  position: absolute;
  width: 10px;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
  animation: float-particle 3s ease-in-out infinite;
  animation-delay: calc(var(--particle-index) * 0.2s);
  left: calc(var(--particle-index) * 20%);
  opacity: 0.9;
}

.loading-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 3px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  white-space: nowrap;
  background: linear-gradient(90deg, #3399ff, #00ffff, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 15px rgba(57, 153, 255, 0.5);
  opacity: 1;
  filter: drop-shadow(0 0 3px rgba(57, 153, 255, 0.6));
}

.char {
  animation: bounce-char 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  animation-delay: calc(var(--char-index) * 0.05s);
  display: inline-block;
}

/* Animations */
@keyframes loading-primary {
  0% { 
    transform: translateX(-150%); 
    width: 25%; 
  }
  50% { 
    transform: translateX(50%); 
    width: 50%; 
  }
  100% { 
    transform: translateX(200%); 
    width: 25%; 
  }
}

@keyframes loading-secondary {
  0% { 
    transform: translateX(-200%); 
    width: 35%; 
  }
  50% { 
    transform: translateX(40%); 
    width: 55%; 
  }
  100% { 
    transform: translateX(250%); 
    width: 35%; 
  }
}

@keyframes loading-tertiary {
  0% { 
    transform: translateX(-100%); 
    width: 40%; 
  }
  50% { 
    transform: translateX(35%); 
    width: 60%; 
  }
  100% { 
    transform: translateX(180%); 
    width: 40%; 
  }
}

@keyframes float-particle {
  0%, 100% {
    opacity: 0;
    transform: translateY(-2px) translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-6px) translateX(5px);
  }
}

@keyframes bounce-char {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

/* Glow effect animation */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(57, 153, 255, 0.4), 0 0 30px rgba(0, 212, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(57, 153, 255, 0.6), 0 0 50px rgba(0, 212, 255, 0.4);
  }
}

.top-loading {
  animation: glow-pulse 2s ease-in-out infinite;
}
</style>
