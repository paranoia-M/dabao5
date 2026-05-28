<template>
  <div class="page-integration_schedule">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <el-input
          v-model="keyword"
          placeholder="计划名称模糊搜索"
          clearable
          class="search-input"
        />
      </div>
      <div class="filter-item">
        <el-select v-model="statusFilter" placeholder="全部状态" clearable class="status-select">
          <el-option label="全部" value="" />
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
      </div>
      <div class="filter-item">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="执行时间开始"
          end-placeholder="执行时间结束"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
      </div>
      <div class="filter-item view-switch">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="day">日视图</el-radio-button>
          <el-radio-button value="week">周视图</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-item actions">
        <el-button type="primary" @click="openAddDialog">新增计划</el-button>
      </div>
    </div>

    <!-- 主体三栏布局 -->
    <div class="main-content">
      <!-- 左侧计划列表 -->
      <div class="plans-sidebar">
        <div
          v-for="plan in filteredPlans"
          :key="plan.id"
          class="plan-item"
          :class="{ active: selectedPlanId === plan.id }"
          @click="selectPlan(plan.id)"
        >
          <div class="plan-name">{{ plan.name }}</div>
          <div class="plan-meta">
            <el-tag :type="plan.status === '启用' ? 'success' : 'info'" size="small">
              {{ plan.status }}
            </el-tag>
            <span class="cron-badge">{{ plan.cronExpression }}</span>
          </div>
        </div>
      </div>

      <!-- 中央甘特图 -->
      <div class="gantt-container">
        <div class="gantt-header">
          <div class="gantt-timescale" ref="timescaleRef">
            <!-- 时间和日期刻度由 renderGantt 动态生成 -->
            <div
              v-for="(col, idx) in timeColumns"
              :key="idx"
              class="time-cell"
              :style="{ width: colWidth + 'px' }"
            >
              <div class="time-label">{{ col.label }}</div>
            </div>
          </div>
        </div>
        <div class="gantt-body">
          <div
            v-for="(plan, planIdx) in filteredPlans"
            :key="plan.id"
            class="gantt-row"
            :class="{ active: selectedPlanId === plan.id }"
          >
            <div class="gantt-row-bg" />
            <!-- 依赖连线 SVG -->
            <svg class="dependencies-svg" :style="{ height: '100%', width: '100%' }" v-if="plan.dependencies && plan.dependencies.length">
              <!-- 暂时不画具体的线，由后面通过JS动态绘制简化 -->
            </svg>
            <!-- 甘特条 -->
            <div
              v-if="plan.ganttBar"
              class="gantt-bar"
              :style="{
                left: plan.ganttBar.left + '%',
                width: plan.ganttBar.width + '%',
                backgroundColor: plan.ganttBar.color,
                opacity: plan.ganttBar.opacity
              }"
              @click="selectPlan(plan.id)"
            >
              <span class="bar-label">{{ plan.name }}</span>
            </div>
            <div v-else class="no-bar">暂无执行记录</div>
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="detail-panel" v-if="currentPlan">
        <div class="panel-header">
          <span class="panel-title">计划详情</span>
          <el-button size="small" text @click="selectedPlanId = null">关闭</el-button>
        </div>
        <div class="panel-body">
          <div class="info-grid">
            <div class="info-item">
              <label>计划名称</label>
              <span>{{ currentPlan.name }}</span>
            </div>
            <div class="info-item">
              <label>cron表达式</label>
              <span>{{ currentPlan.cronExpression }}</span>
            </div>
            <div class="info-item">
              <label>执行策略</label>
              <span>{{ currentPlan.retryPolicy?.exponentialBackoff ? '并行' : '串行' }}</span>
            </div>
            <div class="info-item">
              <label>失败重试次数</label>
              <span>{{ currentPlan.retryPolicy?.maxRetries ?? 0 }}</span>
            </div>
            <div class="info-item">
              <label>重试间隔（分钟）</label>
              <span>{{ currentPlan.retryPolicy?.retryIntervalMinutes ?? 0 }}</span>
            </div>
            <div class="info-item">
              <label>状态</label>
              <el-tag :type="currentPlan.status === '启用' ? 'success' : 'info'">{{ currentPlan.status }}</el-tag>
            </div>
          </div>
          <div class="section-title">最近执行记录</div>
          <el-table :data="planLogs" style="width: 100%" size="small" v-if="planLogs.length > 0">
            <el-table-column prop="id" label="执行ID" width="100" />
            <el-table-column prop="startTime" label="开始时间" width="140" />
            <el-table-column prop="endTime" label="结束时间" width="140" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'warning'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openLogDrawer(row)">日志</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-placeholder">暂无执行记录</div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="min(640px, 92vw)"
      top="5vh"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="right"
        class="plan-form"
      >
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="form.name" maxlength="50" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="计划描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
        <el-form-item label="cron表达式" prop="cronExpression">
          <el-input v-model="form.cronExpression" placeholder="如 0 0 2 * * ?" />
        </el-form-item>
        <el-form-item label="执行策略" prop="strategy">
          <el-select v-model="form.strategy" placeholder="请选择">
            <el-option label="串行" value="serial" />
            <el-option label="并行" value="parallel" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联数据资产" prop="assetIds">
          <el-select
            v-model="form.assetIds"
            multiple
            placeholder="选择关联资产"
            class="asset-select"
          >
            <el-option
              v-for="asset in dataAssetList"
              :key="asset.id"
              :label="asset.name"
              :value="asset.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="失败重试次数" prop="maxRetries">
          <el-input-number v-model="form.maxRetries" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="重试间隔(分钟)" prop="retryIntervalMinutes">
          <el-input-number v-model="form.retryIntervalMinutes" :min="0" :max="60" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 手动执行结果提示 -->
    <el-dialog
      title="执行触发"
      v-model="triggerDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="trigger-info">
        <el-icon class="trigger-icon" color="#67C23A"><CircleCheckFilled /></el-icon>
        <p>任务已触发，执行ID: <strong>{{ lastTriggerId }}</strong></p>
      </div>
      <template #footer>
        <el-button @click="triggerDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 日志抽屉 -->
    <el-drawer
      v-model="logDrawerVisible"
      title="执行日志"
      size="min(500px, 85vw)"
      direction="rtl"
    >
      <div v-if="currentLog">
        <p><strong>执行ID：</strong>{{ currentLog.id }}</p>
        <p><strong>开始时间：</strong>{{ currentLog.startTime }}</p>
        <p><strong>结束时间：</strong>{{ currentLog.endTime || '-' }}</p>
        <p><strong>状态：</strong>
          <el-tag :type="currentLog.status === '成功' ? 'success' : currentLog.status === '失败' ? 'danger' : 'warning'">
            {{ currentLog.status }}
          </el-tag>
        </p>
        <el-divider />
        <p><strong>日志内容：</strong></p>
        <pre class="log-content">{{ currentLog.logContent }}</pre>
      </div>
      <div v-else>
        <el-empty description="暂无日志" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { useIntegrationPlanStore } from '@/stores/integrationPlan'
