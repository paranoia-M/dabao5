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
            path: 'risk-assessment',
            name: 'RiskAssessment',
            component: () => import('@/views/RiskAssessment.vue')
          },
          {
            path: 'risk-control',
            name: 'RiskControl',
            component: () => import('@/views/RiskControl.vue')
          },
          {
            path: 'early-warning',
            name: 'EarlyWarning',
            component: () => import('@/views/EarlyWarning.vue')
          },
          {
            path: 'statistics-analysis',
            name: 'StatisticsAnalysis',
            component: () => import('@/views/StatisticsAnalysis.vue')
          },
          {
            path: 'system-management',
            name: 'SystemManagement',
            component: () => import('@/views/SystemManagement.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router