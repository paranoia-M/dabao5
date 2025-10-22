<template>
  <div class="emergency-radio-container">
    <!-- 页面标题和统计概览 -->
    <div class="page-header">
      <h1 class="page-title">网络探针实时检测预警软件</h1>
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card">
              <div class="stat-icon total-signals">
                <span class="icon-text">📡</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalSignals }}</div>
                <div class="stat-label">总信号数量</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card">
              <div class="stat-icon active-devices">
                <span class="icon-text">📱</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.activeDevices }}</div>
                <div class="stat-label">活跃设备</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card">
              <div class="stat-icon emergency-calls">
                <span class="icon-text">🚨</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.emergencyCalls }}</div>
                <div class="stat-label">紧急呼叫</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card">
              <div class="stat-icon signal-quality">
                <span class="icon-text">📊</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.signalQuality }}%</div>
                <div class="stat-label">信号质量</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-card class="filter-card">
        <el-form :model="filterForm" :inline="true" class="filter-form">
          <el-form-item label="信号类型">
            <el-select v-model="filterForm.signalType" placeholder="请选择信号类型" clearable>
              <el-option label="语音通信" value="voice"></el-option>
              <el-option label="数据通信" value="data"></el-option>
              <el-option label="紧急广播" value="emergency"></el-option>
              <el-option label="测试信号" value="test"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="频率范围">
            <el-input v-model="filterForm.frequencyMin" placeholder="最小频率" style="width: 100px"></el-input>
            <span style="margin: 0 10px">-</span>
            <el-input v-model="filterForm.frequencyMax" placeholder="最大频率" style="width: 100px"></el-input>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :loading="searchLoading">
              <span class="button-icon">🔍</span> 搜索
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>通信信号列表</span>
            <div>
              <el-button type="primary" size="small" @click="handleExport">
                <span class="button-icon">📥</span> 导出数据
              </el-button>
              <el-button size="small" @click="handleRefresh">
                <span class="button-icon">🔄</span> 刷新
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          :data="tableData"
          v-loading="tableLoading"
          style="width: 100%"
          @sort-change="handleSortChange">
          <el-table-column prop="id" label="ID" width="80" sortable="custom"></el-table-column>
          <el-table-column prop="deviceId" label="设备ID" width="120"></el-table-column>
          <el-table-column prop="signalType" label="信号类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getSignalTypeTag(row.signalType)">{{ getSignalTypeText(row.signalType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="frequency" label="频率(MHz)" width="120" sortable="custom"></el-table-column>
          <el-table-column prop="strength" label="信号强度" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.strength" 
                :show-text="false"
                :color="getStrengthColor(row.strength)">
              </el-progress>
              <span style="margin-left: 8px">{{ row.strength }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="持续时间" width="120"></el-table-column>
          <el-table-column prop="location" label="位置" width="150"></el-table-column>
          <el-table-column prop="timestamp" label="时间戳" width="180" sortable="custom"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
                {{ row.status === 'normal' ? '正常' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button type="text" size="small" @click="handleAnalyze(row)">分析</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange">
          </el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="信号详情"
      width="600px">
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ currentDetail.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="信号类型">{{ getSignalTypeText(currentDetail.signalType) }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ currentDetail.frequency }} MHz</el-descriptions-item>
          <el-descriptions-item label="信号强度">{{ currentDetail.strength }}%</el-descriptions-item>
          <el-descriptions-item label="持续时间">{{ currentDetail.duration }}</el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ currentDetail.location }}</el-descriptions-item>
          <el-descriptions-item label="时间戳" :span="2">{{ currentDetail.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 'normal' ? 'success' : 'danger'">
              {{ currentDetail.status === 'normal' ? '正常' : '异常' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 分析结果弹窗 -->
    <el-dialog
      v-model="analyzeDialogVisible"
      title="信号分析结果"
      width="700px">
      <div v-if="currentAnalyzeData" class="analyze-content">
        <div class="analyze-header">
          <h3>设备 {{ currentAnalyzeData.deviceId }} 信号分析报告</h3>
          <el-tag :type="currentAnalyzeData.overallStatus === '良好' ? 'success' : 'warning'">
            总体状态: {{ currentAnalyzeData.overallStatus }}
          </el-tag>
        </div>
        
        <el-divider></el-divider>
        
        <div class="analyze-stats">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="analyze-stat-item">
                <div class="analyze-stat-value" :class="getSignalQualityClass(currentAnalyzeData.signalQuality)">
                  {{ currentAnalyzeData.signalQuality }}%
                </div>
                <div class="analyze-stat-label">信号质量评分</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="analyze-stat-item">
                <div class="analyze-stat-value">{{ currentAnalyzeData.stability }}%</div>
                <div class="analyze-stat-label">通信稳定性</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="analyze-stat-item">
                <div class="analyze-stat-value">{{ currentAnalyzeData.interferenceLevel }}</div>
                <div class="analyze-stat-label">干扰等级</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-divider></el-divider>

        <div class="analyze-details">
          <h4>详细分析</h4>
          <div class="analyze-detail-item">
            <strong>频率稳定性:</strong> 
            <el-tag size="small" :type="currentAnalyzeData.frequencyStability === '稳定' ? 'success' : 'warning'">
              {{ currentAnalyzeData.frequencyStability }}
            </el-tag>
          </div>
          <div class="analyze-detail-item">
            <strong>信号覆盖范围:</strong> {{ currentAnalyzeData.coverageRange }}
          </div>
          <div class="analyze-detail-item">
            <strong>最近异常次数:</strong> {{ currentAnalyzeData.recentErrors }}
          </div>
          <div class="analyze-detail-item">
            <strong>建议措施:</strong> 
            <el-tag type="info" size="small">{{ currentAnalyzeData.recommendation }}</el-tag>
          </div>
        </div>

        <el-divider></el-divider>

        <div class="analyze-timeline">
          <h4>最近活动时间线</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in currentAnalyzeData.recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type">
              {{ activity.event }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleExportReport">导出报告</el-button>
        <el-button @click="analyzeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const stats = reactive({
  totalSignals: 12543,
  activeDevices: 287,
  emergencyCalls: 42,
  signalQuality: 92.5
})

// 筛选表单
const filterForm = reactive({
  signalType: '',
  frequencyMin: '',
  frequencyMax: '',
  dateRange: []
})

// 表格数据
const tableData = ref([])
const tableLoading = ref(false)
const searchLoading = ref(false)

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框控制
const detailDialogVisible = ref(false)
const analyzeDialogVisible = ref(false)
const currentDetail = ref(null)
const currentAnalyzeData = ref(null)

// 生成假数据
const generateMockData = () => {
  const signalTypes = ['voice', 'data', 'emergency', 'test']
  const locations = ['北京基站', '上海控制中心', '广州应急站', '深圳指挥所', '成都监测点']
  const mockData = []
  
  for (let i = 1; i <= 100; i++) {
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)]
    mockData.push({
      id: i,
      deviceId: `DEV${String(i).padStart(4, '0')}`,
      signalType: signalType,
      frequency: (400 + Math.random() * 200).toFixed(2),
      strength: Math.floor(Math.random() * 100),
      duration: `${Math.floor(Math.random() * 60)}分${Math.floor(Math.random() * 60)}秒`,
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      status: Math.random() > 0.1 ? 'normal' : 'abnormal'
    })
  }
  
  return mockData
}

// 生成分析数据
const generateAnalyzeData = (row) => {
  const quality = Math.floor(Math.random() * 40) + 60 // 60-100
  const stability = Math.floor(Math.random() * 30) + 70 // 70-100
  const interferenceLevels = ['低', '中', '高']
  const recommendations = [
    '继续保持当前状态',
    '建议检查天线连接',
    '建议调整设备位置',
    '需要专业维护',
    '信号质量良好无需调整'
  ]
  
  return {
    deviceId: row.deviceId,
    overallStatus: quality >= 80 ? '良好' : '需关注',
    signalQuality: quality,
    stability: stability,
    interferenceLevel: interferenceLevels[Math.floor(Math.random() * interferenceLevels.length)],
    frequencyStability: Math.random() > 0.3 ? '稳定' : '波动',
    coverageRange: `${Math.floor(Math.random() * 50) + 10}公里`,
    recentErrors: Math.floor(Math.random() * 5),
    recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
    recentActivities: [
      { time: '2分钟前', event: '信号强度正常', type: 'primary' },
      { time: '15分钟前', event: '频率微调完成', type: 'success' },
      { time: '1小时前', event: '设备自检通过', type: 'success' },
      { time: '3小时前', event: '数据同步完成', type: 'info' }
    ]
  }
}

// 获取信号类型标签
const getSignalTypeTag = (type) => {
  const tagMap = {
    voice: 'primary',
    data: 'success',
    emergency: 'danger',
    test: 'warning'
  }
  return tagMap[type] || 'info'
}

// 获取信号类型文本
const getSignalTypeText = (type) => {
  const textMap = {
    voice: '语音通信',
    data: '数据通信',
    emergency: '紧急广播',
    test: '测试信号'
  }
  return textMap[type] || '未知'
}

// 获取信号强度颜色
const getStrengthColor = (strength) => {
  if (strength >= 80) return '#67c23a'
  if (strength >= 60) return '#e6a23c'
  if (strength >= 40) return '#f56c6c'
  return '#909399'
}

// 获取信号质量样式类
const getSignalQualityClass = (quality) => {
  if (quality >= 90) return 'quality-excellent'
  if (quality >= 80) return 'quality-good'
  if (quality >= 70) return 'quality-fair'
  return 'quality-poor'
}

// 搜索处理
const handleSearch = async () => {
  searchLoading.value = true
  // 模拟搜索延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 这里应该是实际的搜索逻辑，现在只是重新加载数据
  loadTableData()
  searchLoading.value = false
  ElMessage.success('搜索完成')
}

// 重置筛选
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    if (Array.isArray(filterForm[key])) {
      filterForm[key] = []
    } else {
      filterForm[key] = ''
    }
  })
  pagination.currentPage = 1
  loadTableData()
}

// 加载表格数据
const loadTableData = () => {
  tableLoading.value = true
  // 模拟加载延迟
  setTimeout(() => {
    const allData = generateMockData()
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    tableData.value = allData.slice(start, end)
    pagination.total = allData.length
    tableLoading.value = false
  }, 500)
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadTableData()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTableData()
}

// 排序改变
const handleSortChange = ({ prop, order }) => {
  ElMessage.info(`按 ${prop} ${order === 'ascending' ? '升序' : '降序'} 排序`)
  // 实际项目中这里应该调用排序接口
}

// 查看详情
const handleViewDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// 分析信号
const handleAnalyze = (row) => {
  ElMessageBox.confirm(
    `确定要分析设备 ${row.deviceId} 的信号数据吗？`,
    '信号分析',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('开始分析信号数据...')
    // 模拟分析过程
    setTimeout(() => {
      currentAnalyzeData.value = generateAnalyzeData(row)
      analyzeDialogVisible.value = true
      ElMessage.success('分析完成！')
    }, 1500)
  })
}

// 导出数据
const handleExport = () => {
  ElMessage.success('开始导出数据，请稍候...')
  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('数据导出成功！')
  }, 2000)
}

// 导出分析报告
const handleExportReport = () => {
  if (currentAnalyzeData.value) {
    ElMessage.success(`开始导出设备 ${currentAnalyzeData.value.deviceId} 的分析报告...`)
    setTimeout(() => {
      ElMessage.success('分析报告导出成功！')
    }, 1500)
  }
}

// 刷新数据
const handleRefresh = () => {
  loadTableData()
  ElMessage.success('数据已刷新')
}

// 初始化加载数据
onMounted(() => {
  loadTableData()
})
</script>

<style lang="scss" scoped>


@use './Settings.scss';


</style>