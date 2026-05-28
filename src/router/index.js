import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据概览仪表盘', module: '首页概览' } },
      { path: 'model-library', name: 'ModelLibrary', component: () => import('@/views/ModelLibrary.vue'), meta: { title: '模型库', module: '模型管理' } },
      { path: 'model-view', name: 'ModelView', component: () => import('@/views/ModelView.vue'), meta: { title: '模型详情', module: '模型管理' } },
      { path: 'share-approval', name: 'ShareApproval', component: () => import('@/views/ShareApproval.vue'), meta: { title: '共享审批', module: '共享协作' } },
      { path: 'team-members', name: 'TeamMembers', component: () => import('@/views/TeamMembers.vue'), meta: { title: '团队管理', module: '共享协作' } },
      { path: 'my-assets', name: 'MyAssets', component: () => import('@/views/MyAssets.vue'), meta: { title: '我的资产', module: '个人工作台' } },
      { path: 'usage-statistics', name: 'UsageStatistics', component: () => import('@/views/UsageStatistics.vue'), meta: { title: '使用统计', module: '个人工作台' } },
      { path: 'model-category', name: 'ModelCategory', component: () => import('@/views/ModelCategory.vue'), meta: { title: '模型分类', module: '系统配置' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 三维模型资产库管理与共享平台'
  next()
})

export default router
