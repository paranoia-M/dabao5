import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/command-overview',
    children: [
      { path: 'command-overview', name: 'CommandOverview', component: () => import('@/views/CommandOverview.vue'), meta: { title: '指挥调度大屏', module: '指挥总览' } },
      { path: 'video-surveillance', name: 'VideoSurveillance', component: () => import('@/views/VideoSurveillance.vue'), meta: { title: '实时视频监控', module: '视频监控与报警' } },
      { path: 'patrol-schedule', name: 'PatrolSchedule', component: () => import('@/views/PatrolSchedule.vue'), meta: { title: '巡查任务排程', module: '巡查管理' } },
      { path: 'patrol-record', name: 'PatrolRecord', component: () => import('@/views/PatrolRecord.vue'), meta: { title: '巡查记录查询', module: '巡查管理' } },
      { path: 'inmate-archive', name: 'InmateArchive', component: () => import('@/views/InmateArchive.vue'), meta: { title: '在押人员档案', module: '在押人员管理' } },
      { path: 'inmate-movement', name: 'InmateMovement', component: () => import('@/views/InmateMovement.vue'), meta: { title: '人员出入登记', module: '在押人员管理' } },
      { path: 'device-monitor', name: 'DeviceMonitor', component: () => import('@/views/DeviceMonitor.vue'), meta: { title: '设备运行监控', module: '设备设施管理' } },
      { path: 'device-maintenance', name: 'DeviceMaintenance', component: () => import('@/views/DeviceMaintenance.vue'), meta: { title: '设备维护记录', module: '设备设施管理' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 智慧监所指挥调度平台'
  next()
})

export default router
