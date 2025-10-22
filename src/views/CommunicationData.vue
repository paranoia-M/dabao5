<template>
  <div class="communication-data-container">
    <!-- 页面标题和统计卡片 -->
    <div class="page-header">
      <h1 class="page-title">网络探针实时检测预警软件</h1>
      <div class="stats-cards">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon primary">
              <span class="icon-text">📡</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">1,248</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon success">
              <span class="icon-text">📊</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">856</div>
              <div class="stat-label">今日通信</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon warning">
              <span class="icon-text">⚠️</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">23</div>
              <div class="stat-label">异常告警</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon info">
              <span class="icon-text">⏱️</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">98.7%</div>
              <div class="stat-label">运行正常率</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索设备编号或位置..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <span class="search-icon">🔍</span>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="statusFilter"
            placeholder="设备状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部在线" value="online" />
            <el-option label="部分离线" value="offline" />
            <el-option label="异常告警" value="warning" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <span class="button-icon">🔍</span>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span>通信设备列表</span>
            <el-button type="primary" @click="handleExport">
              <span class="button-icon">📥</span>
              导出数据
            </el-button>
          </div>
        </template>
        
        <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'lastCommunication', order: 'descending' }"
        >
          <el-table-column prop="deviceId" label="设备编号" width="120" sortable />
          <el-table-column prop="location" label="位置" min-width="150" />
          <el-table-column prop="frequency" label="频率(MHz)" width="120" sortable />
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
          <el-table-column prop="signalStrength" label="信号强度" width="120">
            <template #default="{ row }">
              <div class="signal-indicator">
                <div 
                  class="signal-bar"
                  :class="getSignalClass(row.signalStrength)"
                ></div>
                <span>{{ row.signalStrength }}dB</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="lastCommunication" label="最后通信" width="180" sortable />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleViewDetail(row)"
              >
                详情
              </el-button>
              <el-button
                link
                type="warning"
                size="small"
                @click="handleAnalyze(row)"
              >
                分析
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
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
      title="设备详情"
      width="600px"
    >
      <div v-if="currentDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentDevice.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentDevice.location }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ currentDevice.frequency }} MHz</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentDevice.status)">
              {{ getStatusText(currentDevice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信号强度">{{ currentDevice.signalStrength }} dB</el-descriptions-item>
          <el-descriptions-item label="最后通信">{{ currentDevice.lastCommunication }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-chart">
          <h4>信号强度趋势</h4>
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div v-for="i in 7" :key="i" class="chart-bar" :style="{ height: `${20 + Math.random() * 60}%` }"></div>
            </div>
            <div class="chart-labels">
              <span v-for="day in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="day">{{ day }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 分析结果弹窗 -->
    <el-dialog
      v-model="analyzeDialogVisible"
      title="通信数据分析"
      width="700px"
    >
      <div v-if="analyzingDevice" class="analyze-result">
        <div class="analyze-header">
          <h3>设备 {{ analyzingDevice.deviceId }} 分析报告</h3>
          <el-tag :type="getStatusType(analyzingDevice.status)" size="large">
            {{ getStatusText(analyzingDevice.status) }}
          </el-tag>
        </div>
        
        <div class="analyze-stats">
          <div class="stat-item">
            <div class="stat-label">通信成功率</div>
            <div class="stat-value success">98.2%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均信号强度</div>
            <div class="stat-value info">-65dB</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">异常次数</div>
            <div class="stat-value warning">3次</div>
          </div>
        </div>

        <div class="analyze-details">
          <h4>分析详情</h4>
          <el-timeline>
            <el-timeline-item timestamp="2024-01-15 14:30" placement="top">
              <el-card>
                <h4>信号强度异常</h4>
                <p>检测到信号强度低于阈值 -85dB，持续5分钟</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-14 09:15" placement="top">
              <el-card>
                <h4>通信中断</h4>
                <p>设备通信中断2次，每次持续时间约3分钟</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-13 16:45" placement="top">
              <el-card>
                <h4>频率波动</h4>
                <p>检测到频率波动超出正常范围 ±0.5MHz</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="analyze-recommendation">
          <h4>处理建议</h4>
          <el-alert
            title="建议检查天线连接和设备位置，优化信号接收环境"
            type="warning"
            :closable="false"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const analyzeDialogVisible = ref(false)
const currentDevice = ref(null)
const analyzingDevice = ref(null)

// 模拟数据
const mockData = ref([])

// 计算属性
const tableData = computed(() => {
  let data = [...mockData.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    data = data.filter(item => 
      item.deviceId.includes(searchQuery.value) || 
      item.location.includes(searchQuery.value)
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    data = data.filter(item => item.status === statusFilter.value)
  }
  
  // 分页
  total.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// 方法
const generateMockData = () => {
  const locations = ['北京指挥中心', '上海应急局', '广州通信站', '成都基地', '武汉中心', '西安调度中心', '南京应急办']
  const statuses = ['online', 'offline', 'warning']
  
  return Array.from({ length: 85 }, (_, i) => ({
    deviceId: `DEV${String(i + 1).padStart(4, '0')}`,
    location: locations[i % locations.length],
    frequency: (400 + Math.random() * 200).toFixed(1),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    signalStrength: Math.floor(-30 - Math.random() * 70),
    lastCommunication: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString()
  }))
}

const getStatusType = (status) => {
  const types = {
    online: 'success',
    offline: 'info',
    warning: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    online: '在线',
    offline: '离线',
    warning: '告警'
  }
  return texts[status] || '未知'
}

const getSignalClass = (strength) => {
  if (strength >= -50) return 'excellent'
  if (strength >= -70) return 'good'
  if (strength >= -85) return 'fair'
  return 'poor'
}

const handleSearch = () => {
  loading.value = true
  // 模拟搜索延迟
  setTimeout(() => {
    currentPage.value = 1
    loading.value = false
    ElMessage.success(`搜索完成，找到 ${tableData.value.length} 条记录`)
  }, 500)
}

const handleFilter = () => {
  handleSearch()
}

const handleDateChange = () => {
  handleSearch()
}

const handleReset = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  handleSearch()
  ElMessage.info('筛选条件已重置')
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  handleSearch()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleViewDetail = (row) => {
  currentDevice.value = row
  detailDialogVisible.value = true
}

const handleAnalyze = (row) => {
  ElMessageBox.confirm(
    `确定要对设备 ${row.deviceId} 进行通信数据分析吗？`,
    '通信数据分析',
    {
      confirmButtonText: '开始分析',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    loading.value = true
    // 模拟分析过程
    setTimeout(() => {
      analyzingDevice.value = row
      analyzeDialogVisible.value = true
      loading.value = false
      ElMessage.success(`设备 ${row.deviceId} 分析完成，发现${Math.floor(Math.random() * 5) + 1}个潜在问题`)
    }, 1500)
  }).catch(() => {
    ElMessage.info('已取消分析操作')
  })
}

const handleExport = () => {
  loading.value = true
  // 模拟导出延迟
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`成功导出 ${tableData.value.length} 条通信设备数据`)
    
    // 模拟下载文件
    const dataStr = JSON.stringify(tableData.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `应急无线电通信数据_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, 1000)
}

// 生命周期
onMounted(() => {
  loading.value = true
  setTimeout(() => {
    mockData.value = generateMockData()
    total.value = mockData.value.length
    loading.value = false
    ElMessage.success('通信数据加载完成')
  }, 800)
})
</script>

<style lang="scss" scoped>


@use './CommunicationData.scss';


</style>