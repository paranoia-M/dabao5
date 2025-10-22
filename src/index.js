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
            path: 'behavior-management',
            name: 'BehaviorManagement',
            component: () => import('@/views/BehaviorManagement.vue')
          },
          {
            path: 'security-audit',
            name: 'SecurityAudit',
            component: () => import('@/views/SecurityAudit.vue')
          },
          {
            path: 'system-settings',
            name: 'SystemSettings',
            component: () => import('@/views/SystemSettings.vue')
          },
          {
            path: 'report-center',
            name: 'ReportCenter',
            component: () => import('@/views/ReportCenter.vue')
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