import { useExecutionLogStore } from '@/stores/executionLog'
import { useDataAssetStore } from '@/stores/dataAsset'

// stores
const integrationPlanStore = useIntegrationPlanStore()
const executionLogStore = useExecutionLogStore()
const dataAssetStore = useDataAssetStore()

// data
const integrationPlanList = computed(() => integrationPlanStore.integrationPlanList)
const executionLogList = computed(() => executionLogStore.executionLogList)
const dataAssetList = computed(() => dataAssetStore.dataAssetList)

// 筛选
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([]) // 初始为 []，铁律要求
const viewMode = ref('day')

// 选中计划
const selectedPlanId = ref(null)

// 甘特图数据
const timeColumns = ref([])
const colWidth = ref(60)

// 计算基准时间：取所有 executionLog 的最早和最晚时间，或今天前后
const baseMinTime = computed(() => {
  const times = executionLogList.value
    .filter(l => l.startTime)
    .map(l => new Date(l.startTime).getTime())
  if (times.length === 0) return Date.now() - 7 * 24 * 60 * 60 * 1000
  return Math.min(...times)
})
const baseMaxTime = computed(() => {
  const times = executionLogList.value
    .filter(l => l.endTime)
    .map(l => new Date(l.endTime).getTime())
  if (times.length === 0) return Date.now() + 7 * 24 * 60 * 60 * 1000
  return Math.max(...times, Date.now())
})
const totalSpan = computed(() => baseMaxTime.value - baseMinTime.value)

