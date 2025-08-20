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
    let min = Math.floor(value / 60)
    let sec = Math.floor(value % 60)
    let min_str = min < 10 ? '0' + min : min
    let sec_str = sec < 10 ? '0' + sec : sec
    let value_str = min_str + ':' + sec_str
    return value_str
  },
  toMinAndHours(seconds) {
    var date = new Date(0)
    date.setSeconds(seconds)
    return date.toISOString().substr(11, 8)
  }
}

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
