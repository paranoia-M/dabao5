<template>
  <div class="page-inspection_tasks">
    <!-- 顶部 KPI 统计 -->
    <div class="kpi-section">
      <div class="kpi-card" v-for="k in kpiList" :key="k.label">
        <span class="kpi-value" :style="{ color: k.color }">{{ k.count }}</span>
        <span class="kpi-label">{{ k.label }}</span>
      </div>
    </div>

    <!-- 筛选 + 操作栏 -->
    <div class="action-bar">
      <el-input
        v-model="keyword"
        placeholder="按任务编号/批次模糊搜索"
        clearable
        class="filter-input"
      />
      <el-select v-model="statusFilter" placeholder="状态" clearable class="filter-select">
        <el-option label="待分配" value="待分配" />
        <el-option label="已分配" value="已分配" />
        <el-option label="进行中" value="进行中" />
        <el-option label="已完成" value="已完成" />
        <el-option label="已关闭" value="已关闭" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="计划起始"
        end-placeholder="计划结束"
        value-format="YYYY-MM-DD"
        class="filter-date"
      />
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button type="success" @click="openAddDialog">＋ 新建任务</el-button>
      <el-button @click="handleExport">导出</el-button>
    </div>

    <!-- 主体：左侧时间线 + 右侧详情面板 -->
    <div class="main-body">
      <!-- 左侧时间线（招牌积木） -->
      <div class="timeline-wrapper">
        <div class="timeline">
          <div
            v-for="task in paginatedTasks"
            :key="task.id"
            class="timeline-item"
            :class="{ active: selectedTask?.id === task.id }"
            @click="selectTask(task)"
          >
            <div class="timeline-dot" :style="{ borderColor: statusColor(task.status) }" />
            <div class="timeline-content">
              <div class="task-badge">{{ task.batchNo }}</div>
              <div class="task-time">{{ formatDate(task.planTime) }}</div>
              <el-tag :type="statusTag(task.status)" size="small">{{ mapStatus(task.status) }}</el-tag>
              <el-tag v-if="task.result" :type="resultTag(task.result)" size="small">{{ task.result }}</el-tag>
              <div class="task-actions" v-if="task.status === '草稿'">
                <el-button type="danger" size="small" link @click.stop="handleDelete(task)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
        <el-pagination
          v-if="totalPages > 1"
          background
          layout="prev, pager, next"
          :total="sortedFilteredTasks.length"
          :page-size="pageSize"
          v-model:current-page="currentPage"
          class="pagination"
        />
      </div>

      <!-- 右侧详情面板 -->
      <div class="detail-wrapper" v-if="selectedTask">
        <el-card class="detail-card">
          <template #header>
            <span>任务详情 - {{ selectedTask.batchNo }}</span>
            <el-button text @click="openEditDialog(selectedTask)" v-if="selectedTask.status=== '草稿' || selectedTask.status=== '待执行'" style="float:right">编辑</el-button>
          </template>
          <div class="detail-fields">
            <div class="field-row"><label>批号</label><span>{{ selectedTask.batchNo }}</span></div>
            <div class="field-row"><label>检测类型</label><span>{{ selectedTask.taskType }}</span></div>
            <div class="field-row"><label>计划时间</label><span>{{ formatDate(selectedTask.planTime) }}</span></div>
            <div class="field-row"><label>执行人</label><span>{{ selectedTask.executor || '未分配' }}</span></div>
            <div class="field-row"><label>状态</label><el-tag :type="statusTag(selectedTask.status)">{{ mapStatus(selectedTask.status) }}</el-tag></div>
            <div class="field-row"><label>结果</label><span>{{ selectedTask.result }}</span></div>
            <div class="field-row"><label>描述</label><span>{{ selectedTask.detail }}</span></div>
            <div class="field-row"><label>备注</label><span>{{ selectedTask.remark }}</span></div>
          </div>

          <!-- 检测项目表 -->
          <h4 style="margin-top:16px;">检测项目</h4>
          <el-table :data="[]" empty-text="暂无检测数据" stripe size="small">
            <el-table-column label="检测项目" prop="itemName" />
            <el-table-column label="标准值" prop="minValue" />
            <el-table-column label="实测值" prop="measured" />
            <el-table-column label="结论" prop="conclusion" />
          </el-table>

          <!-- 分配执行人 -->
          <div v-if="selectedTask.status === '草稿' || selectedTask.status === '待执行'" class="assign-section">
            <el-select v-model="newExecutor" placeholder="选择执行人" style="width:200px">
              <el-option v-for="exe in executorOptions" :key="exe" :label="exe" :value="exe" />
            </el-select>
            <el-button type="primary" @click="assignExecutor">分配</el-button>
          </div>

          <!-- 状态流转按钮 -->
          <div v-if="selectedTask" class="transition-buttons">
            <el-button
              v-for="t in availableTransitions"
              :key="t.to"
              :type="t.btnType"
              @click="applyTransition(t)"
            >{{ t.label }}</el-button>
          </div>

          <!-- 操作历史（由于种子没有，暂放空） -->
          <div style="margin-top:16px;">
            <h4>操作历史</h4>
            <div class="empty-history">暂无操作记录</div>
          </div>
        </el-card>
      </div>
      <div v-else class="detail-wrapper empty-detail">
        <el-empty description="请选择左侧任务查看详情" />
      </div>
    </div>

    <!-- 新增 / 编辑 对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑检测任务' : '新建检测任务'"
      width="min(640px,92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="任务名称" prop="batchNo">
          <el-input v-model="form.batchNo" placeholder="请输入任务编号" />
        </el-form-item>
        <el-form-item label="检测类型" prop="taskType">
          <el-select v-model="form.taskType" style="width:100%">
            <el-option label="感官检测" value="感官检测" />
            <el-option label="理化检测" value="理化检测" />
            <el-option label="微生物检测" value="微生物检测" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始日期" prop="planStart">
          <el-date-picker v-model="form.planStart" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="计划完成日期" prop="planEnd">
          <el-date-picker v-model="form.planEnd" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="执行人" prop="executor">
          <el-select v-model="form.executor" clearable style="width:100%">
            <el-option v-for="exe in executorOptions" :key="exe" :label="exe" :value="exe" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInspectionTaskStore } from '@/stores/inspectionTask'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const inspectionStore = useInspectionTaskStore()

