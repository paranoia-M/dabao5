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
            path: '/enterprise-list',
            name: 'EnterpriseList',
            component: () => import('@/views/enterprise/EnterpriseList.vue')
          },
          {
            path: '/preference-application',
            name: 'PreferenceApplication',
            component: () => import('@/views/application/PreferenceApplication.vue')
          },
          {
            path: '/application-history',
            name: 'ApplicationHistory',
            component: () => import('@/views/application/ApplicationHistory.vue')
          },
          {
            path: '/policy-guidance',
            name: 'PolicyGuidance',
            component: () => import('@/views/policy/PolicyGuidance.vue')
          },
          {
            path: '/audit-management',
            name: 'AuditManagement',
            component: () => import('@/views/audit/AuditManagement.vue')
          },
          {
            path: '/statistics-report',
            name: 'StatisticsReport',
            component: () => import('@/views/report/StatisticsReport.vue')
          },
          {
            path: '/user-profile',
            name: 'UserProfile',
            component: () => import('@/views/user/UserProfile.vue')
          },
          {
            path: '/system-settings',
            name: 'SystemSettings',
            component: () => import('@/views/system/SystemSettings.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router