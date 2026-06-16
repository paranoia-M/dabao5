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
            path: 'broadcast',
            name: 'Broadcast',
            component: () => import('@/views/Broadcast.vue')
          },
          {
            path: 'schedule',
            name: 'Schedule',
            component: () => import('@/views/Schedule.vue')
          },
          {
            path: 'device',
            name: 'Device',
            component: () => import('@/views/Device.vue')
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