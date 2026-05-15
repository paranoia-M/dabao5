<template>
  <div class="page-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-actions">
      <el-button type="primary" @click="handleAddTask">新增排查任务</el-button>
      <el-button @click="handleExportReport" :loading="exportLoading">导出报表</el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索设备名称或隐患描述"
        clearable
        class="filter-input"
      />
      <el-select
        v-model="typeFilter"
        multiple
        collapse-tags
        placeholder="设备类型"
        class="filter-select"
      >
        <el-option
          v-for="t in deviceTypes"
          :key="t"
          :label="t"
          :value="t"
        />
      </el-select>
      <el-date-picker
        v-model="timeRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="filter-date"
        :shortcuts="dateShortcuts"
        value-format="YYYY-MM-DD"
      />
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-grid">
      <div class="kpi-card" @click="showHazardDetailDialog">
        <div class="kpi-icon" style="background: #e3f0ff;">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">{{ kpiTotalHazards.toLocaleString() }}</span>
          <span class="kpi-label">隐患总数</span>
        </div>
        <div class="kpi-trend" v-if="kpiTotalHazards > 0">
          <span class="trend-up">↑ 较上月 +{{ monthlyIncrease }}</span>
        </div>
      </div>
      <div class="kpi-card" @click="showPendingDialog">
        <div class="kpi-icon" style="background: #fff0e6;">
          <el-icon><CircleCloseFilled /></el-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">{{ kpiPending.toLocaleString() }}</span>
          <span class="kpi-label">待整改</span>
        </div>
      </div>
      <div class="kpi-card" @click="handleOverdueJump">
        <div class="kpi-icon" style="background: #ffe6e6;">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">{{ kpiOverdue.toLocaleString() }}</span>
          <span class="kpi-label">超期未检</span>
        </div>
      </div>
      <div class="kpi-card" @click="showRateDialog">
        <div class="kpi-icon" style="background: #e6f7e6;">
          <el-icon><Select /></el-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">{{ rectificationRate }}%</span>
          <span class="kpi-label">整改完成率</span>
        </div>
      </div>
    </div>

    <!-- 主舞台：左环图 + 右最近隐患 -->
    <div class="main-stage">
      <div class="stage-left">
        <!-- 设备状态环图（招牌积木） -->
        <div class="status-ring-wrapper">
          <div class="status-ring" :style="ringStyle" @mouseenter="showRingTooltip = true" @mouseleave="showRingTooltip = false">
            <div class="ring-center">
              <span class="ring-total">{{ deviceTotal }}</span>
              <span class="ring-unit">台</span>
            </div>
          </div>
          <div class="ring-tooltip" v-if="showRingTooltip">
            <div v-for="s in deviceStatusStats" :key="s.label" class="tooltip-item">
              <span class="tooltip-dot" :style="{ background: s.color }"></span>
              <span>{{ s.label }}: {{ s.count }}</span>
            </div>
          </div>
        </div>
        <div class="stage-title">设备状态分布</div>
      </div>
      <div class="stage-right">
        <div class="stage-title">最近隐患</div>
        <div v-for="h in recentHazards" :key="h.id" class="hazard-item" @click="showHazardDetail(h)">
          <div class="hazard-desc">{{ h.description }}</div>
          <div class="hazard-meta">
            <el-tag :type="riskTagType(h.riskLevel)" size="small">{{ h.riskLevel }}</el-tag>
            <span class="hazard-date">{{ h.discoveredDate }}</span>
          </div>
        </div>
        <div v-if="recentHazards.length === 0" class="empty-tip">暂无最近隐患</div>
      </div>
    </div>

    <!-- ECharts 区域（最多2个图表） -->
    <div class="charts-area">
      <div class="chart-box" ref="pieChartRef"></div>
      <div class="chart-box" ref="barChartRef"></div>
    </div>

    <!-- 待办任务列表 + 导出记录 -->
    <div class="bottom-section">
      <div class="todo-section">
        <div class="section-header">
          <h3>待办任务（{{ todoTasks.length }}）</h3>
        </div>
        <el-table :data="todoTasks" stripe style="width: 100%" @row-click="handleTodoRowClick">
          <el-table-column prop="description" label="任务名称" min-width="180">
            <template #default="{ row }">
              <span class="ellipsis-text">{{ row.description }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="equipmentName" label="设备名称" min-width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '待整改' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rectificationDeadline" label="截止日期" width="120" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="showHazardDetail(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="todoTasks.length === 0" class="empty-tip">暂无待办任务</div>
      </div>
      <div class="export-section">
        <div class="section-header">
          <h3>最近导出报表</h3>
        </div>
        <div v-for="r in recentReports" :key="r.id" class="export-item">
          <span class="export-title">{{ r.title }}</span>
          <span class="export-time">{{ r.createTime }}</span>
        </div>
        <div v-if="recentReports.length === 0" class="empty-tip">暂无导出记录</div>
      </div>
    </div>

    <!-- 新增排查任务弹窗 -->
    <el-dialog v-model="addTaskVisible" title="新增排查任务" width="min(640px,92vw)" @close="resetAddForm">
      <el-form :model="addForm" ref="addFormRef" label-width="100px">
        <el-form-item label="选择设备" prop="equipmentIds" :rules="[{ required: true, message: '请至少选择一个设备' }]">
          <el-select v-model="addForm.equipmentIds" multiple filterable placeholder="搜索设备" style="width:100%">
            <el-option v-for="eq in equipmentStore.equipmentList" :key="eq.id" :label="eq.name" :value="eq.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查类型" prop="taskType" :rules="[{ required: true, message: '请选择检查类型' }]">
          <el-select v-model="addForm.taskType" placeholder="检查类型">
            <el-option label="日常检查" value="日常检查" />
            <el-option label="专项检查" value="专项检查" />
            <el-option label="季度检查" value="季度检查" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查人员" prop="assignee" :rules="[{ required: true, message: '请选择检查人员' }]">
          <el-select v-model="addForm.assignee" multiple filterable placeholder="检查人员" style="width:100%">
            <el-option label="张伟" value="张伟" />
            <el-option label="李娜" value="李娜" />
            <el-option label="王芳" value="王芳" />
            <el-option label="刘洋" value="刘洋" />
            <el-option label="陈静" value="陈静" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate" :rules="[{ required: true, message: '请选择开始日期' }]">
          <el-date-picker v-model="addForm.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate" :rules="[
          { required: true, message: '请选择结束日期' },
          { validator: (rule, value, callback) => { if (value && addForm.startDate && value < addForm.startDate) { callback(new Error('结束日期不能早于开始日期')) } else { callback() } } }
        ]">
          <el-date-picker v-model="addForm.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remarks" type="textarea" :rows="3" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addTaskVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddTask" :loading="addTaskLoading">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 隐患总数详情弹窗 -->
    <el-dialog v-model="hazardDetailVisible" title="隐患分类明细" width="min(600px,92vw)">
      <el-table :data="hazardTypeStats" stripe @row-click="handleHazardTypeClick">
        <el-table-column prop="type" label="隐患类型" />
        <el-table-column prop="count" label="数量" width="100" />
      </el-table>
    </el-dialog>

    <!-- 待整改隐患详情弹窗 -->
    <el-dialog v-model="pendingDialogVisible" title="待整改隐患列表" width="min(800px,92vw)">
      <el-table :data="pendingHazards" stripe @row-click="showHazardDetail">
        <el-table-column prop="description" label="隐患描述" min-width="200" />
        <el-table-column prop="equipmentName" label="设备" width="120" />
        <el-table-column prop="riskLevel" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskLevel)" size="small">{{ row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rectificationDeadline" label="整改截止" width="120" />
      </el-table>
    </el-dialog>

    <!-- 整改完成率详情弹窗 -->
    <el-dialog v-model="rateDialogVisible" title="整改完成情况" width="min(500px,92vw)">
      <div class="rate-stat">
        <div>已完成：{{ rateCompleted }}</div>
        <div>未完成：{{ ratePending }}</div>
      </div>
    </el-dialog>

    <!-- 隐患明细弹窗 -->
    <el-dialog v-model="hazardDetailDialogVisible" title="隐患详情" width="min(600px,92vw)">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="隐患描述">{{ selectedHazard?.description }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="riskTagType(selectedHazard?.riskLevel)" size="small">{{ selectedHazard?.riskLevel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="隐患类型">{{ selectedHazard?.hazardType }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">{{ selectedHazard?.severity }}</el-descriptions-item>
        <el-descriptions-item label="发现日期">{{ selectedHazard?.discoveredDate }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedHazard?.assignedTo }}</el-descriptions-item>
        <el-descriptions-item label="整改截止">{{ selectedHazard?.rectificationDeadline }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedHazard?.status === '待整改' ? 'danger' : 'warning'" size="small">{{ selectedHazard?.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled, CircleCloseFilled, Select } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// stores
import { useEquipmentStore } from '@/stores/equipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'
import { useInspectionTaskStore } from '@/stores/inspectionTask'
import { useTaskEquipmentStore } from '@/stores/taskEquipment'
import { useRiskAssessmentStore } from '@/stores/riskAssessment'
import { useRectificationStore } from '@/stores/rectification'
import { useReportStore } from '@/stores/report'

const equipmentStore = useEquipmentStore()
const hazardRecordStore = useHazardRecordStore()
const inspectionTaskStore = useInspectionTaskStore()
const taskEquipmentStore = useTaskEquipmentStore()
const riskAssessmentStore = useRiskAssessmentStore()
const rectificationStore = useRectificationStore()
const reportStore = useReportStore()

// 筛选数据
const keyword = ref('')
const typeFilter = ref([])
const timeRange = ref([]) // 初始无限制
const dateShortcuts = [
  { text: '近7天', value: () => {
    const end = new Date()
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
    return [start, end]
  }},
  { text: '近30天', value: () => {
    const end = new Date()
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000)
    return [start, end]
  }},
  { text: '本月', value: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return [start, now]
  }}
]

// 设备类型列表
const deviceTypes = computed(() => {
  const types = new Set(equipmentStore.equipmentList.map(e => e.equipmentType))
  return Array.from(types)
})

// 根据筛选条件过滤设备
const filteredEquipmentList = computed(() => {
  let list = equipmentStore.equipmentList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(kw) || e.registerCode?.toLowerCase().includes(kw))
  }
  if (typeFilter.value.length > 0) {
    list = list.filter(e => typeFilter.value.includes(e.equipmentType))
  }
  return list
})

