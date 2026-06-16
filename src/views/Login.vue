
<template>
  <div class="login-container">
    <div class="login-left">
      <div class="bubbles-container">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <div class="security-animation">
          <div class="shield"></div>
          <div class="lock"></div>
          <div class="network"></div>
        </div>
      </div>
      <h1 class="system-title">计算机网络安全维护集成管理软件</h1>
      <p class="system-desc">全面监控 · 智能分析 · 快速响应</p>
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <div class="feature-text">实时威胁检测</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <div class="feature-text">漏洞防护</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-text">安全态势分析</div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <el-card class="login-box" shadow="always">
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
            >
              <template #prefix>
                <span class="input-prefix">🔑</span>
              </template>
            </el-input>
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
        <div class="login-footer">
          <p>账号: admin 密码: admin123</p>
          <el-button type="text" @click="showSecurityTip">安全登录提示</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="安全提示" width="30%">
      <div class="security-tip">
        <p>1. 请确保使用专用网络登录系统</p>
        <p>2. 定期更换密码并启用双因素认证</p>
        <p>3. 不要在公共设备上保存登录信息</p>
        <p>4. 发现异常登录请立即联系管理员</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});

const showSecurityTip = () => {
  dialogVisible.value = true;
}

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
      // 模拟获取用户权限
      const userInfo = {
        name: '管理员',
        role: 'admin',
        lastLogin: new Date().toLocaleString(),
        securityLevel: '高级'
      };
      localStorage.setItem("token", "token_admin");
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      
      // 模拟安全审计日志
      console.log(`[安全审计] 用户 ${loginForm.username} 于 ${new Date().toLocaleString()} 登录系统`);
      
      router.push("/");
    } else {
      ElMessage.error('账号或密码错误');
      // 模拟失败日志
      console.log(`[安全警告] 用户 ${loginForm.username} 尝试登录失败`);
    }
    loading.value = false;
  }, 1000);
};
</script>

<style lang="scss" scoped>

@use './Login.scss';

</style>
    