
<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">安全生产风险分级管控与动态预警平台</div>
      <el-dropdown @command="handleCommand" class="user-dropdown" trigger="click">
        <span class="el-dropdown-link">
          <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <span class="username">管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <el-menu-item index="/" route="/">
            <template #title>
              <span class="menu-icon">🏠</span>
              <span>首页</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/risk-assessment" route="/risk-assessment">
            <template #title>
              <span class="menu-icon">📊</span>
              <span>风险评估</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/risk-control" route="/risk-control">
            <template #title>
              <span class="menu-icon">🛡️</span>
              <span>风险管控</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/early-warning" route="/early-warning">
            <template #title>
              <span class="menu-icon">⚠️</span>
              <span>动态预警</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/statistics-analysis" route="/statistics-analysis">
            <template #title>
              <span class="menu-icon">📈</span>
              <span>统计分析</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/system-management" route="/system-management">
            <template #title>
              <span class="menu-icon">⚙️</span>
              <span>系统管理</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  return route.path
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    await handleLogout()
  }
}

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>
        