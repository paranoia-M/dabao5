<template>
  <div class="page-real_time_monitor">
    <!-- 顶栏 -->
    <div class="topbar">
      <div class="topbar-title">食品生产线智能监控</div>
      <div class="topbar-line">{{ currentLineName }}</div>
      <div class="topbar-clock">{{ now }}</div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索报警描述"
          clearable
          style="width:200px"
        />
        <el-select v-model="filterStatus" placeholder="报警状态" clearable style="width:140px">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="未处理" />
          <el-option label="已确认" value="已确认" />
          <el-option label="已关闭" value="已处理" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width:340px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="warning" @click="handleExport" style="margin-left:auto">导出Excel</el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="main-area">
      <!-- 左侧主舞台：报警瀑布图 -->
      <div class="waterfall-panel">
        <div class="waterfall-header">
          <span class="panel-title">报警时序瀑布图</span>
          <div class="legend">
            <span class="legend-dot dot-low" />低级
            <span class="legend-dot dot-mid" />中级
            <span class="legend-dot dot-high" />高级
            <span class="legend-dot dot-urgent" />紧急
          </div>
        </div>
        <div class="waterfall-body" ref="wfRef" @scroll="onWfScroll">
          <svg
            :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            :width="svgWidth"
            :height="svgHeight"
            class="waterfall-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g v-for="(alarm, index) in filteredAlarms" :key="alarm.id"
               :transform="`translate(0, ${index * rowHeight})`"
               @click="selectAlarm(alarm)"
               class="alarm-bar-g"
               :class="{ selected: selectedAlarm?.id === alarm.id }"
            >
              <rect
                :x="4"
                y="2"
                :width="svgWidth - 8"
                :height="rowHeight - 4"
                :rx="4"
                :fill="severityColor(alarm.severity)"
                fill-opacity=".9"
                stroke="transparent"
                stroke-width="2"
                class="alarm-rect"
                :class="{ 'is-selected': selectedAlarm?.id === alarm.id }"
              />
              <text
                x="14"
                y="22"
                font-size="13"
                fill="#fff"
                font-weight="600"
              >{{ alarm.alarmType }}</text>
              <text
                :x="svgWidth - 160"
                y="22"
                font-size="11"
                fill="#fff"
              >{{ formatTime(alarm.triggerTime) }}</text>
              <text
                x="130"
                y="22"
                font-size="12"
                fill="#fff"
                class="desc-text"
              >{{ truncate(alarm.description, 28) }}</text>
            </g>
          </svg>
        </div>
        <div v-if="filteredAlarms.length === 0" class="empty-hint">
          <el-empty description="暂无比对报警" />
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="side-panel">
        <!-- 统计卡片 -->
        <div class="stat-card">
          <div class="stat-item">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-label">总报警</span>
          </div>
          <div class="stat-item pending">
            <span class="stat-num">{{ pendingCount }}</span>
            <span class="stat-label">待处理</span>
          </div>
          <div class="stat-item confirmed">
            <span class="stat-num">{{ confirmedCount }}</span>
            <span class="stat-label">已确认</span>
          </div>
          <div class="stat-item closed">
            <span class="stat-num">{{ closedCount }}</span>
            <span class="stat-label">已关闭</span>
          </div>
        </div>

        <!-- 详情与操作卡片 -->
        <div class="detail-card" v-if="selectedAlarm">
          <div class="detail-header">
            <span>报警详情</span>
            <el-button link @click="openDetailDrawer">完整详情</el-button>
          </div>
          <div class="detail-body">
            <div class="detail-row">
              <span class="label">设备</span>
              <span class="value">{{ getEquipmentName(selectedAlarm.equipmentId) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">类型</span>
              <span class="value">{{ selectedAlarm.alarmType }}</span>
            </div>
            <div class="detail-row">
              <span class="label">严重程度</span>
              <el-tag :type="severityTag(selectedAlarm.severity)" size="small">{{ selectedAlarm.severity }}</el-tag>
            </div>
            <div class="detail-row">
              <span class="label">状态</span>
              <el-tag :type="statusTag(selectedAlarm.status)" size="small">{{ statusLabel(selectedAlarm.status) }}</el-tag>
            </div>
            <div class="detail-row">
              <span class="label">触发时间</span>
              <span class="value">{{ formatTime(selectedAlarm.triggerTime) }}</span>
            </div>
            <div class="detail-row desc-row">
              <span class="label">描述</span>
              <span class="value">{{ selectedAlarm.description }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="selectedAlarm.status !== '未处理'"
              @click="handleConfirm"
            >确认</el-button>
            <el-button
              type="success"
              size="small"
              :disabled="selectedAlarm.status !== '未处理'"
              @click="handleProcessClick"
            >处理</el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="selectedAlarm.status !== '未处理' || hasRelatedOrder(selectedAlarm)"
              @click="handleDelete"
            >删除</el-button>
          </div>
        </div>
        <div class="detail-card empty-detail" v-else>
          <el-empty description="点击左侧报警查看详情" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 处理弹窗 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理报警"
      width="min(480px,90vw)"
      :close-on-click-modal="false"
      @close="resetProcessForm"
    >
      <el-form :model="processForm" label-width="90px">
        <el-form-item label="处理人" required>
          <el-select v-model="processForm.handler" placeholder="请选择处理人" style="width:100%">
            <el-option
              v-for="emp in employeeList"
              :key="emp"
              :label="emp"
              :value="emp"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理方式" required>
          <el-select v-model="processForm.handleMethod" placeholder="请选择" style="width:100%">
            <el-option label="人工干预" value="人工干预" />
            <el-option label="自动恢复" value="自动恢复" />
            <el-option label="停机检修" value="停机检修" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="processForm.remark" type="textarea" :rows="3" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="报警完整信息"
      size="min(500px,85vw)"
      direction="rtl"
    >
      <template v-if="drawerAlarm">
        <div class="drawer-grid">
          <div class="drawer-item">
            <span class="label">报警编号</span>
            <span class="value">{{ drawerAlarm.id }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">报警类型</span>
            <span class="value">{{ drawerAlarm.alarmType }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">严重程度</span>
            <el-tag :type="severityTag(drawerAlarm.severity)" size="small">{{ drawerAlarm.severity }}</el-tag>
          </div>
          <div class="drawer-item">
            <span class="label">设备</span>
            <span class="value">{{ getEquipmentName(drawerAlarm.equipmentId) }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">当前值</span>
            <span class="value">{{ drawerAlarm.currentValue ?? '—' }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">阈值</span>
            <span class="value">{{ drawerAlarm.threshold ?? '—' }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">触发时间</span>
            <span class="value">{{ formatTime(drawerAlarm.triggerTime) }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">持续时间</span>
            <span class="value">{{ drawerAlarm.duration ?? '—' }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">状态</span>
            <el-tag :type="statusTag(drawerAlarm.status)" size="small">{{ statusLabel(drawerAlarm.status) }}</el-tag>
          </div>
          <div class="drawer-item" v-if="drawerAlarm.handler">
            <span class="label">处理人</span>
            <span class="value">{{ drawerAlarm.handler }}</span>
          </div>
          <div class="drawer-item" v-if="drawerAlarm.handleMethod">
            <span class="label">处理方式</span>
            <span class="value">{{ drawerAlarm.handleMethod }}</span>
          </div>
          <div class="drawer-item" v-if="drawerAlarm.handledTime">
            <span class="label">处理时间</span>
            <span class="value">{{ formatTime(drawerAlarm.handledTime) }}</span>
          </div>
          <div class="drawer-item" v-if="drawerAlarm.remark">
            <span class="label">处理备注</span>
            <span class="value">{{ drawerAlarm.remark }}</span>
          </div>
          <div class="drawer-item full-width">
            <span class="label">建议措施</span>
            <span class="value">{{ getSuggestion(drawerAlarm.alarmType) }}</span>
          </div>
          <div class="drawer-item full-width">
            <span class="label">关联工单</span>
            <span class="value" v-if="relatedOrders.length > 0">
              <el-tag
                v-for="ord in relatedOrders"
                :key="ord.id"
                size="small"
                style="margin-right:4px"
              >{{ ord.id }}</el-tag>
            </span>
            <span class="value" v-else>无</span>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProductionLineStore } from '@/stores/productionLine'
import { useEquipmentStore } from '@/stores/equipment'
import { useAlarmRecordStore } from '@/stores/alarmRecord'
import { useMaintenanceOrderStore } from '@/stores/maintenanceOrder'
import { ElMessage, ElMessageBox } from 'element-plus'

// stores
const productionLineStore = useProductionLineStore()
const equipmentStore = useEquipmentStore()
const alarmRecordStore = useAlarmRecordStore()
const maintenanceOrderStore = useMaintenanceOrderStore()

// 当前产线
const currentLineName = computed(() => {
  const first = productionLineStore.productionLineList[0]
  return first ? first.name : '未选择'
})

// 实时时钟
const now = ref('')
let timer = null
function updateClock() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  now.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})
onUnmounted(() => clearInterval(timer))

// 筛选条件
const keyword = ref('')
const filterStatus = ref('') // '' 表示全部
const dateRange = ref([])    // [Date, Date] 或 null

// 原始报警列表（按时间降序）
const rawAlarms = computed(() => {
  return [...alarmRecordStore.alarmRecordList].sort((a,b) => new Date(b.triggerTime) - new Date(a.triggerTime))
})

// 过滤后的报警
const filteredAlarms = computed(() => {
  let list = rawAlarms.value
  // 关键词
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(a => a.description.toLowerCase().includes(kw))
  }
  // 状态
  if (filterStatus.value) {
    list = list.filter(a => a.status === filterStatus.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0].getTime()
    const end = dateRange.value[1].getTime()
    list = list.filter(a => {
      const t = new Date(a.triggerTime).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

// 统计（基于全部报警）
const totalCount = computed(() => alarmRecordStore.alarmRecordList.length)
const pendingCount = computed(() => alarmRecordStore.alarmRecordList.filter(a => a.status === '未处理').length)
const confirmedCount = computed(() => alarmRecordStore.alarmRecordList.filter(a => a.status === '已确认').length)
const closedCount = computed(() => alarmRecordStore.alarmRecordList.filter(a => a.status === '已处理').length)

// 当前选中
const selectedAlarm = ref(null)
function selectAlarm(alarm) {
  selectedAlarm.value = alarm
}

// 瀑布图配置
const rowHeight = 38
const svgWidth = ref(800) // 动态更新
const svgHeight = computed(() => filteredAlarms.value.length * rowHeight)
const wfRef = ref(null)
function onWfScroll() {
  // 可以留空
}
// 页面resize更新svg宽
onMounted(() => {
  const updateSvgWidth = () => {
    if (wfRef.value) {
      svgWidth.value = wfRef.value.clientWidth - 4
    }
  }
  updateSvgWidth()
  window.addEventListener('resize', updateSvgWidth)
  onUnmounted(() => window.removeEventListener('resize', updateSvgWidth))
})

// 颜色和标签辅助
function severityColor(severity) {
  const map = {
    '低级': '#E6A23C',
    '中级': '#F56C6C',
    '高级': '#C23531',
    '紧急': '#8B0000'
  }
  return map[severity] || '#909399'
}
function severityTag(severity) {
  const map = { '低级': 'warning', '中级': 'danger', '高级': 'danger', '紧急': 'danger' }
  return map[severity] || 'info'
}
function statusTag(status) {
  const map = { '未处理': 'warning', '已确认': 'primary', '已处理': 'success' }
  return map[status] || 'info'
}
function statusLabel(status) {
  const map = { '未处理': '待处理', '已确认': '已确认', '已处理': '已关闭' }
  return map[status] || status
}
function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}
// 获取设备名
function getEquipmentName(equipId) {
  const equip = equipmentStore.equipmentList.find(e => e.id === equipId)
  return equip ? equip.name : equipId
}
// 是否有关联工单
function hasRelatedOrder(alarm) {
  return maintenanceOrderStore.maintenanceOrderList.some(o => o.equipmentId === alarm.equipmentId)
}
// 建议措施
function getSuggestion(type) {
  const map = {
    '温度超限': '检查加热元件、温控器，必要时调整温控参数或更换传感器',
    '异物检出': '停机检查上游工序，清除异物源，加强筛网/磁选检查',
    '设备异常': '立即停止设备，联系维修人员进行故障排查',
    '卫生超标': '启动清洗程序，检查清洁剂浓度和冲洗时间',
    '其他': '根据现场情况判断处理'
  }
  return map[type] || '请根据现场情况处理'
}
// 关联工单列表
const relatedOrders = computed(() => {
  if (!drawerAlarm.value) return []
  return maintenanceOrderStore.maintenanceOrderList.filter(o => o.equipmentId === drawerAlarm.value.equipmentId)
})

// 筛选操作
function handleSearch() {
  // 指令式触发 computed 已更新
  selectedAlarm.value = null
}
function handleReset() {
  keyword.value = ''
  filterStatus.value = ''
  dateRange.value = []
  selectedAlarm.value = null
}

// 确认
function handleConfirm() {
  if (!selectedAlarm.value) return
  const alarm = selectedAlarm.value
  if (alarm.status !== '未处理') {
    ElMessage.info('该报警已处理，不可操作')
    return
  }
  alarmRecordStore.update(alarm.id, { status: '已确认' })
  ElMessage.success('已确认为已确认状态')
}
// 删除
function handleDelete() {
  if (!selectedAlarm.value) return
  const alarm = selectedAlarm.value
  if (alarm.status !== '未处理') {
    ElMessage.info('仅允许删除待处理状态的报警')
    return
  }
  if (hasRelatedOrder(alarm)) {
    ElMessage.warning('该报警已关联工单，不可删除')
    return
  }
  ElMessageBox.confirm('删除后将无法恢复，若已关联工单则不可删除。确定删除？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    alarmRecordStore.remove(alarm.id)
    selectedAlarm.value = null
    ElMessage.success('报警已删除')
  }).catch(() => {})
}
// 处理弹窗
const processDialogVisible = ref(false)
const processForm = ref({
  handler: '',
  handleMethod: '',
  remark: ''
})
const employeeList = ['张伟','李娜','王芳','刘洋','陈静','赵鑫','孙丽','周磊','吴敏','马超']
function handleProcessClick() {
  if (!selectedAlarm.value) return
  const alarm = selectedAlarm.value
  if (alarm.status !== '未处理') {
    ElMessage.info('该报警已处理，不可操作')
    return
  }
  processForm.value = { handler: alarm.handler || '', handleMethod: alarm.handleMethod || '', remark: alarm.remark || '' }
  processDialogVisible.value = true
}
function handleProcessSubmit() {
  if (!processForm.value.handler || !processForm.value.handleMethod) {
    ElMessage.warning('请填写处理人和处理方式')
    return
  }
  if (!selectedAlarm.value) return
  const nowStr = formatTime(new Date().toISOString())
  alarmRecordStore.update(selectedAlarm.value.id, {
    status: '已处理',
    handler: processForm.value.handler,
    handleMethod: processForm.value.handleMethod,
    remark: processForm.value.remark,
    handledTime: nowStr
  })
  processDialogVisible.value = false
  selectedAlarm.value = null
  ElMessage.success('报警已处理')
}
function resetProcessForm() {
  processForm.value = { handler: '', handleMethod: '', remark: '' }
}

// 详情抽屉
const detailDrawerVisible = ref(false)
const drawerAlarm = ref(null)
function openDetailDrawer() {
  drawerAlarm.value = selectedAlarm.value
  detailDrawerVisible.value = true
}

// 导出
function handleExport() {
  const lines = filteredAlarms.value
  if (lines.length === 0) {
    ElMessage.info('当前没有可导出的报警记录')
    return
  }
  // 生成 CSV
  const header = '报警编号,报警类型,严重程度,设备ID,描述,状态,处理人,处理方式,触发时间,处理时间\n'
  const rows = lines.map(a => {
    const fields = [
      a.id,
      a.alarmType,
      a.severity,
      a.equipmentId,
      `"${(a.description||'').replace(/"/g,'""')}"`,
      a.status,
      a.handler || '',
      a.handleMethod || '',
      a.triggerTime,
      a.handledTime || ''
    ]
    return fields.join(',')
  }).join('\n')
  const csv = '\uFEFF' + header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const nowStr = new Date().toISOString().slice(0,19).replace(/[:-]/g,'')
  link.href = url
  link.download = `报警记录_${nowStr}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 响应式调整，保证水fall图宽度正确
onMounted(() => {
  setTimeout(() => {
    if (wfRef.value) {
      svgWidth.value = wfRef.value.clientWidth - 4
    }
  }, 100)
})
</script>

<style scoped lang="scss">
@use './LineMonitor.scss' as *;
</style>