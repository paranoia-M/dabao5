<template>
  <div class="page-login">
    <div class="login-left">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 120 120" class="brand-svg">
            <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="60" cy="60" r="20" fill="currentColor" opacity="0.3" />
            <line x1="20" y1="20" x2="100" y2="100" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
            <line x1="100" y1="20" x2="20" y2="100" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
          </svg>
        </div>
        <h1 class="brand-title">食品生产线智能监控系统</h1>
        <p class="brand-subtitle">精准管控 · 安全溯源 · 智能运维</p>
      </div>
      <div class="decorative-grid"></div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <h2 class="login-card-title">用户登录</h2>
        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin" label-width="0">
          <el-form-item prop="account">
            <el-input v-model="form.account" placeholder="请输入账号" :prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="remember">记住密码</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleLogin" class="login-btn">登 录</el-button>
          </el-form-item>
        </el-form>
        <div class="login-third">
          <span class="third-label">第三方登录</span>
          <div class="third-icons">
            <span class="third-icon">微信</span>
            <span class="third-icon">钉钉</span>
            <span class="third-icon">企业微信</span>
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
const remember = ref(true)
const form = reactive({
  account: '',
  password: ''
})
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不少于6位', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  formRef.value.validate(valid => {
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