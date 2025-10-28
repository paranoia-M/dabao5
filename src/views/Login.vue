<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-form">
        <h1 class="login-title">航清智能项目实时追踪及进度提醒软件</h1>
        <div class="system-description">
          实时监控项目申报进度 · 智能预警潜在风险 · 高效管理项目全生命周期
        </div>
        
        <el-form :model="loginForm" class="form-content">
          <el-form-item>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              size="large"
              class="custom-input"
            >
              <template #prefix>
                <span class="input-icon">👤</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              class="custom-input"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <span class="input-icon">🔒</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="login-btn" 
              @click="handleLogin"
              :loading="loading"
            >
              登录系统
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-tip">
          <span class="tip-icon">💡</span>
          测试账号: admin / 密码: admin123
        </div>
        
        <div class="feature-highlights">
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-text">进度可视化监控</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚠️</div>
            <div class="feature-text">智能风险预警</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📋</div>
            <div class="feature-text">申报流程管理</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 气泡背景 -->
    <div class="bubbles">
      <div v-for="i in 15" :key="i" class="bubble" :style="bubbleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from "vue-router"
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  
  loading.value = true
  
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      ElMessage.success('登录成功')
      localStorage.setItem("token", "token_admin")
      router.push("/")
    } else {
      ElMessage.error('账号或密码错误')
    }
    loading.value = false
  }, 1000)
}

// 气泡样式
const bubbleStyle = (index) => {
  const size = Math.random() * 40 + 20
  const left = Math.random() * 100
  const animationDuration = Math.random() * 10 + 10
  const animationDelay = Math.random() * 5
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    'animation-duration': `${animationDuration}s`,
    'animation-delay': `${animationDelay}s`
  }
}

onMounted(() => {
  // 检查是否已登录
  const token = localStorage.getItem("token")
  if (token) {
    router.push("/")
  }
})
</script>

<style lang="scss" scoped>
@use './Login.scss';
</style>