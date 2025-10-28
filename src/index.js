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
            path: 'monitoring',
            name: 'Monitoring',
            component: () => import('@/views/Monitoring.vue')
          },
          {
            path: 'alarm',
            name: 'Alarm',
            component: () => import('@/views/Alarm.vue')
          },
          {
            path: 'statistics',
            name: 'Statistics',
            component: () => import('@/views/Statistics.vue')
          },
          {
            path: 'settings',
            name: 'Settings',
            component: () => import('@/views/Settings.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router