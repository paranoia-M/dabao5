
<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="title">航清水资源保护与智能化系统</div>
      <el-button type="danger" @click="handleLogout" class="logout-btn">退出</el-button>
    </el-header>
    <el-container>
      <el-aside width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          background-color="#f5f7fa"
          text-color="#333"
          :active-text-color="activeTextColor"
          router
        >
          <el-menu-item index="/" route="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/data-monitoring" route="/data-monitoring">
            <el-icon><Monitor /></el-icon>
            <span>数据监测</span>
          </el-menu-item>
          <el-menu-item index="/quality-assessment" route="/quality-assessment">
            <el-icon><DataAnalysis /></el-icon>
            <span>质量评估</span>
          </el-menu-item>
          <el-menu-item index="/data-fusion" route="/data-fusion">
            <el-icon><Connection /></el-icon>
            <span>数据融合</span>
          </el-menu-item>
          <el-menu-item index="/report-generation" route="/report-generation">
            <el-icon><Document /></el-icon>
            <span>报告生成</span>
          </el-menu-item>
          <el-menu-item index="/system-management" route="/system-management">
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House,
  Monitor,
  DataAnalysis,
  Connection,
  Document,
  Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeTextColor = ref('#409eff')

const activeMenu = computed(() => {
  return route.path
})

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>
    