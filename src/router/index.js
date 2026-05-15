import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据概览', module: '工作台' } },
      { path: 'equipment-ledger', name: 'EquipmentLedger', component: () => import('@/views/EquipmentLedger.vue'), meta: { title: '设备台账', module: '设备管理' } },
      { path: 'equipment-profile', name: 'EquipmentProfile', component: () => import('@/views/EquipmentProfile.vue'), meta: { title: '设备详情', module: '设备管理' } },
      { path: 'inspection-task', name: 'InspectionTask', component: () => import('@/views/InspectionTask.vue'), meta: { title: '排查任务', module: '隐患排查' } },
      { path: 'hazard-record', name: 'HazardRecord', component: () => import('@/views/HazardRecord.vue'), meta: { title: '隐患记录', module: '隐患排查' } },
      { path: 'rectification-management', name: 'RectificationManagement', component: () => import('@/views/RectificationManagement.vue'), meta: { title: '整改管理', module: '隐患排查' } },
      { path: 'risk-analysis', name: 'RiskAnalysis', component: () => import('@/views/RiskAnalysis.vue'), meta: { title: '风险分析', module: '风险评估' } },
      { path: 'risk-checklist', name: 'RiskChecklist', component: () => import('@/views/RiskChecklist.vue'), meta: { title: '风险清单', module: '风险评估' } },
      { path: 'report-archive', name: 'ReportArchive', component: () => import('@/views/ReportArchive.vue'), meta: { title: '报告台账', module: '报告管理' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 特种设备安全隐患排查评估软件'
  next()
})

export default router
