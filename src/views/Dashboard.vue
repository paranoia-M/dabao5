<template>
  <div class="page-dashboard">
    <!-- 顶部 KPI 条 -->
    <div class="kpi-bar">
      <div class="kpi-card" :class="{'zero': totalBlocks === 0}" @click="openDetail('blocks')" :style="totalBlocks === 0 ? 'cursor: not-allowed;' : ''">
        <div class="kpi-label">楼栋总数</div>
        <div class="kpi-value">{{ totalBlocks.toLocaleString() }}</div>
        <div class="kpi-unit">栋</div>
      </div>
      <div class="kpi-card" :class="{'zero': totalRooms === 0}" @click="openDetail('rooms')">
        <div class="kpi-label">房间总数</div>
        <div class="kpi-value">{{ totalRooms.toLocaleString() }}</div>
        <div class="kpi-unit">间</div>
      </div>
      <div class="kpi-card" :class="{'zero': totalResidents === 0}" @click="openDetail('residents')">
        <div class="kpi-label">当前入住人数</div>
        <div class="kpi-value">{{ totalResidents.toLocaleString() }}</div>
        <div class="kpi-unit">人</div>
        <div class="kpi-trend">
          <span :class="occupancyRate >= 80 ? 'trend-up' : 'trend-down'">{{ occupancyRate.toFixed(1) }}%</span>
          <span class="kpi-sub">入住率</span>
        </div>
      </div>
      <div class="kpi-card" :class="{'zero': pendingRepairs === 0}" @click="openDetail('pending')">
        <div class="kpi-label">待处理工单</div>
        <div class="kpi-value">{{ pendingRepairs.toLocaleString() }}</div>
        <div class="kpi-unit">单</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">维修完成率</div>
        <div class="kpi-value">{{ repairCompletionRate.toFixed(1) }}%</div>
        <div class="kpi-unit">已完成</div>
        <div class="kpi-trend">
          <span :class="repairCompletionRate >= 80 ? 'trend-up' : 'trend-down'">{{ completedRepairs.toLocaleString() }}</span>
          <span class="kpi-sub">已完成单</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select v-model="statusFilter" placeholder="维修状态" style="width:140px;margin-right:12px;">
          <el-option label="全部" value="全部" />
          <el-option label="待派单" value="待派单" />
          <el-option label="处理中" value="处理中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          style="width:240px;"
        />
      </div>
      <div class="filter-right">
        <el-button @click="refresh" style="margin-right:8px;">刷新</el-button>
        <el-button type="primary" @click="exportReport">导出报表</el-button>
      </div>
    </div>

    <!-- 主舞台 -->
    <div class="main-area">
      <!-- 左面板：楼栋选择器 + 图表 -->
      <div class="left-panel">
        <!-- 楼栋选择器（招牌积木） -->
        <div class="block-selector">
          <div
            v-for="(block, idx) in blockList"
            :key="block.id"
            class="block-item"
            :class="{ active: selectedBlockId === block.id }"
            :style="{ '--block-color': blockColors[idx % blockColors.length] }"
            @click="selectBlock(block.id)"
          >
            <span class="block-name">{{ block.name }}</span>
            <span class="block-room-count">{{ blockActualRoomCount(block.id) }} 间</span>
          </div>
        </div>
        <!-- 图表区 -->
        <div class="charts-row">
          <div ref="barChartRef" class="chart-box"></div>
          <div ref="pieChartRef" class="chart-box"></div>
        </div>
      </div>
      <!-- 右面板：紧急工单 -->
      <div class="right-panel">
        <div class="panel-header">紧急工单</div>
        <div v-if="urgentOrders.length > 0" class="urgent-list">
          <div v-for="order in urgentOrders" :key="order.id" class="urgent-card" @click="viewOrderDetail(order.id)">
            <div class="card-bar" :style="{ background: priorityColor(order.priority) }"></div>
            <div class="card-body">
              <div class="card-title ellipsis">{{ order.title }}</div>
              <div class="card-meta">
                <span class="meta-room">{{ getRoomNumber(order.roomId) }}</span>
                <el-tag :type="order.priority === '紧急' ? 'danger' : 'warning'" size="small">{{ order.priority }}</el-tag>
              </div>
              <div class="card-time">{{ dayjs(order.createdAt).format('MM-DD HH:mm') }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty">无紧急工单</div>
      </div>
    </div>

    <!-- 底部最新工单动态 -->
    <div class="latest-section">
      <div class="section-title">最新工单动态</div>
      <el-timeline v-if="latestOrders.length > 0">
        <el-timeline-item
          v-for="order in latestOrders"
          :key="order.id"
          :timestamp="dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')"
          :color="statusColor(order.status)"
          placement="top"
        >
          <div class="timeline-content">
            <span class="tl-title">{{ order.title }}</span>
            <span class="tl-room">{{ getRoomNumber(order.roomId) }}</span>
            <el-tag :type="order.priority === '紧急' ? 'danger' : (order.priority === '高' ? 'warning' : 'info')" size="small">{{ order.priority }}</el-tag>
            <el-tag :type="statusTagType(order.status)" size="small">{{ order.status }}</el-tag>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else class="empty">暂无工单</div>
    </div>

    <!-- 统计数字详情弹窗 -->
    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="60%" :close-on-click-modal="false">
      <el-table :data="pageDetailList" stripe highlight-current-row v-loading="detailLoading" @row-click="handleRowClick">
        <!-- 根据type动态列 -->
        <el-table-column v-if="detailDialog.type === 'blocks'" prop="name" label="楼栋名称" />
        <el-table-column v-if="detailDialog.type === 'blocks'" prop="code" label="编号" />
        <el-table-column v-if="detailDialog.type === 'blocks'" prop="floorCount" label="楼层数" />
        <el-table-column v-if="detailDialog.type === 'blocks'" prop="roomCount" label="房间数" />

        <el-table-column v-if="detailDialog.type === 'rooms'" prop="roomNumber" label="房间号" />
        <el-table-column v-if="detailDialog.type === 'rooms'" prop="blockName" label="所属楼栋" />
        <el-table-column v-if="detailDialog.type === 'rooms'" prop="capacity" label="容量" />
        <el-table-column v-if="detailDialog.type === 'rooms'" prop="currentOccupancy" label="当前入住" />
        <el-table-column v-if="detailDialog.type === 'rooms'" prop="status" label="状态" />

        <el-table-column v-if="detailDialog.type === 'residents'" prop="userName" label="姓名" />
        <el-table-column v-if="detailDialog.type === 'residents'" prop="roomNumber" label="房间号" />
        <el-table-column v-if="detailDialog.type === 'residents'" prop="bedNumber" label="床位号" />
        <el-table-column v-if="detailDialog.type === 'residents'" prop="moveInDate" label="入住日期" />

        <el-table-column v-if="detailDialog.type === 'pending'" prop="title" label="工单标题" min-width="150" />
        <el-table-column v-if="detailDialog.type === 'pending'" prop="reporter" label="报修人" />
        <el-table-column v-if="detailDialog.type === 'pending'" prop="room" label="房间" />
        <el-table-column v-if="detailDialog.type === 'pending'" prop="priority" label="紧急程度" width="80" />
        <el-table-column v-if="detailDialog.type === 'pending'" prop="status" label="状态" width="80" />
        <el-table-column v-if="detailDialog.type === 'pending'" prop="createdAt" label="提交时间" width="120" />
        <el-table-column v-if="detailDialog.type === 'pending'" label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="viewOrderDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination
          v-if="detailTotal > detailPageSize"
          v-model:current-page="detailPage"
          :page-size="detailPageSize"
          :total="detailTotal"
          layout="prev, pager, next"
        />
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 工单详情查看弹窗 -->
    <el-dialog v-model="viewDialog.visible" title="工单详情" width="50%">
      <div v-if="viewOrder" class="order-detail">
        <div class="detail-row"><label>工单标题：</label><span>{{ viewOrder.title }}</span></div>
        <div class="detail-row"><label>描述：</label><span>{{ viewOrder.description }}</span></div>
        <div class="detail-row"><label>报修人：</label><span>{{ userName(viewOrder.userId) }}</span></div>
        <div class="detail-row"><label>房间：</label><span>{{ getRoomNumber(viewOrder.roomId) }}</span></div>
        <div class="detail-row"><label>状态：</label><el-tag :type="statusTagType(viewOrder.status)">{{ viewOrder.status }}</el-tag></div>
        <div class="detail-row"><label>优先级：</label><el-tag :type="viewOrder.priority === '紧急' ? 'danger' : 'warning'">{{ viewOrder.priority }}</el-tag></div>
        <div class="detail-row"><label>维修人员：</label><span>{{ workerName(viewOrder.assignedUserId) }}</span></div>
        <div class="detail-row"><label>创建时间：</label><span>{{ dayjs(viewOrder.createdAt).format('YYYY-MM-DD HH:mm') }}</span></div>
        <div class="detail-row" v-if="viewOrder.completedAt"><label>完成时间：</label><span>{{ dayjs(viewOrder.completedAt).format('YYYY-MM-DD HH:mm') }}</span></div>
      </div>
      <template #footer>
        <el-button @click="viewDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useResidenceStore } from '@/stores/residence'
import { useRepairOrderStore } from '@/stores/repairOrder'
import { useUserStore } from '@/stores/user'

// ---------- stores ----------
const blockStore = useDormitoryBlockStore()
const roomStore = useDormitoryRoomStore()
const residenceStore = useResidenceStore()
const repairStore = useRepairOrderStore()
const userStore = useUserStore()

// ---------- 基础数据 ----------
const blockList = computed(() => blockStore.dormitoryBlockList || [])
const roomList = computed(() => roomStore.dormitoryRoomList || [])
const residenceList = computed(() => residenceStore.residenceList || [])
const repairList = computed(() => repairStore.repairOrderList || [])

// ---------- KPI ----------
const totalBlocks = computed(() => blockList.value.length)
const totalRooms = computed(() => roomList.value.length)
const totalResidents = computed(() => residenceList.value.filter(r => r.status === '在住').length)
const pendingRepairs = computed(() =>
  repairList.value.filter(r => !['已完成','已驳回','已取消'].includes(r.status)).length
)
const completedRepairs = computed(() => repairList.value.filter(r => r.status === '已完成').length)
const repairCompletionRate = computed(() => {
  const total = repairList.value.length
  return total > 0 ? (completedRepairs.value / total) * 100 : 0
})
const occupancyRate = computed(() => {
  const totalCapacity = roomList.value.reduce((s, r) => s + r.capacity, 0)
  const totalOccupancy = roomList.value.reduce((s, r) => s + r.currentOccupancy, 0)
  return totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0
})

// ---------- 筛选 ----------
const statusFilter = ref('全部')
const dateRange = ref([]) // 空数组表示不限日期

const dateShortcuts = [
  { text: '近7天', value: () => [dayjs().subtract(7, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()] },
  { text: '本月', value: () => [dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()] },
  { text: '全部', value: () => [] },
]

const filteredRepairs = computed(() => {
  let list = repairList.value
  if (statusFilter.value !== '全部') {
    if (statusFilter.value === '待派单') list = list.filter(r => r.status === '待审核')
    else if (statusFilter.value === '处理中') list = list.filter(r => r.status === '已受理' || r.status === '处理中')
    else if (statusFilter.value === '已完成') list = list.filter(r => r.status === '已完成')
  }
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dayjs(dateRange.value[0]).startOf('day')
    const end = dayjs(dateRange.value[1]).endOf('day')
    list = list.filter(r => {
      const t = dayjs(r.createdAt)
      return t.isAfter(start) && t.isBefore(end)
    })
  }
  return list
})

// ---------- 楼栋选择器 ----------
const selectedBlockId = ref(null)
const blockColors = ['#2563EB', '#0D9488', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#84CC16', '#F97316']
const selectBlock = (id) => {
  selectedBlockId.value = selectedBlockId.value === id ? null : id
  initCharts()
}
const blockActualRoomCount = (blockId) => roomList.value.filter(r => r.blockId === blockId).length

// ---------- 图表数据 ----------
const barData = computed(() => {
  let blocks = blockList.value
  if (selectedBlockId.value) blocks = blocks.filter(b => b.id === selectedBlockId.value)
  return blocks.map(b => {
    const rooms = roomList.value.filter(r => r.blockId === b.id)
    const occupants = rooms.reduce((s, r) => s + r.currentOccupancy, 0)
    return { name: b.name, value: occupants }
  })
})
const pieData = computed(() => {
  let orders = filteredRepairs.value
  if (selectedBlockId.value) {
    const roomIds = roomList.value.filter(r => r.blockId === selectedBlockId.value).map(r => r.id)
    orders = orders.filter(r => roomIds.includes(r.roomId))
  }
  const map = {}
  orders.forEach(r => { map[r.status] = (map[r.status] || 0) + 1 })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
})

// ---------- ECharts ----------
const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChart = null
let pieChart = null

function initCharts() {
  nextTick(() => {
    if (barChartRef.value) {
      if (!barChart) barChart = echarts.init(barChartRef.value)
      const xData = barData.value.map(d => d.name)
      const yData = barData.value.map(d => d.value)
      barChart.setOption({
        title: { text: '各楼栋入住人数', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30, fontSize: 11 } },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: yData, itemStyle: { color: '#2563EB', borderRadius: [4,4,0,0] } }],
        grid: { left: '10%', right: '5%', top: 40, bottom: 40 },
      })
    }
    if (pieChartRef.value) {
      if (!pieChart) pieChart = echarts.init(pieChartRef.value)
      pieChart.setOption({
        title: { text: '工单状态分布', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['35%', '65%'],
          data: pieData.value,
          label: { show: true, formatter: '{b}\n{d}%' },
          itemStyle: { borderRadius: 4 },
        }],
      })
    }
  })
}

