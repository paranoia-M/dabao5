<template>
  <div class="app-layout">
    <el-container class="layout-container">
      <el-aside :width="collapsed ? '64px' : '240px'" class="layout-aside">
        <div class="logo-area">
          <span v-if="!collapsed" class="project-title">食品质量安全检测分析平台</span>
          <span v-else class="project-short">检测</span>
        </div>
        <el-menu
          :default-active="currentPath"
          :collapse="collapsed"
          :collapse-transition="false"
          background-color="#fff"
          text-color="#333"
          active-text-color="#52525B"
          @select="handleMenuSelect"
          class="sidebar-menu"
        >
          <template v-for="group in MENU" :key="group.moduleName">
            <el-sub-menu :index="group.moduleName">
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
          </template>
        </el-menu>
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon><Fold /></el-icon>
        </div>
      </el-aside>
      <el-container class="layout-main">
        <el-header class="layout-header">
          <div class="header-left">
            <span class="header-title">食品质量安全检测分析平台</span>
          </div>
          <div class="header-right">
            <span class="status-item">待处理任务: 12</span>
            <span class="status-item">预警: 3</span>
            <el-button type="text" @click="handleLogout" class="logout-btn">退出登录</el-button>
          </div>
        </el-header>
        <el-main class="layout-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const MENU = [
  { moduleName: '工作台', items: [
    { name: '首页仪表盘', path: '/dashboard' },
  ]},
  { moduleName: '检测任务', items: [
    { name: '检测任务管理', path: '/detect-task' },
  ]},
  { moduleName: '样品管理', items: [
    { name: '样品记录', path: '/sample-records' },
  ]},
  { moduleName: '检测分析', items: [
    { name: '结果录入', path: '/result-input' },
    { name: '检测报告', path: '/inspection-report' },
    { name: '分析看板', path: '/analysis-board' },
  ]},
  { moduleName: '预警与标准', items: [
    { name: '预警配置', path: '/alert-config' },
    { name: '检测标准', path: '/detect-standard' },
    { name: '预警记录', path: '/alert-record' },
  ]},
]

const currentPath = computed(() => route.path)

function handleMenuSelect(index: string) {
  router.push(index)
}

function handleLogout() {
  router.push('/login')
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>