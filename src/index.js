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
            path: 'traffic-info',
            name: 'TrafficInfo',
            component: () => import('@/views/TrafficInfo.vue')
          },
          {
            path: 'warning-info',
            name: 'WarningInfo',
            component: () => import('@/views/WarningInfo.vue')
          },
          {
            path: 'statistics',
            name: 'Statistics',
            component: () => import('@/views/Statistics.vue')
          },
          {
            path: 'system-settings',
            name: 'SystemSettings',
            component: () => import('@/views/SystemSettings.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router