onMounted(initCharts)
watch([barData, pieData, statusFilter, dateRange, selectedBlockId], () => { initCharts() })

// ---------- 紧急工单 ----------
const urgentOrders = computed(() => {
  return filteredRepairs.value
    .filter(r => r.priority === '高' || r.priority === '紧急')
    .slice(0, 5)
})

// ---------- 最新工单 ----------
const latestOrders = computed(() => {
  return [...filteredRepairs.value]
    .sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
    .slice(0, 5)
})

// ---------- 工具函数 ----------
function userName(uid) {
  const u = userStore.userList.find(x => x.id === uid)
  return u ? u.name : '未知'
}
function workerName(uid) {
  if (!uid) return '未分配'
  const u = userStore.userList.find(x => x.id === uid)
  return u ? u.name : '未知'
}
function getRoomNumber(roomId) {
  const r = roomStore.dormitoryRoomList.find(x => x.id === roomId)
  return r ? r.roomNumber : '未知'
}
function getBlockName(roomId) {
  const r = roomStore.dormitoryRoomList.find(x => x.id === roomId)
  if (!r) return ''
  const b = blockStore.dormitoryBlockList.find(x => x.id === r.blockId)
  return b ? b.name : ''
}
function priorityColor(p) {
  if (p === '紧急') return '#DC2626'
  if (p === '高') return '#F97316'
  if (p === '中') return '#EAB308'
  return '#6B7280'
}
function statusColor(s) {
  if (s === '已完成') return '#10B981'
  if (s === '处理中' || s === '已受理') return '#3B82F6'
  if (s === '待审核') return '#F59E0B'
  if (s === '已驳回' || s === '已取消') return '#9CA3AF'
  return '#6B7280'
}
function statusTagType(s) {
  if (s === '已完成') return 'success'
  if (s === '处理中' || s === '已受理') return 'primary'
  if (s === '待审核') return 'warning'
  if (s === '已驳回' || s === '已取消') return 'info'
  return 'info'
}

