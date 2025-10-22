<template>
  <div class="home-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total-signals">
                <i class="el-icon-monitor"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalSignals }}</div>
                <div class="stat-label">总信号数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon active-devices">
                <i class="el-icon-cpu"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.activeDevices }}</div>
                <div class="stat-label">活跃设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning-signals">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.warningSignals }}</div>
                <div class="stat-label">预警信号</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon success-rate">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.successRate }}%</div>
                <div class="stat-label">通信成功率</div>
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
                <span>信号强度趋势</span>
                <el-select v-model="signalTimeRange" size="small" style="width: 120px">
                  <el-option label="24小时" value="24h"></el-option>
                  <el-option label="7天" value="7d"></el-option>
                  <el-option label="30天" value="30d"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart signal-chart">
                <div class="chart-placeholder">
                  <i class="el-icon-data-analysis"></i>
                  <p>信号强度趋势图表</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>信号类型分布</span>
                <el-button size="small" type="text">查看详情</el-button>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart type-chart">
                <div class="chart-placeholder">
                  <i class="el-icon-pie-chart"></i>
                  <p>信号类型分布图表</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近信号列表 -->
    <div class="table-section">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>最近通信记录</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索设备或频率"
                size="small"
                style="width: 200px; margin-right: 10px;"
                clearable
              >
                <template #prefix>
                  <i class="el-icon-search"></i>
                </template>
              </el-input>
              <el-select v-model="statusFilter" size="small" placeholder="状态筛选" style="width: 120px; margin-right: 10px;">
                <el-option label="全部" value=""></el-option>
                <el-option label="成功" value="success"></el-option>
                <el-option label="失败" value="failed"></el-option>
                <el-option label="警告" value="warning"></el-option>
              </el-select>
              <el-button size="small" type="primary" @click="refreshData">
                <i class="el-icon-refresh"></i>
                刷新
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          :data="filteredSignals"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'timestamp', order: 'descending' }"
        >
          <el-table-column prop="deviceId" label="设备ID" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.deviceId }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="frequency" label="频率(MHz)" width="120">
            <template #default="{ row }">
              {{ row.frequency.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="signalStrength" label="信号强度" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.signalStrength" 
                :show-text="false"
                :color="getSignalColor(row.signalStrength)"
              />
              <span style="font-size: 12px; margin-left: 8px;">{{ row.signalStrength }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="信号类型" width="120">
            <template #default="{ row }">
              <el-tag 
                :type="getTypeTagType(row.type)"
                size="small"
              >
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusTagType(row.status)"
                effect="light"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" sortable width="180">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置">
            <template #default="{ row }">
              <span class="location-text">{{ row.location }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small"
                @click="viewDetails(row)"
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
            :total="totalSignals"
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
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedSignal" class="signal-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备ID">{{ selectedSignal.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ selectedSignal.frequency.toFixed(2) }} MHz</el-descriptions-item>
          <el-descriptions-item label="信号强度">
            <el-progress 
              :percentage="selectedSignal.signalStrength" 
              :show-text="false"
              :color="getSignalColor(selectedSignal.signalStrength)"
            />
            {{ selectedSignal.signalStrength }}%
          </el-descriptions-item>
          <el-descriptions-item label="信号类型">
            <el-tag :type="getTypeTagType(selectedSignal.type)">
              {{ selectedSignal.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedSignal.status)">
              {{ getStatusText(selectedSignal.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatTime(selectedSignal.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ selectedSignal.location }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ selectedSignal.remarks || '无备注信息' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const stats = ref({
  totalSignals: 0,
  activeDevices: 0,
  warningSignals: 0,
  successRate: 0
})

const signalTimeRange = ref('24h')
const searchKeyword = ref('')
const statusFilter = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalSignals = ref(0)
const detailDialogVisible = ref(false)
const selectedSignal = ref(null)

// 模拟数据
const signalsData = ref([])

// 计算属性
const filteredSignals = computed(() => {
  let filtered = signalsData.value
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(signal => 
      signal.deviceId.toLowerCase().includes(keyword) ||
      signal.frequency.toString().includes(keyword) ||
      signal.location.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(signal => signal.status === statusFilter.value)
  }
  
  // 分页
  totalSignals.value = filtered.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return filtered.slice(start, end)
})

// 方法
const generateMockData = () => {
  const types = ['语音', '数据', '紧急', '测试', '控制']
  const statuses = ['success', 'failed', 'warning']
  const locations = ['北京控制中心', '上海监测站', '广州基站', '成都中继站', '武汉终端']
  
  const mockData = []
  for (let i = 1; i <= 150; i++) {
    mockData.push({
      id: i,
      deviceId: `DEV${String(i).padStart(4, '0')}`,
      frequency: 400 + Math.random() * 200,
      signalStrength: Math.floor(Math.random() * 100),
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      location: locations[Math.floor(Math.random() * locations.length)],
      remarks: Math.random() > 0.7 ? '信号质量良好，通信稳定' : ''
    })
  }
  
  return mockData
}

const refreshData = async () => {
  loading.value = true
  
  // 模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 800))
  
  signalsData.value = generateMockData()
  
  // 更新统计数据
  stats.value = {
    totalSignals: signalsData.value.length,
    activeDevices: new Set(signalsData.value.map(s => s.deviceId)).size,
    warningSignals: signalsData.value.filter(s => s.status === 'warning').length,
    successRate: Math.round((signalsData.value.filter(s => s.status === 'success').length / signalsData.value.length) * 100)
  }
  
  loading.value = false
  ElMessage.success('数据刷新成功')
}

const getSignalColor = (strength) => {
  if (strength >= 80) return '#67C23A'
  if (strength >= 60) return '#E6A23C'
  if (strength >= 40) return '#F56C6C'
  return '#909399'
}

const getTypeTagType = (type) => {
  const typeMap = {
    '语音': '',
    '数据': 'success',
    '紧急': 'danger',
    '测试': 'info',
    '控制': 'warning'
  }
  return typeMap[type] || ''
}

const getStatusTagType = (status) => {
  const statusMap = {
    'success': 'success',
    'failed': 'danger',
    'warning': 'warning'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    'success': '成功',
    'failed': '失败',
    'warning': '警告'
  }
  return statusMap[status] || status
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const viewDetails = (signal) => {
  selectedSignal.value = signal
  detailDialogVisible.value = true
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
  refreshData()
})
</script>

<style lang="scss" scoped>


@use './Home.scss';


</style>