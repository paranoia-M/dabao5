import { createWebHistory, createRouter } from 'vue-router'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    children: [
          {
            path: '',
            name: 'Home',
            component: () => import('@/views/Home.vue')
          },
    
          {
            path: 'calibration',
            name: 'Calibration',
            component: () => import('@/views/Calibration.vue')
          },
          {
            path: 'data-management',
            name: 'DataManagement',
            component: () => import('@/views/DataManagement.vue')
          },
          {
            path: 'alarm',
            name: 'Alarm',
            component: () => import('@/views/Alarm.vue')
          },
          {
            path: 'report',
            name: 'Report',
            component: () => import('@/views/Report.vue')
          },
          {
            path: 'system-setting',
            name: 'SystemSetting',
            component: () => import('@/views/SystemSetting.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router