import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '首页概览', module: '工作台' } },
      { path: 'asset-catalog', name: 'AssetCatalog', component: () => import('@/views/AssetCatalog.vue'), meta: { title: '资产目录', module: '数据资产' } },
      { path: 'asset-profile/:id', name: 'AssetProfile', component: () => import('@/views/AssetProfile.vue'), meta: { title: '资产详情', module: '数据资产' } },
      { path: 'quality-monitor', name: 'QualityMonitor', component: () => import('@/views/QualityMonitor.vue'), meta: { title: '质量监控', module: '数据治理' } },
      { path: 'standard-config', name: 'StandardConfig', component: () => import('@/views/StandardConfig.vue'), meta: { title: '标准配置', module: '数据治理' } },
      { path: 'integration-schedule', name: 'IntegrationSchedule', component: () => import('@/views/IntegrationSchedule.vue'), meta: { title: '集成计划', module: '数据开发' } },
      { path: 'api-register', name: 'ApiRegister', component: () => import('@/views/ApiRegister.vue'), meta: { title: 'API注册', module: '数据服务' } },
      { path: 'grant-approval', name: 'GrantApproval', component: () => import('@/views/GrantApproval.vue'), meta: { title: '授权审批', module: '数据服务' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 企业智能数据管理综合服务平台'
  next()
})

export default router
