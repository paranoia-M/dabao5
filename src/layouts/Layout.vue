<template>
  <div class="app-layout">
    <header class="layout-header">
      <div class="brand-title">智慧监所指挥调度平台</div>
      <el-menu
        mode="horizontal"
        :default-active="route.path"
        @select="handleMenuSelect"
        class="layout-menu"
      >
        <template v-for="module in MENU" :key="module.moduleName">
          <el-sub-menu :index="module.moduleName" popper-class="layout-menu-popper">
            <template #title>
              <span>{{ module.moduleName }}</span>
            </template>
            <el-menu-item
              v-for="item in module.items"
              :key="item.path"
              :index="item.path"
            >
              {{ item.name }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
      <div class="header-actions">
        <el-button text @click="handleLogout">退出登录</el-button>
      </div>
    </header>
    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const MENU = [
  { moduleName: '指挥总览', items: [
    { name: '指挥调度大屏', path: '/command-overview' },
  ]},
  { moduleName: '视频监控与报警', items: [
    { name: '实时视频监控', path: '/video-surveillance' },
  ]},
  { moduleName: '巡查管理', items: [
    { name: '巡查任务排程', path: '/patrol-schedule' },
    // { name: '巡查记录查询', path: '/patrol-record' },
  ]},
  { moduleName: '在押人员管理', items: [
    { name: '在押人员档案', path: '/inmate-archive' },
    { name: '人员出入登记', path: '/inmate-movement' },
  ]},
  { moduleName: '设备设施管理', items: [
    { name: '设备运行监控', path: '/device-monitor' },
    { name: '设备维护记录', path: '/device-maintenance' },
  ]},
]

function handleMenuSelect(index) {
  router.push(index)
}

function handleLogout() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>