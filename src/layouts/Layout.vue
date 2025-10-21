<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">
        <span class="logo-icon">🖥️</span>
        <span class="logo-text">泰捷欣监控设备数据压缩上传应用系统</span>
      </div>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            <el-avatar :size="small" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
            <span class="username">管理员</span>
            <span class="user-status">● 在线</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          background-color="#f5f7fa"
          text-color="#333"
          active-text-color="#000"
          :active-background-color="activeBgColor"
          router
        >
          <el-menu-item index="/">
            <span class="menu-icon">🏠</span>
            <span>首页</span>
            <span class="menu-badge"></span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <span class="menu-icon">⚠️</span>
            <span>告警管理</span>
          </el-menu-item>
          <el-menu-item index="/report">
            <span class="menu-icon">📊</span>
            <span>报表统计</span>
          </el-menu-item>
          <el-menu-item index="/system">
            <span class="menu-icon">⚙️</span>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
        <div class="system-status">
          <div class="status-item">
            <span class="status-label">系统状态：</span>
            <span class="status-value running">运行中</span>
          </div>
          <div class="status-item">
            <span class="status-label">最后检测：</span>
            <span class="status-value">{{ new Date().toLocaleTimeString() }}</span>
          </div>
        </div>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeBgColor = ref('#e6f7ff')

const activeMenu = computed(() => {
  return route.path
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    await handleLogout()
  } else if (command === 'profile') {
    // 个人中心直接跳转，不显示弹窗
    console.log('个人中心功能')
  }
}

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}

// 模拟实时监控数据
const mockMonitorData = () => {
  return {
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    diskUsage: Math.floor(Math.random() * 100),
    networkStatus: ['正常', '拥堵', '断开'][Math.floor(Math.random() * 3)],
    lastUpdate: new Date().toLocaleTimeString()
  }
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>