// ---------- 初始化 ----------
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = 20
const selectedTask = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const newExecutor = ref('')
const formRef = ref(null)

const executorOptions = ['张伟', '李娜', '王芳', '刘洋', '陈静']

// 种子已就位，直接读取
const allTasks = computed(() => inspectionStore.inspectionTaskList || [])

// ------- 筛选与排序 --------
const filteredTasks = computed(() => {
  let list = allTasks.value
  // 关键词
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(t => t.batchNo.toLowerCase().includes(kw) || t.batchNo.toLowerCase().includes(kw))
  }
  // 状态筛选（显示状态 -> store状态）
  if (statusFilter.value) {
    const mapRev = { '待分配': '草稿', '已分配': '待执行', '进行中': '进行中', '已完成': '已完成', '已关闭': '已审核' }
    const storeStatus = mapRev[statusFilter.value]
    list = list.filter(t => t.status === storeStatus)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0] ? new Date(dateRange.value[0]).getTime() : null
    const end = dateRange.value[1] ? new Date(dateRange.value[1]).getTime() : null
    if (start) list = list.filter(t => new Date(t.planTime).getTime() >= start)
    if (end) list = list.filter(t => new Date(t.planTime).getTime() <= end + 86400000)
  }
  return list
})

const sortedFilteredTasks = computed(() => {
  const copy = filteredTasks.value.slice()
  copy.sort((a, b) => new Date(b.planTime) - new Date(a.planTime))
  return copy
})

