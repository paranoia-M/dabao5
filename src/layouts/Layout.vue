
<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">
        <span class="logo-icon">🧠</span>
        <span class="logo-text">人工智能数据采集分析系统</span>
      </div>
      <div class="user-info">
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-dropdown">
            <el-avatar :size="40" :src="userAvatar" />
            <span class="username">{{ userName }}</span>
            <span class="dropdown-arrow">▼</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          background-color="#f8fafc"
          text-color="#333"
          active-text-color="#000"
          :active-background-color="activeBgColor"
          router
        >
          <el-menu-item index="/">
            <span class="menu-icon">🏠</span>
            <span class="menu-text">首页</span>
          </el-menu-item>
          <el-menu-item index="/knowledge-base">
            <span class="menu-icon">📚</span>
            <span class="menu-text">知识库</span>
          </el-menu-item>
          <el-menu-item index="/classification">
            <span class="menu-icon">🏷️</span>
            <span class="menu-text">智能分类</span>
          </el-menu-item>
          <el-menu-item index="/integration">
            <span class="menu-icon">🔄</span>
            <span class="menu-text">知识整合</span>
          </el-menu-item>
          <el-menu-item index="/user-management">
            <span class="menu-icon">👥</span>
            <span class="menu-text">用户管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">系统设置</span>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 用户信息
const userName = ref('管理员')
const userAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')

// 计算当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 计算激活菜单的背景色
const activeBgColor = computed(() => {
  return '#e1f0ff'
})

// 处理下拉菜单命令
const handleCommand = async (command) => {
  if (command === 'logout') {
    await handleLogout()
  }
}

// 退出登录
const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>
    