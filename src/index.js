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
            path: 'data-monitoring',
            name: 'DataMonitoring',
            component: () => import('@/views/DataMonitoring.vue')
          },
          {
            path: 'quality-assessment',
            name: 'QualityAssessment',
            component: () => import('@/views/QualityAssessment.vue')
          },
          {
            path: 'data-fusion',
            name: 'DataFusion',
            component: () => import('@/views/DataFusion.vue')
          },
          {
            path: 'report-generation',
            name: 'ReportGeneration',
            component: () => import('@/views/ReportGeneration.vue')
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