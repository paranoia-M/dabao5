<template>
  <div class="monitor-container">
    <div class="header">
      <h1>航清环境、污染应急预案处理系统</h1>
      <div class="time-display">{{ currentTime }}</div>
    </div>
    
    <div class="dashboard">
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in overviewData" :key="item.title">
            <el-card shadow="hover" class="metric-card">
              <div class="metric-content">
                <div class="metric-title">{{ item.title }}</div>
                <div class="metric-value" :class="getValueClass(item.value, item.threshold)">
                  {{ item.value }}{{ item.unit }}
                </div>
                <div class="metric-trend">
                  <span :class="getTrendClass(item.trend)">
                    {{ item.trend === 'up' ? '↑' : '↓' }}
                  </span>
                  <span>{{ item.change }}%</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="main-content">
        <el-row :gutter="20">
          <el-col :xs="24" :lg="16">
            <el-card shadow="hover" class="chart-card">
              <div class="card-header">
                <h3>环境数据趋势图</h3>
                <el-select v-model="chartType" size="small" style="width: 120px">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="PM2.5" value="pm25" />
                </el-select>
              </div>
              <div class="chart-container">
                <div ref="chartRef" style="height: 300px"></div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :lg="8">
            <el-card shadow="hover" class="alert-card">
              <div class="card-header">
                <h3>异常数据告警</h3>
                <el-tag type="danger">{{ alerts.length }}条</el-tag>
              </div>
              <el-scrollbar height="300px">
                <el-timeline>
                  <el-timeline-item
                    v-for="(alert, index) in alerts"
                    :key="index"
                    :timestamp="alert.time"
                    placement="top"
                  >
                    <el-card>
                      <h4>{{ alert.type }}</h4>
                      <p>{{ alert.message }}</p>
                      <el-button size="small" type="primary" @click="handleCalibrate(alert)">校准</el-button>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </el-scrollbar>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="data-table">
        <el-card shadow="hover">
          <div class="card-header">
            <h3>监测点数据明细</h3>
            <div class="table-actions">
              <el-input
                v-model="tableSearch"
                placeholder="搜索监测点"
                clearable
                style="width: 200px"
                size="small"
              />
              <el-select
                v-model="tableFilter"
                placeholder="筛选状态"
                clearable
                style="width: 120px; margin-left: 10px"
                size="small"
              >
                <el-option label="正常" value="normal" />
                <el-option label="异常" value="abnormal" />
                <el-option label="待校准" value="pending" />
              </el-select>
            </div>
          </div>
          
          <el-table :data="filteredTableData" style="width: 100%" border>
            <el-table-column prop="point" label="监测点" width="150" />
            <el-table-column prop="temperature" label="温度(℃)" width="100">
              <template #default="{ row }">
                <span :class="{ 'abnormal-value': row.temperatureStatus === 'abnormal' }">
                  {{ row.temperature }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="humidity" label="湿度(%)" width="100">
              <template #default="{ row }">
                <span :class="{ 'abnormal-value': row.humidityStatus === 'abnormal' }">
                  {{ row.humidity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="pm25" label="PM2.5(μg/m³)" width="120">
              <template #default="{ row }">
                <span :class="{ 'abnormal-value': row.pm25Status === 'abnormal' }">
                  {{ row.pm25 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="showDetailDialog(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              :total="tableData.length"
            />
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 校准对话框 -->
    <el-dialog v-model="dialogVisible" title="数据校准" width="500px">
      <el-form :model="calibrateForm" label-width="120px">
        <el-form-item label="监测点">
          <el-input v-model="calibrateForm.point" disabled />
        </el-form-item>
        <el-form-item label="参数类型">
          <el-input v-model="calibrateForm.type" disabled />
        </el-form-item>
        <el-form-item label="当前值">
          <el-input v-model="calibrateForm.currentValue" disabled />
        </el-form-item>
        <el-form-item label="校准值" required>
          <el-input v-model="calibrateForm.newValue" />
        </el-form-item>
        <el-form-item label="校准原因">
          <el-input v-model="calibrateForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCalibrate">确认校准</el-button>
      </template>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="`${currentDetail.point}监测详情`" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="监测点">{{ currentDetail.point }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentDetail.status)">
            {{ getStatusText(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="温度">{{ currentDetail.temperature }}℃</el-descriptions-item>
        <el-descriptions-item label="温度状态">
          <el-tag :type="currentDetail.temperatureStatus === 'normal' ? 'success' : 'danger'">
            {{ currentDetail.temperatureStatus === 'normal' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="湿度">{{ currentDetail.humidity }}%</el-descriptions-item>
        <el-descriptions-item label="湿度状态">
          <el-tag :type="currentDetail.humidityStatus === 'normal' ? 'success' : 'danger'">
            {{ currentDetail.humidityStatus === 'normal' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="PM2.5">{{ currentDetail.pm25 }}μg/m³</el-descriptions-item>
        <el-descriptions-item label="PM2.5状态">
          <el-tag :type="currentDetail.pm25Status === 'normal' ? 'success' : 'danger'">
            {{ currentDetail.pm25Status === 'normal' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后更新时间">{{ currentTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 当前时间
const currentTime = ref('')
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 概览数据
const overviewData = ref([
  { title: '平均温度', value: 24.5, unit: '℃', trend: 'up', change: 2.3, threshold: 30 },
  { title: '平均湿度', value: 65, unit: '%', trend: 'down', change: 1.2, threshold: 80 },
  { title: 'PM2.5均值', value: 42, unit: 'μg/m³', trend: 'up', change: 5.6, threshold: 75 },
  { title: '异常监测点', value: 3, unit: '个', trend: 'down', change: 1, threshold: 5 }
])

// 图表相关
const chartRef = ref(null)
let chartInstance = null
const chartType = ref('temperature')
const chartOptions = {
  temperature: {
    title: { text: '温度变化趋势(℃)' },
    xAxis: { type: 'category', data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] },
    yAxis: { type: 'value', name: '温度(℃)' },
    series: [{ 
      data: [22, 20, 21, 24, 28, 26, 25, 23], 
      type: 'line', 
      smooth: true,
      lineStyle: { color: '#ff6b6b', width: 3 },
      itemStyle: { color: '#ff6b6b' },
      areaStyle: { color: 'rgba(255, 107, 107, 0.2)' }
    }]
  },
  humidity: {
    title: { text: '湿度变化趋势(%)' },
    xAxis: { type: 'category', data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] },
    yAxis: { type: 'value', name: '湿度(%)' },
    series: [{ 
      data: [70, 72, 68, 65, 60, 62, 65, 68], 
      type: 'line', 
      smooth: true,
      lineStyle: { color: '#48dbfb', width: 3 },
      itemStyle: { color: '#48dbfb' },
      areaStyle: { color: 'rgba(72, 219, 251, 0.2)' }
    }]
  },
  pm25: {
    title: { text: 'PM2.5变化趋势(μg/m³)' },
    xAxis: { type: 'category', data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] },
    yAxis: { type: 'value', name: 'PM2.5(μg/m³)' },
    series: [{ 
      data: [35, 40, 38, 45, 50, 48, 42, 38], 
      type: 'line', 
      smooth: true,
      lineStyle: { color: '#1dd1a1', width: 3 },
      itemStyle: { color: '#1dd1a1' },
      areaStyle: { color: 'rgba(29, 209, 161, 0.2)' }
    }]
  }
}

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(chartOptions[chartType.value])
    window.addEventListener('resize', resizeChart)
  }
}

const resizeChart = () => {
  chartInstance?.resize()
}

const destroyChart = () => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
}

watch(chartType, (newVal) => {
  if (chartInstance) {
    chartInstance.setOption(chartOptions[newVal])
  }
})

// 告警数据
const alerts = ref([
  { time: '10:30', type: '温度异常', message: '监测点A温度超过阈值(32℃)', point: '监测点A', param: 'temperature', value: '32' },
  { time: '09:45', type: 'PM2.5异常', message: '监测点B PM2.5浓度超标(85μg/m³)', point: '监测点B', param: 'pm25', value: '85' },
  { time: '08:20', type: '湿度异常', message: '监测点C湿度过高(82%)', point: '监测点C', param: 'humidity', value: '82' }
])

// 表格数据
const tableData = ref([
  { point: '监测点A', temperature: 24.5, temperatureStatus: 'normal', humidity: 65, humidityStatus: 'normal', pm25: 42, pm25Status: 'normal', status: 'normal' },
  { point: '监测点B', temperature: 32, temperatureStatus: 'abnormal', humidity: 60, humidityStatus: 'normal', pm25: 85, pm25Status: 'abnormal', status: 'abnormal' },
  { point: '监测点C', temperature: 22, temperatureStatus: 'normal', humidity: 82, humidityStatus: 'abnormal', pm25: 38, pm25Status: 'normal', status: 'abnormal' },
  { point: '监测点D', temperature: 25, temperatureStatus: 'normal', humidity: 68, humidityStatus: 'normal', pm25: 45, pm25Status: 'normal', status: 'normal' },
  { point: '监测点E', temperature: 28, temperatureStatus: 'normal', humidity: 72, humidityStatus: 'normal', pm25: 52, pm25Status: 'normal', status: 'normal' },
  { point: '监测点F', temperature: 20, temperatureStatus: 'normal', humidity: 58, humidityStatus: 'normal', pm25: 65, pm25Status: 'pending', status: 'pending' },
  { point: '监测点G', temperature: 26, temperatureStatus: 'normal', humidity: 64, humidityStatus: 'normal', pm25: 48, pm25Status: 'normal', status: 'normal' },
  { point: '监测点H', temperature: 23, temperatureStatus: 'normal', humidity: 70, humidityStatus: 'normal', pm25: 55, pm25Status: 'normal', status: 'normal' }
])

const tableSearch = ref('')
const tableFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredTableData = computed(() => {
  let data = [...tableData.value]
  
  if (tableSearch.value) {
    data = data.filter(item => item.point.includes(tableSearch.value))
  }
  
  if (tableFilter.value) {
    data = data.filter(item => item.status === tableFilter.value)
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// 校准对话框
const dialogVisible = ref(false)
const calibrateForm = ref({
  point: '',
  type: '',
  currentValue: '',
  newValue: '',
  reason: ''
})

const handleCalibrate = (alert) => {
  calibrateForm.value = {
    point: alert.point,
    type: alert.type.split('异常')[0],
    currentValue: alert.value,
    newValue: '',
    reason: ''
  }
  dialogVisible.value = true
}

const submitCalibrate = () => {
  // 模拟校准操作
  ElMessage.success(`已提交${calibrateForm.value.type}校准申请`)
  // 更新表格数据
  const index = tableData.value.findIndex(item => item.point === calibrateForm.value.point)
  if (index !== -1) {
    const param = calibrateForm.value.type.toLowerCase()
    tableData.value[index][`${param}Status`] = 'pending'
    tableData.value[index].status = 'pending'
  }
  dialogVisible.value = false
}

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref({
  point: '',
  temperature: 0,
  temperatureStatus: 'normal',
  humidity: 0,
  humidityStatus: 'normal',
  pm25: 0,
  pm25Status: 'normal',
  status: 'normal'
})

const showDetailDialog = (row) => {
  currentDetail.value = { ...row }
  detailDialogVisible.value = true
}

// 辅助函数
const getValueClass = (value, threshold) => {
  return value > threshold * 0.9 ? 'warning-value' : ''
}

const getTrendClass = (trend) => {
  return trend === 'up' ? 'up-trend' : 'down-trend'
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'normal': return 'success'
    case 'abnormal': return 'danger'
    case 'pending': return 'warning'
    default: return ''
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'normal': return '正常'
    case 'abnormal': return '异常'
    case 'pending': return '待校准'
    default: return ''
  }
}

// 生命周期
onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 1000)
  initChart()
  
  onBeforeUnmount(() => {
    clearInterval(timer)
    destroyChart()
  })
})
</script>

<style lang="scss" scoped>
@use './Report.scss';
</style>