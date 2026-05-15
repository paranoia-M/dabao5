<template>
  <div class="page-production_overview">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="tempDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
      />
      <el-select
        v-model="tempSelectedLine"
        placeholder="全部产线"
        clearable
        size="default"
        style="width:200px"
      >
        <el-option
          v-for="pl in productionLineStore.productionLineList"
          :key="pl.id"
          :label="pl.name"
          :value="pl.id"
        />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="handleExport">导出总览报表</el-button>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <el-card class="kpi-card" shadow="hover">
        <div class="kpi-value">{{ linesRunning }}</div>
        <div class="kpi-label">运行生产线</div>
      </el-card>
      <el-card class="kpi-card alarm" shadow="hover">
        <div class="kpi-value">{{ todayAlarms }}</div>
        <div class="kpi-label">当日报警数</div>
      </el-card>
      <el-card class="kpi-card inspect" shadow="hover">
        <div class="kpi-value">{{ completedInspectionsToday }}</div>
        <div class="kpi-label">今日完成检测</div>
      </el-card>
    </div>

    <!-- 主舞台：左侧拓扑图 + 右侧折线图 -->
    <div class="main-content">
      <div class="topology-section">
        <h3 class="section-title">生产线状态拓扑图</h3>
        <div class="topology-svg-wrapper">
          <svg
            :width="svgWidth"
            :height="svgHeight"
            viewBox="0 0 800 400"
            class="topology-svg"
          >
            <!-- 连接线 -->
            <g v-for="(line, index) in filteredLines" :key="'line-' + line.id">
              <line
                v-if="index < filteredLines.length - 1 && (index + 1) % 4 !== 0"
                :x1="getCenterX(index)"
                :y1="getCenterY(index)"
                :x2="getCenterX(index + 1)"
                :y2="getCenterY(index + 1)"
                stroke="#9ca3af"
                stroke-width="2"
                stroke-dasharray="4,2"
                class="connect-line"
              />
            </g>
            <!-- 产线矩形 -->
            <g
              v-for="(line, index) in filteredLines"
              :key="'rect-' + line.id"
              class="line-node"
              @mouseenter="hoveredLine = line"
              @mouseleave="hoveredLine = null"
              @click="goToLine(line.id)"
            >
              <rect
                :x="getX(index)"
                :y="getY(index)"
                width="140"
                height="80"
                :fill="statusColor(line.status)"
                rx="6"
                class="line-rect"
              />
              <text
                :x="getX(index) + 70"
                :y="getY(index) + 32"
                text-anchor="middle"
                fill="#fff"
                font-size="14"
                font-weight="600"
                class="line-text"
              >{{ line.name }}</text>
              <text
                :x="getX(index) + 70"
                :y="getY(index) + 55"
                text-anchor="middle"
                fill="#fff"
                font-size="12"
                opacity="0.9"
              >{{ line.status }} · {{ line.location }}</text>
            </g>
          </svg>
          <!-- hover 浮层 -->
          <div
            v-if="hoveredLine"
            class="hover-tooltip"
            :style="{ left: '20px', top: svgHeight - 40 + 'px' }"
          >
            <p><strong>{{ hoveredLine.name }}</strong></p>
            <p>负责人：{{ hoveredLine.manager }}</p>
            <p>描述：{{ hoveredLine.description }}</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h3 class="section-title">报警趋势</h3>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 报警列表 -->
    <div class="alarm-list-section">
      <h3 class="section-title">报警列表</h3>
      <el-table
        :data="pagedAlarms"
        stripe
        style="width:100%"
        :default-sort="{ prop: 'triggerTime', order: 'descending' }"
      >
        <el-table-column prop="alarmType" label="报警类型" width="120" />
        <el-table-column prop="severity" label="严重程度" width="90">
          <template #default="{ row }">
            <el-tag :type="severityTag(row.severity)" size="small">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="triggerTime" label="触发时间" width="160" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDetailDrawer(row)">详情</el-button>
            <el-button
              :type="row.status === '未处理' ? 'warning' : 'info'"
              size="small"
              :disabled="row.status !== '未处理'"
              @click="handleConfirm(row)"
            >
              {{ row.status === '未处理' ? '确认' : '已确认' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="filteredAlarms.length > 20"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredAlarms.length"
        layout="prev, pager, next"
        class="pagination"
      />
      <el-empty v-else-if="filteredAlarms.length === 0" description="暂无报警数据" />
    </div>

    <!-- 导出成功提示 -->
    <el-alert
      v-if="exportSuccess"
      type="success"
      title="报表导出成功，已开始下载"
      show-icon
      :closable="true"
      class="export-alert"
      @close="exportSuccess = false"
    />

    <!-- 报警详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="报警详情"
      size="30%"
      :before-close="() => { drawerVisible = false }"
    >
      <el-descriptions :column="1" border v-if="detailItem">
        <el-descriptions-item label="报警类型">{{ detailItem.alarmType }}</el-descriptions-item>
        <el-descriptions-item label="产线">{{ getLineNameByEquipment(detailItem.equipmentId) }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ getEquipmentName(detailItem.equipmentId) }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="severityTag(detailItem.severity)" size="small">{{ detailItem.severity }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailItem.description }}</el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ detailItem.triggerTime }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="statusTag(detailItem.status)" size="small">{{ detailItem.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailItem.handler || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理方式">{{ detailItem.handleMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detailItem.handledTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailItem.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductionLineStore } from '@/stores/productionLine'
import { useEquipmentStore } from '@/stores/equipment'
import { useAlarmRecordStore } from '@/stores/alarmRecord'
import { useInspectionTaskStore } from '@/stores/inspectionTask'

const productionLineStore = useProductionLineStore()
const equipmentStore = useEquipmentStore()
const alarmRecordStore = useAlarmRecordStore()
const inspectionTaskStore = useInspectionTaskStore()

// ── 筛选状态 ──
const tempDateRange = ref([])
const tempSelectedLine = ref('')
const dateRange = ref([])
const selectedLine = ref('')

function handleQuery() {
  dateRange.value = tempDateRange.value.map(d => (d instanceof Date ? d.toISOString().slice(0, 10) : d))
  selectedLine.value = tempSelectedLine.value
}

// ── 计算属性 ──
const filteredLines = computed(() => {
  let list = productionLineStore.productionLineList
  if (selectedLine.value) {
    list = list.filter(pl => pl.id === selectedLine.value)
  }
  return list
})

const filteredAlarms = computed(() => {
  let list = alarmRecordStore.alarmRecordList
  if (selectedLine.value) {
    const equipIds = equipmentStore.equipmentList
      .filter(eq => eq.productionLineId === selectedLine.value)
      .map(eq => eq.id)
    list = list.filter(al => equipIds.includes(al.equipmentId))
  }
  if (dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(al => {
      const t = new Date(al.triggerTime).getTime()
      return t >= start && t < end
    })
  }
  return list
})

const linesRunning = computed(() => filteredLines.value.filter(pl => pl.status === '运行中').length)

const todayAlarms = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return filteredAlarms.value.filter(al => al.triggerTime.startsWith(today)).length
})