// 根据设备过滤隐患
const filteredHazardRecords = computed(() => {
  const eqIds = new Set(filteredEquipmentList.value.map(e => e.id))
  let hazs = hazardRecordStore.hazardRecordList.filter(h => eqIds.has(h.equipmentId))
  if (timeRange.value && timeRange.value.length === 2) {
    const [start, end] = timeRange.value
    hazs = hazs.filter(h => {
      const d = new Date(h.discoveredDate)
      return d >= new Date(start) && d <= new Date(end)
    })
  }
  // 关键词搜索隐患描述
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    hazs = hazs.filter(h => h.description.toLowerCase().includes(kw))
  }
  return hazs
})

// 设备名称映射
const equipmentNameMap = computed(() => {
  const map = {}
  equipmentStore.equipmentList.forEach(e => { map[e.id] = e.name })
  return map
})

// 最近隐患（按发现日期倒序取5条）
const recentHazards = computed(() => {
  const sorted = [...filteredHazardRecords.value].sort((a, b) => new Date(b.discoveredDate) - new Date(a.discoveredDate))
  return sorted.slice(0, 5)
})

// KPI 计算
const kpiTotalHazards = computed(() => filteredHazardRecords.value.length)
const kpiPending = computed(() => filteredHazardRecords.value.filter(h => h.status === '待整改').length)
// 超期未检设备
const kpiOverdue = computed(() => {
  return filteredEquipmentList.value.filter(e => e.status === '超期未检').length
})
// 整改完成率：从rectificationStore统计
const rectificationRate = computed(() => {
  const all = rectificationStore.rectificationList.length
  if (all === 0) return 0
  const completed = rectificationStore.rectificationList.filter(r => r.status === '已完成').length
  return Math.round((completed / all) * 100)
})
// 隐患总数卡片中的增长
const monthlyIncrease = computed(() => {
  const now = new Date()
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1)
  const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisCount = filteredHazardRecords.value.filter(h => new Date(h.discoveredDate) >= startThis).length
  const lastCount = filteredHazardRecords.value.filter(h => new Date(h.discoveredDate) >= startLast && new Date(h.discoveredDate) < startThis).length
  return thisCount - lastCount
})

