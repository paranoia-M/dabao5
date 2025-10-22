<template>
  <div class="home-container">
    <!-- 顶部统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" v-for="stat in statsData" :key="stat.title">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <span class="icon-text">{{ stat.icon }}</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-title">{{ stat.title }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 通信数据分析图表 -->
        <el-col :xs="24" :lg="16">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>通信数据趋势分析</span>
                <el-select v-model="chartTimeRange" size="small" style="width: 120px" @change="handleChartTimeChange">
                  <el-option label="今日" value="today" />
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-visualization">
                  <div class="signal-bars">
                    <div 
                      v-for="(bar, index) in signalBars" 
                      :key="index"
                      class="signal-bar"
                      :style="{ height: bar.height + '%', backgroundColor: bar.color }"
                    ></div>
                  </div>
                  <div class="chart-labels">
                    <span v-for="label in chartLabels" :key="label" class="chart-label">{{ label }}</span>
                  </div>
                </div>
                <p>应急通信数据趋势监控</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 实时通信状态 -->
        <el-col :xs="24" :lg="8">
          <el-card class="status-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>实时通信状态</span>
                <el-tag :type="realTimeStatus.type" size="small">
                  {{ realTimeStatus.text }}
                </el-tag>
              </div>
            </template>
            <div class="status-list">
              <div 
                v-for="status in communicationStatus" 
                :key="status.id"
                class="status-item"
                @click="handleStatusClick(status)"
              >
                <div class="status-info">
                  <div class="status-name">{{ status.name }}</div>
                  <div class="status-desc">{{ status.description }}</div>
                </div>
                <el-tag 
                  :type="status.online ? 'success' : 'danger'" 
                  size="small"
                >
                  {{ status.online ? '在线' : '离线' }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近通信记录 -->
      <el-card class="records-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>最近通信记录</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索通信记录..."
                size="small"
                style="width: 200px; margin-right: 10px;"
                clearable
              >
                <template #prefix>
                  <span class="search-icon">🔍</span>
                </template>
              </el-input>
              <el-button type="primary" size="small" @click="handleRefresh">
                刷新
              </el-button>
              <el-button type="success" size="small" @click="handleExportData">
                导出数据
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredRecords"
          style="width: 100%"
          v-loading="loading"
          @row-click="handleRecordClick"
        >
          <el-table-column prop="id" label="记录ID" width="100" />
          <el-table-column prop="frequency" label="频率" width="120" />
          <el-table-column prop="callSign" label="呼号" width="120" />
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="signalStrength" label="信号强度" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.signalStrength" 
                :show-text="false"
                :color="getSignalColor(row.signalStrength)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'warning'" size="small">
                {{ row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleDetailClick(row)">
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

    <!-- 通信记录详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="通信记录详情"
      width="600px"
      center
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ selectedRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="呼号">{{ selectedRecord.callSign }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ selectedRecord.frequency }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedRecord.location }}</el-descriptions-item>
          <el-descriptions-item label="信号强度">
            <el-progress 
              :percentage="selectedRecord.signalStrength" 
              :color="getSignalColor(selectedRecord.signalStrength)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="通信状态">
            <el-tag :type="selectedRecord.status === 'success' ? 'success' : 'warning'">
              {{ selectedRecord.status === 'success' ? '通信成功' : '通信失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间戳" :span="2">
            {{ formatTime(selectedRecord.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="通信质量" :span="2">
            <el-rate
              v-model="selectedRecord.quality"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value} 分"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleAnalyzeSignal(selectedRecord)">
            信号分析
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备状态详情弹窗 -->
    <el-dialog
      v-model="statusDialogVisible"
      :title="`设备状态 - ${selectedStatus?.name}`"
      width="500px"
    >
      <div v-if="selectedStatus" class="status-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备名称">{{ selectedStatus.name }}</el-descriptions-item>
          <el-descriptions-item label="设备描述">{{ selectedStatus.description }}</el-descriptions-item>
          <el-descriptions-item label="运行状态">
            <el-tag :type="selectedStatus.online ? 'success' : 'danger'">
              {{ selectedStatus.online ? '在线运行' : '离线维护' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后心跳">
            {{ formatTime(new Date()) }}
          </el-descriptions-item>
          <el-descriptions-item label="设备负载">
            <el-progress :percentage="selectedStatus.load || 45" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="!selectedStatus?.online" 
            type="warning" 
            @click="handleRestartDevice(selectedStatus)"
          >
            重启设备
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 信号分析弹窗 -->
    <el-dialog
      v-model="analyzeDialogVisible"
      title="信号质量分析"
      width="700px"
    >
      <div v-if="analyzingRecord" class="signal-analysis">
        <el-alert
          title="信号质量分析报告"
          :description="getSignalAnalysisDesc(analyzingRecord)"
          type="info"
          show-icon
          :closable="false"
        />
        
        <div class="analysis-chart">
          <div class="frequency-spectrum">
            <div class="spectrum-title">频率频谱分布</div>
            <div class="spectrum-bars">
              <div 
                v-for="(bar, index) in spectrumBars" 
                :key="index"
                class="spectrum-bar"
                :style="{ height: bar.height + '%', backgroundColor: bar.color }"
                :title="`频率: ${bar.freq}MHz`"
              ></div>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="analysis-suggestions">
          <h4>优化建议：</h4>
          <ul>
            <li v-for="suggestion in getSignalSuggestions(analyzingRecord)" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="analyzeDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleGenerateReport(analyzingRecord)">
            生成报告
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const statsData = ref([
  { title: '总通信次数', value: '1,234', icon: '📞', color: '#409EFF' },
  { title: '在线设备', value: '28', icon: '🖥️', color: '#67C23A' },
  { title: '信号覆盖率', value: '98.5%', icon: '📶', color: '#E6A23C' },
  { title: '异常事件', value: '3', icon: '⚠️', color: '#F56C6C' }
])

const chartTimeRange = ref('today')
const realTimeStatus = ref({
  type: 'success',
  text: '正常'
})

const communicationStatus = ref([
  { id: 1, name: '主控制台', description: '系统核心控制单元', online: true, load: 35 },
  { id: 2, name: '基站A', description: '城市中心区域覆盖', online: true, load: 60 },
  { id: 3, name: '基站B', description: '郊区信号覆盖', online: true, load: 45 },
  { id: 4, name: '移动终端1', description: '应急车辆终端', online: false, load: 0 },
  { id: 5, name: '移动终端2', description: '巡逻人员终端', online: true, load: 25 }
])

const communicationRecords = ref([])
const searchKeyword = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)

// 弹窗相关数据
const detailDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const analyzeDialogVisible = ref(false)
const selectedRecord = ref(null)
const selectedStatus = ref(null)
const analyzingRecord = ref(null)

// 图表数据
const signalBars = ref([])
const chartLabels = ref(['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'])
const spectrumBars = ref([])

// 计算属性
const filteredRecords = computed(() => {
  let records = communicationRecords.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    records = records.filter(record => 
      record.callSign.toLowerCase().includes(keyword) ||
      record.location.toLowerCase().includes(keyword) ||
      record.frequency.includes(keyword)
    )
  }
  
  totalRecords.value = records.length
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return records.slice(start, end)
})

// 方法
const generateMockData = () => {
  const mockRecords = []
  const callSigns = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO']
  const locations = ['北京控制中心', '上海基站', '广州应急点', '深圳指挥所', '成都分站']
  
  for (let i = 1; i <= 50; i++) {
    mockRecords.push({
      id: i,
      frequency: `${146 + (i % 10)}.${i % 100} MHz`,
      callSign: `${callSigns[i % 5]}-${String(i).padStart(3, '0')}`,
      location: locations[i % 5],
      signalStrength: 30 + Math.floor(Math.random() * 70),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      status: Math.random() > 0.2 ? 'success' : 'failed',
      quality: Math.floor(Math.random() * 3) + 3
    })
  }
  
  communicationRecords.value = mockRecords
  totalRecords.value = mockRecords.length
}

const generateChartData = () => {
  const bars = []
  for (let i = 0; i < 12; i++) {
    const height = 20 + Math.floor(Math.random() * 60)
    let color = '#F56C6C'
    if (height >= 70) color = '#67C23A'
    else if (height >= 40) color = '#E6A23C'
    
    bars.push({ height, color })
  }
  signalBars.value = bars
}

const generateSpectrumData = () => {
  const bars = []
  for (let i = 0; i < 20; i++) {
    const height = 10 + Math.floor(Math.random() * 80)
    const color = `hsl(${200 + i * 5}, 70%, 50%)`
    const freq = (140 + i * 2).toFixed(1)
    bars.push({ height, color, freq })
  }
  spectrumBars.value = bars
}

const getSignalColor = (strength) => {
  if (strength >= 80) return '#67C23A'
  if (strength >= 60) return '#E6A23C'
  return '#F56C6C'
}

const formatTime = (timestamp) => {
  return timestamp.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    generateMockData()
    generateChartData()
    loading.value = false
    ElMessage.success('数据刷新成功')
  }, 500)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleChartTimeChange = (value) => {
  generateChartData()
  ElMessage.info(`已切换到${value === 'today' ? '今日' : value === 'week' ? '本周' : '本月'}数据`)
}

const handleStatusClick = (status) => {
  selectedStatus.value = status
  statusDialogVisible.value = true
}

const handleRecordClick = (record) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const handleDetailClick = (record) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const handleAnalyzeSignal = (record) => {
  analyzingRecord.value = record
  generateSpectrumData()
  detailDialogVisible.value = false
  analyzeDialogVisible.value = true
}

const handleExportData = async () => {
  try {
    loading.value = true
    // 模拟导出数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据导出成功，开始下载...')
    
    // 模拟下载
    const dataStr = JSON.stringify(communicationRecords.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `emergency_radio_data_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
  } catch (error) {
    ElMessage.error('数据导出失败')
  } finally {
    loading.value = false
  }
}

const handleRestartDevice = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要重启设备"${device.name}"吗？重启过程可能需要几分钟。`,
      '重启设备',
      {
        confirmButtonText: '确定重启',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟重启过程
    ElMessage.info(`设备"${device.name}"正在重启...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新设备状态
    const deviceIndex = communicationStatus.value.findIndex(d => d.id === device.id)
    if (deviceIndex !== -1) {
      communicationStatus.value[deviceIndex].online = true
      communicationStatus.value[deviceIndex].load = 10
    }
    
    ElMessage.success(`设备"${device.name}"重启成功`)
    statusDialogVisible.value = false
    
  } catch (error) {
    // 用户取消操作
  }
}

const handleGenerateReport = (record) => {
  ElMessage.success('分析报告生成成功，已保存到报告中心')
  analyzeDialogVisible.value = false
}

const getSignalAnalysisDesc = (record) => {
  if (record.signalStrength >= 80) {
    return '信号质量优秀，通信稳定可靠，适合应急指挥通信。'
  } else if (record.signalStrength >= 60) {
    return '信号质量良好，通信基本稳定，建议持续监控。'
  } else {
    return '信号质量一般，存在通信中断风险，建议优化信号覆盖。'
  }
}

const getSignalSuggestions = (record) => {
  const suggestions = []
  
  if (record.signalStrength < 60) {
    suggestions.push('检查天线连接和方向调整')
    suggestions.push('考虑增加信号中继设备')
    suggestions.push('优化设备位置和高度')
  } else if (record.signalStrength < 80) {
    suggestions.push('定期检查设备运行状态')
    suggestions.push('监控信号波动情况')
  } else {
    suggestions.push('继续保持当前配置')
    suggestions.push('定期进行设备维护')
  }
  
  suggestions.push('记录通信质量变化趋势')
  suggestions.push('建立应急备用通信方案')
  
  return suggestions
}

// 生命周期
onMounted(() => {
  generateMockData()
  generateChartData()
  generateSpectrumData()
})
</script>

<style lang="scss" scoped>


@use './UserManagement.scss';


</style>