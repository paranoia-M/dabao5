<template>
  <div class="page-login">
    <div class="login-left">
      <div class="brand">
        <div class="book">
          <div class="book-page left-page"></div>
          <div class="book-spine"></div>
          <div class="book-page right-page"></div>
        </div>
        <h1 class="brand-title">宿舍信息管理</h1>
        <p class="brand-subtitle">维修登记 · 智能无纸化</p>
        <div class="brand-decoration">
          <span class="char">📖</span>
          <span class="char">✏️</span>
          <span class="char">📚</span>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <h2 class="card-title">欢迎登录</h2>
        <p class="card-desc">请使用学号/工号登录</p>
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
              size="large"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          <span>第三方登录</span>
          <div class="third-icons">
            <span class="third-icon">❖</span>
            <span class="third-icon">⚙</span>
            <span class="third-icon">✉</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)
const rememberMe = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (!loginForm.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!loginForm.password || loginForm.password.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('登录成功')
    router.push('/')
  }, 400)
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>