<template>
  <div class="signal-analysis">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon primary">
                <span class="icon-font">📡</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalSignals }}</div>
                <div class="stat-label">总信号数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon success">
                <span class="icon-font">📶</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.activeSignals }}</div>
                <div class="stat-label">活跃信号</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <span class="icon-font">⚠️</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.abnormalSignals }}</div>
                <div class="stat-label">异常信号</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon danger">
                <span class="icon-font">🚫</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.interferenceSignals }}</div>
                <div class="stat-label">干扰信号</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="频率范围">
          <el-input
            v-model="filterForm.frequencyMin"
            placeholder="最小频率"
            style="width: 120px"
          />
          <span style="margin: 0 8px">-</span>
          <el-input
            v-model="filterForm.frequencyMax"
            placeholder="最大频率"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="信号类型">
          <el-select v-model="filterForm.signalType" placeholder="请选择">
            <el-option label="全部" value="" />
            <el-option label="语音信号" value="voice" />
            <el-option label="数据信号" value="data" />
            <el-option label="控制信号" value="control" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择">
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="异常" value="abnormal" />
            <el-option label="干扰" value="interference" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <span class="button-icon">🔍</span>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 信号数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span>应急无线电信号数据列表</span>
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
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="frequency" label="频率(MHz)" width="120" sortable="custom" />
        <el-table-column prop="signalType" label="信号类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getSignalTypeTag(row.signalType)">
              {{ getSignalTypeText(row.signalType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="strength" label="信号强度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.strength"
              :color="getStrengthColor(row.strength)"
              :show-text="false"
            />
            <span style="margin-left: 8px">{{ row.strength }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="150" />
        <el-table-column prop="timestamp" label="检测时间" width="180" sortable="custom" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="text"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="text"
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
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="信号详情"
      width="600px"
    >
      <div v-if="currentSignal" class="signal-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="信号ID">{{ currentSignal.id }}</el-descriptions-item>
          <el-descriptions-item label="频率">{{ currentSignal.frequency }} MHz</el-descriptions-item>
          <el-descriptions-item label="信号类型">
            <el-tag :type="getSignalTypeTag(currentSignal.signalType)">
              {{ getSignalTypeText(currentSignal.signalType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信号强度">{{ currentSignal.strength }}%</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentSignal.status)">
              {{ getStatusText(currentSignal.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentSignal.location }}</el-descriptions-item>
          <el-descriptions-item label="检测时间" :span="2">{{ currentSignal.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentSignal.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 分析结果弹窗 -->
    <el-dialog
      v-model="analyzeDialogVisible"
      title="信号分析报告"
      width="700px"
    >
      <div v-if="currentSignal" class="analyze-report">
        <div class="report-header">
          <h3>应急无线电信号分析报告</h3>
          <el-tag :type="getStatusTag(currentSignal.status)" size="large">
            {{ getStatusText(currentSignal.status) }}
          </el-tag>
        </div>
        
        <el-divider />
        
        <div class="report-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="report-item">
                <label>信号ID：</label>
                <span>{{ currentSignal.id }}</span>
              </div>
              <div class="report-item">
                <label>频率：</label>
                <span>{{ currentSignal.frequency }} MHz</span>
              </div>
              <div class="report-item">
                <label>信号类型：</label>
                <span>{{ getSignalTypeText(currentSignal.signalType) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="report-item">
                <label>信号强度：</label>
                <span>{{ currentSignal.strength }}%</span>
              </div>
              <div class="report-item">
                <label>位置：</label>
                <span>{{ currentSignal.location }}</span>
              </div>
              <div class="report-item">
                <label>检测时间：</label>
                <span>{{ currentSignal.timestamp }}</span>
              </div>
            </el-col>
          </el-row>
          
          <el-divider />
          
          <div class="analysis-result">
            <h4>分析结果</h4>
            <div class="result-content">
              <p>{{ getAnalysisResult(currentSignal) }}</p>
            </div>
          </div>
          
          <div class="recommendation">
            <h4>处理建议</h4>
            <div class="recommendation-content">
              <p>{{ getRecommendation(currentSignal) }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleGenerateReport">生成报告</el-button>
        <el-button @click="analyzeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const analyzeDialogVisible = ref(false)
const currentSignal = ref(null)

const stats = reactive({
  totalSignals: 0,
  activeSignals: 0,
  abnormalSignals: 0,
  interferenceSignals: 0
})

const filterForm = reactive({
  frequencyMin: '',
  frequencyMax: '',
  signalType: '',
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 模拟数据 - 体现应急无线电通信特色
const mockData = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  frequency: (Math.random() * 500 + 30).toFixed(2), // 应急通信常用频率范围
  signalType: ['voice', 'data', 'control'][Math.floor(Math.random() * 3)],
  strength: Math.floor(Math.random() * 100),
  status: ['normal', 'abnormal', 'interference'][Math.floor(Math.random() * 3)],
  location: `应急区域${Math.floor(Math.random() * 20) + 1}`,
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
  description: `应急无线电信号${index + 1}，频率${(Math.random() * 500 + 30).toFixed(2)}MHz，${['语音通信', '数据传输', '控制指令'][Math.floor(Math.random() * 3)]}，信号质量${Math.floor(Math.random() * 100)}%，用于${['应急救援', '指挥调度', '灾情上报', '物资调配'][Math.floor(Math.random() * 4)]}。`
}))

// 计算属性
const tableData = computed(() => {
  let data = [...mockData]
  
  // 应用筛选条件
  if (filterForm.frequencyMin) {
    data = data.filter(item => parseFloat(item.frequency) >= parseFloat(filterForm.frequencyMin))
  }
  if (filterForm.frequencyMax) {
    data = data.filter(item => parseFloat(item.frequency) <= parseFloat(filterForm.frequencyMax))
  }
  if (filterForm.signalType) {
    data = data.filter(item => item.signalType === filterForm.signalType)
  }
  if (filterForm.status) {
    data = data.filter(item => item.status === filterForm.status)
  }
  
  // 更新分页总数
  pagination.total = data.length
  
  // 分页
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return data.slice(start, end)
})

// 方法
const handleSearch = () => {
  loading.value = true
  pagination.currentPage = 1
  
  // 模拟搜索延迟
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`搜索完成，找到 ${pagination.total} 条应急无线电信号记录`)
  }, 500)
}

const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  pagination.currentPage = 1
  handleSearch()
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确定要导出当前应急无线电信号数据吗？', '导出确认', {
      type: 'warning',
      confirmButtonText: '确认导出',
      cancelButtonText: '取消'
    })
    
    // 模拟导出操作
    loading.value = true
    setTimeout(() => {
      loading.value = false
      ElMessage.success('应急无线电信号数据导出成功，已生成分析报告文件')
    }, 1000)
  } catch {
    ElMessage.info('取消数据导出')
  }
}

const handleViewDetail = (row) => {
  currentSignal.value = row
  detailDialogVisible.value = true
}

const handleAnalyze = (row) => {
  currentSignal.value = row
  analyzeDialogVisible.value = true
  
  // 模拟分析操作
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`应急无线电信号 ${row.id} 深度分析完成`)
  }, 1500)
}

const handleGenerateReport = () => {
  ElMessage.success('应急无线电信号分析报告生成成功')
  analyzeDialogVisible.value = false
}

const handleSortChange = ({ prop, order }) => {
  ElMessage.info(`应急信号数据按 ${prop} ${order === 'ascending' ? '升序' : '降序'} 排序`)
}

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize
  pagination.currentPage = 1
}

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage
}

