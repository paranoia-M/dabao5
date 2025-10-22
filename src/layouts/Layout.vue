<template>
  <div class="layout-container">
    <el-container class="layout-wrapper">
      <!-- 侧边栏 -->
      <el-aside width="220px" class="sidebar">
        <div class="logo">
          <h2>网络探针实时检测预警软件</h2>
        </div>
        <el-menu
          :default-active="currentRoute"
          class="sidebar-menu"
          background-color="#f8f9fa"
          text-color="#333"
          active-text-color="#fff"
          router
        >
          <el-menu-item index="/" class="menu-item">
            <span class="menu-icon">🏠</span>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/dashboard" class="menu-item">
            <span class="menu-icon">📊</span>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/communication-data" class="menu-item">
            <span class="menu-icon">📡</span>
            <span>通信数据</span>
          </el-menu-item>
          <el-menu-item index="/signal-analysis" class="menu-item">
            <span class="menu-icon">📶</span>
            <span>信号分析</span>
          </el-menu-item>
          <el-menu-item index="/equipment-management" class="menu-item">
            <span class="menu-icon">🔧</span>
            <span>设备管理</span>
          </el-menu-item>
          <el-menu-item index="/user-management" class="menu-item">
            <span class="menu-icon">👥</span>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/system-logs" class="menu-item">
            <span class="menu-icon">📝</span>
            <span>系统日志</span>
          </el-menu-item>
          <el-menu-item index="/settings" class="menu-item">
            <span class="menu-icon">⚙️</span>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <span class="system-name">网络探针实时检测预警软件</span>
            <span class="system-tag">应急通信 • 数据分析 • 实时监控</span>
          </div>
          <div class="header-right">
            <el-button 
              type="primary" 
              @click="handleLogout"
              class="logout-btn"
            >
              <span class="btn-icon">🚪</span>
              安全退出
            </el-button>
          </div>
        </el-header>

        <!-- 页面内容 -->
        <el-main class="main-content">
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 计算当前路由用于菜单激活
const currentRoute = computed(() => {
  return route.path
})

// 退出登录
const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}

// 组件挂载后的初始化操作
onMounted(() => {
  // 模拟系统初始化日志
  console.log('网络探针实时检测预警软件初始化完成')
  console.log('当前用户权限：系统管理员')
  console.log('通信设备连接状态：正常')
  console.log('数据监控服务：运行中')
  
  // 显示欢迎消息
  ElMessage({
    message: '欢迎使用网络探针实时检测预警软件',
    type: 'info',
    duration: 3000
  })
})
</script>

<style lang="scss" scoped>


@use './Layout.scss';


</style>