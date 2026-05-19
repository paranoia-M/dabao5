import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router/index.ts'
import App from './App.vue'

const app = createApp(App)

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 配置Element Plus
app.use(ElementPlus, {
  size: 'default', // 设置默认尺寸
  zIndex: 3000, // 设置默认z-index
})

app.use(router)

app.mount('#app')
