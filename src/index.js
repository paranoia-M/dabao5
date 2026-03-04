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
            path: 'device-monitor',
            name: 'DeviceMonitor',
            component: () => import('@/views/device/DeviceMonitor.vue')
          },
          {
            path: 'energy-management',
            name: 'EnergyManagement',
            component: () => import('@/views/energy/EnergyManagement.vue')
          },
          {
            path: 'environment-control',
            name: 'EnvironmentControl',
            component: () => import('@/views/environment/EnvironmentControl.vue')
          },
          {
            path: 'security-system',
            name: 'SecuritySystem',
            component: () => import('@/views/security/SecuritySystem.vue')
          },
          {
            path: 'alarm-center',
            name: 'AlarmCenter',
            component: () => import('@/views/alarm/AlarmCenter.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router