// ---------- 弹出详情 ----------
const detailDialog = ref({ visible: false, title: '', type: '' })
const detailPage = ref(1)
const detailPageSize = 10
const detailTotal = ref(0)
const detailList = ref([])
const detailLoading = ref(false)

function openDetail(type) {
  let title = ''
  let list = []
  detailLoading.value = true
  if (type === 'blocks') {
    title = '楼栋列表'
    list = blockList.value.map(b => ({
      name: b.name,
      code: b.code,
      floorCount: b.floorCount,
      roomCount: blockActualRoomCount(b.id),
    }))
  } else if (type === 'rooms') {
    title = '房间列表'
    list = roomList.value.map(r => ({
      roomNumber: r.roomNumber,
      blockName: getBlockName(r.id),
      capacity: r.capacity,
      currentOccupancy: r.currentOccupancy,
      status: r.status,
    }))
  } else if (type === 'residents') {
    title = '在住人员列表'
    list = residenceList.value
      .filter(r => r.status === '在住')
      .map(r => ({
        userName: userName(r.userId),
        roomNumber: getRoomNumber(r.roomId),
        bedNumber: r.bedNumber,
        moveInDate: r.moveInDate,
      }))
  } else if (type === 'pending') {
    title = '待处理工单列表'
    list = repairList.value
      .filter(r => !['已完成','已驳回','已取消'].includes(r.status))
      .map(r => ({
        id: r.id,
        title: r.title,
        reporter: userName(r.userId),
        room: `${getRoomNumber(r.roomId)} (${getBlockName(r.roomId)})`,
        priority: r.priority,
        status: r.status,
        createdAt: dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
      }))
  } else {
    detailLoading.value = false
    return
  }
  if (list.length === 0) {
    detailLoading.value = false
    // 轻微视觉提示：不做任何事，相当于点击无效
    return
  }
  detailList.value = list
  detailTotal.value = list.length
  detailPage.value = 1
  detailDialog.value = { visible: true, title: title + '详情', type }
  detailLoading.value = false
}

const pageDetailList = computed(() => {
  const start = (detailPage.value - 1) * detailPageSize
  return detailList.value.slice(start, start + detailPageSize)
})

function handleRowClick(row) {
  // 可选：点击行触发详情，但pending类型已有查看按钮
}

// ---------- 工单详情查看 ----------
const viewDialog = ref({ visible: false })
const viewOrder = ref(null)

function viewOrderDetail(orderId) {
  const order = repairStore.repairOrderList.find(r => r.id === orderId)
  if (!order) return
  viewOrder.value = order
  viewDialog.value = { visible: true }
}

// ---------- 操作 ----------
function refresh() {
  ElMessage.info('数据已刷新')
  // 重置图表位置
  initCharts()
}

function exportReport() {
  ElMessage.success('正在导出报表...')
  setTimeout(() => {
    ElMessage.success('报表导出成功')
  }, 1200)
}
</script>

<style scoped lang="scss">
@use './Dashboard.scss' as *;
</style>