// 设备状态统计（用于环图）
const deviceStatusStats = computed(() => {
  const statusMap = {}
  filteredEquipmentList.value.forEach(e => {
    const s = e.status || '未知'
    statusMap[s] = (statusMap[s] || 0) + 1
  })
  const colors = {
    '正常': '#67c23a',
    '待检验': '#e6a23c',
    '超期未检': '#f56c6c',
    '停用': '#909399',
    '报废': '#000'
  }
  return Object.entries(statusMap).map(([label, count]) => ({
    label,
    count,
    color: colors[label] || '#909399'
  }))
})
const deviceTotal = computed(() => filteredEquipmentList.value.length)
const ringStyle = computed(() => {
  const stats = deviceStatusStats.value
  if (stats.length === 0) return {}
  const total = stats.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return {}
  let conic = 'conic-gradient('
  let start = 0
  stats.forEach((s, i) => {
    const deg = (s.count / total) * 360
    const end = start + deg
    conic += `${s.color} ${start}deg ${end}deg${i < stats.length - 1 ? ', ' : ''}`
    start = end
  })
  conic += ')'
  return { background: conic }
})
const showRingTooltip = ref(false)

// ECharts 图表
const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null

const initCharts = () => {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    updatePieChart()
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
    updateBarChart()
  }
}

