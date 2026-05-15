<template>
  <div class="page-login">
    <!-- 装饰背景 -->
    <div class="login-bg">
      <div class="grid-overlay"></div>
      <div class="particles">
        <span class="particle" v-for="n in 30" :key="n" :style="{ '--i': n, '--x': Math.random() * 100 + '%', '--y': Math.random() * 100 + '%', '--s': 2 + Math.random() * 4 + 'px', '--delay': Math.random() * 5 + 's' }"></span>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="login-container">
      <!-- 左侧品牌区域 -->
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <path d="M40 10 L40 70 M10 40 L70 40" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
            <circle cx="40" cy="40" r="12" fill="none" stroke="rgba(82,82,91,0.8)" stroke-width="3" />
            <circle cx="40" cy="40" r="6" fill="#52525B" />
          </svg>
        </div>
        <h1 class="brand-title">食品质量安全<br/>检测分析平台</h1>
        <p class="brand-subtitle">精准检测 · 守护安全</p>
        <div class="brand-metrics">
          <div class="metric-item">
            <span class="metric-value">99.8%</span>
            <span class="metric-label">检出率</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">200+</span>
            <span class="metric-label">检测指标</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">实时</span>
            <span class="metric-label">数据同步</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录卡片（玻璃拟态） -->
      <div class="login-card-wrapper">
        <el-card class="login-card" shadow="never">
          <h2 class="card-title">系统登录</h2>
          <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-position="top" class="login-form">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入账号" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="remember">记住我</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleLogin" class="login-btn">登录</el-button>
            </el-form-item>
          </el-form>
          <div class="login-footer">
            <span>第三方登录</span>
            <div class="social-icons">
              <div class="icon-placeholder"></div>
              <div class="icon-placeholder"></div>
              <div class="icon-placeholder"></div>
            </div>
          </div>
        </el-card>
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
const loginFormRef = ref(null)
const loginForm = reactive({ username: '', password: '' })
const loading = ref(false)
const remember = ref(false)

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }]
}

const handleLogin = () => {
  loginFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true
      setTimeout(() => {
        ElMessage.success('登录成功')
        router.push('/')
        loading.value = false
      }, 400)
    }
  })
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>