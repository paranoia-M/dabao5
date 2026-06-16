
<template>
  <div class="login-container">
    <div class="login-bubbles">
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
      <div class="bubble bubble-4"></div>
      <div class="bubble bubble-5"></div>
    </div>
    <div class="login-wrapper">
      <h1 class="login-title">智慧交通信息发布管理系统</h1>
      <div class="login-subtitle">智能调度 · 实时监控 · 数据分析</div>
      <el-card class="login-card" shadow="hover">
        <el-form :model="loginForm" label-width="80px" class="login-form">
          <el-form-item label="账号" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入账号" clearable>
              <template #prefix>
                <span class="custom-icon">👤</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password>
              <template #prefix>
                <span class="custom-icon">🔒</span>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleLogin" class="login-btn" round>登录</el-button>
            <el-button @click="showSystemInfo" class="info-btn" round>系统介绍</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      <div class="login-footer">
        <span>©2023 智慧交通信息平台 版本 v2.1.0</span>
      </div>
    </div>
    
    <el-dialog v-model="dialogVisible" title="系统介绍" width="50%" center>
      <div class="system-info">
        <h3>智慧交通信息发布管理系统</h3>
        <p>本系统是面向现代城市交通管理的智能化平台，主要功能包括：</p>
        <ul>
          <li>实时交通数据采集与分析</li>
          <li>智能信号灯控制系统</li>
          <li>交通事件快速发布</li>
          <li>多终端信息同步展示</li>
          <li>历史数据统计与报表</li>
        </ul>
        <p>通过本系统，管理人员可以高效地进行交通调度和应急响应。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" type="primary">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter()
const dialogVisible = ref(false);

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});
const isAuthenticated = ref(false);

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      isAuthenticated.value = true;
      ElMessage.success('登录成功');
      localStorage.setItem("token", "token_admin");
      router.push("/");
    } else {
      ElMessage.error('账号或密码错误');
    }
  }, 1000);
};

const showSystemInfo = () => {
  dialogVisible.value = true;
};
</script>

<style lang="scss" scoped>

@use './Login.scss';

</style>
    