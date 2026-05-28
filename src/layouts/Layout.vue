<template>
  <div class="app-layout">
    <el-container class="app-layout__container">
      <el-header class="app-layout__header">
        <div class="header-left">
          <span class="header-title">企业智能数据管理综合服务平台</span>
        </div>
        <div class="header-center">
          <el-input
            v-model="searchQuery"
            placeholder="搜索数据资产、API..."
            class="header-search"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-right">
          <span class="header-user">
            <el-icon><User /></el-icon>
            管理员
          </span>
          <el-button type="text" class="header-logout" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside class="app-layout__aside" width="240px">
          <el-menu
            :default-active="activeMenu"
            class="app-layout__menu"
            background-color="#1d1e1f"
            text-color="#ffffff"
            active-text-color="#EA580C"
            @select="handleMenuSelect"
          >
            <template v-for="mod in MENU" :key="mod.moduleName">
              <el-sub-menu :index="mod.moduleName">
                <template #title>
                  <el-icon v-if="mod.moduleName === '工作台'"><HomeFilled /></el-icon>
                  <el-icon v-if="mod.moduleName === '数据资产'"><DataAnalysis /></el-icon>
                  <el-icon v-if="mod.moduleName === '数据治理'"><Monitor /></el-icon>
                  <el-icon v-if="mod.moduleName === '数据开发'"><Connection /></el-icon>
                  <el-icon v-if="mod.moduleName === '数据服务'"><Setting /></el-icon>
                  <span>{{ mod.moduleName }}</span>
                </template>
                <el-menu-item
                  v-for="item in mod.items"
                  :key="item.name"
                  :index="item.name"
                >
                  {{ item.name }}
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-menu>
        </el-aside>
        <el-main class="app-layout__main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElContainer, ElHeader, ElAside, ElMain,
  ElMenu, ElSubMenu, ElMenuItem,
  ElInput, ElButton, ElIcon
} from 'element-plus'
import {
  Search, User,
  HomeFilled, DataAnalysis, Monitor, Connection, Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const MENU = [
  { moduleName: '工作台', items: [
    { name: '首页概览', path: '/dashboard' },
  ]},
  { moduleName: '数据资产', items: [
    { name: '资产目录', path: '/asset-catalog' },
  ]},
  { moduleName: '数据治理', items: [
    { name: '质量监控', path: '/quality-monitor' },
    { name: '标准配置', path: '/standard-config' },
  ]},
  { moduleName: '数据开发', items: [
    { name: '集成计划', path: '/integration-schedule' },
  ]},
  { moduleName: '数据服务', items: [
    { name: 'API注册', path: '/api-register' },
    { name: '授权审批', path: '/grant-approval' },
  ]},
]

const searchQuery = ref('')

const activeMenu = computed(() => {
  const path = route.path
  for (const mod of MENU) {
    for (const item of mod.items) {
      const prefix = item.path.includes(':id') ? item.path.split(':')[0] : item.path
      if (path === item.path || (item.path.includes(':id') && path.startsWith(prefix))) {
        return item.name
      }
    }
  }
  return ''
})

function handleMenuSelect(index) {
  for (const mod of MENU) {
    for (const item of mod.items) {
      if (item.name === index) {
        router.push(item.path)
        return
      }
    }
  }
}

function handleLogout() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>