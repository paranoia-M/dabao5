<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="220px" class="system-aside">
        <div class="logo">
          <span class="logo-text">智慧广播管理系统</span>
          <span class="logo-subtext">Smart Broadcast System</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
          class="system-menu"
        >
          <el-menu-item index="/" class="menu-item">
            <span class="menu-item-content">首页</span>
          </el-menu-item>
          <el-menu-item index="/broadcast" class="menu-item">
            <span class="menu-item-content">广播管理</span>
          </el-menu-item>
          <el-menu-item index="/schedule" class="menu-item">
            <span class="menu-item-content">排程管理</span>
          </el-menu-item>
          <el-menu-item index="/device" class="menu-item">
            <span class="menu-item-content">设备管理</span>
          </el-menu-item>
          <el-menu-item index="/statistics" class="menu-item">
            <span class="menu-item-content">统计分析</span>
          </el-menu-item>
          <el-menu-item index="/settings" class="menu-item">
            <span class="menu-item-content">系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="system-header">
          <div class="header-right">
            <div class="user-info" @click="handleLogout">
              <span class="user-name">管理员</span>
              <el-avatar size="small" class="user-avatar">Admin</el-avatar>
            </div>
          </div>
        </el-header>
        <el-main class="system-main">
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