const totalPages = computed(() => Math.ceil(sortedFilteredTasks.value.length / pageSize))

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedFilteredTasks.value.slice(start, start + pageSize)
})

// ------- KPI 统计 -------
const kpiList = computed(() => {
  const statusCount = { 草稿: 0, 待执行: 0, 进行中: 0, 已完成: 0, 已审核: 0 }
  allTasks.value.forEach(t => {
    if (statusCount[t.status] !== undefined) statusCount[t.status]++
  })
  return [
    { label: '待分配', count: statusCount['草稿'], color: '#909399' },
    { label: '已分配', count: statusCount['待执行'], color: '#409EFF' },
    { label: '进行中', count: statusCount['进行中'], color: '#E6A23C' },
    { label: '已完成', count: statusCount['已完成'], color: '#67C23A' },
    { label: '已关闭', count: statusCount['已审核'], color: '#F56C6C' },
  ]
})

// ------- 状态映射工具 -------
const statusMap = { '草稿': '待分配', '待执行': '已分配', '进行中': '进行中', '已完成': '已完成', '已审核': '已关闭' }
const statusReverse = { '待分配': '草稿', '已分配': '待执行', '进行中': '进行中', '已完成': '已完成', '已关闭': '已审核' }
const mapStatus = (s) => statusMap[s] || s
const statusColor = (s) => {
  const map = { '草稿': '#909399', '待执行': '#409EFF', '进行中': '#E6A23C', '已完成': '#67C23A', '已审核': '#F56C6C' }
  return map[s] || '#909399'
}
const statusTag = (s) => {
  const map = { '草稿': 'info', '待执行': 'primary', '进行中': 'warning', '已完成': 'success', '已审核': 'danger' }
  return map[s] || 'info'
}
const resultTag = (r) => {
  if (r === '合格') return 'success'
  if (r === '不合格') return 'danger'
  return 'info'
}

// ------- 可用流转 -------
const availableTransitions = computed(() => {
  if (!selectedTask.value) return []
  const ds = mapStatus(selectedTask.value.status)
  const trans = [
    { from: '待分配', to: '已分配', label: '开始分配', btnType: 'primary' },
    { from: '已分配', to: '进行中', label: '开始检测', btnType: 'warning' },
    { from: '进行中', to: '已完成', label: '完成（合格）', btnType: 'success' },
    { from: '进行中', to: '已关闭', label: '标记不合格', btnType: 'danger' },
    { from: '已关闭', to: '待分配', label: '重新检测', btnType: 'info' },
    { from: '已关闭', to: '已完成', label: '人工确认通过', btnType: 'success' },
  ]
  return trans.filter(t => t.from === ds)
})

const applyTransition = (t) => {
  const newStatus = statusReverse[t.to] || t.to
  const updateData = { status: newStatus, planTime: selectedTask.value.planTime } // 保留时间
  if (t.to === '已完成' && t.from === '进行中') {
    updateData.result = '合格'
  }
  if (t.to === '已关闭' && t.from === '进行中') {
    updateData.result = '不合格'
  }
  if (t.to === '待分配') {
    updateData.executor = ''
    updateData.result = '待判定'
  }
  inspectionStore.update(selectedTask.value.id, updateData)
  ElMessage.success(`任务状态已更新为「${t.to}」`)
  selectedTask.value = null // 刷新选中
  // 重新选中同一个任务
  const updated = inspectionStore.findById(selectedTask.value?.id)
  if (updated) selectedTask.value = updated
  else {
    // 如果任务被删了（不会发生）
    selectedTask.value = null
  }
}

// ------- 操作：分配执行人 -------
const assignExecutor = () => {
  if (!newExecutor.value) {
    ElMessage.warning('请选择执行人')
    return
  }
  inspectionStore.update(selectedTask.value.id, { executor: newExecutor.value, status: '待执行' })
  ElMessage.success('已分配执行人')
  newExecutor.value = ''
  selectedTask.value = { ...selectedTask.value, executor: newExecutor.value, status: '待执行' }
}

