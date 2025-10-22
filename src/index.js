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
            path: 'knowledge-base',
            name: 'KnowledgeBase',
            component: () => import('@/views/KnowledgeBase.vue')
          },
          {
            path: 'classification',
            name: 'Classification',
            component: () => import('@/views/Classification.vue')
          },
          {
            path: 'integration',
            name: 'Integration',
            component: () => import('@/views/Integration.vue')
          },
          {
            path: 'settings',
            name: 'Settings',
            component: () => import('@/views/Settings.vue')
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