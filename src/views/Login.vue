<template>
  <div class="page-login">
    <div class="login-left">
      <div class="left-decoration">
        <svg class="tech-svg" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#EA580C" stop-opacity="0.05" />
              <stop offset="100%" stop-color="#EA580C" stop-opacity="0.3" />
            </linearGradient>
          </defs>
          <!-- 网格线 -->
          <line x1="0" y1="400" x2="800" y2="400" stroke="#EA580C" stroke-width="0.5" opacity="0.2" />
          <line x1="400" y1="0" x2="400" y2="800" stroke="#EA580C" stroke-width="0.5" opacity="0.2" />
          <line x1="0" y1="200" x2="800" y2="200" stroke="#EA580C" stroke-width="0.2" opacity="0.1" />
          <line x1="0" y1="600" x2="800" y2="600" stroke="#EA580C" stroke-width="0.2" opacity="0.1" />
          <line x1="200" y1="0" x2="200" y2="800" stroke="#EA580C" stroke-width="0.2" opacity="0.1" />
          <line x1="600" y1="0" x2="600" y2="800" stroke="#EA580C" stroke-width="0.2" opacity="0.1" />
          <!-- 同心圆组 -->
          <circle cx="400" cy="400" r="120" fill="none" stroke="#EA580C" stroke-width="1" stroke-dasharray="12 24" class="ring ring-1" />
          <circle cx="400" cy="400" r="200" fill="none" stroke="#EA580C" stroke-width="0.8" stroke-dasharray="8 16" class="ring ring-2" />
          <circle cx="400" cy="400" r="280" fill="none" stroke="#EA580C" stroke-width="0.5" stroke-dasharray="4 12" class="ring ring-3" />
          <circle cx="400" cy="400" r="50" fill="none" stroke="#EA580C" stroke-width="2" stroke-dasharray="6 18" class="ring ring-4" />
          <!-- 扫描射线 -->
          <line x1="400" y1="400" x2="200" y2="200" stroke="#EA580C" stroke-width="1" opacity="0.4" class="scan-line" />
          <line x1="400" y1="400" x2="600" y2="200" stroke="#EA580C" stroke-width="1" opacity="0.4" class="scan-line" />
          <line x1="400" y1="400" x2="700" y2="500" stroke="#EA580C" stroke-width="1" opacity="0.4" class="scan-line" />
          <line x1="400" y1="400" x2="100" y2="600" stroke="#EA580C" stroke-width="1" opacity="0.4" class="scan-line" />
          <!-- 脉冲点 -->
          <circle cx="300" cy="300" r="3" fill="#EA580C" class="pulse-dot" />
          <circle cx="500" cy="300" r="3" fill="#EA580C" class="pulse-dot" />
          <circle cx="550" cy="500" r="3" fill="#EA580C" class="pulse-dot" />
          <circle cx="250" cy="550" r="3" fill="#EA580C" class="pulse-dot" />
          <circle cx="400" cy="200" r="2" fill="#EA580C" class="pulse-dot" />
          <circle cx="400" cy="600" r="2" fill="#EA580C" class="pulse-dot" />
        </svg>
        <div class="brand">
          <h1 class="brand-title">企业智能数据管理综合服务平台</h1>
          <p class="brand-sub">智能 · 高效 · 安全</p>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <div class="card-header">
          <el-icon :size="28" color="#EA580C"><User /></el-icon>
          <h2 class="card-title">用户登录</h2>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="handleLogin" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" clearable>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password clearable>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="remember" class="remember-checkbox">记住我</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">登 录</el-button>
          </el-form-item>
        </el-form>
        <div class="card-footer">
          <span class="hint-text">默认账号：admin / admin123</span>
        </div>
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
const formRef = ref(null)
const loading = ref(false)
const remember = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  formRef.value.validate((valid) => {
    if (valid) {
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
  })
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>