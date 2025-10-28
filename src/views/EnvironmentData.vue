<template>
  <div class="environment-data">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">航清环境应急移动源管理软件</h1>
      <p class="page-subtitle">实时监测农业环境数据，助力精准农业</p>
    </div>

    <!-- 数据概览卡片 -->
    <div class="data-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="data-card temperature-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <span class="icon-temperature">🌡️</span>
              </div>
              <div class="card-info">
                <div class="card-value">{{ temperature }}°C</div>
                <div class="card-label">温度</div>
                <div class="card-trend" :class="{ 'trend-up': temperatureTrend === 'up', 'trend-down': temperatureTrend === 'down' }">
                  {{ temperatureTrend === 'up' ? '↑' : temperatureTrend === 'down' ? '↓' : '→' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="data-card humidity-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <span class="icon-humidity">💧</span>
              </div>
              <div class="card-info">
                <div class="card-value">{{ humidity }}%</div>
                <div class="card-label">湿度</div>
                <div class="card-trend" :class="{ 'trend-up': humidityTrend === 'up', 'trend-down': humidityTrend === 'down' }">
                  {{ humidityTrend === 'up' ? '↑' : humidityTrend === 'down' ? '↓' : '→' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="data-card light-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <span class="icon-light">☀️</span>
              </div>
              <div class="card-info">
                <div class="card-value">{{ lightIntensity }} lux</div>
                <div class="card-label">光照强度</div>
                <div class="card-trend" :class="{ 'trend-up': lightTrend === 'up', 'trend-down': lightTrend === 'down' }">
                  {{ lightTrend === 'up' ? '↑' : lightTrend === 'down' ? '↓' : '→' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="data-card soil-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon">
                <span class="icon-soil">🌱</span>
              </div>
              <div class="card-info">
                <div class="card-value">{{ soilMoisture }}%</div>
                <div class="card-label">土壤湿度</div>
                <div class="card-trend" :class="{ 'trend-up': soilTrend === 'up', 'trend-down': soilTrend === 'down' }">
                  {{ soilTrend === 'up' ? '↑' : soilTrend === 'down' ? '↓' : '→' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据图表区域 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
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
              <div class="mock-chart temperature-chart">
                <div class="chart-line"></div>
                <div class="chart-points">
                  <div 
                    v-for="(point, index) in temperatureData" 
                    :key="index"
                    class="chart-point"
                    :style="{ left: `${index * 20}%`, bottom: `${point}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <span>环境参数分布</span>
                <el-button type="primary" text size="small" @click="showDistributionAnalysis">分析报告</el-button>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart distribution-chart">
                <div class="distribution-bar temperature-bar"></div>
                <div class="distribution-bar humidity-bar"></div>
                <div class="distribution-bar light-bar"></div>
                <div class="distribution-bar soil-bar"></div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据列表 -->
    <div class="data-table-section">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span>环境数据记录</span>
            <div class="table-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索传感器或位置"
                size="small"
                style="width: 200px; margin-right: 10px;"
                clearable
              >
                <template #prefix>
                  <span class="search-icon">🔍</span>
                </template>
              </el-input>
              <el-select v-model="sensorType" placeholder="传感器类型" size="small" style="width: 120px; margin-right: 10px;">
                <el-option label="全部" value=""></el-option>
                <el-option label="温度" value="temperature"></el-option>
                <el-option label="湿度" value="humidity"></el-option>
                <el-option label="光照" value="light"></el-option>
                <el-option label="土壤" value="soil"></el-option>
              </el-select>
              <el-button type="primary" size="small" @click="refreshData">
                <span class="refresh-icon">🔄</span>
                刷新
              </el-button>
              <el-button type="success" size="small" @click="exportData">
                <span class="export-icon">📊</span>
                导出
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="filteredData" v-loading="loading" style="width: 100%">
          <el-table-column prop="sensorId" label="传感器ID" width="120"></el-table-column>
          <el-table-column prop="sensorType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getSensorTypeTag(row.sensorType)"
                size="small"
              >
                {{ getSensorTypeText(row.sensorType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" width="120"></el-table-column>
          <el-table-column prop="value" label="数值" width="100">
            <template #default="{ row }">
              {{ row.value }}{{ getValueUnit(row.sensorType) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === '正常' ? 'success' : 'danger'"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="更新时间" width="180"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewDetails(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="handleAlert(row)">告警</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="传感器详情"
      width="500px"
    >
      <div v-if="selectedSensor" class="sensor-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="传感器ID">{{ selectedSensor.sensorId }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getSensorTypeText(selectedSensor.sensorType) }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedSensor.location }}</el-descriptions-item>
          <el-descriptions-item label="当前数值">{{ selectedSensor.value }}{{ getValueUnit(selectedSensor.sensorType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedSensor.status === '正常' ? 'success' : 'danger'">
              {{ selectedSensor.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ selectedSensor.timestamp }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="sensor-history">
          <h4>历史数据趋势</h4>
          <div class="history-chart">
            <div class="history-line"></div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 告警设置对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      title="设置告警阈值"
      width="400px"
    >
      <div v-if="selectedAlertSensor" class="alert-setting">
        <el-form :model="alertForm" label-width="100px">
          <el-form-item label="传感器ID">
            <el-input v-model="selectedAlertSensor.sensorId" disabled />
          </el-form-item>
          <el-form-item label="当前数值">
            <el-input 
              :value="`${selectedAlertSensor.value}${getValueUnit(selectedAlertSensor.sensorType)}`" 
              disabled 
            />
          </el-form-item>
          <el-form-item label="告警类型">
            <el-select v-model="alertForm.alertType" placeholder="请选择告警类型">
              <el-option label="过高告警" value="high"></el-option>
              <el-option label="过低告警" value="low"></el-option>
              <el-option label="范围告警" value="range"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="阈值">
            <el-input-number 
              v-model="alertForm.threshold" 
              :precision="1" 
              :step="0.1"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="通知方式">
            <el-checkbox-group v-model="alertForm.notificationMethods">
              <el-checkbox label="短信">短信</el-checkbox>
              <el-checkbox label="邮件">邮件</el-checkbox>
              <el-checkbox label="App推送">App推送</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        
        <div class="alert-actions">
          <el-button @click="alertDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAlertSetting">确认设置</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 分析报告对话框 -->
    <el-dialog
      v-model="analysisDialogVisible"
      title="环境数据分析报告"
      width="600px"
    >
      <div class="analysis-report">
        <el-descriptions title="环境状况概览" :column="1" border>
          <el-descriptions-item label="整体评价">
            <el-tag type="success">良好</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="温度状况">
            当前温度 {{ temperature }}°C，处于适宜作物生长范围
          </el-descriptions-item>
          <el-descriptions-item label="湿度状况">
            当前湿度 {{ humidity }}%，建议保持当前水平
          </el-descriptions-item>
          <el-descriptions-item label="光照状况">
            光照强度 {{ lightIntensity }}lux，满足大部分作物需求
          </el-descriptions-item>
          <el-descriptions-item label="土壤状况">
            土壤湿度 {{ soilMoisture }}%，建议适时灌溉
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="recommendations">
          <h4>农业建议</h4>
          <ul>
            <li>当前环境参数适宜，建议维持现有管理措施</li>
            <li>注意监测土壤湿度变化，适时补充水分</li>
            <li>光照充足，可适当延长光照时间</li>
            <li>温度稳定，有利于作物生长</li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const temperature = ref(25.6)
const humidity = ref(65.2)
const lightIntensity = ref(1250)
const soilMoisture = ref(42.8)

const temperatureTrend = ref('up')
const humidityTrend = ref('down')
const lightTrend = ref('up')
const soilTrend = ref('down')

const timeRange = ref('24h')
const searchKeyword = ref('')
const sensorType = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const alertDialogVisible = ref(false)
const analysisDialogVisible = ref(false)
const selectedSensor = ref(null)
const selectedAlertSensor = ref(null)

// 告警表单
const alertForm = ref({
  alertType: 'high',
  threshold: 30,
  notificationMethods: ['短信', '邮件']
})

// 模拟温度数据
const temperatureData = ref([30, 45, 60, 75, 65, 50, 40, 55, 70, 80])

// 模拟表格数据
const tableData = ref([
  { sensorId: 'SENSOR_001', sensorType: 'temperature', location: '温室A区', value: 25.6, status: '正常', timestamp: '2024-01-15 10:30:25' },
  { sensorId: 'SENSOR_002', sensorType: 'humidity', location: '温室B区', value: 65.2, status: '正常', timestamp: '2024-01-15 10:29:45' },
  { sensorId: 'SENSOR_003', sensorType: 'light', location: '露天种植区', value: 1250, status: '正常', timestamp: '2024-01-15 10:28:15' },
  { sensorId: 'SENSOR_004', sensorType: 'soil', location: '温室A区', value: 42.8, status: '正常', timestamp: '2024-01-15 10:27:30' },
  { sensorId: 'SENSOR_005', sensorType: 'temperature', location: '储藏室', value: 18.3, status: '正常', timestamp: '2024-01-15 10:26:50' },
  { sensorId: 'SENSOR_006', sensorType: 'humidity', location: '储藏室', value: 45.6, status: '警告', timestamp: '2024-01-15 10:25:10' },
  { sensorId: 'SENSOR_007', sensorType: 'light', location: '温室B区', value: 980, status: '正常', timestamp: '2024-01-15 10:24:35' },
  { sensorId: 'SENSOR_008', sensorType: 'soil', location: '露天种植区', value: 35.2, status: '正常', timestamp: '2024-01-15 10:23:45' },
])

// 计算属性
const filteredData = computed(() => {
  let filtered = tableData.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(item => 
      item.sensorId.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.location.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 类型过滤
  if (sensorType.value) {
    filtered = filtered.filter(item => item.sensorType === sensorType.value)
  }
  
  total.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const getSensorTypeTag = (type) => {
  const typeMap = {
    temperature: 'danger',
    humidity: 'primary',
    light: 'warning',
    soil: 'success'
  }
  return typeMap[type] || 'info'
}

const getSensorTypeText = (type) => {
  const textMap = {
    temperature: '温度',
    humidity: '湿度',
    light: '光照',
    soil: '土壤'
  }
  return textMap[type] || type
}

const getValueUnit = (type) => {
  const unitMap = {
    temperature: '°C',
    humidity: '%',
    light: 'lux',
    soil: '%'
  }
  return unitMap[type] || ''
}

const refreshData = async () => {
  loading.value = true
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 更新假数据
  temperature.value = (20 + Math.random() * 15).toFixed(1)
  humidity.value = (40 + Math.random() * 40).toFixed(1)
  lightIntensity.value = Math.floor(500 + Math.random() * 1500)
  soilMoisture.value = (30 + Math.random() * 40).toFixed(1)
  
  // 更新趋势
  temperatureTrend.value = Math.random() > 0.5 ? 'up' : 'down'
  humidityTrend.value = Math.random() > 0.5 ? 'up' : 'down'
  lightTrend.value = Math.random() > 0.5 ? 'up' : 'down'
  soilTrend.value = Math.random() > 0.5 ? 'up' : 'down'
  
  ElMessage.success('数据已刷新')
  loading.value = false
}

const viewDetails = (sensor) => {
  selectedSensor.value = sensor
  detailDialogVisible.value = true
}

const handleAlert = (sensor) => {
  selectedAlertSensor.value = sensor
  alertForm.value.threshold = sensor.value
  alertDialogVisible.value = true
}

const confirmAlertSetting = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要为传感器 ${selectedAlertSensor.value.sensorId} 设置告警吗？`,
      '确认设置告警',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟设置告警
    const sensorIndex = tableData.value.findIndex(item => item.sensorId === selectedAlertSensor.value.sensorId)
    if (sensorIndex !== -1) {
      tableData.value[sensorIndex].status = '警告'
    }
    
    ElMessage.success('告警设置成功')
    alertDialogVisible.value = false
  } catch {
    ElMessage.info('已取消设置')
  }
}

const handleTimeRangeChange = (value) => {
  // 模拟根据时间范围更新图表数据
  ElMessage.info(`已切换到${value}数据范围`)
}

const showDistributionAnalysis = () => {
  analysisDialogVisible.value = true
}

const exportData = () => {
  ElMessage.success('数据导出成功')
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// 生命周期
onMounted(() => {
  total.value = tableData.value.length
})
</script>

<style lang="scss" scoped>

@use './EnvironmentData.scss';

</style>