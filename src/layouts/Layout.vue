
<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="220px" class="custom-aside">
        <div class="logo">
          <span class="logo-icon">🚦</span>
          <span class="logo-text">智慧交通信息发布管理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          router
          class="custom-menu"
        >
          <el-menu-item index="Home" route="/" class="menu-item">
            <span class="menu-icon">🏠</span>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="TrafficInfo" route="/traffic-info" class="menu-item">
            <span class="menu-icon">🚗</span>
            <span>交通信息</span>
          </el-menu-item>
          <el-menu-item index="WarningInfo" route="/warning-info" class="menu-item">
            <span class="menu-icon">⚠️</span>
            <span>预警信息</span>
          </el-menu-item>
          <el-menu-item index="Statistics" route="/statistics" class="menu-item">
            <span class="menu-icon">📊</span>
            <span>统计分析</span>
          </el-menu-item>
          <el-menu-item index="SystemSettings" route="/system-settings" class="menu-item">
            <span class="menu-icon">⚙️</span>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="custom-header">
          <div class="header-right">
            <el-button type="primary" plain class="logout-btn" @click="handleLogout">
              <span class="logout-icon">🚪</span>
              <span>退出登录</span>
            </el-button>
          </div>
        </el-header>
        <el-main class="custom-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  return route.name
})

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>
    