
<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="220px">
        <div class="menu-title">
          <span class="platform-name">航清环境、污染应急预案处理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#ffd04b"
          router
        >
          <el-menu-item index="/">
            <span class="menu-item-content">
              <span class="menu-icon">🏠</span>
              <span>首页</span>
            </span>
          </el-menu-item>
        
          <el-menu-item index="/calibration">
            <span class="menu-item-content">
              <span class="menu-icon">🔧</span>
              <span>校准管理</span>
            </span>
          </el-menu-item>
          <el-menu-item index="/data-management">
            <span class="menu-item-content">
              <span class="menu-icon">📁</span>
              <span>数据管理</span>
            </span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <span class="menu-item-content">
              <span class="menu-icon">⚠️</span>
              <span>告警管理</span>
            </span>
          </el-menu-item>
          <el-menu-item index="/report">
            <span class="menu-item-content">
              <span class="menu-icon">📈</span>
              <span>报表统计</span>
            </span>
          </el-menu-item>
          <el-menu-item index="/system-setting">
            <span class="menu-item-content">
              <span class="menu-icon">⚙️</span>
              <span>系统设置</span>
            </span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="main-header">
          <div class="header-right">
            <el-button type="text" @click="handleLogout">
              <span class="user-info">
                <span class="user-avatar">👤</span>
                <span>退出登录</span>
              </span>
            </el-button>
          </div>
        </el-header>
        <el-main class="main-content">
          <RouterView />
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
    