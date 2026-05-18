import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据概览', module: '首页' } },
      { path: 'dormitory-list', name: 'DormitoryList', component: () => import('@/views/DormitoryList.vue'), meta: { title: '宿舍列表', module: '宿舍管理' } },
      { path: 'room-occupancy', name: 'RoomOccupancy', component: () => import('@/views/RoomOccupancy.vue'), meta: { title: '住宿管理', module: '宿舍管理' } },
      { path: 'repair-order', name: 'RepairOrder', component: () => import('@/views/RepairOrder.vue'), meta: { title: '维修工单', module: '维修管理' } },
      { path: 'repair-task', name: 'RepairTask', component: () => import('@/views/RepairTask.vue'), meta: { title: '维修任务', module: '维修管理' } },
      { path: 'repair-center', name: 'RepairCenter', component: () => import('@/views/RepairCenter.vue'), meta: { title: '报修中心', module: '报修服务' } },
      { path: 'dormitory-block', name: 'DormitoryBlock', component: () => import('@/views/DormitoryBlock.vue'), meta: { title: '楼栋配置', module: '配置管理' } },
      { path: 'room-category', name: 'RoomCategory', component: () => import('@/views/RoomCategory.vue'), meta: { title: '房间类型配置', module: '配置管理' } },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.title) document.title = to.meta.title + ' · 宿舍信息管理与维修登记系统'
  next()
})

export default router
