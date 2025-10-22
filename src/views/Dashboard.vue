<template>
  <div class="dashboard-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon primary">
                <span class="icon-font">📡</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalDevices }}</div>
                <div class="stat-label">总设备数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon success">
                <span class="icon-font">🟢</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.onlineDevices }}</div>
                <div class="stat-label">在线设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <span class="icon-font">⚠️</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.alerts }}</div>
                <div class="stat-label">今日告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon info">
                <span class="icon-font">📊</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.dataVolume }}</div>
                <div class="stat-label">数据量(MB)</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="chart-title">通信频率分布</span>
                <el-button type="primary" link @click="refreshFrequencyData">
                  <span class="btn-icon">🔄</span>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container">
              <div class="frequency-chart">
                <div 
                  v-for="(item, index) in frequencyData" 
                  :key="index"
                  class="frequency-bar"
                  :style="{ height: item.value * 2 + 'px' }"
                  :class="getFrequencyClass(item.value)"
                >
                  <span class="frequency-label">{{ item.frequency }}</span>
                  <span class="frequency-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="chart-title">设备状态分布</span>
                <el-button type="primary" link @click="refreshDeviceData">
                  <span class="btn-icon">🔄</span>
                  刷新
                </el-button>
              </div>
            </template>
            <div class="chart-container">
              <div class="device-status-chart">
                <div 
                  v-for="status in deviceStatusData" 
                  :key="status.name"
                  class="status-item"
                >
                  <div class="status-info">
                    <span class="status-name">{{ status.name }}</span>
                    <span class="status-count">{{ status.value }}</span>
                  </div>
                  <el-progress 
                    :percentage="status.percentage" 
                    :color="getStatusColor(status.name)"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近通信记录 -->
    <div class="recent-records">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span class="chart-title">最近通信记录</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索设备或频率"
                style="width: 200px; margin-right: 10px;"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <span class="search-icon">🔍</span>
                </template>
              </el-input>
              <el-button type="primary" @click="refreshRecords">
                <span class="btn-icon">🔄</span>
                刷新
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          :data="paginatedRecords"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'timestamp', order: 'descending' }"
        >
          <el-table-column prop="deviceId" label="设备ID" width="120" sortable />
          <el-table-column prop="frequency" label="频率(MHz)" width="120" sortable />
          <el-table-column prop="signalStrength" label="信号强度" width="120">
            <template #default="{ row }">
              <el-tag 
                :type="getSignalType(row.signalStrength)"
                size="small"
              >
                {{ row.signalStrength }} dB
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="持续时间" width="120" />
          <el-table-column prop="timestamp" label="时间" width="180" sortable>
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === '成功' ? 'success' : 'danger'"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link
                size="small"
                @click="viewRecordDetail(row)"
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
      title="通信记录详情"
      width="600px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备ID">{{ selectedRecord.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ selectedRecord.frequency }} MHz</el-descriptions-item>
          <el-descriptions-item label="信号强度">{{ selectedRecord.signalStrength }} dB</el-descriptions-item>
          <el-descriptions-item label="持续时间">{{ selectedRecord.duration }}</el-descriptions-item>
          <el-descriptions-item label="时间" :span="2">{{ formatTime(selectedRecord.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="2">
            <el-tag :type="selectedRecord.status === '成功' ? 'success' : 'danger'">
              {{ selectedRecord.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="通信质量" :span="2">
            <el-progress 
              :percentage="calculateCommunicationQuality(selectedRecord)"
              :color="getQualityColor(selectedRecord)"
              :show-text="true"
            />
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-actions">
          <el-button type="primary" @click="generateReport(selectedRecord)">
            <span class="btn-icon">📋</span>
            生成报告
          </el-button>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 报告生成对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="通信报告生成成功"
      width="500px"
    >
      <div class="report-success">
        <div class="success-icon">✅</div>
        <div class="success-message">通信记录报告已成功生成！</div>
        <div class="report-info">
          <p>设备ID: {{ selectedRecord?.deviceId }}</p>
          <p>生成时间: {{ formatTime(Date.now()) }}</p>
          <p>报告包含详细的通信质量分析和建议</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="reportDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const stats = ref({
  totalDevices: 156,
  onlineDevices: 128,
  alerts: 12,
  dataVolume: 2456
})

const frequencyData = ref([])
const deviceStatusData = ref([])
const communicationRecords = ref([])
const filteredRecords = ref([])
const searchKeyword = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const detailDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const selectedRecord = ref(null)

// 计算属性
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

// 方法
const generateFrequencyData = () => {
  const frequencies = ['87.5', '98.7', '106.1', '89.3', '91.5', '104.2', '96.8', '102.4']
  return frequencies.map(freq => ({
    frequency: freq,
    value: Math.floor(Math.random() * 50) + 10
  }))
}

const generateDeviceStatusData = () => {
  return [
    { name: '在线', value: 128, percentage: 82 },
    { name: '离线', value: 18, percentage: 12 },
    { name: '故障', value: 10, percentage: 6 }
  ]
}

const generateCommunicationRecords = () => {
  const records = []
  const statuses = ['成功', '失败']
  
  for (let i = 1; i <= 100; i++) {
    records.push({
      id: i,
      deviceId: `DEV${String(i).padStart(3, '0')}`,
      frequency: (Math.random() * 20 + 87).toFixed(1),
      signalStrength: Math.floor(Math.random() * 60) - 30,
      duration: `${Math.floor(Math.random() * 60)}分钟`,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  }
  
  return records
}

const refreshFrequencyData = () => {
  frequencyData.value = generateFrequencyData()
  ElMessage.success('频率数据已刷新')
}

const refreshDeviceData = () => {
  deviceStatusData.value = generateDeviceStatusData()
  ElMessage.success('设备数据已刷新')
}

const refreshRecords = async () => {
  loading.value = true
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 1000))
  communicationRecords.value = generateCommunicationRecords()
  filteredRecords.value = communicationRecords.value
  totalRecords.value = communicationRecords.value.length
  loading.value = false
  ElMessage.success('通信记录已刷新')
}

const handleSearch = () => {
  if (!searchKeyword.value) {
    filteredRecords.value = communicationRecords.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredRecords.value = communicationRecords.value.filter(record => 
      record.deviceId.toLowerCase().includes(keyword) ||
      record.frequency.includes(keyword)
    )
  }
  totalRecords.value = filteredRecords.value.length
  currentPage.value = 1
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const viewRecordDetail = (record) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const generateReport = (record) => {
  // 模拟生成报告功能
  console.log('生成通信报告:', record)
  reportDialogVisible.value = true
  ElMessage.success('通信报告生成成功')
}

const calculateCommunicationQuality = (record) => {
  // 根据信号强度和状态计算通信质量
  let quality = 50
  if (record.signalStrength >= -20) quality += 30
  else if (record.signalStrength >= -40) quality += 15
  
  if (record.status === '成功') quality += 20
  
  return Math.min(quality, 100)
}

const getQualityColor = (record) => {
  const quality = calculateCommunicationQuality(record)
  if (quality >= 80) return '#67C23A'
  if (quality >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getFrequencyClass = (value) => {
  if (value > 40) return 'high-frequency'
  if (value > 25) return 'medium-frequency'
  return 'low-frequency'
}

const getStatusColor = (status) => {
  const colors = {
    '在线': '#67C23A',
    '离线': '#909399',
    '故障': '#E6A23C'
  }
  return colors[status] || '#409EFF'
}

const getSignalType = (strength) => {
  if (strength >= -20) return 'success'
  if (strength >= -40) return 'warning'
  return 'danger'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  frequencyData.value = generateFrequencyData()
  deviceStatusData.value = generateDeviceStatusData()
  refreshRecords()
})
</script>

<style lang="scss" scoped>


@use './Dashboard.scss';


</style>