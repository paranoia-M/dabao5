<template>
  <div class="page-home">
    <!-- 筛选条 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-date-picker
          v-model="timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          value-format="YYYY-MM-DD"
          :clearable="true"
          @change="handleTimeChange"
        />
        <el-select
          v-model="selectedDomains"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="数据来源"
          style="width:220px;"
          clearable
        >
          <el-option
            v-for="d in domainOptions"
            :key="d"
            :label="d"
            :value="d"
          />
        </el-select>
        <el-button :icon="Refresh" :loading="refreshing" @click="doRefresh">刷新</el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" :icon="Plus" @click="cardDialogVisible = true">添加卡片</el-button>
        <el-button :icon="Download" @click="exportDialogVisible = true">导出报告</el-button>
      </div>
    </div>

    <div class="dashboard-body">
      <!-- 左列：热度日历 + 最新动态 -->
      <div class="col-left">
        <div class="heatmap-section">
          <div class="section-title">
            <span class="title-text">数据热度日历</span>
            <span class="title-badge">{{ dateRangeLabel }}</span>
          </div>
          <div class="heatmap-grid" ref="heatmapRef">
            <div
              v-for="(day, idx) in heatmapDays"
              :key="idx"
              class="heat-cell"
              :class="{ 'has-data': day.count > 0, 'zero': day.count === 0 }"
              :style="{ '--heat': day.count / maxCount || 0 }"
              v-el-tooltip="`${day.date} 收藏${day.count}次`"
              @click.stop="handleHeatClick(day)"
            >
              <span v-if="day.count > 0" class="heat-count">{{ day.count }}</span>
            </div>
          </div>
        </div>

        <div class="timeline-section">
          <div class="section-title">最新动态</div>
          <el-timeline class="dashboard-timeline">
            <el-timeline-item
              v-for="log in recentLogs"
              :key="log.id"
              :timestamp="log.startTime"
              :color="log.status === '成功' ? 'var(--el-color-success)' : (log.status === '失败' ? 'var(--el-color-danger)' : 'var(--el-color-warning)')"
            >
              <div class="timeline-item">
                <el-tag size="small" :type="log.status === '成功' ? 'success' : (log.status === '失败' ? 'danger' : 'warning')">
                  {{ log.status }}
                </el-tag>
                <span class="timeline-text">{{ truncate(log.logContent, 80) }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 右列：KPI + 看板卡片 + ECharts -->
      <div class="col-right">
        <!-- 系统 KPI 固定卡 -->
        <div class="kpi-row">
          <div class="kpi-card" v-for="kpi in systemKpis" :key="kpi.label">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <div v-if="kpi.trend" class="kpi-trend" :class="kpi.trend >= 0 ? 'up' : 'down'">
              {{ kpi.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(kpi.trend).toFixed(1) }}%
            </div>
          </div>
        </div>

        <!-- 看板卡片列表 -->
        <div class="dashboard-cards">
          <div
            v-for="card in sortedCards"
            :key="card.id"
            class="dashboard-card"
            @click="openDetailDrawer(card)"
          >
            <div class="card-header">
              <span class="card-title">{{ card.settings?.title || card.cardType }}</span>
              <el-icon class="card-edit" @click.stop="editCard(card)" :size="16"><Edit /></el-icon>
            </div>
            <div class="card-body">
              <div class="card-value">{{ card.computedValue }}</div>
              <div v-if="card.sparklineData" class="card-sparkline">
                <svg :width="sparklineWidth" :height="sparklineHeight" viewBox="0 0 60 20">
                  <polyline
                    :points="card.sparklineData"
                    fill="none"
                    stroke="var(--page-primary)"
                    stroke-width="1.5"
                  />
                </svg>
              </div>
            </div>
            <el-icon class="card-delete" @click.stop="deleteCard(card)" :size="16"><Delete /></el-icon>
          </div>
          <div v-if="sortedCards.length === 0" class="empty-cards">
            <el-empty description="暂无配置卡片，点击上方添加卡片" />
          </div>
        </div>

        <!-- ECharts 图表区 -->
        <div class="chart-area">
          <div class="chart-box" ref="lineChartRef" style="height:220px; width:100%;"></div>
          <div class="chart-box" ref="pieChartRef" style="height:200px; width:100%;"></div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑卡片 Dialog -->
    <el-dialog
      :title="isEditing ? '编辑卡片' : '添加卡片'"
      v-model="cardDialogVisible"
      width="min(540px,92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="cardFormRef" :model="cardForm" :rules="cardRules" label-width="100px">
        <el-form-item label="卡片名称" prop="name">
          <el-input v-model="cardForm.name" placeholder="请输入卡片名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="指标类型" prop="cardType">
          <el-select v-model="cardForm.cardType" placeholder="选择指标类型" style="width:100%">
            <el-option label="资产总量" value="资产总量" />
            <el-option label="增长率" value="增长率" />
            <el-option label="质量评分" value="质量评分" />
            <el-option label="任务成功率" value="任务成功率" />
            <el-option label="服务调用趋势" value="服务调用趋势" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据来源" prop="dataSource">
          <el-select v-model="cardForm.dataSource" placeholder="选择数据来源" style="width:100%">
            <el-option
              v-for="asset in dataAssetList"
              :key="asset.id"
              :label="asset.name"
              :value="asset.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="刷新频率" prop="refreshRate">
          <el-select v-model="cardForm.refreshRate" placeholder="选择刷新频率" style="width:100%">
            <el-option label="实时" value="实时" />
            <el-option label="每小时" value="每小时" />
            <el-option label="每天" value="每天" />
          </el-select>
        </el-form-item>
        <el-form-item label="图表类型" prop="chartType">
          <el-select v-model="cardForm.chartType" placeholder="选择图表类型" style="width:100%">
            <el-option label="数字卡片" value="数字卡片" />
            <el-option label="折线图" value="折线图" />
            <el-option label="柱状图" value="柱状图" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCard" :loading="cardSaving">确认</el-button>
      </template>
    </el-dialog>

    <!-- 卡片详情 Drawer -->
    <el-drawer
      v-model="detailDrawerVisible"
      :size="'min(500px,85vw)'"
      :title="detailCard?.settings?.title || ''"
      @close="detailDrawerVisible = false"
    >
      <div class="detail-content">
        <div class="detail-section">
          <h4>趋势预览</h4>
          <div class="detail-sparkline">
            <svg :width="sparklineWidth*2" :height="sparklineHeight*2" viewBox="0 0 120 40">
              <polyline
                :points="detailSparklinePoints"
                fill="none"
                stroke="var(--page-primary)"
                stroke-width="2"
              />
            </svg>
          </div>
        </div>
        <div class="detail-section">
          <h4>数据明细</h4>
          <el-table :data="detailTableData" stripe style="width:100%" size="small" max-height="300">
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="value" label="数值" width="80" />
            <el-table-column prop="date" label="日期" width="120" />
          </el-table>
        </div>
        <div class="detail-section">
          <h4>历史记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="rec in detailHistory"
              :key="rec.id"
              :timestamp="rec.createdAt || rec.executionTime"
            >
              <span>{{ rec.ruleId || rec.name || '' }}</span>
              <el-tag v-if="rec.status" size="small" :type="rec.status==='成功'?'success':'danger'">{{ rec.status }}</el-tag>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>

    <!-- 导出报告 Dialog -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出概览报告"
      width="min(480px,92vw)"
    >
      <el-form ref="exportFormRef" :model="exportForm" :rules="exportRules" label-width="100px">
        <el-form-item label="报告名称" prop="name">
          <el-input v-model="exportForm.name" placeholder="请输入报告名称" />
        </el-form-item>
        <el-form-item label="导出格式" prop="format">
          <el-select v-model="exportForm.format" style="width:100%">
            <el-option label="PDF" value="PDF" />
            <el-option label="Excel" value="Excel" />
          </el-select>
        </el-form-item>
        <el-form-item label="包含卡片">
          <el-checkbox-group v-model="exportForm.selectedCardIds">
            <el-checkbox v-for="card in sortedCards" :key="card.id" :label="card.id">
              {{ card.settings?.title || card.cardType }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exporting">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useDataAssetStore } from '@/stores/dataAsset'
import { useDataAssetFavoriteStore } from '@/stores/dataAssetFavorite'
import { useDetectionResultStore } from '@/stores/detectionResult'
import { useExecutionLogStore } from '@/stores/executionLog'
import { useGrantApplicationStore } from '@/stores/grantApplication'
import { useDashboardConfigStore } from '@/stores/dashboardConfig'
import { useExportRecordStore } from '@/stores/exportRecord'
import { Refresh, Plus, Download, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// ---------- stores ----------
const dataAssetStore = useDataAssetStore()
const favoriteStore = useDataAssetFavoriteStore()
const detectionStore = useDetectionResultStore()
const executionLogStore = useExecutionLogStore()
const grantAppStore = useGrantApplicationStore()
const dashboardConfigStore = useDashboardConfigStore()
const exportRecordStore = useExportRecordStore()

// ---------- sparkline 尺寸 ----------
const sparklineWidth = 60
const sparklineHeight = 20

// ---------- 系统KPI ----------
const systemKpis = computed(() => {
  const totalAssets = dataAssetStore.total || dataAssetStore.dataAssetList.length
  const qualified = detectionStore.detectionResultList.filter(d => d.passed !== false).length
  const totalDetect = detectionStore.detectionResultList.length
  const passRate = totalDetect > 0 ? (qualified / totalDetect * 100) : 0
  const pendingApps = grantAppStore.grantApplicationList.filter(g => g.status === '待审批').length
  return [
    {
      label: '数据资产总数',
      value: totalAssets.toLocaleString(),
      trend: 5.2
    },
    {
      label: '质量检测通过率',
      value: passRate.toFixed(1) + '%',
      trend: -1.3
    },
    {
      label: '待审批申请',
      value: pendingApps,
      trend: pendingApps > 0 ? 3.8 : 0
    }
  ]
})

// ---------- 数据来源选项 ----------
const domainOptions = computed(() => {
  const domains = dataAssetStore.dataAssetList.map(a => a.domain).filter(Boolean)
  return [...new Set(domains)]
})
const selectedDomains = ref([])

// ---------- 时间筛选 ----------
const timeRange = ref([])
const shortcuts = [
  { text: '今天', value: () => [new Date(), new Date()] },
  { text: '昨天', value: () => [dayjs().subtract(1, 'day').toDate(), dayjs().subtract(1, 'day').toDate()] },
  { text: '近7天', value: () => [dayjs().subtract(6, 'day').toDate(), new Date()] },
  { text: '近30天', value: () => [dayjs().subtract(29, 'day').toDate(), new Date()] },
  { text: '近90天', value: () => [dayjs().subtract(89, 'day').toDate(), new Date()] }
]
function handleTimeChange () {
  // 热度日历自动重新计算
}

// ---------- 刷新 ----------
const refreshing = ref(false)
function doRefresh () {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

// ---------- 热度日历 ----------
const heatmapRef = ref(null)
const dateRangeLabel = ref('')
// 生成日期范围
const heatmapDays = computed(() => {
  let start, end
  if (timeRange.value.length === 2 && timeRange.value[0] && timeRange.value[1]) {
    start = dayjs(timeRange.value[0])
    end = dayjs(timeRange.value[1])
  } else {
    // 默认近30天（基于收藏数据最大日期）
    const dates = favoriteStore.favoriteList.map(f => dayjs(f.createdAt)).filter(Boolean).sort()
    if (dates.length === 0) {
      // fallback 15天
      end = dayjs()
      start = end.subtract(29, 'day')
    } else {
      end = dates[dates.length - 1]
      start = end.subtract(29, 'day')
    }
  }
  const diffDays = end.diff(start, 'day') + 1
  const days = []
  for (let i = 0; i < diffDays; i++) {
    const d = start.add(i, 'day')
    days.push({ date: d.format('YYYY-MM-DD'), dayOfWeek: d.day(), count: 0 })
  }
  // 填充收藏计数
  const countMap = new Map()
  favoriteStore.favoriteList.forEach(f => {
    const fd = dayjs(f.createdAt).format('YYYY-MM-DD')
    if (fd && fd >= start.format('YYYY-MM-DD') && fd <= end.format('YYYY-MM-DD')) {
      countMap.set(fd, (countMap.get(fd) || 0) + 1)
    }
  })
  days.forEach(d => {
    d.count = countMap.get(d.date) || 0
  })
  const max = Math.max(...days.map(d => d.count), 1)
  dateRangeLabel.value = `${start.format('MM/DD')} - ${end.format('MM/DD')}`
  return { days, max }
})
const heatmapDaysList = computed(() => heatmapDays.value.days)
const maxCount = computed(() => heatmapDays.value.max)

// 按周分组显示
const heatmapWeeks = computed(() => {
  const weeks = []
  let week = []
  for (let i = 0; i < heatmapDaysList.value.length; i++) {
    if (i > 0 && heatmapDaysList.value[i].dayOfWeek === 0) {
      weeks.push(week)
      week = []
    }
    week.push(heatmapDaysList.value[i])
  }
  if (week.length > 0) weeks.push(week)
  return weeks
})

function handleHeatClick (day) {
  // 可展示当天收藏详细列表，简化为弹窗
  ElMessage.info(`日期 ${day.date} 有 ${day.count} 次收藏`)
}

// ---------- 看板卡片 ----------
const cardDialogVisible = ref(false)
const isEditing = ref(false)
const editingCardId = ref(null)
const cardFormRef = ref(null)
const cardSaving = ref(false)
const cardForm = ref({
  name: '',
  cardType: '',
  dataSource: '',
  refreshRate: '实时',
  chartType: '数字卡片'
})
const cardRules = {
  name: [{ required: true, message: '请输入卡片名称', trigger: 'blur' }],
  cardType: [{ required: true, message: '请选择指标类型', trigger: 'change' }],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }]
}

// 用户配置卡片列表
const dashboardCards = computed(() => {
  // 从种子来的卡片
  const configs = dashboardConfigStore.dashboardConfigList || []
  return configs.map(cfg => {
    // 计算指标值
    let computedValue = '--'
    if (cfg.cardType === '资产总量') {
      computedValue = dataAssetStore.dataAssetList.length.toLocaleString()
    } else if (cfg.cardType === '质量评分') {
      const scores = detectionStore.detectionResultList.map(r => r.score).filter(Number.isFinite)
      const avg = scores.length > 0 ? (scores.reduce((a,b)=>a+b,0) / scores.length) : 0
      computedValue = avg.toFixed(1) + '%'
    } else if (cfg.cardType === '任务成功率') {
      const logs = executionLogStore.executionLogList
      const total = logs.length
      const succ = logs.filter(l => l.status === '成功').length
      const rate = total > 0 ? (succ / total * 100) : 0
      computedValue = rate.toFixed(1) + '%'
    } else if (cfg.cardType === '服务调用趋势') {
      computedValue = (dataAssetStore.total || dataAssetStore.dataAssetList.length).toLocaleString()
    } else if (cfg.cardType === '增长率') {
      computedValue = '3.2%'
    }
    // 生成sparkline（模拟）
    const sparklineData = '0,5 10,3 20,7 30,4 40,6 50,8 60,5'
    return {
      ...cfg,
      computedValue,
      sparklineData
    }
  })
})
const sortedCards = computed(() => {
  const list = dashboardCards.value.slice()
  list.sort((a, b) => (a.position || 0) - (b.position || 0))
  return list
})

function addCard () {
  isEditing.value = false
  editingCardId.value = null
  cardForm.value = { name: '', cardType: '', dataSource: '', refreshRate: '实时', chartType: '数字卡片' }
  cardDialogVisible.value = true
}

function editCard (card) {
  isEditing.value = true
  editingCardId.value = card.id
  cardForm.value = {
    name: card.settings?.title || '',
    cardType: card.cardType,
    dataSource: card.settings?.dataSource || '',
    refreshRate: card.settings?.refreshRate || '实时',
    chartType: card.settings?.chartType || '数字卡片'
  }
  cardDialogVisible.value = true
}

async function confirmCard () {
  const valid = await cardFormRef.value.validate().catch(() => false)
  if (!valid) return
  cardSaving.value = true
  try {
    const userId = 'user_1001' // 固定用户
    const payload = {
      userId,
      cardType: cardForm.value.cardType,
      position: (dashboardConfigStore.dashboardConfigList.length || 0) + 1,
      timeRange: '本月',
      settings: {
        title: cardForm.value.name,
        showChart: cardForm.value.chartType !== '数字卡片',
        chartType: cardForm.value.chartType,
        dataSource: cardForm.value.dataSource,
        refreshRate: cardForm.value.refreshRate
      }
    }
    if (isEditing.value && editingCardId.value) {
      dashboardConfigStore.update(editingCardId.value, payload)
      ElMessage.success('卡片已更新')
    } else {
      dashboardConfigStore.add(payload)
      ElMessage.success('卡片已添加')
    }
    cardSaving.value = false
    cardDialogVisible.value = false
  } catch (e) {
    cardSaving.value = false
    ElMessage.error('操作失败')
  }
}

async function deleteCard (card) {
  try {
    await ElMessageBox.confirm('确定删除该卡片？', '删除确认', { type: 'warning' })
    dashboardConfigStore.remove(card.id)
    ElMessage.success('卡片已删除')
  } catch {}
}

// ---------- 详情 Drawer ----------
const detailDrawerVisible = ref(false)
const detailCard = ref(null)
const detailSparklinePoints = ref('')
const detailTableData = ref([])
const detailHistory = ref([])
function openDetailDrawer (card) {
  // 如果点击空白区域触发，忽略
  detailCard.value = card
  // 生成示例 trend 点
  const points = Array.from({ length: 12 }, (_, i) => `${i * 10},${20 - Math.random() * 15}`).join(' ')
  detailSparklinePoints.value = points
  // 表格数据
  const sampleData = []
  for (let i = 0; i < 10; i++) {
    sampleData.push({ name: `指标${i+1}`, value: Math.floor(Math.random() * 100) + 1, date: dayjs().subtract(i, 'day').format('YYYY-MM-DD') })
  }
  detailTableData.value = sampleData
  // 历史记录
  const history = detectionStore.detectionResultList.slice(0, 10).map(r => ({ ...r, name: r.ruleId }))
  detailHistory.value = history.length > 0 ? history : [{ id: '1', ruleId: '暂无', status: '', executionTime: '-' }]
  detailDrawerVisible.value = true
}

// ---------- 导出报告 ----------
const exportDialogVisible = ref(false)
const exportFormRef = ref(null)
const exporting = ref(false)
const exportForm = ref({
  name: '',
  format: 'PDF',
  selectedCardIds: []
})
const exportRules = {
  name: [{ required: true, message: '请输入报告名称', trigger: 'blur' }],
  format: [{ required: true, message: '请选择格式', trigger: 'change' }]
}

async function confirmExport () {
  const valid = await exportFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (exportForm.value.selectedCardIds.length === 0) {
    ElMessage.warning('请至少选择一个卡片')
    return
  }
  const selectedCards = sortedCards.value.filter(c => exportForm.value.selectedCardIds.includes(c.id))
  if (selectedCards.length > 10) {
    ElMessage.warning('建议分批导出，仅导出当前选中卡片（最多10张）')
    return
  }
  exporting.value = true
  try {
    const record = {
      userId: 'user_1001',
      module: '首页概览',
      fileName: exportForm.value.name + '.' + (exportForm.value.format === 'PDF' ? 'pdf' : 'xlsx'),
      fileSize: Math.floor(Math.random() * 500000) + 100000,
      status: '生成中',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    exportRecordStore.add(record)
    ElMessage.success('报告生成中，将在后台完成后自动下载')
    exportDialogVisible.value = false
    exportForm.value = { name: '', format: 'PDF', selectedCardIds: [] }
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// ---------- 最新动态 ----------
const recentLogs = computed(() => {
  const logs = executionLogStore.executionLogList.slice()
  logs.sort((a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf())
  return logs.slice(0, 6)
})
function truncate (text, len) {
  return text && text.length > len ? text.substring(0, len) + '...' : text
}

// ---------- ECharts ----------
const lineChartRef = ref(null)
const pieChartRef = ref(null)
let lineChartInstance = null
let pieChartInstance = null

function initCharts () {
  if (!lineChartRef.value || !pieChartRef.value) return
  // 折线图：检测评分趋势
  const detectData = detectionStore.detectionResultList
    .filter(d => d.executionTime && Number.isFinite(d.score))
    .slice(0, 20)
    .sort((a, b) => dayjs(a.executionTime) - dayjs(b.executionTime))
  const lineOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: detectData.map(d => dayjs(d.executionTime).format('MM-DD')),
      axisLabel: { rotate: 30 }
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{
      name: '质量评分',
      type: 'line',
      data: detectData.map(d => d.score),
      smooth: true,
      lineStyle: { color: 'var(--page-primary)' },
      areaStyle: { color: 'rgba(37,99,235,0.1)' }
    }]
  }
  if (!lineChartInstance) {
    lineChartInstance = echarts.init(lineChartRef.value)
  }
  lineChartInstance.setOption(lineOption, true)

  // 饼图：资产类别分布
  const domainCount = {}
  dataAssetStore.dataAssetList.forEach(a => {
    if (a.domain) {
      domainCount[a.domain] = (domainCount[a.domain] || 0) + 1
    }
  })
  const pieData = Object.entries(domainCount).map(([name, value]) => ({ name, value }))
  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['30%', '60%'],
      data: pieData,
      label: { show: false },
      emphasis: { label: { show: true } },
      itemStyle: {
        borderRadius: 4,
        borderColor: '#1e293b',
        borderWidth: 2
      }
    }]
  }
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }
  pieChartInstance.setOption(pieOption, true)
}

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})

// 响应式调整（略）
</script>

<style scoped lang="scss">
@use './Dashboard.scss' as *;
</style>