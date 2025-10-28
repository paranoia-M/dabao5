<template>
  <div class="layout-container">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1 class="title">航清环境应急移动源管理软件</h1>
          <div class="user-info">
            <el-button 
              type="primary" 
              @click="handleLogout"
              class="logout-btn"
            >
              退出登录
            </el-button>
          </div>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="200px" class="sidebar">
          <el-menu
            :default-active="currentRoute"
            class="menu"
            router
            background-color="#f8f9fa"
            text-color="#333333"
            active-text-color="#ffffff"
          >
            <el-menu-item index="/" class="menu-item">
              <span class="menu-icon">📊</span>
              <span>首页看板</span>
            </el-menu-item>
            <el-menu-item index="/real-time-monitoring" class="menu-item">
              <span class="menu-icon">🔍</span>
              <span>实时监测</span>
            </el-menu-item>
            <el-menu-item index="/environment-data" class="menu-item">
              <span class="menu-icon">🌡️</span>
              <span>环境数据</span>
            </el-menu-item>
            <el-menu-item index="/device-management" class="menu-item">
              <span class="menu-icon">🔧</span>
              <span>设备管理</span>
            </el-menu-item>
            <el-menu-item index="/alarm-management" class="menu-item">
              <span class="menu-icon">⚠️</span>
              <span>告警管理</span>
            </el-menu-item>
            <el-menu-item index="/data-analysis" class="menu-item">
              <span class="menu-icon">📈</span>
              <span>数据分析</span>
            </el-menu-item>
            <el-menu-item index="/system-settings" class="menu-item">
              <span class="menu-icon">⚙️</span>
              <span>系统设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
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

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => {
  return route.path === '/' ? '/' : route.path
})

const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}

// 模拟系统初始化
onMounted(() => {
  console.log('航清环境应急移动源管理软件初始化完成')
  console.log('当前监测节点：温室大棚A区、露天种植B区、育苗基地C区')
  console.log('监测参数：温度、湿度、光照强度、土壤湿度、CO2浓度')
})
</script>

<style lang="scss" scoped>

@use './Layout.scss';

</style>