import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '首页仪表盘', module: '工作台' } },
      { path: 'detect-task', name: 'DetectTask', component: () => import('@/views/DetectTask.vue'), meta: { title: '检测任务管理', module: '检测任务' } },
      { path: 'sample-records', name: 'SampleRecords', component: () => import('@/views/SampleRecords.vue'), meta: { title: '样品记录', module: '样品管理' } },
      { path: 'result-input', name: 'ResultInput', component: () => import('@/views/ResultInput.vue'), meta: { title: '结果录入', module: '检测分析' } },
      { path: 'inspection-report', name: 'InspectionReport', component: () => import('@/views/InspectionReport.vue'), meta: { title: '检测报告', module: '检测分析' } },
      { path: 'analysis-board', name: 'AnalysisBoard', component: () => import('@/views/AnalysisBoard.vue'), meta: { title: '分析看板', module: '检测分析' } },
      { path: 'alert-config', name: 'AlertConfig', component: () => import('@/views/AlertConfig.vue'), meta: { title: '预警配置', module: '预警与标准' } },
      { path: 'detect-standard', name: 'DetectStandard', component: () => import('@/views/DetectStandard.vue'), meta: { title: '检测标准', module: '预警与标准' } },
      { path: 'alert-record', name: 'AlertRecord', component: () => import('@/views/AlertRecord.vue'), meta: { title: '预警记录', module: '预警与标准' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 食品质量安全检测分析平台'
  next()
})

export default router
