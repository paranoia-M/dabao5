import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/line-dashboard',
    children: [
      { path: 'line-dashboard', name: 'LineDashboard', component: () => import('@/views/LineDashboard.vue'), meta: { title: '生产总览', module: '首页概览' } },
      { path: 'line-monitor', name: 'LineMonitor', component: () => import('@/views/LineMonitor.vue'), meta: { title: '实时监控', module: '产线监控' } },
      { path: 'alarm-history', name: 'AlarmHistory', component: () => import('@/views/AlarmHistory.vue'), meta: { title: '报警历史', module: '产线监控' } },
      { path: 'inspection-tasks', name: 'InspectionTasks', component: () => import('@/views/InspectionTasks.vue'), meta: { title: '检测任务', module: '质量检测' } },
      { path: 'inspection-standards', name: 'InspectionStandards', component: () => import('@/views/InspectionStandards.vue'), meta: { title: '检测标准', module: '质量检测' } },
      { path: 'maintenance-schedule', name: 'MaintenanceSchedule', component: () => import('@/views/MaintenanceSchedule.vue'), meta: { title: '维护计划', module: '维护管理' } },
      { path: 'maintenance-orders', name: 'MaintenanceOrders', component: () => import('@/views/MaintenanceOrders.vue'), meta: { title: '维护工单', module: '维护管理' } },
      { path: 'report-center', name: 'ReportCenter', component: () => import('@/views/ReportCenter.vue'), meta: { title: '报表中心', module: '报表分析' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 食品生产线智能监控软件'
  next()
})

export default router
