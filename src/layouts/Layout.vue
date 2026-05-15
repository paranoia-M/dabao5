<template>
  <div class="app-layout">
    <header class="top-banner">
      <div class="brand">
        <span class="brand-icon">🛡️</span>
        <span class="brand-title">{{ spec.title }}</span>
      </div>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="全局搜索设备或隐患..."
          class="search-input"
        />
      </div>
      <div class="user-area">
        <el-button type="text" @click="handleLogout">退出登录</el-button>
      </div>
    </header>
    <div class="layout-body">
      <aside class="app-aside">
        <el-menu
          :default-active="route.path"
          :router="true"
          class="app-menu"
          mode="vertical"
          :collapse="false"
          background-color="transparent"
          text-color="#ffffff"
          active-text-color="#059669"
        >
          <template v-for="mod in MENU" :key="mod.moduleName">
            <el-sub-menu
              v-if="mod.items && mod.items.length > 1"
              :index="mod.moduleName"
            >
              <template #title>
                <span>{{ mod.moduleName }}</span>
              </template>
              <el-menu-item
                v-for="item in mod.items"
                :key="item.name"
                :index="item.path"
              >
                {{ item.name }}
              </el-menu-item>
            </el-sub-menu>
            <template v-else>
              <el-menu-item
                v-for="item in mod.items"
                :key="item.name"
                :index="item.path"
              >
                {{ item.name }}
              </el-menu-item>
            </template>
          </template>
        </el-menu>
      </aside>
      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const spec = {
  title: '特种设备隐患排查评估系统'
}

const MENU = [
  { moduleName: '工作台', items: [
    { name: '数据概览', path: '/dashboard' },
  ]},
  { moduleName: '设备管理', items: [
    { name: '设备台账', path: '/equipment-ledger' },
    { name: '设备详情', path: '/equipment-profile' },
  ]},
  { moduleName: '隐患排查', items: [
    { name: '排查任务', path: '/inspection-task' },
    { name: '隐患记录', path: '/hazard-record' },
    { name: '整改管理', path: '/rectification-management' },
  ]},
  { moduleName: '风险评估', items: [
    { name: '风险分析', path: '/risk-analysis' },
    { name: '风险清单', path: '/risk-checklist' },
  ]},
  { moduleName: '报告管理', items: [
    { name: '报告台账', path: '/report-archive' },
  ]},
]

const searchQuery = ref('')

function handleLogout() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>