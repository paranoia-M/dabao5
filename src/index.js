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
            path: 'dashboard',
            name: 'Dashboard',
            component: () => import('@/views/Dashboard.vue')
          },
          {
            path: 'security-monitor',
            name: 'SecurityMonitor',
            component: () => import('@/views/SecurityMonitor.vue')
          },
          {
            path: 'log-management',
            name: 'LogManagement',
            component: () => import('@/views/LogManagement.vue')
          },
          {
            path: 'alarm-management',
            name: 'AlarmManagement',
            component: () => import('@/views/AlarmManagement.vue')
          },
          {
            path: 'system-config',
            name: 'SystemConfig',
            component: () => import('@/views/SystemConfig.vue')
          },
          {
            path: 'user-management',
            name: 'UserManagement',
            component: () => import('@/views/UserManagement.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router