/*
 * @Author: FirstsnowLucky firstsnow1119@163.com
 * @Date: 2025-07-24 09:11:05
 * @LastEditors: FirstsnowLucky firstsnow1119@163.com
 * @LastEditTime: 2025-07-24 09:46:44
 * @FilePath: \新版测试\泰捷欣监控设备数据压缩上传应用系统\vue\src\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
            path: 'alarm',
            name: 'Alarm',
            component: () => import('@/views/Alarm.vue')
          },
          {
            path: 'report',
            name: 'Report',
            component: () => import('@/views/Report.vue')
          },
          {
            path: 'system',
            name: 'System',
            component: () => import('@/views/System.vue')
          }
        ]
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router