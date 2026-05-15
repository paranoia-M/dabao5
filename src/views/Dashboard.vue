<template>
  <div class="page-dashboard">
    <!-- 顶部筛选栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h2 class="header-title">食品质量安全检测平台</h2>
        <span class="header-subtitle">实时监测 · 智能预警 · 全程追溯</span>
      </div>
      <div class="header-right">
        <div class="filter-group">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="datePickerOptions"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleDateChange"
          />
          <el-select
            v-model="selectedCategory"
            placeholder="样品类别"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 180px"
          >
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
          <el-button type="primary" :icon="Download" @click="handleExport">
            导出报表
          </el-button>
        </div>
      </div>
    </div>

    <!-- KPI 卡片行 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.label">
        <div class="kpi-icon" :style="{ background: kpi.bg }">
          <el-icon :size="22"><component :is="kpi.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">{{ kpi.label }}</span>
          <span class="kpi-value">{{ kpi.value }}</span>
          <span class="kpi-trend" v-if="kpi.trend !== undefined">
            <span :class="kpi.trend >= 0 ? 'up' : 'down'">
              {{ kpi.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(kpi.trend) }}%
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- 主内容区：第一行 -->
    <div class="main-row">
      <div class="main-left">
        <div class="section-card compliance-card">
          <div class="section-header">
            <span class="section-title">检测项目达标环</span>
            <div class="section-actions">
              <el-tag
                v-for="cat in complianceCategories"
                :key="cat"
                :type="activeComplianceCat === cat ? 'primary' : 'info'"
                size="small"
                style="cursor: pointer; margin-left: 6px"
                @click="switchComplianceCat(cat)"
              >
                {{ cat }}
              </el-tag>
            </div>
          </div>
          <div class="compliance-body">
            <div class="ring-container" ref="ringRef" @click="cycleComplianceCat">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r="80"
                  fill="none" stroke="#2a2a3e" stroke-width="18"
                />
                <circle
                  cx="100" cy="100" r="80"
                  fill="none"
                  :stroke="complianceRingColor"
                  stroke-width="18"
                  stroke-linecap="round"
                  :stroke-dasharray="complianceDashArray"
                  :stroke-dashoffset="complianceDashOffset"
                  transform="rotate(-90, 100, 100)"
                  style="transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease"
                />
                <text x="100" y="92" text-anchor="middle" fill="#e8e8f0" font-size="38" font-weight="700">
                  {{ complianceRate }}%
                </text>
                <text x="100" y="120" text-anchor="middle" fill="#8a8aa0" font-size="13">
                  达标率
                </text>
              </svg>
            </div>
            <div class="ring-legend">
              <div class="legend-item">
                <span class="dot pass"></span>
                <span>合格 {{ compliancePass }}</span>
              </div>
              <div class="legend-item">
                <span class="dot fail"></span>
                <span>不合格 {{ complianceFail }}</span>
              </div>
              <div class="legend-item">
                <span class="dot total"></span>
                <span>总计 {{ complianceTotal }}</span>
              </div>
              <div class="legend-hint">点击切换类别</div>
            </div>
          </div>
        </div>
      </div>
      <div class="main-right">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">样品类别分布</span>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 主内容区：第二行 -->
    <div class="main-row second">
      <div class="main-left">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">检测任务状态分布</span>
          </div>
          <div ref="barChartRef" class="chart-container"></div>
        </div>
      </div>
      <div class="main-right">
        <div class="section-card todo-card">
          <div class="section-header">
            <span class="section-title">待办任务</span>
            <el-button link type="primary" size="small" @click="refreshTodo">
              刷新
            </el-button>
          </div>
          <div class="todo-list" v-if="todoTasks.length > 0">
            <div
              class="todo-item"
              v-for="task in todoTasks"
              :key="task.id"
            >
              <div class="todo-priority" :class="task.priority"></div>
              <div class="todo-info">
                <span class="todo-name">{{ task.sampleName || '检测任务' }}</span>
                <span class="todo-meta">
                  <el-tag :type="priorityTagType(task.priority)" size="small">{{ task.priority }}</el-tag>
                  <span class="todo-date">截止: {{ task.dueDate }}</span>
                </span>
              </div>
              <el-button
                link
                type="primary"
                size="small"
                @click="handleGotoTask(task)"
              >
                前往处理
              </el-button>
            </div>
          </div>
          <el-empty v-else description="暂无待办任务" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 底部：预警记录 -->
    <div class="bottom-section">
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">最新预警记录</span>
          <div class="section-actions">
            <el-tag type="danger" size="small" v-if="highAlertCount > 0">
              高风险 {{ highAlertCount }} 条
            </el-tag>
          </div>
        </div>
        <div class="alert-table-wrap">
          <el-table
            :data="filteredAlertRecords"
            stripe
            style="width: 100%"
            max-height="320"
            @row-click="handleAlertRowClick"
          >
            <el-table-column label="预警等级" width="90">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.level)" size="small">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="预警描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '未确认' ? 'warning' : row.status === '已确认' ? 'success' : 'info'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createDate" label="触发时间" width="160" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="handleAlertDetail(row)">
                  查看详情
                </el-button>
                <el-button
                  link
                  type="success"
                  size="small"
                  :disabled="row.status !== '未确认'"
                  @click.stop="handleConfirmAlert(row)"
                >
                  {{ row.status === '未确认' ? '确认预警' : '已确认' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 预警详情 Drawer -->
    <el-drawer
      v-model="alertDrawerVisible"
      title="预警详情"
      size="500px"
    >
      <template v-if="currentAlert">
        <div class="drawer-body">
          <div class="detail-row">
            <span class="detail-label">预警等级</span>
            <el-tag :type="levelTagType(currentAlert.level)" size="default">
              {{ currentAlert.level }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前状态</span>
            <el-tag :type="currentAlert.status === '未确认' ? 'warning' : 'success'" size="default">
              {{ currentAlert.status }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span class="detail-label">预警描述</span>
            <p class="detail-text">{{ currentAlert.description }}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">触发规则</span>
            <p class="detail-text">{{ currentAlertConfig?.name || '—' }}</p>
            <p class="detail-sub" v-if="currentAlertConfig">阈值: {{ currentAlertConfig.threshold }}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">相关样品</span>
            <p class="detail-text">{{ currentSample?.name || '—' }} ({{ currentSample?.type || '—' }})</p>
            <p class="detail-sub" v-if="currentSample">来源: {{ currentSample.source }}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">建议措施</span>
            <p class="detail-text" v-if="currentAlert.remark">{{ currentAlert.remark }}</p>
            <p class="detail-text" v-else>请及时核查相关样品检测数据，必要时启动复检流程。</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span>{{ currentAlert.createDate }}</span>
          </div>
          <div class="detail-row" v-if="currentAlert.handledBy">
            <span class="detail-label">处理人</span>
            <span>{{ currentAlert.handledBy }}</span>
          </div>
          <div class="detail-row" v-if="currentAlert.handledDate">
            <span class="detail-label">处理时间</span>
            <span>{{ currentAlert.handledDate }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="alertDrawerVisible = false">关闭</el-button>
        <el-button
          v-if="currentAlert && currentAlert.status === '未确认'"
          type="primary"
          @click="handleConfirmAlert(currentAlert)"
        >
          确认预警
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { Download, Warning, CircleCheck, List, TrendCharts } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useInspectionReportStore } from '@/stores/inspectionReport'
import { useDetectStandardStore } from '@/stores/detectStandard'
import { useAlertConfigStore } from '@/stores/alertConfig'
import { useAlertRecordStore } from '@/stores/alertRecord'

// ─── Stores ───
const sampleStore = useSampleStore()
const detectTaskStore = useDetectTaskStore()
const resultStore = useInspectionResultStore()
const reportStore = useInspectionReportStore()
const standardStore = useDetectStandardStore()
const alertConfigStore = useAlertConfigStore()
const alertRecordStore = useAlertRecordStore()

const router = useRouter()

// ─── 筛选状态 ───
const dateRange = ref([])
const selectedCategory = ref([])
const datePickerOptions = {
  disabledDate(time) {
    const max = dayjs().valueOf()
    const min = dayjs().subtract(30, 'day').valueOf()
    return time.getTime() > max || time.getTime() < min
  }
}

// ─── 样品类别选项 ───
const categoryOptions = [
  { label: '蔬菜', value: '蔬菜' },
  { label: '水果', value: '水果' },
  { label: '肉类', value: '肉类' },
  { label: '乳制品', value: '乳制品' },
  { label: '水产品', value: '水产品' },
  { label: '其他', value: '其他' }
]

// ─── 日期筛选处理 ───
function handleDateChange(val) {
  if (val && val.length === 2) {
    const start = dayjs(val[0])
    const end = dayjs(val[1])
    const diff = end.diff(start, 'day')
    if (diff > 30) {
      ElMessage.warning('仅支持查询最近30天数据')
      dateRange.value = []
    }
  }
}

// ─── 计算筛选后的数据 ───
const filteredSamples = computed(() => {
  let list = sampleStore.sampleList
  if (selectedCategory.value.length > 0) {
    list = list.filter(s => selectedCategory.value.includes(s.type))
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(s => s.receiveDate >= start && s.receiveDate <= end)
  }
  return list
})

const filteredResults = computed(() => {
  let list = resultStore.inspectionResultList
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(r => r.testDate >= start && r.testDate <= end)
  }
  return list
})

const filteredTasks = computed(() => {
  let list = detectTaskStore.detectTaskList
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(t => t.createDate >= start && t.createDate <= end + ' 23:59:59')
  }
  return list
})

const filteredAlertRecords = computed(() => {
  let list = alertRecordStore.alertRecordList
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(a => a.createDate >= start && a.createDate <= end + ' 23:59:59')
  }
  return [...list].sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
})

// ─── KPI ───
const kpiList = computed(() => {
  const totalTasks = detectTaskStore.detectTaskList.length
  const pendingSamples = sampleStore.sampleList.filter(s => s.status === '待检').length
  const results = filteredResults.value
  const totalResults = results.length
  const passCount = results.filter(r => r.conclusion === '合格').length
  const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0
  const highAlerts = alertRecordStore.alertRecordList.filter(a => a.level === '高' && a.status === '未确认').length
  return [
    {
      label: '检测任务总数',
      value: totalTasks,
      icon: List,
      bg: 'linear-gradient(135deg, #2563EB, #1E40AF)',
      trend: 12
    },
    {
      label: '待处理样品',
      value: pendingSamples,
      icon: Warning,
      bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      trend: -5
    },
    {
      label: '检测合格率',
      value: passRate + '%',
      icon: CircleCheck,
      bg: 'linear-gradient(135deg, #10B981, #059669)',
      trend: passRate >= 90 ? 2 : -1
    },
    {
      label: '高风险预警',
      value: highAlerts,
      icon: TrendCharts,
      bg: 'linear-gradient(135deg, #EF4444, #DC2626)',
      trend: highAlerts > 0 ? 8 : 0
    }
  ]
})

const highAlertCount = computed(() =>
  alertRecordStore.alertRecordList.filter(a => a.level === '高' && a.status === '未确认').length
)

// ─── 检测项目达标环 ───
const complianceCategories = computed(() => {
  const types = [...new Set(resultStore.inspectionResultList.map(r => {
    const task = detectTaskStore.detectTaskList.find(t => t.id === r.taskId)
    if (task) {
      const sample = sampleStore.sampleList.find(s => s.id === task.sampleId)
      return sample ? sample.type : '其他'
    }
    return '其他'
  }))]
  return ['全部', ...types]
})

const activeComplianceCat = ref('全部')

function switchComplianceCat(cat) {
  activeComplianceCat.value = cat
}

function cycleComplianceCat() {
  const cats = complianceCategories.value
  const idx = cats.indexOf(activeComplianceCat.value)
  activeComplianceCat.value = cats[(idx + 1) % cats.length]
}

const complianceResults = computed(() => {
  let list = resultStore.inspectionResultList
  if (activeComplianceCat.value !== '全部') {
    const targetType = activeComplianceCat.value
    const taskIds = detectTaskStore.detectTaskList
      .filter(t => {
        const s = sampleStore.sampleList.find(sm => sm.id === t.sampleId)
        return s && s.type === targetType
      })
      .map(t => t.id)
    list = list.filter(r => taskIds.includes(r.taskId))
  }
  return list
})

const complianceTotal = computed(() => complianceResults.value.length)
const compliancePass = computed(() => complianceResults.value.filter(r => r.conclusion === '合格').length)
const complianceFail = computed(() => complianceResults.value.filter(r => r.conclusion === '不合格').length)
const complianceRate = computed(() =>
  complianceTotal.value > 0 ? Math.round((compliancePass.value / complianceTotal.value) * 100) : 0
)

const complianceRingColor = computed(() => {
  const rate = complianceRate.value
  if (rate >= 90) return '#10B981'
  if (rate >= 70) return '#F59E0B'
  return '#EF4444'
})

const complianceDashArray = computed(() => {
  const circumference = 2 * Math.PI * 80
  return `${circumference} ${circumference}`
})

const complianceDashOffset = computed(() => {
  const circumference = 2 * Math.PI * 80
  const rate = complianceRate.value
  return circumference - (rate / 100) * circumference
})

// ─── 待办任务 ───
const todoTasks = computed(() => {
  const pending = detectTaskStore.detectTaskList.filter(t =>
    ['待分配', '已分配', '执行中'].includes(t.status)
  )
  return pending.slice(0, 6).map(t => {
    const sample = sampleStore.sampleList.find(s => s.id === t.sampleId)
    return { ...t, sampleName: sample ? sample.name : '未知样品' }
  })
})

function priorityTagType(p) {
  if (p === '高') return 'danger'
  if (p === '中') return 'warning'
  return 'info'
}

function refreshTodo() {
  ElMessage.success('待办任务已刷新')
}

function handleGotoTask(task) {
  if (['已完成', '已取消'].includes(task.status)) {
    ElMessage.info('任务已处理')
    return
  }
  router.push({ path: '/task/detail', query: { id: task.id } })
}

// ─── 预警操作 ───
const alertDrawerVisible = ref(false)
const currentAlert = ref(null)
const currentAlertConfig = computed(() => {
  if (!currentAlert.value) return null
  return alertConfigStore.alertConfigList.find(c => c.id === currentAlert.value.alertConfigId) || null
})
const currentSample = computed(() => {
  if (!currentAlert.value) return null
  return sampleStore.sampleList.find(s => s.id === currentAlert.value.sampleId) || null
})

function handleAlertRowClick(row) {
  currentAlert.value = row
  alertDrawerVisible.value = true
}

function handleAlertDetail(row) {
  currentAlert.value = row
  alertDrawerVisible.value = true
}

function handleConfirmAlert(row) {
  if (row.status !== '未确认') {
    ElMessage.info('该预警已确认，不可重复操作')
    return
  }
  ElMessageBox.confirm('确认该预警已处理完毕？', '确认预警', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    alertRecordStore.update(row.id, {
      status: '已确认',
      handledBy: '系统管理员',
      handledDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    ElMessage.success('预警已确认')
    alertDrawerVisible.value = false
  }).catch(() => {})
}

function levelTagType(level) {
  if (level === '高') return 'danger'
  if (level === '中') return 'warning'
  return 'info'
}

// ─── 导出报表 ───
function handleExport() {
  const total = filteredResults.value.length + filteredSamples.value.length + filteredAlertRecords.value.length
  if (total > 1000) {
    ElMessage.warning('导出数据量过大，请缩小筛选范围')
    return
  }
  ElMessage.success('报表导出任务已提交，请在报告模块查看')
}

// ─── ECharts ───
const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieInstance = null
let barInstance = null

function initCharts() {
  // 饼图
  if (pieChartRef.value) {
    pieInstance = echarts.init(pieChartRef.value)
    updatePieChart()
  }
  // 柱状图
  if (barChartRef.value) {
    barInstance = echarts.init(barChartRef.value)
    updateBarChart()
  }
}

function updatePieChart() {
  if (!pieInstance) return
  const typeMap = {}
  filteredSamples.value.forEach(s => {
    typeMap[s.type] = (typeMap[s.type] || 0) + s.quantity
  })
  const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }))
  pieInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 1 }],
      label: { color: '#c0c0d0', fontSize: 12 },
      labelLine: { lineStyle: { color: '#4a4a60' } },
      itemStyle: {
        borderRadius: 4,
        borderColor: '#1e1e2e',
        borderWidth: 2
      },
      color: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    }]
  })
}

function updateBarChart() {
  if (!barInstance) return
  const statusMap = {}
  filteredTasks.value.forEach(t => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1
  })
  const categories = ['待分配', '已分配', '执行中', '已完成', '已取消']
  const data = categories.map(c => statusMap[c] || 0)
  barInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#4a4a60' } },
      axisLabel: { color: '#a0a0b8' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4a4a60' } },
      splitLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b8' }
    },
    series: [{
      type: 'bar',
      data: data,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2563EB' },
          { offset: 1, color: '#1E40AF' }
        ])
      }
    }]
  })
}

watch([filteredSamples, filteredTasks], () => {
  nextTick(() => {
    updatePieChart()
    updateBarChart()
  })
})

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})

onBeforeUnmount(() => {
  if (pieInstance) { pieInstance.dispose(); pieInstance = null }
  if (barInstance) { barInstance.dispose(); barInstance = null }
})

// ─── 窗口resize ───
function handleResize() {
  if (pieInstance) pieInstance.resize()
  if (barInstance) barInstance.resize()
}
window.addEventListener('resize', handleResize)
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
@use './Dashboard.scss' as *;
</style>