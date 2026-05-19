<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">
            <el-icon :size="48" color="#0066CC"><Lock /></el-icon>
          </div>
          <h1 class="login-title">桥梁桩基成孔质量检测系统</h1>
          <p class="login-subtitle">请登录您的账户</p>
        </div>
        <el-form
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
        <div v-if="errorMessage" class="login-error">
          <el-alert
            :title="errorMessage"
            type="error"
            show-icon
            :closable="false"
          />
        </div>
        <div class="login-footer">
          <span class="login-footer-text">剩余尝试次数：{{ remainingAttempts }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const loading = ref(false)
const errorMessage = ref('')
const remainingAttempts = ref(5)

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    errorMessage.value = '请输入账号和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  setTimeout(() => {
    loading.value = false
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      ElMessage.success('登录成功')
      localStorage.setItem('token', 'token_admin')
      router.push('/')
    } else {
      remainingAttempts.value--
      errorMessage.value = '账号或密码错误'
      if (remainingAttempts.value <= 0) {
        errorMessage.value = '错误次数过多，请稍后再试'
      }
    }
  }, 1500)
}
</script>

<style lang='scss' scoped>
@use './index.scss';
</style>
