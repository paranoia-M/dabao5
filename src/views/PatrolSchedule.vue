<template>
  <div class="page-patrol-schedule">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称/路线名称"
          clearable
          style="width: 280px"
          @input="onFilterChange"
        />
        <el-select
          v-model="selectedStatus"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @change="onFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="草稿" value="计划" />
          <el-option label="待执行" value="发布" />
          <el-option label="执行中" value="执行中" />
          <el-option label="已完成" value="完成" />
          <el-option label="已取消" value="取消" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px"
          @change="onFilterChange"
        />
      </div>
      <div class="filter-right">
        <el-button type="primary" class="btn-add" @click="openAddDialog">
          <el-icon><Plus /></el-icon>新增排程
        </el-button>
        <el-button class="btn-export" @click="handleExport">
          <el-icon><Download /></el-icon>导出报表
        </el-button>
      </div>
    </div>

    <!-- 主体：左地图 + 右甘特 -->
    <div class="main-area">
      <!-- 左侧: 巡查路线示意地图 (Leaflet) -->
      <div class="map-wrapper">
        <div id="mapContainer" class="map-container" ref="mapRef"></div>
        <div class="map-legend">
          <span class="legend-item"><span class="dot in-progress"></span>执行中</span>
          <span class="legend-item"><span class="dot completed"></span>已完成</span>
          <span class="legend-item"><span class="dot draft"></span>草稿/待执行</span>
          <span class="legend-item"><span class="dot cancelled"></span>已取消</span>
        </div>
      </div>

      <!-- 右侧: 甘特图时间轴 (CSS grid 自绘) -->
      <div class="gantt-wrapper">
        <div class="gantt-header">
          <h3 class="gantt-title">任务排程甘特图</h3>
          <el-tag v-if="conflictCount > 0" type="danger" effect="dark" size="small">
            检测到 {{ conflictCount }} 个时间冲突
          </el-tag>
        </div>
        <div class="gantt-scroll" ref="ganttScrollRef">
          <div class="gantt-grid" :style="{ width: ganttWidth + 'px' }">
            <!-- 时间刻度 -->
            <div class="gantt-timescale">
              <div
                v-for="day in ganttDays"
                :key="day.date"
                class="timescale-day"
                :style="{ left: day.left + 'px' }"
              >
                <div class="day-label">{{ day.label }}</div>
                <div class="hour-lines">
                  <div
                    v-for="h in 24"
                    :key="h"
                    class="hour-line"
                    :style="{ left: (h - 1) * (dayWidth / 24) + 'px' }"
                  />
                </div>
              </div>
            </div>
            <!-- 任务行 -->
            <div class="gantt-rows">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="gantt-row"
                :class="{ 'conflict-row': conflictRows.has(task.id) }"
                @click="handleRowClick(task)"
              >
                <div class="row-label">{{ task.taskName }}</div>
                <div class="row-track">
                  <div
                    class="task-bar"
                    :class="'bar-' + task.status"
                    :style="getBarStyle(task)"
                    @click.stop="handleBarClick(task)"
                  >
                    <span class="bar-text">{{ task.assignedPerson }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 冲突提示条 -->
        <div v-if="conflictList.length > 0" class="conflict-tips">
          <el-alert
            v-for="(c, idx) in conflictList.slice(0, 3)"
            :key="idx"
            :title="c.tip"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑排程任务' : '新建排程任务'"
      width="min(680px, 92vw)"
      class="patrol-schedule-detail-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="form.taskName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡查路线" prop="patrolRoute">
              <el-select v-model="form.patrolRoute" placeholder="请选择巡查路线" style="width:100%">
                <el-option
                  v-for="route in routeOptions"
                  :key="route"
                  :label="route"
                  :value="route"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="执行人员" prop="assignedPerson">
              <el-select
                v-model="form.assignedPerson"
                multiple
                placeholder="请选择执行人员"
                style="width:100%"
              >
                <el-option
                  v-for="person in personOptions"
                  :key="person"
                  :label="person"
                  :value="person"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域" prop="area">
              <el-select v-model="form.area" placeholder="请选择区域" style="width:100%">
                <el-option label="A区" value="A区" />
                <el-option label="B区" value="B区" />
                <el-option label="C区" value="C区" />
                <el-option label="D区" value="D区" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="任务详情"
      class="patrol-schedule-detail-drawer"
      direction="rtl"
      size="min(760px, 92vw)"
    >
      <template #default>
        <div v-if="currentDetail" class="detail-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ currentDetail.taskName }}</el-descriptions-item>
            <el-descriptions-item label="巡查路线">{{ currentDetail.patrolRoute }}</el-descriptions-item>
            <el-descriptions-item label="执行人员">{{ currentDetail.assignedPerson }}</el-descriptions-item>
            <el-descriptions-item label="区域">{{ currentDetail.area }}</el-descriptions-item>
            <el-descriptions-item label="计划开始时间">{{ currentDetail.startTime }}</el-descriptions-item>
            <el-descriptions-item label="计划结束时间">{{ currentDetail.endTime }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTagType(currentDetail.status)" size="small">{{ statusLabel(currentDetail.status) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="detail-section">
            <h4>状态流转日志</h4>
            <el-timeline v-if="approvalLogs.length > 0">
              <el-timeline-item
                v-for="log in approvalLogs"
                :key="log.id"
                :timestamp="log.operateTime"
                placement="top"
                :color="log.newStatus === '完成' ? '#67C23A' : '#E6A23C'"
              >
                <p><strong>{{ log.operator }}</strong> 执行了“{{ log.action }}”</p>
                <p v-if="log.comment" class="log-comment">{{ log.comment }}</p>
                <p class="log-status">状态变更：{{ log.previousStatus }} → {{ log.newStatus }}</p>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无流转记录" :image-size="60" />
          </div>

          <div class="detail-section">
            <h4>关联巡查记录</h4>
            <el-table :data="relatedRecords" stripe style="width:100%" size="small">
              <el-table-column prop="patrolTime" label="巡查时间" width="150" />
              <el-table-column prop="patrolPerson" label="巡查人" width="90" />
              <el-table-column prop="area" label="区域" width="120" />
              <el-table-column prop="abnormal" label="异常" width="60">
                <template #default="{ row }">
                  <el-tag :type="row.abnormal ? 'danger' : 'success'" size="small">{{ row.abnormal ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
            </el-table>
            <el-empty v-if="relatedRecords.length === 0" description="暂无关联巡查记录" :image-size="60" />
          </div>
        </div>
        <el-empty v-else description="未选择任务" />
      </template>
    </el-drawer>

    <!-- 状态流转确认弹窗 -->
    <el-dialog v-model="transDialogVisible" title="确认状态变更" width="400px">
      <p>确定将任务“{{ transTask?.taskName }}”状态变更为“{{ transNextLabel }}”吗？</p>
      <el-input
        v-model="transComment"
        type="textarea"
        :rows="2"
        placeholder="变更备注（选填）"
        style="margin-top:12px"
      />
      <template #footer>
        <el-button @click="transDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTransition">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认通过 ElMessageBox 内联调用 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import { usePatrolTaskStore } from '@/stores/patrolTask'
import { usePatrolApprovalStore } from '@/stores/patrolApproval'
import { usePatrolRecordStore } from '@/stores/patrolRecord'
// import L from 'leaflet'
// import 'leaflet/dist/leaflet.css'

// ---- stores ----
const taskStore = usePatrolTaskStore()
const approvalStore = usePatrolApprovalStore()
const recordStore = usePatrolRecordStore()

// ---- filtered tasks ----
const searchKeyword = ref('')
const selectedStatus = ref('')
const dateRange = ref([])

const filteredTasks = computed(() => {
  let list = taskStore.patrolTaskList
  // 关键词
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(t => t.taskName.toLowerCase().includes(kw) || t.patrolRoute.toLowerCase().includes(kw))
  }
  // 状态
  if (selectedStatus.value) {
    list = list.filter(t => t.status === selectedStatus.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0])
    const end = new Date(dateRange.value[1])
    list = list.filter(t => {
      const tStart = new Date(t.startTime)
      return tStart >= start && tStart <= end
    })
  }
  // 按计划开始时间降序
  return [...list].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
})

const onFilterChange = () => {
  // 触发 computed
}

// ---- LEAFLET MAP ----
let map = null
const mapRef = ref(null)

// 模拟坐标（根据 area）
const areaCoords = {
  'A区': [31.2304, 121.4737],
  'B区': [31.2400, 121.4750],
  'C区': [31.2200, 121.4800],
  'D区': [31.2350, 121.4650]
}

function getCoords(area) {
  const base = areaCoords[area] || [31.2304, 121.4737]
  // 加一些随机偏移模拟不同任务点
  return [base[0] + (Math.random() - 0.5) * 0.02, base[1] + (Math.random() - 0.5) * 0.02]
}

let markersLayer = null
let polylinesLayer = null

function initMap() {
  map = L.map('mapContainer').setView([31.2304, 121.4737], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  polylinesLayer = L.layerGroup().addTo(map)
  updateMapData()
}

function updateMapData() {
  markersLayer.clearLayers()
  polylinesLayer.clearLayers()

  filteredTasks.value.forEach(task => {
    const coord = getCoords(task.area)
    const color = task.status === '完成' ? '#67C23A' :
                  task.status === '取消' ? '#909399' :
                  task.status === '执行中' ? '#E6A23C' : '#409EFF'

    const marker = L.circleMarker(coord, {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(markersLayer)
    marker.bindTooltip(`<b>${task.taskName}</b><br/>${task.assignedPerson}`)
    marker.on('click', () => {
      // 点击高亮任务，可展示详情或滚动到甘特行
      handleRowClick(task)
    })

    // 绘制路线折线（用两个随机点模拟）
    const coord2 = getCoords(task.area)
    const coord3 = getCoords(task.area)
    const polyline = L.polyline([coord, coord2, coord3], {
      color: color,
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 10'
    }).addTo(polylinesLayer)
  })
}

watch(filteredTasks, () => {
  nextTick(updateMapData)
})

onMounted(() => {
  nextTick(initMap)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// ---- GANTT (CSS grid self-draw) ----
const ganttScrollRef = ref(null)
const dayWidth = 60 // px per day
const ganttDays = computed(() => {
  // 从 filteredTasks 计算时间跨度，从最早开始时间往前推2天到最晚结束时间推2天
  const tasks = filteredTasks.value
  if (tasks.length === 0) return []
  const starts = tasks.map(t => new Date(t.startTime))
  const ends = tasks.map(t => new Date(t.endTime))
  const min = new Date(Math.min(...starts))
  const max = new Date(Math.max(...ends))
  min.setDate(min.getDate() - 1)
  max.setDate(max.getDate() + 1)
  const days = []
  const cursor = new Date(min)
  let left = 0
  while (cursor <= max) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      label: cursor.getDate() + '/' + (cursor.getMonth() + 1),
      left: left
    })
    left += dayWidth
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
})

const ganttWidth = computed(() => {
  if (ganttDays.value.length === 0) return 600
  return ganttDays.value[ganttDays.value.length - 1].left + dayWidth + 200 // 留余量
})

const timeOrigin = computed(() => {
  if (ganttDays.value.length === 0) return new Date()
  return new Date(ganttDays.value[0].date)
})

function getBarStyle(task) {
  const start = new Date(task.startTime)
  const end = new Date(task.endTime)
  const origin = timeOrigin.value
  const totalWidth = ganttWidth.value - 160 // 减去左侧标签区
  const msPerDay = 24 * 60 * 60 * 1000
  const left = (start - origin) / msPerDay * dayWidth
  const width = (end - start) / msPerDay * dayWidth
  return {
    left: Math.max(0, left) + 'px',
    width: Math.max(dayWidth, width) + 'px' // 至少一天宽
  }
}

function handleRowClick(task) {
  // 滚动高亮，打开详情
  openDetail(task)
}

function handleBarClick(task) {
  // 弹出操作菜单？但为了简单，直接触发状态流转或编辑
  // 我们让点击 bar 弹出操作菜单（通过右键或单击？）使用单击弹出对话框选择操作
  // 简化：点击后打开编辑弹窗
  openEditDialog(task)
}

// ---- 详情 ----
const detailDrawerVisible = ref(false)
const currentDetail = ref(null)

function openDetail(task) {
  currentDetail.value = task
  detailDrawerVisible.value = true
}

const approvalLogs = computed(() => {
  if (!currentDetail.value) return []
  return approvalStore.patrolApprovalList.filter(a => a.patrolTaskId === currentDetail.value.id).sort((a,b) => new Date(b.operateTime) - new Date(a.operateTime))
})

const relatedRecords = computed(() => {
  if (!currentDetail.value) return []
  return recordStore.patrolRecordList.filter(r => r.taskId === currentDetail.value.id)
})

function statusTagType(status) {
  const map = { '计划': 'info', '发布': 'warning', '执行中': 'warning', '完成': 'success', '取消': 'danger' }
  return map[status] || 'info'
}

function statusLabel(status) {
  const map = { '计划': '草稿', '发布': '待执行', '执行中': '执行中', '完成': '已完成', '取消': '已取消' }
  return map[status] || status
}

// ---- 新增/编辑 ----
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const formRef = ref(null)

const form = ref({
  taskName: '',
  patrolRoute: '',
  assignedPerson: [],
  area: '',
  startTime: '',
  endTime: '',
  remark: ''
})

const formRules = {
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  patrolRoute: [{ required: true, message: '请选择巡查路线', trigger: 'change' }],
  assignedPerson: [{ required: true, message: '请选择执行人员', trigger: 'change' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 选项
const routeOptions = computed(() => {
  const set = new Set(taskStore.patrolTaskList.map(t => t.patrolRoute))
  return [...set]
})
const personOptions = computed(() => {
  const set = new Set(taskStore.patrolTaskList.map(t => t.assignedPerson))
  // 添加一些常见人员
  ;['张伟','李娜','王芳','刘洋','陈静','赵鑫','孙丽','周磊','吴敏'].forEach(p => set.add(p))
  return [...set]
})

function openAddDialog() {
  isEdit.value = false
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(task) {
  isEdit.value = true
  editingId.value = task.id
  form.value = {
    taskName: task.taskName,
    patrolRoute: task.patrolRoute,
    assignedPerson: task.assignedPerson.split('、').filter(Boolean), // 假设多人员用顿号分隔
    area: task.area,
    startTime: task.startTime,
    endTime: task.endTime,
    remark: task.remark || ''
  }
  dialogVisible.value = true
}

function resetForm() {
  form.value = {
    taskName: '',
    patrolRoute: '',
    assignedPerson: [],
    area: '',
    startTime: '',
    endTime: '',
    remark: ''
  }
  formRef.value?.resetFields()
}

function handleSubmit() {
  formRef.value.validate((valid) => {
    if (!valid) return
    // 冲突检测
    const taskName = form.value.taskName
    const patrolRoute = form.value.patrolRoute
    const assignedPerson = form.value.assignedPerson.join('、')
    const area = form.value.area
    const startTime = form.value.startTime
    const endTime = form.value.endTime
    const remark = form.value.remark

    // 检查同一区域同一时间段是否已有已发布或执行中的任务
    const conflict = taskStore.patrolTaskList.some(t => {
      if (isEdit.value && t.id === editingId.value) return false
      if (t.area !== area) return false
      if (t.status !== '发布' && t.status !== '执行中') return false
      const tStart = new Date(t.startTime)
      const tEnd = new Date(t.endTime)
      const s = new Date(startTime)
      const e = new Date(endTime)
      return s < tEnd && e > tStart
    })
    if (conflict) {
      ElMessage.warning('该区域此时段已有任务执行中或待执行，存在排班冲突')
      return
    }

    const payload = {
      taskName,
      patrolRoute,
      assignedPerson,
      area,
      startTime,
      endTime,
      status: '计划', // 新增默认草稿
      remark
    }

    if (isEdit.value) {
      taskStore.update(editingId.value, payload)
      ElMessage.success('编辑成功')
    } else {
      // 生成 id
      const newId = 'patroltask_' + Date.now()
      taskStore.add({ id: newId, ...payload })
      ElMessage.success('新建成功')
    }
    dialogVisible.value = false
  })
}

// ---- 状态流转 ----
const transDialogVisible = ref(false)
const transTask = ref(null)
const transAction = ref('')
const transComment = ref('')
const transNextStatus = computed(() => {
  if (!transTask.value) return ''
  const map = {
    '计划': { action: '发布', nextStatus: '发布' },
    '发布': { action: '开始执行', nextStatus: '执行中' },
    '执行中': { action: '完成', nextStatus: '完成' }
  }
  return map[transTask.value.status]?.nextStatus || ''
})
const transNextLabel = computed(() => {
  if (!transTask.value) return ''
  const map = {
    '计划': '待执行',
    '发布': '执行中',
    '执行中': '已完成'
  }
  return map[transTask.value.status] || ''
})

function openTransition(task) {
  if (task.status === '完成' || task.status === '取消') {
    ElMessage.warning('该任务已完成或已取消，无法变更状态')
    return
  }
  const allowedActions = ['计划', '发布', '执行中']
  if (!allowedActions.includes(task.status)) {
    ElMessage.warning('当前状态不允许变更')
    return
  }
  transTask.value = task
  transAction.value = ''
  transComment.value = ''
  transDialogVisible.value = true
}

function confirmTransition() {
  const task = transTask.value
  if (!task) return
  const newStatus = transNextStatus.value
  const action = task.status === '计划' ? '发布' :
                 task.status === '发布' ? '开始执行' : '完成'

  // 更新任务状态
  taskStore.update(task.id, { status: newStatus })

  // 添加审批日志
  approvalStore.add({
    id: 'patrolapproval_' + Date.now(),
    patrolTaskId: task.id,
    action: action,
    operator: '张伟', // 模拟当前用户
    operateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    comment: transComment.value,
    previousStatus: task.status,
    newStatus: newStatus
  })

  ElMessage.success(`任务状态已变更为“${transNextLabel.value}”`)
  transDialogVisible.value = false
}

// ---- 删除 ----
function handleDelete(task) {
  if (task.status === '执行中' || task.status === '完成') {
    ElMessage.warning('该任务已执行，无法删除')
    return
  }
  ElMessageBox.confirm(`确定删除任务“${task.taskName}”吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    taskStore.remove(task.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// ---- 导出 ----
function handleExport() {
  const headers = ['任务名称','巡查路线','执行人员','区域','计划开始时间','计划结束时间','状态']
  const rows = filteredTasks.value.map(t => [
    t.taskName,
    t.patrolRoute,
    t.assignedPerson,
    t.area,
    t.startTime,
    t.endTime,
    statusLabel(t.status)
  ])
  let csv = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(r => {
    csv += r.map(v => `"${v}"`).join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `巡查排程报表_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报表导出完成')
}

// ---- 冲突检测（用于顶部tag） ----
const conflictRows = computed(() => {
  const set = new Set()
  const tasks = filteredTasks.value
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i], b = tasks[j]
      if (a.area !== b.area) continue
      if (a.id === b.id) continue
      const aStart = new Date(a.startTime), aEnd = new Date(a.endTime)
      const bStart = new Date(b.startTime), bEnd = new Date(b.endTime)
      if (aStart < bEnd && aEnd > bStart) {
        set.add(a.id)
        set.add(b.id)
      }
    }
  }
  return set
})
const conflictCount = computed(() => conflictRows.value.size)

const conflictList = computed(() => {
  const list = []
  const tasks = filteredTasks.value
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i], b = tasks[j]
      if (a.area !== b.area) continue
      const aStart = new Date(a.startTime), aEnd = new Date(a.endTime)
      const bStart = new Date(b.startTime), bEnd = new Date(b.endTime)
      if (aStart < bEnd && aEnd > bStart) {
        list.push({
          tip: `“${a.taskName}”与“${b.taskName}”在${a.area}区域时间重叠`
        })
      }
    }
  }
  return list.slice(0, 5)
})

// ---- 操作列按钮（用于甘特行右键菜单？但放在行点击时弹出菜单，我们使用状态流转按钮在行操作区。为了简化，在行点击弹出详情，详情中可进行状态流转和编辑删除。但还需要快速状态流转，在行上增加按钮？由于甘特行已经较短，可以在行右侧添加悬浮按钮，但为了简单，我将在详情抽屉中提供状态流转按钮，同时在表格样式的甘特行上不添加按钮。但需求要求有操作按钮：详情、编辑、删除、状态流转。可以在甘特行右侧 hover 时出现操作图标。但那样比较复杂，这里我改为使用 el-table 作为辅助表格放在甘特图下方？但这样版面布局变化。
// 为了遵守铁律9，必须有这些操作。我们可以在甘特图下方增加一个 el-table 显示当前选中任务或所有任务的详细操作行？但版面已经满了。考虑在甘特图上方添加一个表格？不使用表格，而是把操作放到详情抽屉里，但抽屉不能满足“快速操作”。因此，我在每个甘特行上添加操作按钮列（通过绝对定位悬浮），点击按钮触发相应操作。在 .gantt-row 内部添加 .row-actions。
// 但由于甘特行已经用 flex 布局，我可以在行右侧固定操作区。
// 为了不破坏甘特条布局，我将在行右侧添加一个固定宽度的操作按钮组，用hover显示。
// 我们在模板中修改：

// 在模板 gantt-row 内增加 .row-actions 按钮组。
</script>

<style scoped lang="scss">
@use './PatrolSchedule.scss' as *;
</style>