<template>
  <div class="data-analysis">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">航清环境应急移动源管理软件</h1>
      <p class="page-subtitle">实时监测农业环境数据，助力精准农业生产</p>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" v-for="card in overviewCards" :key="card.title">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: card.color }">
                <span class="icon-text">{{ card.icon }}</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-title">{{ card.title }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 环境数据图表 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>温度变化趋势</span>
                <el-select v-model="timeRange" size="small" style="width: 120px" @change="handleTimeRangeChange">
                  <el-option label="24小时" value="24h"></el-option>
                  <el-option label="7天" value="7d"></el-option>
                  <el-option label="30天" value="30d"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="fake-chart temperature-chart">
                <div class="chart-line"></div>
                <div class="chart-points">
                  <div 
                    v-for="(point, index) in temperatureData" 
                    :key="index"
                    class="chart-point"
                    :style="{ left: `${index * 20}%`, bottom: `${(point - 15) * 4}%` }"
                  ></div>
                </div>
                <div class="chart-labels">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>湿度监测数据</span>
                <el-select v-model="humidityRange" size="small" style="width: 120px" @change="handleHumidityRangeChange">
                  <el-option label="24小时" value="24h"></el-option>
                  <el-option label="7天" value="7d"></el-option>
                  <el-option label="30天" value="30d"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="fake-chart humidity-chart">
                <div 
                  v-for="(bar, index) in humidityData" 
                  :key="index"
                  class="chart-bar"
                  :style="{ height: `${bar}%` }"
                ></div>
                <div class="chart-labels">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 设备状态列表 -->
    <div class="device-section">
      <el-card class="device-card" shadow="hover">
        <template #header>
          <div class="device-header">
            <span>设备状态监控</span>
            <div class="device-actions">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索设备" 
                size="small" 
                style="width: 200px; margin-right: 10px;"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <span class="search-icon">🔍</span>
                </template>
              </el-input>
              <el-select v-model="statusFilter" size="small" style="width: 120px" clearable @change="handleStatusFilterChange">
                <el-option label="全部" value=""></el-option>
                <el-option label="在线" value="online"></el-option>
                <el-option label="离线" value="offline"></el-option>
                <el-option label="异常" value="error"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table :data="paginatedDevices" style="width: 100%" :loading="loading">
          <el-table-column prop="name" label="设备名称" width="180">
            <template #default="{ row }">
              <div class="device-name">
                <span class="device-icon" :class="row.status">📱</span>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" width="150"></el-table-column>
          <el-table-column prop="type" label="设备类型" width="120"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusType(row.status)"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="temperature" label="温度" width="100">
            <template #default="{ row }">
              {{ row.temperature }}°C
            </template>
          </el-table-column>
          <el-table-column prop="humidity" label="湿度" width="100">
            <template #default="{ row }">
              {{ row.humidity }}%
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link 
                size="small"
                @click="viewDeviceDetail(row)"
              >
                详情
              </el-button>
              <el-button 
                type="danger" 
                link 
                size="small"
                v-if="row.status === 'error'"
                @click="handleDeviceAlert(row)"
              >
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredDevices.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 预警信息 -->
    <div class="alert-section" v-if="alerts.length > 0">
      <el-alert
        v-for="alert in alerts"
        :key="alert.id"
        :title="alert.title"
        :type="alert.type"
        :description="alert.description"
        :closable="false"
        show-icon
      />
    </div>

    <!-- 设备详情弹窗 -->
    <el-dialog
      v-model="deviceDetailVisible"
      :title="`设备详情 - ${selectedDevice?.name}`"
      width="600px"
      center
    >
      <div class="device-detail-content" v-if="selectedDevice">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备名称">{{ selectedDevice.name }}</el-descriptions-item>
          <el-descriptions-item label="设备位置">{{ selectedDevice.location }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ selectedDevice.type }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="getStatusType(selectedDevice.status)">
              {{ getStatusText(selectedDevice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前温度">{{ selectedDevice.temperature }}°C</el-descriptions-item>
          <el-descriptions-item label="当前湿度">{{ selectedDevice.humidity }}%</el-descriptions-item>
          <el-descriptions-item label="最后更新" :span="2">{{ selectedDevice.lastUpdate }}</el-descriptions-item>
          <el-descriptions-item label="设备描述" :span="2">
            农业环境监测专用设备，实时采集温湿度数据，支持远程监控和数据分析
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="device-history" v-if="selectedDevice.status === 'online'">
          <h4>历史数据趋势</h4>
          <div class="mini-chart">
            <div class="mini-chart-line"></div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceDetailVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDeviceRefresh(selectedDevice)">刷新数据</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const timeRange = ref('24h')
const humidityRange = ref('24h')
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const deviceDetailVisible = ref(false)
const selectedDevice = ref(null)

// 假数据
const overviewCards = ref([
  { title: '在线设备', value: '24', icon: '📊', color: '#409EFF' },
  { title: '平均温度', value: '25.6°C', icon: '🌡️', color: '#E6A23C' },
  { title: '平均湿度', value: '68.2%', icon: '💧', color: '#67C23A' },
  { title: '土壤湿度', value: '45.8%', icon: '🌱', color: '#F56C6C' }
])

const temperatureData = ref([18, 20, 22, 25, 28, 30, 32, 30, 28, 25, 22, 20])
const humidityData = ref([65, 68, 72, 75, 70, 68, 65, 62, 60, 58, 55, 52])

const devices = ref([
  { id: 1, name: '温室1号传感器', location: 'A区温室', type: '温湿度传感器', status: 'online', temperature: 25.6, humidity: 68.2, lastUpdate: '2024-01-20 10:30:15' },
  { id: 2, name: '土壤监测器', location: 'B区农田', type: '土壤传感器', status: 'online', temperature: 24.8, humidity: 45.8, lastUpdate: '2024-01-20 10:28:42' },
  { id: 3, name: '气象站主机', location: '园区中心', type: '气象站', status: 'error', temperature: 26.1, humidity: 62.3, lastUpdate: '2024-01-20 09:15:33' },
  { id: 4, name: '灌溉控制器', location: 'C区温室', type: '控制器', status: 'online', temperature: 23.9, humidity: 70.1, lastUpdate: '2024-01-20 10:25:18' },
  { id: 5, name: '光照传感器', location: 'D区大棚', type: '光照传感器', status: 'offline', temperature: 0, humidity: 0, lastUpdate: '2024-01-19 16:45:22' }
])

const alerts = ref([
  { id: 1, type: 'warning', title: '设备异常', description: '气象站主机出现连接异常，请及时检查' },
  { id: 2, type: 'info', title: '数据更新', description: '系统数据已更新至最新版本' }
])

// 计算属性
const filteredDevices = computed(() => {
  let filtered = devices.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      device.location.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(device => device.status === statusFilter.value)
  }
  
  return filtered
})

const paginatedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDevices.value.slice(start, end)
})

