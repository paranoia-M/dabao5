<template>
  <div class="layout-container">
    <el-container>
      <!-- 头部区域 -->
      <el-header class="header">
        <div class="header-left">
          <h1>航清智能项目实时追踪及进度提醒软件</h1>
        </div>
        <div class="header-right">
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-container>
        <!-- 侧边栏菜单 -->
        <el-aside width="220px" class="aside">
          <el-menu
            :default-active="$route.path"
            class="menu"
            background-color="#f8f9fa"
            text-color="#303133"
            active-text-color="#1890ff"
            router
            :unique-opened="false"
          >
            <el-menu-item index="/">
              <span class="menu-item-content">
                <el-icon><House /></el-icon>
                <span>首页</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/enterprise-list">
              <span class="menu-item-content">
                <el-icon><OfficeBuilding /></el-icon>
                <span>企业列表</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/preference-application">
              <span class="menu-item-content">
                <el-icon><Document /></el-icon>
                <span>优惠申报</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/application-history">
              <span class="menu-item-content">
                <el-icon><DataBoard /></el-icon>
                <span>申报历史</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/policy-guidance">
              <span class="menu-item-content">
                <el-icon><Notebook /></el-icon>
                <span>政策指导</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/audit-management">
              <span class="menu-item-content">
                <el-icon><Finished /></el-icon>
                <span>审核管理</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/statistics-report">
              <span class="menu-item-content">
                <el-icon><DataAnalysis /></el-icon>
                <span>统计报表</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/user-profile">
              <span class="menu-item-content">
                <el-icon><User /></el-icon>
                <span>用户资料</span>
              </span>
            </el-menu-item>
            <el-menu-item index="/system-settings">
              <span class="menu-item-content">
                <el-icon><Setting /></el-icon>
                <span>系统设置</span>
              </span>
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
import { useRouter } from 'vue-router'
import {
  House,
  OfficeBuilding,
  Document,
  DataBoard,
  Notebook,
  Finished,
  DataAnalysis,
  User,
  Setting
} from '@element-plus/icons-vue'

const router = useRouter()

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>