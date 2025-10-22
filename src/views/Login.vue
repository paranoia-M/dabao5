<template>
  <div class="emergency-radio-container">
    <!-- 登录表单 -->
    <div class="login-container" v-if="!isAuthenticated">
      <div class="login-background">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <div class="bubble bubble-4"></div>
      </div>
      <div class="login-form-wrapper">
        <div class="login-header">
          <h1 class="system-title">网络探针实时检测预警软件</h1>
          <p class="system-subtitle">实时监控、数据分析、应急响应</p>
        </div>
        <el-form 
          :model="loginForm" 
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="login-button"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
          <div class="login-tip">
            <p>测试账号: admin / 密码: admin123</p>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 主页面内容 -->
    <div v-else class="main-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">网络探针实时检测预警软件</h1>
        <p class="page-subtitle">实时监控、数据分析、应急响应</p>
      </div>

      <!-- 数据概览卡片 -->
      <div class="overview-cards">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :lg="3">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon primary">
                  <i class="el-icon-monitor"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.activeDevices }}</div>
                  <div class="stat-label">活跃设备</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :lg="3">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon success">
                  <i class="el-icon-chat-dot-round"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.totalMessages }}</div>
                  <div class="stat-label">今日消息</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :lg="3">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon warning">
                  <i class="el-icon-warning"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.emergencySignals }}</div>
                  <div class="stat-label">紧急信号</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :lg="3">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon danger">
                  <i class="el-icon-position"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.coverageRate }}%</div>
                  <div class="stat-label">信号覆盖率</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <el-row :gutter="20">
          <!-- 信号监控图表 -->
          <el-col :xs="24" :lg="16">
            <el-card class="chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>信号强度实时监控</span>
                  <el-button type="text" @click="refreshChartData">刷新数据</el-button>
                </div>
              </template>
              <div class="chart-container">
                <div class="chart-placeholder">
                  <el-empty description="图表展示区域" :image-size="100">
                    <el-button type="primary" @click="generateChartData">生成模拟数据</el-button>
                  </el-empty>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 设备状态 -->
          <el-col :xs="24" :lg="8">
            <el-card class="device-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span>设备状态监控</span>
                </div>
              </template>
              <div class="device-list">
                <div 
                  v-for="device in deviceStatus" 
                  :key="device.id" 
                  class="device-item"
                  :class="{ 'device-offline': device.status === 'offline' }"
                >
                  <div class="device-info">
                    <el-tag 
                      :type="getStatusType(device.status)" 
                      size="small"
                    >
                      {{ getStatusText(device.status) }}
                    </el-tag>
                    <span class="device-name">{{ device.name }}</span>
                  </div>
                  <div class="device-meta">
                    <span class="device-location">{{ device.location }}</span>
                    <span class="device-time">{{ device.lastUpdate }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 通信记录表格 -->
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>通信记录</span>
              <div class="table-actions">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索设备或内容"
                  style="width: 200px; margin-right: 10px;"
                  clearable
                  @input="handleSearch"
                />
                <el-select 
                  v-model="filterStatus" 
                  placeholder="状态筛选" 
                  style="width: 120px; margin-right: 10px;"
                  @change="handleFilter"
                >
                  <el-option label="全部" value=""></el-option>
                  <el-option label="正常" value="normal"></el-option>
                  <el-option label="紧急" value="emergency"></el-option>
                  <el-option label="警告" value="warning"></el-option>
                </el-select>
                <el-button type="primary" @click="exportData">导出数据</el-button>
              </div>
            </div>
          </template>

          <el-table 
            :data="filteredRecords" 
            v-loading="loading"
            style="width: 100%"
          >
            <el-table-column prop="time" label="时间" width="180">
              <template #default="{ row }">
                <div class="time-cell">
                  <div class="time-main">{{ row.time }}</div>
                  <div class="time-date">{{ row.date }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="device" label="设备" width="120"></el-table-column>
            <el-table-column prop="content" label="通信内容">
              <template #default="{ row }">
                <div class="content-cell" :class="{ 'emergency-content': row.type === 'emergency' }">
                  {{ row.content }}
                  <el-tag 
                    v-if="row.type === 'emergency'" 
                    type="danger" 
                    size="small"
                    style="margin-left: 8px;"
                  >
                    紧急
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="signal" label="信号强度" width="100">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.signal" 
                  :color="getSignalColor(row.signal)"
                  :show-text="false"
                />
                <span class="signal-text">{{ row.signal }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="120"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="handleDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalRecords"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="通信详情"
        width="500px"
      >
        <div v-if="selectedRecord" class="detail-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="设备编号">{{ selectedRecord.device }}</el-descriptions-item>
            <el-descriptions-item label="通信时间">{{ selectedRecord.time }}</el-descriptions-item>
            <el-descriptions-item label="通信内容">{{ selectedRecord.content }}</el-descriptions-item>
            <el-descriptions-item label="信号强度">{{ selectedRecord.signal }}%</el-descriptions-item>
            <el-descriptions-item label="位置信息">{{ selectedRecord.location }}</el-descriptions-item>
            <el-descriptions-item label="通信类型">
              <el-tag :type="getRecordType(selectedRecord.type)">
                {{ getRecordTypeText(selectedRecord.type) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <template #footer>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEmergencyResponse">应急响应</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 登录相关
const loginForm = reactive({
  username: '',
  password: ''
})

const isAuthenticated = ref(false)

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  // 模拟登录请求
  setTimeout(() => {
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      isAuthenticated.value = true
      ElMessage.success('登录成功')
      router.push('/')
      localStorage.setItem('token', 'token_admin')
    } else {
      ElMessage.error('账号或密码错误')
    }
  }, 1000)
}

// 检查是否已登录
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    isAuthenticated.value = true
  }
  generateMockData()
})

