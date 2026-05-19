<template>
  <div class="schedule-page">
    <!-- 时间区间滑动控制 B6 -->
    <div class="time-range-control">
      <el-date-picker
        v-model="timeRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleTimeRangeChange"
      />
      <el-button type="primary" @click="handleToday">今天</el-button>
      <el-button type="primary" @click="handleWeek">本周</el-button>
      <el-button type="primary" @click="handleMonth">本月</el-button>
    </div>

    <!-- 日历热力条 D6 -->
    <div class="heatmap-section">
      <div class="heatmap-header">
        <span class="heatmap-title">检测任务负荷分布</span>
        <div class="heatmap-legend">
          <span class="legend-item" v-for="item in heatmapLegend" :key="item.label">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            {{ item.label }}
          </span>
        </div>
      </div>
      <div class="heatmap-container" ref="heatmapRef">
        <div
          class="heatmap-bar"
          v-for="(day, index) in heatmapData"
          :key="index"
          :style="{ height: day.height + '%', backgroundColor: day.color }"
          :title="day.date + ': ' + day.count + '个任务'"
        ></div>
      </div>
    </div>

    <!-- 时间阻塞预警 C6 -->
    <div class="warning-section" v-if="warnings.length > 0">
      <el-alert
        v-for="(warning, index) in warnings"
        :key="index"
        :title="warning.title"
        :description="warning.description"
        type="warning"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 甘特/日历图 A6 -->
    <div class="gantt-section">
      <div class="gantt-header">
        <span class="gantt-title">检测任务甘特图</span>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增任务
        </el-button>
      </div>
      <div class="gantt-container" v-loading="loading.gantt">
        <div class="gantt-table">
          <div class="gantt-table-header">
            <div class="gantt-col-task">桩号</div>
            <div class="gantt-col-person">负责人</div>
            <div class="gantt-col-duration">工期(天)</div>
            <div class="gantt-col-status">状态</div>
            <div class="gantt-col-action">操作</div>
          </div>
          <div class="gantt-table-body">
            <div class="gantt-row" v-for="(task, index) in ganttTasks" :key="task.id">
              <div class="gantt-col-task">{{ task.pileNo }}</div>
              <div class="gantt-col-person">{{ task.manager }}</div>
              <div class="gantt-col-duration">{{ task.duration }}天</div>
              <div class="gantt-col-status">
                <el-tag :type="task.status === '进行中' ? 'warning' : task.status === '已完成' ? 'success' : 'info'">
                  {{ task.status }}
                </el-tag>
              </div>
              <div class="gantt-col-action">
                <el-button size="small" type="primary" link @click="openViewDialog(task)">查看</el-button>
                <el-button size="small" type="primary" link @click="openEditDialog(task)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDelete(task)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑/查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="'600px'"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="桩号" prop="pileNo">
          <el-input
            v-model="formData.pileNo"
            :disabled="dialogMode === 'view'"
            placeholder="请输入桩号"
          />
        </el-form-item>
        <el-form-item label="计划检测时间" prop="planDate">
          <el-date-picker
            v-model="formData.planDate"
            type="date"
            placeholder="选择日期"
            :disabled="dialogMode === 'view'"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预计工期(天)" prop="duration">
          <el-input-number
            v-model="formData.duration"
            :min="1"
            :max="30"
            :disabled="dialogMode === 'view'"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="manager">
          <el-input
            v-model="formData.manager"
            :disabled="dialogMode === 'view'"
            placeholder="请输入负责人"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="formData.status"
            :disabled="dialogMode === 'view'"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="待开始" value="待开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="loading.submit"
          @click="handleSubmit"
        >
          {{ dialogMode === 'add' ? '新增' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 状态定义
const timeRange = ref([new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)])
const loading = reactive({
  gantt: false,
  submit: false
})
const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogTitle = computed(() => {
  const map = { add: '新增检测任务', edit: '编辑检测任务', view: '查看检测任务' }
  return map[dialogMode.value]
})
const formData = reactive({
  pileNo: '',
  planDate: new Date(),
  duration: 1,
  manager: '',
  status: '待开始'
})
const formRules = {
  pileNo: [{ required: true, message: '请输入桩号', trigger: 'blur' }],
  planDate: [{ required: true, message: '请选择计划检测时间', trigger: 'change' }],
  duration: [{ required: true, message: '请输入预计工期', trigger: 'blur' }],
  manager: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 假数据
const ganttTasks = ref([
  { id: 1, pileNo: 'ZK-001', planDate: '2024-01-15', duration: 3, manager: '张三', status: '进行中' },
  { id: 2, pileNo: 'ZK-002', planDate: '2024-01-18', duration: 2, manager: '李四', status: '待开始' },
  { id: 3, pileNo: 'ZK-003', planDate: '2024-01-20', duration: 4, manager: '王五', status: '已完成' },
  { id: 4, pileNo: 'ZK-004', planDate: '2024-01-22', duration: 3, manager: '赵六', status: '待开始' },
  { id: 5, pileNo: 'ZK-005', planDate: '2024-01-25', duration: 2, manager: '张三', status: '进行中' }
])

const heatmapData = ref([
  { date: '2024-01-15', count: 3, height: 60, color: '#ffc107' },
  { date: '2024-01-16', count: 5, height: 80, color: '#dc3545' },
  { date: '2024-01-17', count: 2, height: 40, color: '#28a745' },
  { date: '2024-01-18', count: 4, height: 70, color: '#ffc107' },
  { date: '2024-01-19', count: 1, height: 20, color: '#28a745' },
  { date: '2024-01-20', count: 6, height: 90, color: '#dc3545' },
  { date: '2024-01-21', count: 3, height: 60, color: '#ffc107' }
])

const heatmapLegend = [
  { label: '低负荷', color: '#28a745' },
  { label: '中负荷', color: '#ffc107' },
  { label: '高负荷', color: '#dc3545' }
]

const warnings = ref([
  {
    title: '时间阻塞预警',
    description: '2024-01-20 检测任务过多，建议调整部分任务至其他日期'
  }
])

// 方法
const handleTimeRangeChange = () => {
  loading.gantt = true
  setTimeout(() => {
    loading.gantt = false
    ElMessage.success('时间区间已更新')
  }, 500)
}

const handleToday = () => {
  const today = new Date()
  timeRange.value = [today, today]
  handleTimeRangeChange()
}

const handleWeek = () => {
  const today = new Date()
  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  timeRange.value = [today, weekLater]
  handleTimeRangeChange()
}

const handleMonth = () => {
  const today = new Date()
  const monthLater = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
  timeRange.value = [today, monthLater]
  handleTimeRangeChange()
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.pileNo = ''
  formData.planDate = new Date()
  formData.duration = 1
  formData.manager = ''
  formData.status = '待开始'
  dialogVisible.value = true
}

const openEditDialog = (task) => {
  dialogMode.value = 'edit'
  Object.assign(formData, task)
  dialogVisible.value = true
}

const openViewDialog = (task) => {
  dialogMode.value = 'view'
  Object.assign(formData, task)
  dialogVisible.value = true
}

const handleSubmit = () => {
  // 手动校验
  let valid = true
  if (!formData.pileNo) {
    valid = false
    ElMessage.error('请输入桩号')
    return
  }
  if (!formData.planDate) {
    valid = false
    ElMessage.error('请选择计划检测时间')
    return
  }
  if (!formData.duration || formData.duration < 1) {
    valid = false
    ElMessage.error('请输入有效的预计工期')
    return
  }
  if (!formData.manager) {
    valid = false
    ElMessage.error('请输入负责人')
    return
  }
  if (!formData.status) {
    valid = false
    ElMessage.error('请选择状态')
    return
  }

  if (!valid) return

  loading.submit = true
  setTimeout(() => {
    loading.submit = false
    if (dialogMode.value === 'add') {
      ganttTasks.value.push({
        id: ganttTasks.value.length + 1,
        ...formData
      })
      ElMessage.success('新增任务成功')
    } else {
      const index = ganttTasks.value.findIndex(t => t.id === formData.id)
      if (index !== -1) {
        ganttTasks.value[index] = { ...formData }
      }
      ElMessage.success('编辑任务成功')
    }
    dialogVisible.value = false
  }, 500)
}

const handleDelete = (task) => {
  ElMessageBox.confirm('确定要删除该检测任务吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = ganttTasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      ganttTasks.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

onMounted(() => {
  loading.gantt = true
  setTimeout(() => {
    loading.gantt = false
  }, 500)
})
</script>

<style lang='scss' scoped>
@use './gantt.scss';
</style>
