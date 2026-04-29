import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// Import Bootstrap JavaScript
import "bootstrap/dist/js/bootstrap.bundle.min.js"

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
