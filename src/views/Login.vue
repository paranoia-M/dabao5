
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <h1 class="system-title">航清环境、污染应急预案处理系统</h1>
        <p class="system-desc">实时监测环境数据 · 精准校准设备参数</p>
        <div class="data-panel">
          <div class="data-item">
            <span class="data-label">PM2.5</span>
            <span class="data-value">{{ mockData.pm25 }} μg/m³</span>
          </div>
          <div class="data-item">
            <span class="data-label">温度</span>
            <span class="data-value">{{ mockData.temperature }} °C</span>
          </div>
          <div class="data-item">
            <span class="data-label">湿度</span>
            <span class="data-value">{{ mockData.humidity }}%</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">用户登录</h2>
          <el-form :model="loginForm" class="login-form">
            <el-form-item>
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入账号" 
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
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
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();

// 模拟环境数据
const mockData = reactive({
  pm25: Math.floor(Math.random() * 50 + 20),
  temperature: (Math.random() * 10 + 20).toFixed(1),
  humidity: Math.floor(Math.random() * 30 + 50)
});

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});
const loading = ref(false);

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
      router.push('/');
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
    