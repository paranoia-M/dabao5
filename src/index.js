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
            path: 'project-list',
            name: 'ProjectList',
            component: () => import('@/views/ProjectList.vue')
          },
          {
            path: 'project-detail',
            name: 'ProjectDetail',
            component: () => import('@/views/ProjectDetail.vue')
          },
          {
            path: 'project-create',
            name: 'ProjectCreate',
            component: () => import('@/views/ProjectCreate.vue')
          },
          {
            path: 'project-edit',
            name: 'ProjectEdit',
            component: () => import('@/views/ProjectEdit.vue')
          },
          {
            path: 'material-manage',
            name: 'MaterialManage',
            component: () => import('@/views/MaterialManage.vue')
          },
          {
            path: 'approval-process',
            name: 'ApprovalProcess',
            component: () => import('@/views/ApprovalProcess.vue')
          },
          {
            path: 'user-center',
            name: 'UserCenter',
            component: () => import('@/views/UserCenter.vue')
          },
          {
            path: 'system-setting',
            name: 'SystemSetting',
            component: () => import('@/views/SystemSetting.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router