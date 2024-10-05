import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/renderer/App.vue'
import router from '@/renderer/router'
import vuetify from '@/renderer/plugins/vuetify'
//import i18n from '@/renderer/plugins/i18n'

// Add API key defined in contextBridge to window object type
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    mainApi?: any
  }
}

const app = createApp(App)

app.config.globalProperties.$filters = {
  minutes(value) {
    if (!value || typeof value !== 'number') return '00:00'
    let min = parseInt(value / 60)
    let sec = parseInt(value % 60)
    min = min < 10 ? '0' + min : min
    sec = sec < 10 ? '0' + sec : sec
    value = min + ':' + sec
    return value
  }
}

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
