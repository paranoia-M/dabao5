<template>
  <div class="layout-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <h1 class="title">航清噪音项目申报综合管理系统</h1>
          <span class="subtitle">一站式申报材料协作与管理</span>
        </div>
        <div class="header-right">
          <el-button type="primary" plain @click="$router.push('/user-center')">
            <span class="user-icon">👤</span>
            用户中心
          </el-button>
          <el-button type="info" plain @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-container>
        <!-- 侧边菜单 -->
        <el-aside width="220px" class="aside">
          <el-menu
            :default-active="activeMenu"
            class="menu"
            background-color="#f8f9fa"
            text-color="#495057"
            :active-text-color="activeTextColor"
            router
            :collapse="false"
          >
            <el-menu-item index="/" class="menu-item">
              <span class="menu-icon">🏠</span>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/project-list" class="menu-item">
              <span class="menu-icon">📋</span>
              <span>项目列表</span>
            </el-menu-item>
            <el-menu-item index="/project-create" class="menu-item">
              <span class="menu-icon">➕</span>
              <span>创建项目</span>
            </el-menu-item>
            <el-menu-item index="/material-manage" class="menu-item">
              <span class="menu-icon">📁</span>
              <span>材料管理</span>
            </el-menu-item>
            <el-menu-item index="/approval-process" class="menu-item">
              <span class="menu-icon">✅</span>
              <span>审批流程</span>
            </el-menu-item>
            <el-menu-item index="/user-center" class="menu-item">
              <span class="menu-icon">👥</span>
              <span>用户中心</span>
            </el-menu-item>
            <el-menu-item index="/system-setting" class="menu-item">
              <span class="menu-icon">⚙️</span>
              <span>系统设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <!-- 主内容区域 -->
        <el-main class="main">
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

// 计算激活菜单的对比色
const activeTextColor = computed(() => {
  // 背景色为#f8f9fa，对比色选择深蓝色
  return '#1a56db'
})

// 退出登录
const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}

onMounted(() => {
  // 初始化用户信息
  console.log('政策项目申报平台初始化完成')
})
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>