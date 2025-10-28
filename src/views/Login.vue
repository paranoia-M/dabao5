
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <h1 class="system-title">航清智慧环保数据采集分析系统</h1>
        <p class="system-desc">实时监测 · 智能预警 · 数据分析</p>
        <div class="system-features">
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-text">实时数据监控</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚠️</div>
            <div class="feature-text">智能异常预警</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📈</div>
            <div class="feature-text">多维数据分析</div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">用户登录</h2>
          <el-form :model="loginForm" label-width="80px" class="login-form">
            <el-form-item label="账号" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入账号" clearable></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" placeholder="请输入密码" show-password></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
              <el-button @click="showSystemInfo" class="info-btn">系统介绍</el-button>
            </el-form-item>
          </el-form>
          <div class="login-tip">提示：管理员账号 admin / admin123</div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="系统介绍" width="50%">
      <div class="system-info-content">
        <h3>航清智慧环保数据采集分析系统</h3>
        <p>本系统采用先进的物联网技术和人工智能算法，实现对环境监测数据的实时采集、分析和预警。</p>
        <div class="info-features">
          <el-tag type="success" effect="plain">实时数据监控</el-tag>
          <el-tag type="warning" effect="plain">异常智能预警</el-tag>
          <el-tag type="info" effect="plain">历史数据分析</el-tag>
          <el-tag type="danger" effect="plain">紧急事件处理</el-tag>
        </div>
        <p>系统可监测空气质量、水质、噪音等多种环境指标，当数据异常时自动触发预警机制。</p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const dialogVisible = ref(false);

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
      router.push("/");
      localStorage.setItem("token", "token_admin");
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
    