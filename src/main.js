import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import * as ElIcons from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './styles/theme.css'

import App from './App.vue'
import router from './router'
import { seedIfEmpty } from './mock/seed.js'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

seedIfEmpty()

const app = createApp(App)
for (const [name, comp] of Object.entries(ElIcons)) {
  app.component(name, comp)
}
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