const updatePieChart = () => {
  if (!pieChart) return
  const riskData = {}
  filteredHazardRecords.value.forEach(h => {
    const level = h.riskLevel
    riskData[level] = (riskData[level] || 0) + 1
  })
  const seriesData = Object.entries(riskData).map(([name, value]) => ({ name, value }))
  pieChart.setOption({
    title: { text: '风险等级分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: seriesData,
      label: { show: true, formatter: '{b}\n{d}%' },
      color: ['#f56c6c', '#e6a23c', '#f0c040', '#67c23a'] // 红橙黄绿
    }]
  })
}

const updateBarChart = () => {
  if (!barChart) return
  const monthData = {}
  filteredHazardRecords.value.forEach(h => {
    const month = h.discoveredDate ? h.discoveredDate.substring(0, 7) : '未知'
    monthData[month] = (monthData[month] || 0) + 1
  })
  const sortedMonths = Object.keys(monthData).sort()
  const values = sortedMonths.map(m => monthData[m])
  barChart.setOption({
    title: { text: '月度隐患趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: sortedMonths },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#2563EB' }
    }]
  })
}

watch([filteredHazardRecords, keyword, typeFilter, timeRange], () => {
  updatePieChart()
  updateBarChart()
})

// 待办任务列表（过滤状态）
const todoTasks = computed(() => {
  return filteredHazardRecords.value
    .filter(h => h.status === '待整改' || h.status === '待复查')
    .map(h => ({
      ...h,
      equipmentName: equipmentNameMap.value[h.equipmentId] || '未知设备'
    }))
})

// 最近导出报表
const recentReports = computed(() => {
  return reportStore.reportList.slice(-5).reverse()
})

// 新增排查任务
const addTaskVisible = ref(false)
const addTaskLoading = ref(false)
const addFormRef = ref(null)
const addForm = ref({
  equipmentIds: [],
  taskType: '',
  assignee: [],
  startDate: '',
  endDate: '',
  remarks: ''
})

const resetAddForm = () => {
  addForm.value = {
    equipmentIds: [],
    taskType: '',
    assignee: [],
    startDate: '',
    endDate: '',
    remarks: ''
  }
}

const handleAddTask = () => {
  addTaskVisible.value = true
}

