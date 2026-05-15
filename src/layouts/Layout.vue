<template>
  <div class="app-layout">
    <aside class="layout-aside">
      <div class="aside-header">
        <h1 class="project-title">食品生产线智能监控</h1>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#ffffff"
        active-text-color="#0F766E"
        @select="handleSelect"
        class="layout-menu"
      >
        <el-sub-menu v-for="group in MENU" :key="group.moduleName" :index="group.moduleName">
          <template #title>
            <span>{{ group.moduleName }}</span>
          </template>
          <el-menu-item
            v-for="item in group.items"
            :key="item.path"
            :index="item.path"
          >
            <span>{{ item.name }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="aside-footer">
        <el-button text type="primary" size="default" class="logout-btn" @click="handleLogout">退出登录</el-button>
      </div>
    </aside>
    <main class="layout-main">
      <div class="status-bar">
        <span class="status-item">设备在线: 42</span>
        <span class="status-item">今日产量: 12,000件</span>
        <span class="status-item">当前报警: <span class="alert-count">3</span></span>
      </div>
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const MENU = [
  { moduleName: '首页概览', items: [
    { name: '生产总览', path: '/line-dashboard' },
  ]},
  { moduleName: '产线监控', items: [
    { name: '实时监控', path: '/line-monitor' },
    { name: '报警历史', path: '/alarm-history' },
  ]},
  { moduleName: '质量检测', items: [
    { name: '检测任务', path: '/inspection-tasks' },
    { name: '检测标准', path: '/inspection-standards' },
  ]},
  { moduleName: '维护管理', items: [
    { name: '维护计划', path: '/maintenance-schedule' },
    { name: '维护工单', path: '/maintenance-orders' },
  ]},
  { moduleName: '报表分析', items: [
    { name: '报表中心', path: '/report-center' },
  ]},
]

const activeMenu = computed(() => route.path)

function handleSelect(key: string) {
  router.push(key)
}

function handleLogout() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>