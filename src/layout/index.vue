<template>
  <div class="layout-container">
    <!-- 左侧侧边栏 -->
    <aside class="layout-aside" :class="{ 'aside-collapsed': isCollapsed }">
      <div class="aside-header">
        <div class="system-title" :class="{ 'title-collapsed': isCollapsed }">
          桥梁桩基成孔质量检测系统
        </div>
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon><ArrowLeft v-if="!isCollapsed" /><ArrowRight v-else /></el-icon>
        </div>
      </div>
      <div class="aside-menu">
        <div
          v-for="menu in menuList"
          :key="menu.path"
          class="menu-item"
          :class="{ 'menu-active': currentPath === menu.path }"
          @click="handleMenuClick(menu)"
        >
          <el-icon class="menu-icon"><Document /></el-icon>
          <span class="menu-text" v-show="!isCollapsed">{{ menu.title }}</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="layout-main">
      <div class="main-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button type="danger" plain size="small" @click="handleLogout">
            <el-icon><Close /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, Document, Close } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const menuList = ref([
  { path: '', title: '检测动态' },
  { path: 'schedule', title: '检测排期' },
  { path: 'review', title: '数据审查' },
  { path: 'detail', title: '检测明细' },
  { path: 'distribution', title: '点位分布' },
  { path: 'flow', title: '流程流转' }
])

const currentPath = computed(() => {
  return route.path.replace('/', '')
})

const currentTitle = computed(() => {
  const menu = menuList.value.find(m => m.path === currentPath.value)
  return menu ? menu.title : ''
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleMenuClick = (menu) => {
  router.push('/' + menu.path)
}

const handleLogout = () => {
  router.push('/login')
}

onMounted(() => {
  if (!currentPath.value) {
    router.push('/' + menuList.value[0].path)
  }
})
</script>

<style lang='scss' scoped>
@use './index.scss';
</style>
