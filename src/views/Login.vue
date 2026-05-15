<template>
  <div class="page-login">
    <div class="login-bg-grid"></div>
    <div class="login-container">
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 48 48" class="brand-svg">
            <path d="M24 4L4 44h40L24 4z" fill="none" stroke="#059669" stroke-width="2"/>
            <circle cx="24" cy="28" r="4" fill="#059669"/>
          </svg>
        </div>
        <h1 class="brand-title">特种设备安全隐患<br/>排查评估系统</h1>
        <p class="brand-subtitle">守护安全 · 防患未然</p>
      </div>
      <div class="login-card glass">
        <h2 class="login-card-title">账户登录</h2>
        <p class="login-card-desc">欢迎使用本系统，请登录以继续</p>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
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
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          <span>第三方登录</span>
          <div class="social-icons">
            <el-icon size="24"><svg-icon name="wechat" /></el-icon>
            <el-icon size="24"><svg-icon name="dingtalk" /></el-icon>
          </div>
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
const rememberMe = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('账号不能为空'))
  } else {
    callback()
  }
}
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('密码不能为空'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能小于6位'))
  } else {
    callback()
  }
}

const formRules = {
  username: [{ validator: validateUsername, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }]
}

const handleLogin = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    // 模拟登录校验
    setTimeout(() => {
      loading.value = false
      ElMessage.success('登录成功')
      router.push('/')
    }, 400)
  })
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>