// 时间列生成
function generateTimeColumns() {
  const start = new Date(baseMinTime.value)
  const end = new Date(baseMaxTime.value)
  const cols = []
  let cursor = new Date(start)
  while (cursor <= end) {
    const label = viewMode.value === 'day'
      ? `${cursor.getMonth() + 1}/${cursor.getDate()}`
      : `${cursor.getFullYear()}第${Math.ceil(cursor.getDate() / 7)}周`
    cols.push({ label, time: cursor.getTime() })
    if (viewMode.value === 'day') {
      cursor.setDate(cursor.getDate() + 1)
    } else {
      cursor.setDate(cursor.getDate() + 7)
    }
  }
  timeColumns.value = cols
  colWidth.value = viewMode.value === 'day' ? 50 : 100
}

// 为每个计划添加甘特条属性
const filteredPlans = computed(() => {
  let list = integrationPlanList.value
  if (keyword.value) {
    list = list.filter(p => p.name.includes(keyword.value))
  }
  if (statusFilter.value) {
    list = list.filter(p => p.status === statusFilter.value)
  }
  // 日期筛选：过滤计划的最新执行记录在 dateRange 内
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(p => {
      const logs = executionLogList.value.filter(l => l.planId === p.id)
      if (logs.length === 0) return false
      return logs.some(l => {
        const t = new Date(l.startTime).getTime()
        return t >= start && t < end
      })
    })
  }

  // 为每个计划计算甘特条
  return list.map(plan => {
    // 取该计划最近的一条 executionLog 作为时间依据
    const logs = executionLogList.value
      .filter(l => l.planId === plan.id)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    if (logs.length === 0) {
      return { ...plan, ganttBar: null }
    }
    const log = logs[0]
    const startTime = new Date(log.startTime).getTime()
    const endTime = log.endTime ? new Date(log.endTime).getTime() : startTime
    const left = totalSpan.value > 0 ? ((startTime - baseMinTime.value) / totalSpan.value) * 100 : 0
    const width = totalSpan.value > 0 ? ((endTime - startTime) / totalSpan.value) * 100 : 0
    let color = '#D97706' // 默认
    let opacity = 0.8
    if (log.status === '成功') {
      color = '#52c41a'
    } else if (log.status === '失败') {
      color = '#ff4d4f'
    } else if (log.status === '运行中') {
      color = '#1890ff'
      opacity = 0.6
    }
    if (plan.status === '停用') {
      opacity = 0.4
    }
    return { ...plan, ganttBar: { left: Math.max(left, 0), width: Math.max(width, 2), color, opacity } }
  })
})

// 当前选中计划
const currentPlan = computed(() => {
  if (!selectedPlanId.value) return null
  return integrationPlanList.value.find(p => p.id === selectedPlanId.value) || null
})

// 当前计划的执行日志
const planLogs = computed(() => {
  if (!selectedPlanId.value) return []
  return executionLogList.value
    .filter(l => l.planId === selectedPlanId.value)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
})

// 选择计划
function selectPlan(id) {
  selectedPlanId.value = id
}

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增计划')
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)

const form = ref({
  name: '',
  description: '',
  cronExpression: '',
  strategy: 'serial',
  assetIds: [],
  maxRetries: 0,
  retryIntervalMinutes: 0
})

const formRules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { max: 50, message: '最多50个字符', trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: '请输入cron表达式', trigger: 'blur' },
    { pattern: /^(\*|\d+)(\s+\S+){4,6}$/, message: 'cron格式不合法', trigger: 'blur' }
  ]
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增计划'
  form.value = { name: '', description: '', cronExpression: '', strategy: 'serial', assetIds: [], maxRetries: 0, retryIntervalMinutes: 0 }
  dialogVisible.value = true
}

function openEditDialog(plan) {
  if (plan.status === '启用') {
    ElMessage.warning('计划已启用，无法编辑配置')
    return
  }
  isEdit.value = true
  editId.value = plan.id
  dialogTitle.value = '编辑计划'
  form.value = {
    name: plan.name,
    description: plan.description,
    cronExpression: plan.cronExpression,
    strategy: plan.retryPolicy?.exponentialBackoff ? 'parallel' : 'serial',
    assetIds: plan.dependencies || [],
    maxRetries: plan.retryPolicy?.maxRetries || 0,
    retryIntervalMinutes: plan.retryPolicy?.retryIntervalMinutes || 0
  }
  dialogVisible.value = true
}

