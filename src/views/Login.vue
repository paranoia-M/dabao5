
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="broadcast-icon">
          <svg viewBox="0 0 24 24" width="80" height="80">
            <path fill="#409EFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        <h1>智慧广播管理系统</h1>
        <p class="system-description">智能化广播设备管理 · 精准内容投放 · 实时监控分析</p>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">📡</div>
            <span>设备远程控制</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📅</div>
            <span>定时任务管理</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <span>播放数据分析</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">用户登录</h2>
          <el-form :model="loginForm" label-width="80px" class="login-form">
            <el-form-item label="账号" prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入账号" 
                clearable
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleLogin" 
                class="login-btn"
                :loading="loading"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter()
const loading = ref(false)

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});

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
      router.push("/");
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
    