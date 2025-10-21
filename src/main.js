import {createApp} from 'vue'
import './style.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './index.js'
import App from './App.vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// router.beforeEach((to, from, next) => {
//     const token = localStorage.getItem('token')
//
//     if (!token && to.path !== '/login') {
//         next('/login')
//     } else {
//         next()
//     }
// })

app.use(ElementPlus)

app.use(router)

app.mount('#app')
