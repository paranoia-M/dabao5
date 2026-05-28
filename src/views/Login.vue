<template>
  <div class="page-login">
    <!-- 左栏：品牌展示与抽象装饰 -->
    <div class="login-left">
      <div class="brand">
        <h1 class="brand-title">模型资产库</h1>
        <p class="brand-subtitle">三维模型 · 共享管理平台</p>
      </div>
      <div class="decorative-grid"></div>
      <div class="decorative-cube"></div>
      <div class="decorative-rings"></div>
    </div>
    <!-- 右栏：登录卡片 -->
    <div class="login-right">
      <div class="login-card">
        <div class="card-header">
          <h2 class="card-title">欢迎登录</h2>
          <p class="card-subtitle">输入您的账号密码继续</p>
        </div>
        <el-form :model="form" class="login-form" @keyup.enter="handleLogin">
          <el-form-item>
            <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.password" type="password" placeholder="密码（默认 admin / admin123）" :prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="remember">记住我</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
          </el-form-item>
        </el-form>
        <p class="default-hint">默认账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const form = reactive({
  username: '',
  password: ''
})
const remember = ref(false)
const loading = ref(false)

const handleLogin = () => {
  if (!form.username) {
    ElMessage.warning('请输入账号')
    return
  }
  if (!form.password || form.password.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
  loading.value = true
  setTimeout(() => {
    loading.value = false
    if (form.username === 'admin' && form.password === 'admin123') {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误（默认 admin / admin123）')
    }
  }, 400)
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>