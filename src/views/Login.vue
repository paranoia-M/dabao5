
<template>
  <div class="login-container">
    <div class="water-wave">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
    </div>
    
    <div class="login-form">
      <div class="login-header">
        <h1>航清水资源保护与智能化系统</h1>
        <p class="subtitle">全面监测 · 智能分析 · 科学决策</p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">🌊</span>
            <span>多源数据整合</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>智能分析引擎</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span>水质实时监测</span>
          </div>
        </div>
      </div>
      
      <el-form :model="loginForm" class="form-content">
        <el-form-item>
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入账号" 
            size="large"
            class="custom-input">
            <template #prefix>
              <span class="input-prefix">👤</span>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            placeholder="请输入密码" 
            type="password" 
            size="large"
            show-password
            class="custom-input">
            <template #prefix>
              <span class="input-prefix">🔒</span>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            @click="handleLogin" 
            class="login-btn"
            :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
      </div>
    </div>

    <!-- 登录成功弹窗 -->
    <el-dialog
      v-model="showWelcomeDialog"
      title="欢迎使用"
      width="30%"
      center>
      <div class="welcome-content">
        <p>欢迎进入航清水资源保护与智能化系统</p>
        <p>当前系统已接入 <span class="highlight">12</span> 个数据源</p>
        <p>监测 <span class="highlight">156</span> 个水质指标</p>
        <p>覆盖 <span class="highlight">32</span> 个省市地区</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showWelcomeDialog = false; router.push('/');">
          开始使用
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

const router = useRouter();

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const showWelcomeDialog = ref(false);

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  
  loading.value = true;
  
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      ElMessage.success('登录成功');
      localStorage.setItem("token", "token_admin");
      showWelcomeDialog.value = true;
    } else {
      ElMessage.error('账号或密码错误');
    }
    loading.value = false;
  }, 1000);
};
</script>

<style lang="scss" scoped>

@use './Login.scss';

</style>
    