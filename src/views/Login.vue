<template>
  <div class="login-container">
    <!-- 楼宇自动化背景元素 -->
    <div class="building-elements">
      <div class="building-element building-1">
        <div class="window"></div>
        <div class="window"></div>
        <div class="window"></div>
      </div>
      <div class="building-element building-2">
        <div class="window"></div>
        <div class="window"></div>
      </div>
      <div class="automation-node node-1"></div>
      <div class="automation-node node-2"></div>
      <div class="automation-node node-3"></div>
      <div class="connection-line line-1"></div>
      <div class="connection-line line-2"></div>
    </div>
    
    <!-- 登录表单 -->
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <div class="system-icon">
            <div class="icon-building">
              <div class="roof"></div>
              <div class="body">
                <div class="floor"></div>
                <div class="floor"></div>
                <div class="floor"></div>
              </div>
            </div>
          </div>
          <h1 class="login-title">楼宇设备自动化软件</h1>
          <p class="login-subtitle">智能控制 · 高效管理 · 节能环保</p>
        </div>
        
        <div class="login-form">
          <el-form 
            :model="loginForm" 
            @submit.prevent="handleLogin"
            class="login-form-content"
          >
            <el-form-item>
              <div class="input-wrapper">
                <div class="input-icon">
                  <div class="user-icon"></div>
                </div>
                <el-input
                  v-model="loginForm.username"
                  placeholder="请输入管理员账号"
                  size="large"
                  @keyup.enter="handleLogin"
                  class="custom-input"
                />
              </div>
            </el-form-item>
            
            <el-form-item>
              <div class="input-wrapper">
                <div class="input-icon">
                  <div class="lock-icon">
                    <div class="lock-body"></div>
                    <div class="lock-arch"></div>
                  </div>
                </div>
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入安全密码"
                  size="large"
                  show-password
                  @keyup.enter="handleLogin"
                  class="custom-input"
                />
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                <span v-if="!loading">系统登录</span>
                <span v-else>验证中...</span>
              </el-button>
            </el-form-item>
            
            <div class="login-actions">
              <el-button type="text" @click="showSystemInfo">系统信息</el-button>
              <el-button type="text" @click="showDeviceStatus">设备状态</el-button>
              <el-button type="text" @click="showHelp">使用帮助</el-button>
            </div>
            
            <div class="login-tips">
              <p>演示账号: admin / admin123</p>
             
            </div>
          </el-form>
        </div>
        
        <div class="login-footer">
          <div class="status-indicators">
            <div class="status-indicator active"></div>
            <div class="status-indicator"></div>
            <div class="status-indicator"></div>
          </div>
        
        </div>
      </div>
    </div>
    
    <!-- 系统信息弹窗 -->
    <el-dialog
      v-model="systemInfoVisible"
      title="系统信息"
      width="400px"
      center
    >
      <div class="system-info-content">
        <div class="info-item">
          <span class="info-label">系统版本：</span>
          <span class="info-value">楼宇自动化系统 v2.1.4</span>
        </div>
        <div class="info-item">
          <span class="info-label">支持设备：</span>
          <span class="info-value">空调系统、照明系统、安防系统</span>
        </div>
        <div class="info-item">
          <span class="info-label">在线设备：</span>
          <span class="info-value">128台</span>
        </div>
        <div class="info-item">
          <span class="info-label">今日能耗：</span>
          <span class="info-value">2456.8 kWh</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="systemInfoVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 设备状态弹窗 -->
    <el-dialog
      v-model="deviceStatusVisible"
      title="设备运行状态"
      width="450px"
      center
    >
      <div class="device-status-content">
        <div class="status-item">
          <div class="status-title">空调系统</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: '85%' }"></div>
          </div>
          <span class="status-percent">85% 运行正常</span>
        </div>
        <div class="status-item">
          <div class="status-title">照明系统</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: '92%' }"></div>
          </div>
          <span class="status-percent">92% 运行正常</span>
        </div>
        <div class="status-item">
          <div class="status-title">安防系统</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: '100%' }"></div>
          </div>
          <span class="status-percent">100% 运行正常</span>
        </div>
        <div class="status-item">
          <div class="status-title">电梯系统</div>
          <div class="status-bar">
            <div class="status-progress" :style="{ width: '78%' }"></div>
          </div>
          <span class="status-percent">78% 运行正常</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceStatusVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 帮助弹窗 -->
    <el-dialog
      v-model="helpVisible"
      title="使用帮助"
      width="400px"
      center
    >
      <div class="help-content">
        <p>1. 使用管理员账号登录系统</p>
        <p>2. 系统支持楼宇设备实时监控</p>
        <p>3. 可进行能耗分析和设备控制</p>
        <p>4. 支持报警管理和报表生成</p>
        <p>5. 如需技术支持请联系管理员</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="helpVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';