const getSignalTypeTag = (type) => {
  const map = {
    voice: 'primary',
    data: 'success',
    control: 'warning'
  }
  return map[type] || 'info'
}

const getSignalTypeText = (type) => {
  const map = {
    voice: '语音信号',
    data: '数据信号',
    control: '控制信号'
  }
  return map[type] || '未知'
}

const getStatusTag = (status) => {
  const map = {
    normal: 'success',
    abnormal: 'warning',
    interference: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    normal: '正常',
    abnormal: '异常',
    interference: '干扰'
  }
  return map[status] || '未知'
}

const getStrengthColor = (strength) => {
  if (strength >= 80) return '#67c23a'
  if (strength >= 60) return '#e6a23c'
  if (strength >= 40) return '#f56c6c'
  return '#909399'
}

const getAnalysisResult = (signal) => {
  const results = {
    normal: '该应急无线电信号运行稳定，频率合规，信号强度良好，符合应急救援通信标准要求。',
    abnormal: '检测到信号异常波动，可能存在设备故障或环境干扰，建议进行设备检查和频谱监测。',
    interference: '发现外部干扰源，可能影响应急通信质量，建议启动干扰排查和频率调整程序。'
  }
  return results[signal.status] || '信号分析完成，详情请查看完整报告。'
}

const getRecommendation = (signal) => {
  const recommendations = {
    normal: '继续保持监测，确保应急通信畅通。建议定期进行设备维护和信号质量检测。',
    abnormal: '立即进行设备检修，加强该区域信号监测频率，准备备用通信方案。',
    interference: '启动干扰源定位程序，调整通信频率，必要时启用抗干扰通信模式。'
  }
  return recommendations[signal.status] || '按照应急通信管理规程进行常规维护和监测。'
}

// 初始化
onMounted(() => {
  loading.value = true
  
  // 模拟初始化数据加载
  setTimeout(() => {
    stats.totalSignals = mockData.length
    stats.activeSignals = mockData.filter(item => item.strength > 50).length
    stats.abnormalSignals = mockData.filter(item => item.status === 'abnormal').length
    stats.interferenceSignals = mockData.filter(item => item.status === 'interference').length
    pagination.total = mockData.length
    loading.value = false
    ElMessage.success('应急无线电通信数据加载完成')
  }, 800)
})
</script>

<style lang="scss" scoped>


@use './SignalAnalysis.scss';


</style>