// 响应式数据
const overviewData = reactive({
  activeDevices: 156,
  totalMessages: 2347,
  emergencySignals: 12,
  coverageRate: 89.5
})

const deviceStatus = ref([
  { id: 1, name: '基站A-001', location: '区域A', status: 'online', lastUpdate: '2分钟前' },
  { id: 2, name: '移动终端B-002', location: '区域B', status: 'online', lastUpdate: '5分钟前' },
  { id: 3, name: '应急车C-003', location: '区域C', status: 'warning', lastUpdate: '10分钟前' },
  { id: 4, name: '手持设备D-004', location: '区域D', status: 'offline', lastUpdate: '1小时前' },
  { id: 5, name: '中继站E-005', location: '区域E', status: 'online', lastUpdate: '3分钟前' }
])

const communicationRecords = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedRecord = ref(null)

// 计算属性
const totalRecords = computed(() => communicationRecords.value.length)

const filteredRecords = computed(() => {
  let records = communicationRecords.value
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    records = records.filter(record => 
      record.device.toLowerCase().includes(keyword) ||
      record.content.toLowerCase().includes(keyword) ||
      record.location.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    records = records.filter(record => record.type === filterStatus.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return records.slice(start, end)
})

// 方法
const getStatusType = (status) => {
  const types = {
    online: 'success',
    warning: 'warning',
    offline: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    online: '在线',
    warning: '警告',
    offline: '离线'
  }
  return texts[status] || '未知'
}

const getSignalColor = (signal) => {
  if (signal >= 80) return '#67c23a'
  if (signal >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getRecordType = (type) => {
  const types = {
    normal: '',
    warning: 'warning',
    emergency: 'danger'
  }
  return types[type] || ''
}

const getRecordTypeText = (type) => {
  const texts = {
    normal: '正常',
    warning: '警告',
    emergency: '紧急'
  }
  return texts[type] || '未知'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleDetail = (record) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const handleEmergencyResponse = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要启动应急响应流程吗？',
      '应急响应确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('应急响应流程已启动')
    detailDialogVisible.value = false
  } catch {
    ElMessage.info('已取消操作')
  }
}

const refreshChartData = () => {
  loading.value = true
  setTimeout(() => {
    ElMessage.success('数据已刷新')
    loading.value = false
  }, 1000)
}

const generateChartData = () => {
  ElMessage.info('图表数据生成功能开发中')
}

const exportData = () => {
  ElMessage.success('数据导出成功')
}

// 模拟数据生成
const generateMockData = () => {
  const devices = ['基站A-001', '移动终端B-002', '应急车C-003', '手持设备D-004', '中继站E-005']
  const locations = ['区域A', '区域B', '区域C', '区域D', '区域E']
  const contents = [
    '设备运行正常，信号稳定',
    '检测到微弱干扰信号',
    '紧急求助！需要医疗支援',
    '常规通信测试',
    '设备电池电量低警告',
    '信号强度波动较大',
    '设备重启完成',
    '位置信息更新'
  ]
  const types = ['normal', 'normal', 'emergency', 'normal', 'warning', 'warning', 'normal', 'normal']
  
  const records = []
  for (let i = 0; i < 50; i++) {
    const deviceIndex = Math.floor(Math.random() * devices.length)
    const locationIndex = Math.floor(Math.random() * locations.length)
    const contentIndex = Math.floor(Math.random() * contents.length)
    
    records.push({
      id: i + 1,
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      date: '2024-01-15',
      device: devices[deviceIndex],
      content: contents[contentIndex],
      signal: Math.floor(Math.random() * 40) + 60, // 60-100
      location: locations[locationIndex],
      type: types[contentIndex]
    })
  }
  
  communicationRecords.value = records
}
</script>

<style lang="scss" scoped>
@use './Login.scss';
</style>