// 方法
const getStatusType = (status) => {
  const statusMap = {
    online: 'success',
    offline: 'info',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    online: '在线',
    offline: '离线',
    error: '异常'
  }
  return statusMap[status] || '未知'
}

const viewDeviceDetail = (device) => {
  selectedDevice.value = device
  deviceDetailVisible.value = true
}

const handleDeviceAlert = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要处理设备 ${device.name} 的异常吗？`,
      '处理设备异常',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟处理异常
    device.status = 'online'
    ElMessage.success('设备异常已处理')
  } catch {
    // 用户取消操作
  }
}

const handleDeviceRefresh = (device) => {
  loading.value = true
  // 模拟数据刷新
  setTimeout(() => {
    device.temperature = (Math.random() * 10 + 20).toFixed(1)
    device.humidity = (Math.random() * 20 + 50).toFixed(1)
    device.lastUpdate = new Date().toLocaleString()
    loading.value = false
    ElMessage.success('设备数据已刷新')
  }, 1000)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleTimeRangeChange = (value) => {
  // 模拟根据时间范围更新数据
  loading.value = true
  setTimeout(() => {
    if (value === '7d') {
      temperatureData.value = [20, 22, 24, 26, 28, 26, 24]
    } else if (value === '30d') {
      temperatureData.value = [18, 19, 21, 23, 25, 27, 29, 31, 30, 28, 26, 24]
    } else {
      temperatureData.value = [18, 20, 22, 25, 28, 30, 32, 30, 28, 25, 22, 20]
    }
    loading.value = false
  }, 500)
}

const handleHumidityRangeChange = (value) => {
  // 模拟根据时间范围更新数据
  loading.value = true
  setTimeout(() => {
    if (value === '7d') {
      humidityData.value = [60, 65, 70, 75, 72, 68, 65]
    } else if (value === '30d') {
      humidityData.value = [55, 58, 62, 65, 68, 72, 75, 70, 68, 65, 62, 60]
    } else {
      humidityData.value = [65, 68, 72, 75, 70, 68, 65, 62, 60, 58, 55, 52]
    }
    loading.value = false
  }, 500)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleStatusFilterChange = () => {
  currentPage.value = 1
}

// 生命周期
onMounted(() => {
  // 模拟数据加载
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>

@use './DataAnalysis.scss';

</style>