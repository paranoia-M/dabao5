<template>
  <div class="page-inspection_task">
    <!-- 顶部信息条 -->
    <div class="top-bar">
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-num">{{ taskStore.total }}</span>
          <span class="stat-label">全部任务</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ draftCount }}</span>
          <span class="stat-label">待发布</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ activeCount }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ doneCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ taskTotalProgress }}%</span>
          <span class="stat-label">总体进度</span>
          <el-progress :percentage="taskTotalProgress" :stroke-width="6" color="#1E3A5F" />
        </div>
      </div>
    </div>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- 左半：隐患热力矩阵 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">隐患热力矩阵</span>
          <el-tooltip content="点击格子筛选对应的任务列表" placement="top">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="matrix-wrapper">
          <svg class="heatmap-svg" :viewBox="`0 0 ${matrixCols * 120 + 140} ${matrixRows * 50 + 60}`">
            <!-- 行标签 -->
            <text v-for="(row, ri) in matrixRowsArr" :key="'r'+ri" 
                  :x="20" :y="ri * 50 + 70" class="matrix-label">{{ row }}</text>
            <!-- 列标签 -->
            <text v-for="(col, ci) in matrixColsArr" :key="'c'+ci"
                  :x="ci * 120 + 130" :y="30" class="matrix-label" text-anchor="middle">{{ col }}</text>
            <!-- 格子 -->
            <rect v-for="(cell, idx) in matrixCells" :key="'cell'+idx"
                  :x="cell.cx" :y="cell.cy" width="110" height="40" rx="4"
                  :fill="cell.color" :stroke="cell.stroke" stroke-width="1.5"
                  style="cursor:pointer;transition:stroke 0.2s"
                  @mouseenter="cell.hover=true" @mouseleave="cell.hover=false"
                  @click="handleCellClick(cell)"
                  :opacity="cell.hover ? 0.85 : 1" />
            <!-- 格子数字 -->
            <text v-for="(cell, idx) in matrixCells" :key="'ct'+idx"
                  :x="cell.cx + 55" :y="cell.cy + 25" 
                  text-anchor="middle" fill="#fff" font-size="14" font-weight="700">
              {{ cell.count }}
            </text>
          </svg>
          <div class="matrix-legend">
            <span v-for="item in legendItems" :key="item.label" class="legend-item">
              <span class="legend-color" :style="{background:item.color}"></span>
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右半：任务列表 + 甘特条 -->
      <div class="right-panel">
        <div class="filter-bar">
          <el-input v-model="keyword" placeholder="搜索任务名称" clearable style="width:200px" @clear="handleClear" />
          <el-select v-model="filterStatus" placeholder="任务状态" clearable style="width:140px">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable style="width:240px" />
          <el-button type="primary" size="small" @click="handleAdd">新增任务</el-button>
          <el-button size="small" :disabled="selectedTaskIds.length===0" @click="handleBatchAssign">批量分配</el-button>
          <el-button size="small" @click="handleExport">导出清单</el-button>
          <el-tag v-if="selectedCell" closable @close="clearCellFilter" type="info">
            已筛选：{{ selectedCell.hazardType }} / {{ selectedCell.equipmentType }}
          </el-tag>
        </div>

        <div class="task-gantt-container">
          <el-table :data="filteredTasks" style="width:100%" stripe highlight-current-row @selection-change="onSelectionChange" max-height="600">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="title" label="任务名称" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="task-title">{{ row.title }}</span>
                <el-tag v-if="row.status==='草稿'" size="small" type="info" style="margin-left:8px">草稿</el-tag>
                <el-tag v-else-if="row.status==='已发布'" size="small" type="success">已发布</el-tag>
                <el-tag v-else-if="row.status==='进行中'" size="small" type="warning">进行中</el-tag>
                <el-tag v-else-if="row.status==='已完成'" size="small">已完成</el-tag>
                <el-tag v-else-if="row.status==='已撤销'" size="small" type="danger">已撤销</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="taskType" label="类型" width="70" />
            <el-table-column prop="assignee" label="负责人" width="80" />
            <el-table-column label="计划时间" width="180">
              <template #default="{ row }">
                {{ row.startDate }} ~ {{ row.endDate }}
              </template>
            </el-table-column>
            <el-table-column label="甘特图" min-width="240">
              <template #default="{ row }">
                <div class="gantt-row">
                  <div class="gantt-bar" :style="getGanttStyle(row)">
                    <span class="gantt-label">{{ row.title }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link size="small" @click="handleDetail(row)">详情</el-button>
                <el-button link size="small" :disabled="row.status!=='草稿'" @click="handleEdit(row)">编辑</el-button>
                <el-button link size="small" :disabled="row.status!=='草稿'" @click="handlePublish(row)">发布</el-button>
                <el-button link size="small" :disabled="row.status!=='已发布'" @click="handleUnpublish(row)">撤销</el-button>
                <el-button link size="small" type="danger" :disabled="row.status!=='草稿'" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 底部：导出结果区 -->
        <div v-if="exportedReports.length>0" class="export-area">
          <div class="section-title">最近导出</div>
          <div class="export-chips">
            <el-tag v-for="r in exportedReports" :key="r.id" closable @close="removeExport(r.id)">
              {{ r.title }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogFormVisible" :title="isEdit?'编辑任务':'新增任务'" width="min(640px,92vw)" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="form.title" maxlength="50" />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="form.taskType" style="width:100%">
            <el-option v-for="t in taskTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="form.assignee" />
        </el-form-item>
        <el-form-item label="计划开始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="计划结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="关联设备" prop="equipmentIds">
          <el-select v-model="form.equipmentIds" multiple placeholder="请选择设备" style="width:100%">
            <el-option v-for="eq in equipmentList" :key="eq.id" :label="eq.name+'('+eq.registerCode+')'" :value="eq.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="dialogDetailVisible" title="任务详情" width="min(640px,92vw)" destroy-on-close>
      <div v-if="detailTask" class="detail-grid">
        <div class="detail-item"><span class="detail-label">任务名称</span><span>{{ detailTask.title }}</span></div>
        <div class="detail-item"><span class="detail-label">任务类型</span><span>{{ detailTask.taskType }}</span></div>
        <div class="detail-item"><span class="detail-label">状态</span><span>{{ detailTask.status }}</span></div>
        <div class="detail-item"><span class="detail-label">负责人</span><span>{{ detailTask.assignee }}</span></div>
        <div class="detail-item"><span class="detail-label">计划时间</span><span>{{ detailTask.startDate }} ~ {{ detailTask.endDate }}</span></div>
        <div class="detail-item"><span class="detail-label">创建人</span><span>{{ detailTask.createdBy }}</span></div>
        <div class="detail-item"><span class="detail-label">创建时间</span><span>{{ detailTask.createTime }}</span></div>
        <div class="detail-item"><span class="detail-label">关联设备</span>
          <span>
            <el-tag v-for="eq in taskEquipmentNames(detailTask.id)" :key="eq" size="small" style="margin:2px">{{ eq }}</el-tag>
            <span v-if="taskEquipmentNames(detailTask.id).length===0">未关联</span>
          </span>
        </div>
        <div class="detail-item"><span class="detail-label">关联隐患数</span><span>{{ hazardCountForTask(detailTask.id) }}</span></div>
      </div>
    </el-dialog>

    <!-- 批量分配弹窗 -->
    <el-dialog v-model="dialogAssignVisible" title="批量分配执行人" width="400px">
      <el-form>
        <el-form-item label="选择负责人">
          <el-select v-model="assignForm.assignee" placeholder="请选择" style="width:100%">
            <el-option v-for="p in personOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogAssignVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useInspectionTaskStore } from '@/stores/inspectionTask'
import { useTaskEquipmentStore } from '@/stores/taskEquipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'
import { useReportStore } from '@/stores/report'

const equipmentStore = useEquipmentStore()
const taskStore = useInspectionTaskStore()
const taskEquipmentStore = useTaskEquipmentStore()
const hazardStore = useHazardRecordStore()
const reportStore = useReportStore()

// ---------- 基本数据 ----------
const equipmentList = computed(() => equipmentStore.equipmentList)
const taskList = computed(() => taskStore.inspectionTaskList)
const taskEquipmentArr = computed(() => taskEquipmentStore.taskEquipmentList)
const hazardList = computed(() => hazardStore.hazardRecordList)

// 状态枚举
const statusOptions = [
  { value: '', label: '全部' },
  { value: '草稿', label: '草稿' },
  { value: '已发布', label: '已发布' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' },
  { value: '已撤销', label: '已撤销' }
]
const taskTypeOptions = [
  { value: '月度', label: '月度' },
  { value: '季度', label: '季度' },
  { value: '专项', label: '专项' },
  { value: '临时', label: '临时' }
]
const personOptions = ['张伟', '李娜', '王芳', '刘洋', '陈静', '赵鑫', '孙丽', '周磊', '吴敏']

// ---------- 筛选 ----------
const keyword = ref('')
const filterStatus = ref('')
const dateRange = ref([])

// 热力矩阵点击筛选
const selectedCell = ref(null)

const filteredTasks = computed(() => {
  let list = taskList.value
  // 关键词
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(t => t.title.toLowerCase().includes(kw))
  }
  // 状态
  if (filterStatus.value) {
    list = list.filter(t => t.status === filterStatus.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(t => {
      return t.startDate >= start && t.endDate <= end
    })
  }
  // 热力矩阵格子筛选
  if (selectedCell.value) {
    const { hazardType, equipmentType } = selectedCell.value
    // 找出所有符合的设备ID
    const equipIds = equipmentList.value.filter(e => e.equipmentType === equipmentType).map(e => e.id)
    // 找出这些设备关联的任务ID
    const taskEquips = taskEquipmentArr.value.filter(te => equipIds.includes(te.equipmentId))
    const taskIds1 = new Set(taskEquips.map(te => te.taskId))
    // 找出隐患类型匹配的任务ID
    const hazardTaskIds = hazardList.value.filter(h => h.hazardType === hazardType).map(h => h.inspectionTaskId)
    const taskIds2 = new Set(hazardTaskIds)
    // 交集
    const finalIds = new Set([...taskIds1].filter(id => taskIds2.has(id)))
    list = list.filter(t => finalIds.has(t.id))
  }
  // 按开始日期降序
  return list.slice().sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
})

// ---------- 统计 ----------
const draftCount = computed(() => taskList.value.filter(t => t.status === '草稿').length)
const activeCount = computed(() => taskList.value.filter(t => t.status === '进行中').length)
const doneCount = computed(() => taskList.value.filter(t => t.status === '已完成').length)
const taskTotalProgress = computed(() => {
  if (taskList.value.length === 0) return 0
  // 计算状态赋值进度：草稿0，已发布30，进行中60，已完成100，已撤销50
  const map = { 草稿: 0, 已发布: 30, 进行中: 60, 已完成: 100, 已撤销: 50 }
  const total = taskList.value.reduce((s, t) => s + (map[t.status] || 0), 0)
  return Math.round(total / taskList.value.length)
})

// ---------- 热力矩阵 ----------
const hazardTypes = computed(() => [...new Set(hazardList.value.map(h => h.hazardType))])
const equipmentTypes = computed(() => [...new Set(equipmentList.value.map(e => e.equipmentType))])
const matrixRowsArr = computed(() => hazardTypes.value)
const matrixColsArr = computed(() => equipmentTypes.value)
const matrixRows = computed(() => matrixRowsArr.value.length)
const matrixCols = computed(() => matrixColsArr.value.length)

const matrixCells = computed(() => {
  const cells = []
  // 构建计数
  const countMap = {}
  hazardList.value.forEach(h => {
    const eq = equipmentList.value.find(e => e.id === h.equipmentId)
    if (!eq) return
    const key = `${h.hazardType}||${eq.equipmentType}`
    countMap[key] = (countMap[key] || 0) + 1
  })
  const maxCount = Math.max(...Object.values(countMap), 1)
  const colorScale = (count) => {
    if (count === 0) return '#e8e8e8'
    const intensity = count / maxCount
    // 从浅蓝到深蓝 #1E3A5F
    const r = 0 + Math.round(30 * intensity)
    const g = 58 + Math.round(-18 * intensity)
    const b = 95 + Math.round(-40 * intensity)
    return `rgb(${r},${g},${b})`
  }
  matrixRowsArr.value.forEach((hType, ri) => {
    matrixColsArr.value.forEach((eqType, ci) => {
      const key = `${hType}||${eqType}`
      const count = countMap[key] || 0
      cells.push({
        hazardType: hType,
        equipmentType: eqType,
        cx: ci * 120 + 130,
        cy: ri * 50 + 50,
        count,
        color: colorScale(count),
        stroke: selectedCell.value && selectedCell.value.hazardType === hType && selectedCell.value.equipmentType === eqType ? '#fff' : 'transparent',
        hover: false
      })
    })
  })
  return cells
})

const legendItems = computed(() => {
  const colors = ['#e8e8e8', '#4a6b8a', '#2a4a6a', '#1E3A5F']
  return colors.map(c => ({ color: c, label: c === '#e8e8e8' ? '无' : c === '#1E3A5F' ? '高' : '中' }))
})

function handleCellClick(cell) {
  if (selectedCell.value && selectedCell.value.hazardType === cell.hazardType && selectedCell.value.equipmentType === cell.equipmentType) {
    selectedCell.value = null
  } else {
    selectedCell.value = { hazardType: cell.hazardType, equipmentType: cell.equipmentType }
  }
}
function clearCellFilter() {
  selectedCell.value = null
}

// ---------- 甘特图计算 ----------
function getGanttStyle(task) {
  const allStart = Math.min(...taskList.value.map(t => new Date(t.startDate).getTime()))
  const allEnd = Math.max(...taskList.value.map(t => new Date(t.endDate).getTime()))
  const totalWidth = allEnd - allStart
  if (totalWidth <= 0) return { width: '0%', left: '0%' }
  const taskStart = new Date(task.startDate).getTime()
  const taskEnd = new Date(task.endDate).getTime()
  const left = ((taskStart - allStart) / totalWidth) * 100
  const width = ((taskEnd - taskStart) / totalWidth) * 100
  return {
    left: left + '%',
    width: Math.max(width, 5) + '%'
  }
}

// ---------- 弹窗控制 ----------
const dialogFormVisible = ref(false)
const dialogDetailVisible = ref(false)
const dialogAssignVisible = ref(false)
const isEdit = ref(false)
const editingTaskId = ref('')
const formRef = ref(null)
const form = ref({
  title: '',
  taskType: '月度',
  assignee: '',
  startDate: '',
  endDate: '',
  equipmentIds: [],
  description: ''
})
const formRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

function handleAdd() {
  isEdit.value = false
  editingTaskId.value = ''
  form.value = { title: '', taskType: '月度', assignee: '', startDate: '', endDate: '', equipmentIds: [], description: '' }
  dialogFormVisible.value = true
}
function handleEdit(task) {
  isEdit.value = true
  editingTaskId.value = task.id
  form.value = {
    title: task.title,
    taskType: task.taskType,
    assignee: task.assignee,
    startDate: task.startDate,
    endDate: task.endDate,
    equipmentIds: taskEquipmentArr.value.filter(te => te.taskId === task.id).map(te => te.equipmentId),
    description: task.description || ''
  }
  dialogFormVisible.value = true
}
function submitForm() {
  formRef.value.validate(valid => {
    if (!valid) return
    // 检查设备是否选择
    if (!form.value.equipmentIds || form.value.equipmentIds.length === 0) {
      ElMessage.warning('请至少选择一台设备')
      return
    }
    if (isEdit.value) {
      // 编辑
      taskStore.update(editingTaskId.value, {
        title: form.value.title,
        taskType: form.value.taskType,
        assignee: form.value.assignee,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        description: form.value.description
      })
      // 更新设备关联：先删除旧的再添加
      const oldTEs = taskEquipmentArr.value.filter(te => te.taskId === editingTaskId.value)
      oldTEs.forEach(te => taskEquipmentStore.remove(te.id))
      form.value.equipmentIds.forEach(eqId => {
        taskEquipmentStore.add({
          id: 'te_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          taskId: editingTaskId.value,
          equipmentId: eqId
        })
      })
      ElMessage.success('任务已更新')
    } else {
      // 新增
      const newId = 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      taskStore.add({
        id: newId,
        title: form.value.title,
        description: form.value.description,
        taskType: form.value.taskType,
        status: '草稿',
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        assignee: form.value.assignee,
        createdBy: '当前用户',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
      form.value.equipmentIds.forEach(eqId => {
        taskEquipmentStore.add({
          id: 'te_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          taskId: newId,
          equipmentId: eqId
        })
      })
      ElMessage.success('任务创建成功')
    }
    dialogFormVisible.value = false
  })
}

// ---------- 详情 ----------
const detailTask = ref(null)
function handleDetail(task) {
  detailTask.value = task
  dialogDetailVisible.value = true
}
function taskEquipmentNames(taskId) {
  const tes = taskEquipmentArr.value.filter(te => te.taskId === taskId)
  return tes.map(te => {
    const eq = equipmentList.value.find(e => e.id === te.equipmentId)
    return eq ? eq.name : ''
  }).filter(Boolean)
}
function hazardCountForTask(taskId) {
  return hazardList.value.filter(h => h.inspectionTaskId === taskId).length
}

// ---------- 发布/撤销 ----------
function handlePublish(task) {
  taskStore.update(task.id, { status: '已发布' })
  ElMessage.success('任务已发布')
}
function handleUnpublish(task) {
  taskStore.update(task.id, { status: '草稿' })
  ElMessage.success('任务已撤销发布')
}

// ---------- 删除 ----------
function handleDelete(task) {
  const hasRecords = hazardList.value.some(h => h.inspectionTaskId === task.id)
  const message = hasRecords
    ? '当前任务已有排查记录，删除后记录保留但任务关联断开，是否继续？'
    : '确认删除该任务？'
  ElMessageBox.confirm(message, '删除确认', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      // 删除关联设备记录
      const tes = taskEquipmentArr.value.filter(te => te.taskId === task.id)
      tes.forEach(te => taskEquipmentStore.remove(te.id))
      taskStore.remove(task.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}

// ---------- 批量分配 ----------
const selectedTaskIds = ref([])
const assignForm = ref({ assignee: '' })
function onSelectionChange(rows) {
  selectedTaskIds.value = rows.map(r => r.id)
}
function handleBatchAssign() {
  if (selectedTaskIds.value.length === 0) return
  assignForm.value.assignee = ''
  dialogAssignVisible.value = true
}
function confirmAssign() {
  if (!assignForm.value.assignee) {
    ElMessage.warning('请选择负责人')
    return
  }
  selectedTaskIds.value.forEach(id => {
    taskStore.update(id, { assignee: assignForm.value.assignee })
  })
  ElMessage.success(`已将 ${selectedTaskIds.value.length} 个任务分配给 ${assignForm.value.assignee}`)
  dialogAssignVisible.value = false
}

// ---------- 导出 ----------
const exportedReports = ref([])
function handleExport() {
  const reportTitle = `排查任务清单_${new Date().toISOString().slice(0,10)}`
  reportStore.add({
    id: 'report_' + Date.now(),
    title: reportTitle,
    reportType: '隐患排查报告',
    generationMethod: '手动',
    status: '已审核',
    relatedEntityType: '排查任务',
    relatedEntityId: '',
    content: { summary: `导出任务数:${filteredTasks.value.length}` },
    createTime: new Date().toISOString().slice(0,19).replace('T',' '),
    auditBy: '',
    auditTime: ''
  })
  exportedReports.value.unshift({
    id: reportStore.reportList[reportStore.reportList.length-1].id,
    title: reportTitle
  })
  ElMessage.success('清单已导出，请查看下方最近导出区')
}
function removeExport(id) {
  exportedReports.value = exportedReports.value.filter(r => r.id !== id)
}

// ---------- 清除筛选 ----------
function handleClear() {
  keyword.value = ''
}
</script>

<style scoped lang="scss">
@use './InspectionTask.scss' as *;
</style>