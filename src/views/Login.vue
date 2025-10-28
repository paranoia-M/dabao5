<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>航清噪音项目申报综合管理系统</h1>
        <p>一站式申报材料管理与协作解决方案</p>
      </div>
      
      <el-form :model="loginForm" class="login-form">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
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
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>忘记密码？请联系系统管理员</p>
        <p class="platform-features">支持多人协作 · 材料版本管理 · 智能申报指导</p>
      </div>
    </div>
    
    <!-- 气泡背景 -->
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
    <div class="bubble bubble-4"></div>
    <div class="bubble bubble-5"></div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from "vue-router";

const router = useRouter()

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
  
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      ElMessage.success('登录成功');
      localStorage.setItem("token", "token_admin");
      router.push("/");
    } else {
      ElMessage.error('账号或密码错误');
    }
  }, 1000);
};
</script>

<style lang="scss" scoped>
@use './Login.scss';
</style>