
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="bubbles">
          <div class="bubble bubble-1"></div>
          <div class="bubble bubble-2"></div>
          <div class="bubble bubble-3"></div>
        </div>
        <h1 class="title">企业知识人工智能<br>智能分类整合平台</h1>
        <p class="subtitle">高效管理 · 智能分类 · 知识整合</p>
        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-text">智能数据分析</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div class="feature-text">精准知识检索</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🤖</div>
            <div class="feature-text">AI自动分类</div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card">
          <h2 class="login-title">用户登录</h2>
          <el-form :model="loginForm" class="login-form">
            <el-form-item>
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入账号" 
                class="custom-input"
              >
                <template #prefix>
                  <span class="input-prefix">👤</span>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                class="custom-input"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <span class="input-prefix">🔒</span>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                class="login-btn" 
                @click="handleLogin"
                :loading="loading"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-footer">
            <el-button type="text" @click="showHelpDialog">使用帮助</el-button>
            <el-button type="text" @click="showContactDialog">联系我们</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <el-dialog v-model="helpVisible" title="使用帮助" width="500px">
      <div class="dialog-content">
        <p>1. 请输入您的企业账号和密码登录系统</p>
        <p>2. 默认管理员账号: admin/admin123</p>
        <p>3. 登录后可体验智能分类、知识整合等功能</p>
      </div>
      <template #footer>
        <el-button @click="helpVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 联系对话框 -->
    <el-dialog v-model="contactVisible" title="联系我们" width="500px">
      <div class="dialog-content">
        <p>技术支持: 400-888-8888</p>
        <p>邮箱: support@ai-knowledge.com</p>
        <p>工作时间: 周一至周五 9:00-18:00</p>
      </div>
      <template #footer>
        <el-button @click="contactVisible = false">确定</el-button>
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
const helpVisible = ref(false)
const contactVisible = ref(false)

const showHelpDialog = () => {
  helpVisible.value = true
}

const showContactDialog = () => {
  contactVisible.value = true
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
      localStorage.setItem('token', 'token_admin')
      // 模拟获取用户信息
      const userInfo = {
        name: '管理员',
        role: 'admin',
        avatar: '',
        permissions: ['all']
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
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
    