const completedInspectionsToday = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return inspectionTaskStore.inspectionTaskList.filter(
    t => t.status === '已完成' && t.planTime.startsWith(today)
  ).length
})

// ── ECharts ──
const chartRef = ref(null)
let chartInstance = null

function buildChartOption() {
  const dayMap = {}
  filteredAlarms.value.forEach(al => {
    const day = al.triggerTime.slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + 1
  })
  const sortedDays = Object.keys(dayMap).sort()
  const xData = sortedDays.length ? sortedDays : ['暂无数据']
  const yData = sortedDays.map(d => dayMap[d])
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11 }
    },
    series: [{
      data: yData,
      type: 'line',
      smooth: true,
      lineStyle: { color: '#2563EB', width: 2 },
      areaStyle: { color: 'rgba(37,99,235,0.15)' },
      markPoint: { data: [{ type: 'max', name: '最大值' }] }
    }]
  }
}

function resizeChart() {
  chartInstance && chartInstance.resize()
}

watch(filteredAlarms, () => {
  if (chartInstance) {
    chartInstance.setOption(buildChartOption(), true)
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chartInstance = echarts.init(chartRef.value)
      chartInstance.setOption(buildChartOption())
      window.addEventListener('resize', resizeChart)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance && chartInstance.dispose()
})

// ── SVG 拓扑图 ──
const hoveredLine = ref(null)
const itemWidth = 160
const itemHeight = 100
const cols = 4

const svgWidth = 800
const svgHeight = 400

function getX(index) {
  return (index % cols) * itemWidth + 20
}
function getY(index) {
  return Math.floor(index / cols) * itemHeight + 20
}
function getCenterX(index) {
  return getX(index) + 70
}
function getCenterY(index) {
  return getY(index) + 40
}
function statusColor(status) {
  const map = { '运行中': '#0D9488', '停机': '#DC2626', '待维护': '#D97706' }
  return map[status] || '#6B7280'
}

function goToLine(id) {
  ElMessage.info(`跳转到产线 ${id} 详情（模拟）`)
}

// ── 报警列表分页 ──
const currentPage = ref(1)
const pageSize = 20
const pagedAlarms = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAlarms.value.slice(start, start + pageSize)
})
watch(filteredAlarms, () => { currentPage.value = 1 })

// ── 辅助函数 ──
function severityTag(severity) {
  const map = { '低级': 'info', '中级': 'warning', '高级': 'danger', '紧急': 'danger' }
  return map[severity] || 'info'
}
function statusTag(status) {
  const map = { '未处理': 'danger', '已确认': 'warning', '已处理': 'success' }
  return map[status] || 'info'
}

function getEquipmentName(equipmentId) {
  const eq = equipmentStore.equipmentList.find(e => e.id === equipmentId)
  return eq ? eq.name : '-'
}
function getLineNameByEquipment(equipmentId) {
  const eq = equipmentStore.equipmentList.find(e => e.id === equipmentId)
  if (!eq) return '-'
  const line = productionLineStore.productionLineList.find(pl => pl.id === eq.productionLineId)
  return line ? line.name : '-'
}

// ── 报警操作 ──
const drawerVisible = ref(false)
const detailItem = ref(null)

function openDetailDrawer(alarm) {
  detailItem.value = alarm
  drawerVisible.value = true
}

function handleConfirm(alarm) {
  ElMessageBox.confirm('确定处理该报警？', '确认处理', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    alarmRecordStore.update(alarm.id, {
      status: '已确认',
      handler: '管理员',
      handledTime: new Date().toISOString()
    })
    ElMessage.success('报警已确认')
  }).catch(() => {})
}

function handleDelete(alarm) {
  ElMessageBox.confirm('确定删除该报警记录？删除后不可恢复', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    alarmRecordStore.remove(alarm.id)
    ElMessage.success('报警已删除')
  }).catch(() => {})
}

// ── 导出 ──
const exportSuccess = ref(false)

function handleExport() {
  if (filteredAlarms.value.length === 0 &&
      linesRunning.value === 0 &&
      todayAlarms.value === 0 &&
      completedInspectionsToday.value === 0) {
    ElMessage.warning('当前条件下无数据可导出')
    return
  }
  // 模拟导出
  exportSuccess.value = true
  setTimeout(() => { exportSuccess.value = false }, 5000)
}
</script>

<style scoped lang="scss">
@use './LineDashboard.scss' as *;
</style>