<template>
  <div class="real-time-monitoring">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">航清环境应急移动源管理软件</h1>
      <p class="page-subtitle">实时环境数据监控与分析</p>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="data-card temperature-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <i class="icon-temperature">🌡️</i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ temperatureData.current }}°C</div>
                <div class="card-label">温度</div>
                <div class="card-trend" :class="{ 'trend-up': temperatureData.trend > 0, 'trend-down': temperatureData.trend < 0 }">
                  <span v-if="temperatureData.trend > 0">↑</span>
                  <span v-else-if="temperatureData.trend < 0">↓</span>
                  <span v-else>→</span>
                  {{ Math.abs(temperatureData.trend) }}°C
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="data-card humidity-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <i class="icon-humidity">💧</i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ humidityData.current }}%</div>
                <div class="card-label">湿度</div>
                <div class="card-trend" :class="{ 'trend-up': humidityData.trend > 0, 'trend-down': humidityData.trend < 0 }">
                  <span v-if="humidityData.trend > 0">↑</span>
                  <span v-else-if="humidityData.trend < 0">↓</span>
                  <span v-else>→</span>
                  {{ Math.abs(humidityData.trend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="data-card soil-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <i class="icon-soil">🌱</i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ soilMoistureData.current }}%</div>
                <div class="card-label">土壤湿度</div>
                <div class="card-trend" :class="{ 'trend-up': soilMoistureData.trend > 0, 'trend-down': soilMoistureData.trend < 0 }">
                  <span v-if="soilMoistureData.trend > 0">↑</span>
                  <span v-else-if="soilMoistureData.trend < 0">↓</span>
                  <span v-else>→</span>
                  {{ Math.abs(soilMoistureData.trend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="data-card light-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <i class="icon-light">☀️</i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ lightIntensityData.current }}lux</div>
                <div class="card-label">光照强度</div>
                <div class="card-trend" :class="{ 'trend-up': lightIntensityData.trend > 0, 'trend-down': lightIntensityData.trend < 0 }">
                  <span v-if="lightIntensityData.trend > 0">↑</span>
                  <span v-else-if="lightIntensityData.trend < 0">↓</span>
                  <span v-else>→</span>
                  {{ Math.abs(lightIntensityData.trend) }}lux
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>温度趋势图</span>
                <el-select v-model="timeRange" size="small" style="width: 120px" @change="handleTimeRangeChange">
                  <el-option label="最近1小时" value="1h"></el-option>
                  <el-option label="最近6小时" value="6h"></el-option>
                  <el-option label="最近24小时" value="24h"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart temperature-chart">
                <div class="chart-line" v-for="(point, index) in temperatureChartData" 
                     :key="index" 
                     :style="{ left: (index * 15) + 'px', height: (point.value / 2) + 'px' }">
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>湿度趋势图</span>
                <el-select v-model="timeRange" size="small" style="width: 120px" @change="handleTimeRangeChange">
                  <el-option label="最近1小时" value="1h"></el-option>
                  <el-option label="最近6小时" value="6h"></el-option>
                  <el-option label="最近24小时" value="24h"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart humidity-chart">
                <div class="chart-line" v-for="(point, index) in humidityChartData" 
                     :key="index" 
                     :style="{ left: (index * 15) + 'px', height: point.value + 'px' }">
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
                @input="handleSearch">
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="statusFilter" size="small" style="width: 120px" @change="handleFilterChange">
                <el-option label="全部状态" value="all"></el-option>
                <el-option label="在线" value="online"></el-option>
                <el-option label="离线" value="offline"></el-option>
                <el-option label="异常" value="error"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredDevices" 
          style="width: 100%"
          v-loading="loading"
          empty-text="暂无设备数据">
          <el-table-column prop="name" label="设备名称" min-width="120">
            <template #default="{ row }">
              <div class="device-name">
                <el-icon :class="row.status"><Monitor /></el-icon>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="设备类型" min-width="100"></el-table-column>
          <el-table-column prop="location" label="位置" min-width="120"></el-table-column>
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusType(row.status)"
                size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新" min-width="140"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link 
                size="small"
                @click="handleViewDevice(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 40]"
            :total="totalDevices"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 系统状态指示器 -->
    <div class="status-indicator">
      <el-alert
        :title="systemStatus.title"
        :type="systemStatus.type"
        :description="systemStatus.description"
        :closable="false"
        show-icon>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { Search, Monitor } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const timeRange = ref('1h')
const searchKeyword = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 温度数据
const temperatureData = reactive({
  current: 25.6,
  trend: 0.8
})

// 湿度数据
const humidityData = reactive({
  current: 65.2,
  trend: -2.1
})

// 土壤湿度数据
const soilMoistureData = reactive({
  current: 42.8,
  trend: 1.2
})

// 光照强度数据
const lightIntensityData = reactive({
  current: 1250,
  trend: 150
})

// 图表数据
const temperatureChartData = ref([
  { time: '09:00', value: 24.5 },
  { time: '09:10', value: 24.8 },
  { time: '09:20', value: 25.1 },
  { time: '09:30', value: 25.3 },
  { time: '09:40', value: 25.6 },
  { time: '09:50', value: 25.4 },
  { time: '10:00', value: 25.2 }
])

const humidityChartData = ref([
  { time: '09:00', value: 68 },
  { time: '09:10', value: 67 },
  { time: '09:20', value: 66 },
  { time: '09:30', value: 65 },
  { time: '09:40', value: 64 },
  { time: '09:50', value: 65 },
  { time: '10:00', value: 65 }
])

// 设备数据
const devices = ref([
  { id: 1, name: '温度传感器-01', type: '温度传感器', location: '温室A区', status: 'online', lastUpdate: '2024-01-20 10:00:00' },
  { id: 2, name: '湿度传感器-01', type: '湿度传感器', location: '温室A区', status: 'online', lastUpdate: '2024-01-20 10:01:00' },
  { id: 3, name: '土壤传感器-01', type: '土壤传感器', location: '温室B区', status: 'online', lastUpdate: '2024-01-20 09:58:00' },
  { id: 4, name: '光照传感器-01', type: '光照传感器', location: '温室A区', status: 'offline', lastUpdate: '2024-01-20 08:30:00' },
  { id: 5, name: '温度传感器-02', type: '温度传感器', location: '温室B区', status: 'error', lastUpdate: '2024-01-20 09:45:00' },
  { id: 6, name: '湿度传感器-02', type: '湿度传感器', location: '温室B区', status: 'online', lastUpdate: '2024-01-20 10:02:00' },
  { id: 7, name: '土壤传感器-02', type: '土壤传感器', location: '温室C区', status: 'online', lastUpdate: '2024-01-20 09:59:00' },
  { id: 8, name: '光照传感器-02', type: '光照传感器', location: '温室C区', status: 'online', lastUpdate: '2024-01-20 10:01:00' }
])

// 系统状态
const systemStatus = reactive({
  title: '系统运行正常',
  type: 'success',
  description: '所有传感器数据采集正常，系统运行稳定。'
})

// 计算属性
const totalDevices = computed(() => devices.value.length)

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
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(device => device.status === statusFilter.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const handleTimeRangeChange = (value) => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    // 这里可以更新图表数据
    loading.value = false
    ElMessage.success(`时间范围已切换至${getTimeRangeText(value)}`)
  }, 500)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleViewDevice = (device) => {
  ElMessage.info(`查看设备: ${device.name}`)
}

const getStatusType = (status) => {
  const statusMap = {
    'online': 'success',
    'offline': 'info',
    'error': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'error': '异常'
  }
  return statusMap[status] || '未知'
}

const getTimeRangeText = (range) => {
  const rangeMap = {
    '1h': '最近1小时',
    '6h': '最近6小时',
    '24h': '最近24小时'
  }
  return rangeMap[range] || range
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

@use './RealTimeMonitoring.scss';

</style>