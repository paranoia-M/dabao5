<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <h1 class="system-title">泰捷欣监控设备数据压缩上传应用系统</h1>
        <p class="system-desc">全面监控 · 智能运维 · 安全保障</p>
        <div class="monitor-panel">
          <div class="monitor-item">
            <span class="label">服务器状态</span>
            <span class="value running">运行中</span>
          </div>
          <div class="monitor-item">
            <span class="label">网络延迟</span>
            <span class="value">28ms</span>
          </div>
          <div class="monitor-item">
            <span class="label">今日告警</span>
            <span class="value warning">3条</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">用户登录</h2>
          <el-form :model="loginForm" label-position="top" class="login-form">
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入用户名" 
                clearable
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
            <el-button 
              type="primary" 
              class="login-btn" 
              @click="handleLogin"
              :loading="loading"
            >
              登录
            </el-button>
          </el-form>
          <div class="login-tip">
            默认账号: admin 密码: admin123
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="showMonitorDialog" title="系统监控详情" width="50%">
      <div class="monitor-detail">
        <div class="detail-item">
          <span>CPU使用率</span>
          <el-progress :percentage="75" :color="customColors" />
        </div>
        <div class="detail-item">
          <span>内存使用</span>
          <el-progress :percentage="68" :color="customColors" />
        </div>
        <div class="detail-item">
          <span>磁盘空间</span>
          <el-progress :percentage="45" :color="customColors" />
        </div>
        <div class="detail-item">
          <span>网络流量</span>
          <el-progress :percentage="82" :color="customColors" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showMonitorDialog = false">关闭</el-button>
        <el-button type="primary" @click="refreshMonitor">刷新数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const loading = ref(false);
const showMonitorDialog = ref(false);

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});

const isAuthenticated = ref(false);
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
];

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  
  loading.value = true;
  // 模拟登录请求
  setTimeout(() => {
    loading.value = false;
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      isAuthenticated.value = true;
      ElMessage.success('登录成功');
      router.push('/');
      localStorage.setItem("token", "token_admin");
    } else {
      ElMessage.error('账号或密码错误');
    }
  }, 1000);
};

const refreshMonitor = () => {
  ElMessage.success('监控数据已刷新');
};
</script>

<style lang="scss" scoped>

@use './Login.scss';

</style>