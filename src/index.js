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
            path: 'communication-data',
            name: 'CommunicationData',
            component: () => import('@/views/CommunicationData.vue')
          },
          {
            path: 'signal-analysis',
            name: 'SignalAnalysis',
            component: () => import('@/views/SignalAnalysis.vue')
          },
          {
            path: 'equipment-management',
            name: 'EquipmentManagement',
            component: () => import('@/views/EquipmentManagement.vue')
          },
          {
            path: 'user-management',
            name: 'UserManagement',
            component: () => import('@/views/UserManagement.vue')
          },
          {
            path: 'system-logs',
            name: 'SystemLogs',
            component: () => import('@/views/SystemLogs.vue')
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