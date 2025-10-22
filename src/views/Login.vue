
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <h1 class="system-title">浩泽金郡智慧终端设备调度管理平台</h1>
        <p class="system-desc">全面监控 · 智能预警 · 分级管控</p>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div class="feature-text">风险四色图动态展示</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div class="feature-text">隐患闭环管理</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div class="feature-text">智能预警推送</div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-form :model="loginForm" class="login-form" @submit.prevent="handleLogin">
          <h2 class="login-title">用户登录</h2>
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              clearable
            >
              <template #prefix>
                <span class="input-prefix">账号</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
            >
              <template #prefix>
                <span class="input-prefix">密码</span>
              </template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            native-type="submit"
            :loading="loading"
          >
            登录
          </el-button>
          <div class="login-footer">
            <div class="login-tip">默认账号: admin 密码: admin123</div>
            <el-button type="text" @click="showSafetyGuidelines">安全生产规范</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="安全生产规范"
      width="50%"
    >
      <div class="safety-content">
        <h3>风险分级管控要求</h3>
        <p>1. 建立安全风险分级管控制度，制定分级管控措施</p>
        <p>2. 对重大危险源进行重点管控，实施动态监测预警</p>
        <p>3. 定期开展风险评估，及时更新风险管控措施</p>
        <h3>动态预警机制</h3>
        <p>1. 建立预警信息发布制度，明确预警级别和响应措施</p>
        <p>2. 对异常情况实时监测，及时发布预警信息</p>
        <p>3. 预警信息应包括风险类型、位置、级别和应对措施</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="dialogVisible = false">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const dialogVisible = ref(false)

const showSafetyGuidelines = () => {
  dialogVisible.value = true
}

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
      // 模拟获取用户权限
      const userInfo = {
        name: '管理员',
        role: 'admin',
        permissions: ['risk_view', 'warning_manage', 'report_export']
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      localStorage.setItem('token', 'token_admin')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
    }
    loading.value = false
  }, 1000)
}
</script>

<style lang="scss" scoped>
@use './Login.scss';
</style>
    