const confirmAddTask = async () => {
  if (!addFormRef.value) return
  try {
    await addFormRef.value.validate()
    addTaskLoading.value = true
    // 生成任务ID
    const newId = 'task_' + Date.now()
    const taskData = {
      id: newId,
      title: addForm.value.taskType + '排查任务',
      description: addForm.value.remarks || '',
      taskType: addForm.value.taskType,
      status: '已发布',
      startDate: addForm.value.startDate,
      endDate: addForm.value.endDate,
      assignee: addForm.value.assignee.join(','),
      createdBy: '系统管理员',
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    inspectionTaskStore.add(taskData)
    // 关联设备
    addForm.value.equipmentIds.forEach(eqId => {
      taskEquipmentStore.add({
        id: 'te_' + Date.now() + Math.random(),
        taskId: newId,
        equipmentId: eqId
      })
    })
    ElMessage.success('创建成功')
    addTaskVisible.value = false
    resetAddForm()
  } catch (e) {
    if (e.message) ElMessage.warning(e.message)
  } finally {
    addTaskLoading.value = false
  }
}

// 导出报表
const exportLoading = ref(false)
const handleExportReport = async () => {
  if (filteredHazardRecords.value.length === 0 && filteredEquipmentList.value.length === 0) {
    ElMessage.warning('当前筛选条件下无数据，无法导出')
    return
  }
  exportLoading.value = true
  // 模拟生成报表记录
  const newReport = {
    id: 'report_' + Date.now(),
    title: `隐患排查概览报表_${new Date().toLocaleDateString()}`,
    reportType: '综合报告',
    generationMethod: '手动',
    status: '草稿',
    relatedEntityType: '系统概览',
    relatedEntityId: '',
    content: {
      summary: `导出时间：${new Date().toLocaleString()}，隐患总数：${kpiTotalHazards.value}，待整改：${kpiPending.value}`,
      findings: [],
      score: 0
    },
    createTime: new Date().toLocaleString(),
    auditBy: '',
    auditTime: ''
  }
  reportStore.add(newReport)
  ElMessage.success('报表已生成，请在下方查看')
  exportLoading.value = false
}

// 隐患详情弹窗
const hazardDetailDialogVisible = ref(false)
const selectedHazard = ref(null)
const showHazardDetail = (hazard) => {
  selectedHazard.value = hazard
  hazardDetailDialogVisible.value = true
}

// 隐患分类明细弹窗
const hazardDetailVisible = ref(false)
const hazardTypeStats = computed(() => {
  const map = {}
  filteredHazardRecords.value.forEach(h => {
    map[h.hazardType] = (map[h.hazardType] || 0) + 1
  })
  return Object.entries(map).map(([type, count]) => ({ type, count }))
})
const showHazardDetailDialog = () => {
  if (hazardTypeStats.value.length === 0) {
    ElMessage.info('暂无隐患数据')
    return
  }
  hazardDetailVisible.value = true
}
const handleHazardTypeClick = (row) => {
  ElMessage.info(`点击了${row.type}，可跳转至隐患列表（模拟）`)
}

// 待整改隐患弹窗
const pendingDialogVisible = ref(false)
const pendingHazards = computed(() => {
  return filteredHazardRecords.value
    .filter(h => h.status === '待整改')
    .map(h => ({ ...h, equipmentName: equipmentNameMap.value[h.equipmentId] || '未知' }))
})
const showPendingDialog = () => {
  if (pendingHazards.value.length === 0) {
    ElMessage.info('暂无待整改隐患')
    return
  }
  pendingDialogVisible.value = true
}

// 超期未检测跳转
const handleOverdueJump = () => {
  ElMessage.info('跳转至设备台账页面（模拟）')
}

// 整改完成率弹窗
const rateDialogVisible = ref(false)
const rateCompleted = computed(() => rectificationStore.rectificationList.filter(r => r.status === '已完成').length)
const ratePending = computed(() => rectificationStore.rectificationList.filter(r => r.status !== '已完成').length)
const showRateDialog = () => {
  rateDialogVisible.value = true
}

// 待办任务行点击
const handleTodoRowClick = (row) => {
  showHazardDetail(row)
}

// 工具函数
const riskTagType = (level) => {
  if (level.includes('红色')) return 'danger'
  if (level.includes('橙色')) return 'warning'
  if (level.includes('黄色')) return 'info'
  return 'success'
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})
onUnmounted(() => {
  if (pieChart) pieChart.dispose()
  if (barChart) barChart.dispose()
})
</script>

<style scoped lang="scss">
@use './Dashboard.scss' as *;
</style>