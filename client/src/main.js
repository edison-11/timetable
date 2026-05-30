import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// Import Bootstrap JavaScript
import "bootstrap/dist/js/bootstrap.bundle.min.js"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

requestAnimationFrame(() => {
  const firstPaintLoader = document.getElementById('first-paint-loader')
  if (firstPaintLoader) {
    firstPaintLoader.style.opacity = '0'
    firstPaintLoader.style.transition = 'opacity 220ms ease'
    setTimeout(() => firstPaintLoader.remove(), 240)
  }
})
