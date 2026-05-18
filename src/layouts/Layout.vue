<template>
  <div class="app-layout">
    <aside class="layout-aside">
      <div class="brand">
        <h2 class="brand-title">宿舍管理系统</h2>
      </div>

      <el-menu
        :default-active="route.path"
        @select="handleSelect"
        class="layout-menu"
      >
        <template v-for="(module, idx) in MENU" :key="idx">
          <el-sub-menu :index="module.moduleName">
            <template #title>
              <span class="module-title">{{ module.moduleName }}</span>
            </template>
            <el-menu-item
              v-for="item in module.items"
              :key="item.path"
              :index="item.path"
            >
              <span>{{ item.name }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>

      <div class="aside-footer">
        <el-button type="danger" round class="logout-btn" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </aside>

    <main class="layout-main">
      <header class="main-header">
        <span class="page-indicator">
          <span class="page-name">{{ currentPageInfo.pageName }}</span>
          <span class="module-name" v-if="currentPageInfo.moduleName">
            / {{ currentPageInfo.moduleName }}
          </span>
        </span>
      </header>

      <div class="main-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const MENU = [
  { moduleName: '首页', items: [
    { name: '数据概览', path: '/dashboard' },
  ]},
  { moduleName: '宿舍管理', items: [
    { name: '宿舍列表', path: '/dormitory-list' },
    { name: '住宿管理', path: '/room-occupancy' },
  ]},
  { moduleName: '维修管理', items: [
    { name: '维修工单', path: '/repair-order' },
    { name: '维修任务', path: '/repair-task' },
  ]},
  { moduleName: '报修服务', items: [
    { name: '报修中心', path: '/repair-center' },
  ]},
  { moduleName: '配置管理', items: [
    { name: '楼栋配置', path: '/dormitory-block' },
    { name: '房间类型配置', path: '/room-category' },
  ]},
]

function handleLogout() {
  router.push('/login')
}

function handleSelect(index) {
  router.push(index)
}

const currentPageInfo = computed(() => {
  for (const mod of MENU) {
    for (const item of mod.items) {
      if (item.path === route.path) {
        return { pageName: item.name, moduleName: mod.moduleName }
      }
    }
  }
  return { pageName: '', moduleName: '' }
})
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>