// ------- 操作：删除 -------
const handleDelete = async (task) => {
  if (task.status !== '草稿') {
    ElMessage.warning('仅待分配状态可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除任务 ${task.batchNo}？删除后关联检测记录将失效`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    // 真实删除
    inspectionStore.remove(task.id)
    ElMessage.success('删除成功')
    if (selectedTask.value?.id === task.id) selectedTask.value = null
  } catch {
    // 取消
  }
}

// ------- 操作：新增 / 编辑 -------
const form = ref({
  batchNo: '',
  taskType: '',
  planStart: '',
  planEnd: '',
  executor: '',
  remark: ''
})

const formRules = {
  batchNo: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择检测类型', trigger: 'change' }],
  planStart: [{ required: true, message: '请选择计划开始日期', trigger: 'change' }],
  planEnd: [{ required: true, message: '请选择计划完成日期', trigger: 'change' }]
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  form.value = { batchNo: '', taskType: '', planStart: '', planEnd: '', executor: '', remark: '' }
  dialogVisible.value = true
}

const openEditDialog = (task) => {
  isEdit.value = true
  editId.value = task.id
  form.value = {
    batchNo: task.batchNo,
    taskType: task.taskType,
    planStart: dayjs(task.planTime).format('YYYY-MM-DD'),
    planEnd: dayjs(task.planTime).format('YYYY-MM-DD'), // 假设计划完成日期与开始相同；种子只有planTime，此处简化
    executor: task.executor || '',
    remark: task.remark || ''
  }
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    // 校验日期先后
    if (form.value.planEnd && form.value.planStart && new Date(form.value.planEnd) < new Date(form.value.planStart)) {
      ElMessage.warning('计划完成日期不能早于开始日期')
      return
    }
    // 校验微生物采样数量（略，因为没有采样数量字段，忽略）
    const planTime = form.value.planStart + ' 08:00:00'  // 时间统一设为当天8点
    const newTask = {
      batchNo: form.value.batchNo,
      taskType: form.value.taskType,
      planTime: planTime,
      executor: form.value.executor || '',
      status: '草稿',
      result: '待判定',
      detail: '',
      remark: form.value.remark || ''
    }

    if (isEdit.value) {
      inspectionStore.update(editId.value, newTask)
      ElMessage.success('任务已更新')
    } else {
      // 给新任务一个id（种子格式 inspectiontask_xxxx）
      const newId = 'inspectiontask_' + Date.now()
      newTask.id = newId
      inspectionStore.add(newTask)
      ElMessage.success('任务已创建')
    }
    dialogVisible.value = false
    // 刷新选中
    if (selectedTask.value) {
      selectedTask.value = inspectionStore.findById(selectedTask.value.id)
    }
  })
}

// ------- 导出（模拟） -------
const handleExport = () => {
  // 生成CSV并下载
  const rows = sortedFilteredTasks.value
  let csv = '任务编号,检测类型,计划时间,执行人,状态,结果,描述,备注\n'
  rows.forEach(t => {
    csv += `${t.batchNo},${t.taskType},${t.planTime},${t.executor||''},${mapStatus(t.status)},${t.result},${t.detail||''},${t.remark||''}\n`
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `检测任务_导出_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

// ------- 查询按钮 -------
const handleQuery = () => {
  currentPage.value = 1
  // 重新计算筛选
}

// ------- 选择任务 -------
const selectTask = (task) => {
  selectedTask.value = task
  newExecutor.value = ''
}

// ------- 工具函数 -------
const formatDate = (d) => {
  if (!d) return ''
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

// 初始化选中第一个任务
onMounted(() => {
  if (sortedFilteredTasks.value.length > 0) {
    selectedTask.value = sortedFilteredTasks.value[0]
  }
})
</script>

<style scoped lang="scss">
@use './InspectionTasks.scss' as *;
</style>