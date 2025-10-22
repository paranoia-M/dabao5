
<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="240px" class="security-aside">
        <div class="logo">网络安全防御智能化应用软件</div>
        <el-menu
          :default-active="activeMenu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#ffd04b"
          router
          @select="handleMenuSelect"
          class="security-menu"
        >
          <el-menu-item index="Home" route="/">
            <span class="menu-item-text">首页</span>
          </el-menu-item>
          <el-menu-item index="Dashboard" route="/dashboard">
            <span class="menu-item-text">实时仪表盘</span>
          </el-menu-item>
          <el-menu-item index="SecurityMonitor" route="/security-monitor">
            <span class="menu-item-text">安全态势监控</span>
          </el-menu-item>
          <el-menu-item index="LogManagement" route="/log-management">
            <span class="menu-item-text">安全日志审计</span>
          </el-menu-item>
          <el-menu-item index="AlarmManagement" route="/alarm-management">
            <span class="menu-item-text">威胁告警中心</span>
          </el-menu-item>
          <el-menu-item index="SystemConfig" route="/system-config">
            <span class="menu-item-text">系统安全配置</span>
          </el-menu-item>
          <el-menu-item index="UserManagement" route="/user-management">
            <span class="menu-item-text">权限管理系统</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="security-header">
          <div class="header-right">
            <el-button type="primary" plain class="logout-btn" @click="handleLogout">安全退出</el-button>
          </div>
        </el-header>
        <el-main class="security-main">
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
  return route.name
})

const handleMenuSelect = (index) => {
  console.log(`[安全日志] 菜单切换至: ${index}`)
}

const handleLogout = async () => {
  console.log('[安全日志] 用户执行登出操作')
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>
    