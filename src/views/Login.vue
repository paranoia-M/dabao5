<template>
  <div class="page-login">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo-icon"></div>
        <h1 class="login-title">智慧监所指挥调度平台</h1>
        <p class="login-welcome">指挥调度，高效协同</p>
      </div>
      <el-form class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（默认 admin / admin123）"
            :prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            native-type="submit"
            style="width:100%"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span class="login-tip">默认账号：admin / admin123</span>
      </div>
    </div>
    <div class="login-decoration"></div>
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
  if (!form.username || form.password.length < 6) {
    ElMessage.warning('请输入有效账号和密码')
    return
  }
  loading.value = true
  setTimeout(() => {
    if (form.username === 'admin' && form.password === 'admin123') {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误（默认 admin / admin123）')
    }
    loading.value = false
  }, 400)
}
</script>

<style scoped lang="scss">
@use './Login.scss' as *;
</style>