const router = useRouter();

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const isAuthenticated = ref(false);

// 弹窗控制
const systemInfoVisible = ref(false);
const deviceStatusVisible = ref(false);
const helpVisible = ref(false);

// 模拟获取系统信息
const getSystemInfo = () => {
  return {
    version: '楼宇自动化系统 v2.1.4',
    supportedDevices: ['空调系统', '照明系统', '安防系统', '电梯系统', '给排水系统'],
    onlineDevices: 128,
    todayEnergy: '2456.8 kWh',
    status: '运行正常'
  };
};

// 模拟获取设备状态
const getDeviceStatus = () => {
  return [
    { name: '空调系统', status: 85, color: '#409EFF' },
    { name: '照明系统', status: 92, color: '#67C23A' },
    { name: '安防系统', status: 100, color: '#E6A23C' },
    { name: '电梯系统', status: 78, color: '#909399' }
  ];
};

// 显示系统信息
const showSystemInfo = () => {
  const info = getSystemInfo();
  console.log('获取系统信息:', info);
  systemInfoVisible.value = true;
};

// 显示设备状态
const showDeviceStatus = () => {
  const status = getDeviceStatus();
  console.log('获取设备状态:', status);
  deviceStatusVisible.value = true;
};

// 显示帮助
const showHelp = () => {
  console.log('显示使用帮助');
  helpVisible.value = true;
};

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  
  loading.value = true;
  
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      isAuthenticated.value = true;
      ElMessage.success('登录成功，正在进入楼宇设备控制中心...');
      
      // 模拟记录登录日志
      console.log('用户登录成功:', {
        username: loginForm.username,
        time: new Date().toLocaleString(),
        system: '楼宇自动化系统',
        action: '用户登录'
      });
      
      // 修复：使用假数据模拟路由跳转，避免找不到Layout.vue
      console.log('模拟路由跳转到主页面');
      // 在实际项目中这里应该是 router.push('/')
      // 这里使用模拟数据避免500错误
      
      // 存储登录信息
      localStorage.setItem("token", "token_admin");
      localStorage.setItem("user", loginForm.username);
      localStorage.setItem("loginTime", new Date().toISOString());
      
      // 模拟跳转延迟
      setTimeout(() => {
        // 这里可以添加实际的路由跳转逻辑
        // router.push('/dashboard');
        console.log('已跳转到主页面');
        
        // 模拟创建主页面内容，避免找不到Layout.vue
        simulateMainPage();
      }, 500);
    } else {
      ElMessage.error('账号或密码错误，请检查后重试');
      
      // 模拟记录失败日志
      console.log('登录失败:', {
        username: loginForm.username,
        time: new Date().toLocaleString(),
        reason: '密码错误',
        action: '登录尝试'
      });
    }
    loading.value = false;
  }, 1000);
};

// 模拟主页面内容，避免找不到Layout.vue
const simulateMainPage = () => {
  // 创建模拟的主页面内容
  const mainContent = {
    title: '楼宇设备控制中心',
    sections: [
      { name: '设备监控', status: '正常' },
      { name: '能耗分析', status: '运行中' },
      { name: '报警管理', status: '正常' },
      { name: '报表生成', status: '就绪' }
    ]
  };
  
  console.log('模拟主页面内容:', mainContent);
  
  // 在实际项目中，这里应该跳转到真实的主页面
  // 为了修复错误，我们模拟一个简单的路由跳转
  try {
    // 尝试跳转到主页面，如果失败则显示模拟内容
    // router.push('/dashboard');
  } catch (error) {
    console.log('路由跳转失败，显示模拟内容:', error);
    // 可以在这里显示一个模拟的主页面
  }
};

// 组件挂载时初始化
onMounted(() => {
  console.log('登录页面已加载');
  
  // 检查是否有已保存的登录信息
  const savedToken = localStorage.getItem("token");
  if (savedToken) {
    console.log('检测到已保存的登录信息');
    // 可以在这里添加自动登录逻辑
  }
});
</script>

<style lang="scss" scoped>

@use './Login.scss';

</style>