async function submitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  const patch = {
    name: form.value.name,
    description: form.value.description,
    cronExpression: form.value.cronExpression,
    status: '停用', // 新增时默认停用
    dependencies: form.value.assetIds,
    retryPolicy: {
      maxRetries: form.value.maxRetries,
      retryIntervalMinutes: form.value.retryIntervalMinutes,
      exponentialBackoff: form.value.strategy === 'parallel'
    }
  }
  try {
    if (isEdit.value) {
      // 检查计划名称是否重复（排除自身）
      const exist = integrationPlanList.value.find(p => p.name === patch.name && p.id !== editId.value)
      if (exist) {
        ElMessage.warning('计划名称重复，请重新输入')
        return
      }
      integrationPlanStore.update(editId.value, patch)
      ElMessage.success('计划更新成功')
    } else {
      // 检查名称重复
      const exist = integrationPlanList.value.find(p => p.name === patch.name)
      if (exist) {
        ElMessage.warning('计划名称重复，请重新输入')
        return
      }
      integrationPlanStore.add({ ...patch, id: 'integrationplan_' + Date.now() })
      ElMessage.success('计划创建成功')
    }
    dialogVisible.value = false
    // 重新计算甘特图
    nextTick(generateTimeColumns)
  } finally {
    submitLoading.value = false
  }
}

// 删除
async function handleDelete(plan) {
  // 检查是否有运行中的任务
  const runningLogs = executionLogList.value.filter(l => l.planId === plan.id && l.status === '运行中')
  if (runningLogs.length > 0) {
    ElMessage.warning('计划执行中，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除计划 "' + plan.name + '" 吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    integrationPlanStore.remove(plan.id)
    ElMessage.success('计划已删除')
    if (selectedPlanId.value === plan.id) selectedPlanId.value = null
  } catch {
    // 取消
  }
}

// 启用/停用
async function toggleStatus(plan) {
  const newStatus = plan.status === '启用' ? '停用' : '启用'
  const action = newStatus === '启用' ? '启用' : '停用'
  if (newStatus === '启用') {
    // 检查cron合法性
    if (!/^(\*|\d+)(\s+\S+){4,6}$/.test(plan.cronExpression)) {
      ElMessage.warning('请先修正cron表达式')
      return
    }
  }
  try {
    await ElMessageBox.confirm(`确定要${action}计划 "${plan.name}" 吗？`, '确认', {
      confirmButtonText: action,
      cancelButtonText: '取消'
    })
    integrationPlanStore.update(plan.id, { status: newStatus })
    ElMessage.success(`计划已${action}`)
  } catch {
    // 取消
  }
}

// 手动执行
const triggerDialogVisible = ref(false)
const lastTriggerId = ref('')

function handleManualExec(plan) {
  if (plan.status !== '启用') {
    ElMessage.warning('仅启用状态的计划可手动执行')
    return
  }
  const newLog = {
    id: 'executionlog_' + Date.now(),
    planId: plan.id,
    startTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    endTime: null,
    status: '运行中',
    logContent: '手动触发开始执行...'
  }
  executionLogStore.add(newLog)
  lastTriggerId.value = newLog.id
  triggerDialogVisible.value = true
  // 模拟执行完成（可选，延时后更新状态，但不强制，让用户看到运行中）
  setTimeout(() => {
    const log = executionLogStore.findById(newLog.id)
    if (log && log.status === '运行中') {
      executionLogStore.update(newLog.id, {
        status: '成功',
        endTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        logContent: '手动触发执行成功，耗时约1秒'
      })
    }
  }, 2000)
}

// 日志抽屉
const logDrawerVisible = ref(false)
const currentLog = ref(null)

function openLogDrawer(log) {
  currentLog.value = log
  logDrawerVisible.value = true
}

// 初始化
onMounted(() => {
  generateTimeColumns()
})

// 当视图模式变化时重新生成时间列
watch(viewMode, () => {
  generateTimeColumns()
})
</script>

<style scoped lang="scss">
@use './IntegrationSchedule.scss' as *;
</style>