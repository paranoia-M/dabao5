<template>
  <div class="app-layout">
    <el-container>
      <el-aside width="280px" class="app-sidebar">
        <div class="brand">
          <div class="brand-icon"></div>
          <span class="brand-title">3D资产库</span>
        </div>
        <el-menu
          :default-active="route.path"
          :router="false"
          class="app-menu"
          background-color="#ffffff"
          text-color="#333"
          active-text-color="#0F766E"
          @select="handleMenuSelect"
        >
          <template v-for="group in MENU" :key="group.moduleName">
            <el-sub-menu :index="group.moduleName">
              <template #title>
                <span class="menu-group-title">{{ group.moduleName }}</span>
              </template>
              <el-menu-item
                v-for="item in group.items"
                :key="item.path"
                :index="item.path"
              >
                {{ item.name }}
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="app-header">
          <div class="header-left">
            <span class="header-title">三维模型资产库管理与共享平台</span>
          </div>
          <div class="header-right">
            <el-button type="text" @click="handleLogout">退出登录</el-button>
          </div>
        </el-header>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const MENU = [
  { moduleName: '首页概览', items: [
    { name: '数据概览仪表盘', path: '/dashboard' },
  ]},
  { moduleName: '模型管理', items: [
    { name: '模型库', path: '/model-library' },
    { name: '模型详情', path: '/model-view' },
  ]},
  { moduleName: '共享协作', items: [
    { name: '共享审批', path: '/share-approval' },
    { name: '团队管理', path: '/team-members' },
  ]},
  { moduleName: '个人工作台', items: [
    { name: '我的资产', path: '/my-assets' },
    { name: '使用统计', path: '/usage-statistics' },
  ]},
  { moduleName: '系统配置', items: [
    { name: '模型分类', path: '/model-category' },
  ]},
]

function handleMenuSelect(index) {
  router.push(index)
}

function handleLogout() {
  router.push('/login')
}
</script>

<style scoped lang="scss">
@use './Layout.scss' as *;
</style>