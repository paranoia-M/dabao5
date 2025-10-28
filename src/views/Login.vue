<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bubbles">
        <div v-for="i in 20" :key="i" class="bubble" :style="bubbleStyle(i)"></div>
      </div>
      
      <div class="login-card">
        <div class="login-header">
          <h1 class="system-title">航清环境应急移动源管理软件</h1>
          <p class="system-subtitle">Smart Agriculture IoT Environmental Monitoring System</p>
        </div>
        
        <div class="login-content">
          <div class="welcome-section">
            <h2>欢迎登录</h2>
            <p>航清环境应急移动源管理软件</p>
            <p>测试账号：admin</p>
            <p>测试密码：admin123</p>
          </div>
          
          <el-form class="login-form" :model="loginForm" @submit.prevent="handleLogin">
            <el-form-item>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入账号"
                size="large"
                clearable
              >
                <template #prefix>
                  <span class="custom-icon user-icon">👤</span>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                clearable
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <span class="custom-icon lock-icon">🔒</span>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="login-btn"
                @click="handleLogin"
                :loading="loading"
              >
                <span v-if="!loading">登录系统</span>
                <span v-else>登录中...</span>
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="quick-stats">
            <el-row :gutter="20">
              <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
                <div class="stat-card" @click="showDetail('temperature')">
                  <div class="stat-icon temperature">
                    <span class="custom-stat-icon">🌡️</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ stats.temperature }}°C</div>
                    <div class="stat-label">温度</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
                <div class="stat-card" @click="showDetail('humidity')">
                  <div class="stat-icon humidity">
                    <span class="custom-stat-icon">💧</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ stats.humidity }}%</div>
                    <div class="stat-label">湿度</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
                <div class="stat-card" @click="showDetail('soilMoisture')">
                  <div class="stat-icon soil">
                    <span class="custom-stat-icon">🌱</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ stats.soilMoisture }}%</div>
                    <div class="stat-label">土壤湿度</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
                <div class="stat-card" @click="showDetail('lightIntensity')">
                  <div class="stat-icon light">
                    <span class="custom-stat-icon">☀️</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ stats.lightIntensity }}</div>
                    <div class="stat-label">光照强度</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <div class="realtime-chart">
            <h3>实时数据趋势</h3>
            <div class="chart-container">
              <div 
                v-for="(data, index) in chartData" 
                :key="index"
                class="chart-bar"
                :style="{ height: data.height + '%', backgroundColor: data.color }"
                :title="data.label + ': ' + data.value"
              ></div>
            </div>
            <div class="chart-labels">
              <span v-for="(data, index) in chartData" :key="index" class="chart-label">
                {{ data.label }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="login-footer">
          <p>智慧农业 · 科技赋能 · 绿色发展</p>
          <p class="login-tip">测试账号: admin / 密码: admin123</p>
        </div>
      </div>
    </div>

    <!-- 数据详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="detailDialog.title"
      width="500px"
      center
    >
      <div class="detail-content">
        <div class="detail-value">{{ detailDialog.value }}</div>
        <div class="detail-description">{{ detailDialog.description }}</div>
        <div class="detail-tips">
          <h4>农业建议：</h4>
          <p>{{ detailDialog.tips }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
})

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
      // 模拟获取用户信息
      const userInfo = {
        name: '管理员',
        role: 'admin',
        farmName: '智慧农业示范基地'
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      localStorage.setItem('token', 'token_admin')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
    }
    loading.value = false
  }, 1000)
}

// 环境数据统计
const stats = reactive({
  temperature: 25.6,
  humidity: 68,
  soilMoisture: 45,
  lightIntensity: '850Lux'
})

// 图表数据
const chartData = ref([
  { label: '温度', value: '25.6°C', height: 65, color: '#ff6b6b' },
  { label: '湿度', value: '68%', height: 68, color: '#4ecdc4' },
  { label: '土壤', value: '45%', height: 45, color: '#45b7d1' },
  { label: '光照', value: '850Lux', height: 85, color: '#ffa500' }
])

// 详情弹窗数据
const detailDialog = reactive({
  visible: false,
  title: '',
  value: '',
  description: '',
  tips: ''
})

// 显示数据详情
const showDetail = (type) => {
  const detailConfig = {
    temperature: {
      title: '温度监测详情',
      value: `${stats.temperature}°C`,
      description: '当前农田环境温度监测数据',
      tips: '适宜温度范围：15-30°C。当前温度适宜作物生长，建议保持通风。'
    },
    humidity: {
      title: '湿度监测详情',
      value: `${stats.humidity}%`,
      description: '当前农田环境湿度监测数据',
      tips: '适宜湿度范围：60-80%。当前湿度良好，有利于作物生长。'
    },
    soilMoisture: {
      title: '土壤湿度监测详情',
      value: `${stats.soilMoisture}%`,
      description: '当前土壤湿度监测数据',
      tips: '适宜土壤湿度：40-60%。当前湿度适中，建议适时灌溉。'
    },
    lightIntensity: {
      title: '光照强度监测详情',
      value: stats.lightIntensity,
      description: '当前光照强度监测数据',
      tips: '适宜光照强度：800-1200Lux。当前光照充足，有利于光合作用。'
    }
  }
  
  const config = detailConfig[type]
  if (config) {
    Object.assign(detailDialog, config)
    detailDialog.visible = true
  }
}

// 气泡动画样式
const bubbleStyle = (index) => {
  const size = Math.random() * 60 + 20
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 20}s`,
    animationDuration: `${Math.random() * 10 + 10}s`
  }
}

// 模拟实时数据更新
onMounted(() => {
  setInterval(() => {
    // 模拟数据波动
    stats.temperature = (25 + Math.random() * 3).toFixed(1)
    stats.humidity = Math.floor(65 + Math.random() * 10)
    stats.soilMoisture = Math.floor(40 + Math.random() * 15)
    stats.lightIntensity = Math.floor(800 + Math.random() * 200) + 'Lux'
    
    // 更新图表数据
    chartData.value[0].value = stats.temperature + '°C'
    chartData.value[0].height = (stats.temperature - 22) * 10
    chartData.value[1].value = stats.humidity + '%'
    chartData.value[1].height = stats.humidity
    chartData.value[2].value = stats.soilMoisture + '%'
    chartData.value[2].height = stats.soilMoisture
    chartData.value[3].value = stats.lightIntensity
    chartData.value[3].height = parseInt(stats.lightIntensity) / 12
  }, 3000)
})
</script>

<style lang="scss" scoped>
@use './Login.scss';
</style>