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
            name: 'Dashboard',
            component: () => import('@/views/Dashboard.vue')
          },
          {
            path: 'real-time-monitoring',
            name: 'RealTimeMonitoring',
            component: () => import('@/views/RealTimeMonitoring.vue')
          },
          {
            path: 'environment-data',
            name: 'EnvironmentData',
            component: () => import('@/views/EnvironmentData.vue')
          },
          {
            path: 'device-management',
            name: 'DeviceManagement',
            component: () => import('@/views/DeviceManagement.vue')
          },
          {
            path: 'alarm-management',
            name: 'AlarmManagement',
            component: () => import('@/views/AlarmManagement.vue')
          },
          {
            path: 'data-analysis',
            name: 'DataAnalysis',
            component: () => import('@/views/DataAnalysis.vue')
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