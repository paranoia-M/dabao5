<template>
  <div class="page-maintenance_schedule">
    <!-- 顶部信息条 -->
    <div class="schedule-topbar">
      <div class="topbar-left">
        <div class="topbar-title">
          <span class="title-icon">🛠️</span>
          <span>维护计划排程</span>
        </div>
        <div class="topbar-stats">
          <div class="stat-item">
            <span class="stat-label">总计划</span>
            <span class="stat-value">{{ maintenancePlanStore.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待执行</span>
            <span class="stat-value warn">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">执行中</span>
            <span class="stat-value primary">{{ runningCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本月完成</span>
            <span class="stat-value success">{{ completedThisMonth }}</span>
          </div>
        </div>
      </div>
      <div class="topbar-actions">
        <el-button class="action-btn export-btn" @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-button type="primary" class="action-btn add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增计划
        </el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="schedule-filters">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索计划名称/设备名称"
          clearable
          class="filter-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="statusFilter"
          placeholder="计划状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部状态" value="" />
          <el-option label="待执行" value="未开始" />
          <el-option label="执行中" value="执行中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已取消" value="取消" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="计划开始日期"
          end-placeholder="计划结束日期"
          value-format="YYYY-MM-DD"
          class="filter-date"
          @change="handleSearch"
        />
        <el-button class="action-btn query-btn" @click="handleSearch">查询</el-button>
        <el-button class="action-btn reset-btn" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 主区域：甘特图 -->
    <div class="schedule-main">
      <div class="gantt-wrapper">
        <!-- 左侧设备列表 -->
        <div class="gantt-sidebar">
          <div class="gantt-sidebar-header">设备名称</div>
          <div
            v-for="device in ganttDevices"
            :key="device.id"
            class="gantt-sidebar-row"
            :class="{ active: selectedPlan && selectedPlan.equipmentId === device.id }"
            @click="selectDevice(device)"
          >
            <span class="device-name" :title="device.name">{{ device.name }}</span>
            <span class="device-count">{{ getDevicePlanCount(device.id) }}</span>
          </div>
        </div>
        <!-- 右侧甘特图区域 -->
        <div class="gantt-canvas" ref="ganttCanvasRef">
          <!-- 时间轴头部 -->
          <div class="gantt-header">
            <div
              v-for="day in ganttDays"
              :key="day.date"
              class="gantt-header-cell"
              :class="{ today: day.isToday, weekend: day.isWeekend }"
            >
              <span class="header-weekday">{{ day.weekday }}</span>
              <span class="header-date">{{ day.dayNum }}</span>
            </div>
          </div>
          <!-- 甘特图主体 -->
          <div class="gantt-body">
            <div
              v-for="device in ganttDevices"
              :key="device.id"
              class="gantt-body-row"
            >
              <!-- 网格背景 -->
              <div
                v-for="day in ganttDays"
                :key="day.date"
                class="gantt-grid-cell"
                :class="{ today: day.isToday, weekend: day.isWeekend, alt: ganttDevices.indexOf(device) % 2 === 1 }"
              />
              <!-- 计划条块 -->
              <div
                v-for="plan in getDevicePlans(device.id)"
                :key="plan.id"
                class="gantt-bar"
                :class="['status-' + plan.status, { selected: selectedPlan && selectedPlan.id === plan.id }]"
                :style="getBarStyle(plan)"
                @click.stop="onBarClick(plan)"
                :title="plan.description + ' | ' + plan.responsible + ' | ' + formatTime(plan.planTime)"
              >
                <span class="bar-label">{{ plan.description }}</span>
                <span class="bar-time">{{ formatTime(plan.planTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部详情区 -->
    <div class="schedule-footer" v-if="selectedPlan">
      <div class="footer-header">
        <span class="footer-title">选中计划详情</span>
        <el-button text @click="selectedPlan = null">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="footer-body">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">计划名称</span>
            <span class="detail-value">{{ selectedPlan.description }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">设备名称</span>
            <span class="detail-value">{{ getDeviceName(selectedPlan.equipmentId) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">维护类型</span>
            <el-tag :type="getPlanTypeTag(selectedPlan.planType)" size="small">{{ selectedPlan.planType }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">负责人</span>
            <span class="detail-value">{{ selectedPlan.responsible }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">计划时间</span>
            <span class="detail-value">{{ formatTime(selectedPlan.planTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <el-tag :type="getStatusTag(selectedPlan.status)" size="small">{{ getStatusLabel(selectedPlan.status) }}</el-tag>
          </div>
          <div class="detail-item" v-if="getRelatedOrder(selectedPlan.id)">
            <span class="detail-label">关联工单</span>
            <el-tag type="info" size="small">{{ getRelatedOrder(selectedPlan.id)?.id }}</el-tag>
          </div>
        </div>
        <div class="detail-actions">
          <el-button size="small" type="primary" @click="handleDetail(selectedPlan)">查看完整详情</el-button>
          <el-button
            v-if="selectedPlan.status === '未开始'"
            size="small"
            type="success"
            @click="handleStart(selectedPlan)"
          >开始执行</el-button>
          <el-button
            v-if="selectedPlan.status === '执行中'"
            size="small"
            type="warning"
            @click="handleComplete(selectedPlan)"
          >完成</el-button>
          <el-button
            v-if="selectedPlan.status === '执行中'"
            size="small"
            @click="handleCancel(selectedPlan)"
          >取消</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑维护计划' : '新增维护计划'"
      width="min(640px, 92vw)"
      top="5vh"
      :close-on-click-modal="false"
      class="plan-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        label-position="right"
        class="plan-form"
      >
        <el-form-item label="计划名称" prop="description">
          <el-input v-model="formData.description" placeholder="请输入计划名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="关联设备" prop="equipmentId">
          <el-select
            v-model="formData.equipmentId"
            placeholder="请选择设备"
            filterable
            remote
            :remote-method="remoteSearchDevice"
            :loading="deviceLoading"
            style="width: 100%"
          >
            <el-option
              v-for="d in deviceOptions"
              :key="d.id"
              :label="d.name + ' (' + d.model + ')'"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护类型" prop="planType">
          <el-select v-model="formData.planType" placeholder="请选择维护类型" style="width: 100%">
            <el-option label="定期维护" value="定期维护" />
            <el-option label="临时维护" value="临时维护" />
            <el-option label="大修" value="大修" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="responsible">
          <el-select
            v-model="formData.responsible"
            placeholder="请选择负责人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="person in workerOptions"
              :key="person"
              :label="person"
              :value="person"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始时间" prop="planTime">
          <el-date-picker
            v-model="formData.planTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled-date="disabledPastDate"
          />
        </el-form-item>
        <el-form-item label="计划结束时间" prop="planEndTime">
          <el-date-picker
            v-model="formData.planEndTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled-date="disabledPastDate"
          />
        </el-form-item>
        <el-form-item label="维护内容" prop="maintainContent">
          <el-input
            v-model="formData.maintainContent"
            type="textarea"
            :rows="3"
            placeholder="请描述维护内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="备注信息（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">确认{{ isEdit ? '修改' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="维护计划详情"
      size="500px"
      direction="rtl"
      class="plan-drawer"
    >
      <template v-if="detailPlan">
        <div class="drawer-section">
          <div class="drawer-section-title">基本信息</div>
          <div class="drawer-grid">
            <div class="drawer-item">
              <span class="drawer-label">计划名称</span>
              <span class="drawer-value">{{ detailPlan.description }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">设备名称</span>
              <span class="drawer-value">{{ getDeviceName(detailPlan.equipmentId) }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">设备型号</span>
              <span class="drawer-value">{{ getDeviceModel(detailPlan.equipmentId) }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">维护类型</span>
              <el-tag :type="getPlanTypeTag(detailPlan.planType)" size="small">{{ detailPlan.planType }}</el-tag>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">负责人</span>
              <span class="drawer-value">{{ detailPlan.responsible }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">计划时间</span>
              <span class="drawer-value">{{ formatTime(detailPlan.planTime) }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">状态</span>
              <el-tag :type="getStatusTag(detailPlan.status)" size="small">{{ getStatusLabel(detailPlan.status) }}</el-tag>
            </div>
            <div class="drawer-item" v-if="getRelatedOrder(detailPlan.id)">
              <span class="drawer-label">工单编号</span>
              <span class="drawer-value">{{ getRelatedOrder(detailPlan.id)?.id }}</span>
            </div>
          </div>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">维护内容</div>
          <p class="drawer-content">{{ detailPlan.maintainContent || detailPlan.description || '暂无说明' }}</p>
        </div>
        <div class="drawer-section" v-if="getRelatedOrder(detailPlan.id)">
          <div class="drawer-section-title">工单进度</div>
          <div class="order-progress">
            <el-steps :active="orderStepIndex(getRelatedOrder(detailPlan.id)?.status)" align-center finish-status="success" process-status="primary">
              <el-step title="已派工" />
              <el-step title="执行中" />
              <el-step title="已完成" />
            </el-steps>
          </div>
          <div class="order-info">
            <div class="drawer-item">
              <span class="drawer-label">工单类型</span>
              <span class="drawer-value">{{ getRelatedOrder(detailPlan.id)?.orderType }}</span>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">优先级</span>
              <el-tag :type="getPriorityTag(getRelatedOrder(detailPlan.id)?.priority)" size="small">{{ getRelatedOrder(detailPlan.id)?.priority }}</el-tag>
            </div>
            <div class="drawer-item">
              <span class="drawer-label">执行人</span>
              <span class="drawer-value">{{ getRelatedOrder(detailPlan.id)?.handler }}</span>
            </div>
          </div>
        </div>
        <div class="drawer-section" v-if="detailPlan.remark">
          <div class="drawer-section-title">备注</div>
          <p class="drawer-content">{{ detailPlan.remark }}</p>
        </div>
      </template>
    </el-drawer>

    <!-- 确认操作弹窗 -->
    <el-dialog
      v-model="confirmDialog.visible"
      :title="confirmDialog.title"
      width="420px"
      :close-on-click-modal="false"
      class="confirm-dialog"
    >
      <p class="confirm-msg">{{ confirmDialog.message }}</p>
      <template #footer>
        <el-button @click="confirmDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="onConfirmAction">{{ confirmDialog.confirmText }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Close } from '@element-plus/icons-vue'
import { useMaintenancePlanStore } from '@/stores/maintenancePlan'
import { useEquipmentStore } from '@/stores/equipment'
import { useMaintenanceOrderStore } from '@/stores/maintenanceOrder'
import { useProductionLineStore } from '@/stores/productionLine'
import dayjs from 'dayjs'

// ========== Store ==========
const maintenancePlanStore = useMaintenancePlanStore()
const equipmentStore = useEquipmentStore()
const maintenanceOrderStore = useMaintenanceOrderStore()
const productionLineStore = useProductionLineStore()

// ========== 状态变量 ==========
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const selectedPlan = ref(null)
const ganttCanvasRef = ref(null)

// 新增/编辑
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)
const deviceLoading = ref(false)
const deviceOptions = ref([])
const workerOptions = ['张伟', '李娜', '王芳', '刘洋', '陈静', '赵鑫', '孙丽', '周磊', '吴敏', '王明']

const formData = ref({
  id: '',
  description: '',
  equipmentId: '',
  planType: '',
  responsible: '',
  planTime: '',
  planEndTime: '',
  maintainContent: '',
  remark: ''
})

const formRules = {
  description: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  equipmentId: [
    { required: true, message: '请选择关联设备', trigger: 'change' }
  ],
  planType: [
    { required: true, message: '请选择维护类型', trigger: 'change' }
  ],
  responsible: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ],
  planTime: [
    { required: true, message: '请选择计划开始时间', trigger: 'change' }
  ],
  planEndTime: [
    { required: true, message: '请选择计划结束时间', trigger: 'change' }
  ]
}

// 详情抽屉
const drawerVisible = ref(false)
const detailPlan = ref(null)

// 确认操作
const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '确认',
  action: null,
  payload: null
})
const confirmLoading = ref(false)

// ========== 计算属性 ==========
const pendingCount = computed(() => {
  return maintenancePlanStore.maintenancePlanList.filter(p => p.status === '未开始').length
})

const runningCount = computed(() => {
  return maintenancePlanStore.maintenancePlanList.filter(p => p.status === '执行中').length
})

const completedThisMonth = computed(() => {
  const now = dayjs()
  return maintenancePlanStore.maintenancePlanList.filter(p => {
    if (p.status !== '已完成') return false
    const t = dayjs(p.planTime)
    return t.isSame(now, 'month')
  }).length
})

// 筛选后的计划列表
const filteredPlans = computed(() => {
  let list = [...maintenancePlanStore.maintenancePlanList]

  // 关键词
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(p => {
      const name = (p.description || '').toLowerCase()
      const devName = (getDeviceName(p.equipmentId) || '').toLowerCase()
      return name.includes(kw) || devName.includes(kw)
    })
  }

  // 状态
  if (statusFilter.value) {
    list = list.filter(p => p.status === statusFilter.value)
  }

  // 日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dayjs(dateRange.value[0])
    const end = dayjs(dateRange.value[1]).endOf('day')
    list = list.filter(p => {
      const pt = dayjs(p.planTime)
      return pt.isAfter(start) && pt.isBefore(end)
    })
  }

  // 按计划时间降序
  list.sort((a, b) => dayjs(b.planTime).unix() - dayjs(a.planTime).unix())

  return list
})

// 甘特图设备列表（有计划的设备 + 所有设备）
const ganttDevices = computed(() => {
  const plans = filteredPlans.value
  const deviceIds = [...new Set(plans.map(p => p.equipmentId))]
  const devices = deviceIds.map(id => equipmentStore.findById(id)).filter(Boolean)
  // 按生产线分组排序
  return devices.sort((a, b) => (a.productionLineId || '').localeCompare(b.productionLineId || ''))
})

// 甘特图日期范围
const ganttDays = computed(() => {
  const plans = filteredPlans.value
  if (plans.length === 0) {
    const now = dayjs()
    const days = []
    for (let i = -7; i <= 7; i++) {
      const d = now.add(i, 'day')
      days.push({
        date: d.format('YYYY-MM-DD'),
        dayNum: d.format('DD'),
        weekday: d.format('ddd'),
        isToday: d.isSame(now, 'day'),
        isWeekend: d.day() === 0 || d.day() === 6
      })
    }
    return days
  }
  const times = plans.map(p => dayjs(p.planTime))
  const minTime = times.reduce((a, b) => a.isBefore(b) ? a : b)
  const maxTime = times.reduce((a, b) => a.isAfter(b) ? a : b)
  const start = minTime.subtract(2, 'day').startOf('day')
  const end = maxTime.add(2, 'day').endOf('day')
  const days = []
  let cur = start
  const now = dayjs()
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push({
      date: cur.format('YYYY-MM-DD'),
      dayNum: cur.format('DD'),
      weekday: cur.format('ddd'),
      isToday: cur.isSame(now, 'day'),
      isWeekend: cur.day() === 0 || cur.day() === 6
    })
    cur = cur.add(1, 'day')
  }
  return days
})

// ========== 工具函数 ==========
function getDeviceName(deviceId) {
  const dev = equipmentStore.findById(deviceId)
  return dev ? dev.name : '未知设备'
}

function getDeviceModel(deviceId) {
  const dev = equipmentStore.findById(deviceId)
  return dev ? dev.model : '-'
}

function formatTime(time) {
  if (!time) return '-'
  return dayjs(time).format('MM-DD HH:mm')
}

function getStatusLabel(status) {
  const map = { '未开始': '待执行', '执行中': '执行中', '已完成': '已完成', '取消': '已取消' }
  return map[status] || status
}

function getStatusTag(status) {
  const map = { '未开始': 'warning', '执行中': 'primary', '已完成': 'success', '取消': 'info' }
  return map[status] || 'info'
}

function getPlanTypeTag(type) {
  const map = { '定期维护': 'primary', '临时维护': 'warning', '大修': 'danger' }
  return map[type] || 'info'
}

function getPriorityTag(priority) {
  const map = { '低': 'info', '中': 'primary', '高': 'warning', '紧急': 'danger' }
  return map[priority] || 'info'
}

function getDevicePlans(deviceId) {
  return filteredPlans.value.filter(p => p.equipmentId === deviceId)
}

function getDevicePlanCount(deviceId) {
  return getDevicePlans(deviceId).length
}

function getRelatedOrder(planId) {
  return maintenanceOrderStore.maintenanceOrderList.find(o => o.planId === planId)
}

function orderStepIndex(status) {
  const map = { '待处理': 0, '处理中': 1, '待质检': 1, '已完成': 2, '驳回': 0 }
  return map[status] || 0
}

function disabledPastDate(time) {
  return time.getTime() < Date.now() - 86400000
}

// ========== 甘特图样式计算 ==========
function getBarStyle(plan) {
  if (!plan || !plan.planTime || ganttDays.value.length === 0) {
    return { display: 'none' }
  }
  const planDate = dayjs(plan.planTime)
  const firstDay = dayjs(ganttDays.value[0].date)
  const lastDay = dayjs(ganttDays.value[ganttDays.value.length - 1].date)
  const totalDays = lastDay.diff(firstDay, 'day') + 1

  // 计算开始偏移
  const startOffset = planDate.diff(firstDay, 'day')
  // 持续时间（天）
  const durationMap = { '定期维护': 1.5, '临时维护': 0.8, '大修': 3 }
  const duration = durationMap[plan.planType] || 1
  // 结束偏移
  const endOffset = startOffset + duration

  const leftPct = Math.max(0, (startOffset / totalDays) * 100)
  const widthPct = Math.min((duration / totalDays) * 100, 100 - leftPct)

  return {
    left: leftPct + '%',
    width: Math.max(widthPct, 2) + '%'
  }
}

// ========== 交互函数 ==========
function handleAdd() {
  isEdit.value = false
  formData.value = {
    id: '',
    description: '',
    equipmentId: '',
    planType: '',
    responsible: '',
    planTime: '',
    planEndTime: '',
    maintainContent: '',
    remark: ''
  }
  deviceOptions.value = [...equipmentStore.equipmentList]
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

function handleEdit(plan) {
  isEdit.value = true
  const dev = equipmentStore.findById(plan.equipmentId)
  formData.value = {
    id: plan.id,
    description: plan.description || '',
    equipmentId: plan.equipmentId,
    planType: plan.planType,
    responsible: plan.responsible,
    planTime: plan.planTime,
    planEndTime: plan.planEndTime || dayjs(plan.planTime).add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    maintainContent: plan.maintainContent || plan.description || '',
    remark: plan.remark || ''
  }
  deviceOptions.value = [...equipmentStore.equipmentList]
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

function handleDelete(plan) {
  const hasOrder = getRelatedOrder(plan.id)
  let msg = `确认删除计划「${plan.description}」吗？删除后不可恢复。`
  if (hasOrder) {
    msg = `该计划已生成工单（${hasOrder.id}），删除将同时作废工单，确认是否继续？`
  }
  ElMessageBox.confirm(msg, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 如果有工单，同时删除工单
    if (hasOrder) {
      maintenanceOrderStore.remove(hasOrder.id)
    }
    maintenancePlanStore.remove(plan.id)
    if (selectedPlan.value && selectedPlan.value.id === plan.id) {
      selectedPlan.value = null
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleStart(plan) {
  confirmDialog.value = {
    visible: true,
    title: '开始执行计划',
    message: `确认开始执行计划「${plan.description}」？将生成工单并通知负责人 ${plan.responsible}。`,
    confirmText: '确认开始',
    action: 'start',
    payload: plan
  }
}

function handleComplete(plan) {
  confirmDialog.value = {
    visible: true,
    title: '完成计划',
    message: `确认完成计划「${plan.description}」？完成后设备状态将恢复为待机。`,
    confirmText: '确认完成',
    action: 'complete',
    payload: plan
  }
}

function handleCancel(plan) {
  confirmDialog.value = {
    visible: true,
    title: '取消计划',
    message: `确认取消计划「${plan.description}」？`,
    confirmText: '确认取消',
    action: 'cancel',
    payload: plan
  }
}

function handleDetail(plan) {
  detailPlan.value = plan
  drawerVisible.value = true
}

function handleExport() {
  // 导出当前筛选列表
  const list = filteredPlans.value
  if (list.length === 0) {
    ElMessage.warning('当前筛选结果为空，无法导出')
    return
  }
  // 模拟导出：生成CSV并下载
  const headers = ['计划名称', '设备名称', '维护类型', '负责人', '计划时间', '状态', '维护内容']
  const rows = list.map(p => [
    p.description,
    getDeviceName(p.equipmentId),
    p.planType,
    p.responsible,
    p.planTime,
    getStatusLabel(p.status),
    p.description
  ])
  let csv = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(r => {
    csv += r.map(v => `"${v || ''}"`).join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `维护计划_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function handleSearch() {
  // 计算属性已自动响应
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = ''
  dateRange.value = []
}

function selectDevice(device) {
  // 选中设备，如果有该设备的计划，选中第一个
  const plans = getDevicePlans(device.id)
  if (plans.length > 0) {
    selectedPlan.value = plans[0]
  }
}

function onBarClick(plan) {
  selectedPlan.value = plan
}

function remoteSearchDevice(query) {
  if (query) {
    deviceLoading.value = true
    setTimeout(() => {
      deviceOptions.value = equipmentStore.equipmentList.filter(d =>
        d.name.includes(query) || d.model.includes(query) || d.id.includes(query)
      )
      deviceLoading.value = false
    }, 200)
  } else {
    deviceOptions.value = [...equipmentStore.equipmentList]
  }
}

// ========== 确认操作处理 ==========
function onConfirmAction() {
  const { action, payload } = confirmDialog.value
  confirmLoading.value = true

  setTimeout(() => {
    try {
      if (action === 'start') {
        // 状态变更为执行中
        maintenancePlanStore.update(payload.id, { status: '执行中' })
        // 生成工单
        const now = dayjs()
        const seq = String(maintenanceOrderStore.maintenanceOrderList.length + 1).padStart(3, '0')
        const orderId = 'MT' + now.format('YYYYMMDD') + seq
        maintenanceOrderStore.add({
          id: orderId,
          planId: payload.id,
          equipmentId: payload.equipmentId,
          orderType: payload.planType === '定期维护' ? '定期维护' : payload.planType === '大修' ? '其他' : '故障维修',
          priority: '中',
          status: '待处理',
          assignee: payload.responsible,
          handler: payload.responsible,
          description: payload.description,
          completeTime: '',
          remark: '由维护计划自动生成'
        })
        // 更新设备状态为维护中（通过设备store的update）
        const dev = equipmentStore.findById(payload.equipmentId)
        if (dev && dev.status !== '故障') {
          equipmentStore.update(payload.equipmentId, { status: '警告' }) // 用"警告"表示维护中
        }
        ElMessage.success('已生成工单，通知已发送')
      } else if (action === 'complete') {
        maintenancePlanStore.update(payload.id, { status: '已完成' })
        // 更新设备状态为运行
        const dev = equipmentStore.findById(payload.equipmentId)
        if (dev) {
          equipmentStore.update(payload.equipmentId, { status: '运行' })
        }
        // 如果有工单，更新工单状态
        const order = getRelatedOrder(payload.id)
        if (order && order.status !== '已完成') {
          maintenanceOrderStore.update(order.id, {
            status: '已完成',
            completeTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
          })
        }
        ElMessage.success('计划已完成')
      } else if (action === 'cancel') {
        maintenancePlanStore.update(payload.id, { status: '取消' })
        // 如果有工单，取消工单
        const order = getRelatedOrder(payload.id)
        if (order && order.status !== '已完成') {
          maintenanceOrderStore.update(order.id, { status: '驳回', remark: '维护计划已取消' })
        }
        ElMessage.success('计划已取消')
      }
      confirmDialog.value.visible = false
      selectedPlan.value = null
      // 刷新选中状态
      if (selectedPlan.value && selectedPlan.value.id === payload.id) {
        const updated = maintenancePlanStore.findById(payload.id)
        selectedPlan.value = updated || null
      }
    } catch (e) {
      ElMessage.error('操作失败：' + e.message)
    } finally {
      confirmLoading.value = false
    }
  }, 300)
}

// ========== 表单提交 ==========
function onSubmit() {
  formRef.value.validate((valid) => {
    if (!valid) return

    // 检查计划时间必须为未来
    if (dayjs(formData.value.planTime).isBefore(dayjs())) {
      ElMessage.warning('计划执行时间必须为未来时间')
      return
    }

    // 检查结束时间必须大于开始时间
    if (dayjs(formData.value.planEndTime).isBefore(dayjs(formData.value.planTime))) {
      ElMessage.warning('计划结束时间必须晚于开始时间')
      return
    }

    // 设备冲突检测
    const conflict = checkTimeConflict(
      formData.value.equipmentId,
      formData.value.planTime,
      formData.value.planEndTime,
      formData.value.id
    )
    if (conflict) {
      ElMessage.warning('该设备在该时段已有维护计划，请调整时间或选择其他设备')
      return
    }

    submitLoading.value = true

    setTimeout(() => {
      try {
        const planData = {
          equipmentId: formData.value.equipmentId,
          planType: formData.value.planType,
          planTime: formData.value.planTime,
          responsible: formData.value.responsible,
          status: '未开始',
          description: formData.value.description,
          maintainContent: formData.value.maintainContent || '',
          remark: formData.value.remark || '',
          planEndTime: formData.value.planEndTime
        }

        if (isEdit.value) {
          maintenancePlanStore.update(formData.value.id, planData)
          ElMessage.success('修改成功')
        } else {
          const newId = 'maintenanceplan_' + Date.now()
          maintenancePlanStore.add({ id: newId, ...planData })
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        // 刷新选中
        selectedPlan.value = null
      } catch (e) {
        ElMessage.error('操作失败：' + e.message)
      } finally {
        submitLoading.value = false
      }
    }, 300)
  })
}

function checkTimeConflict(equipmentId, startTime, endTime, excludeId) {
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  return maintenancePlanStore.maintenancePlanList.some(p => {
    if (p.equipmentId !== equipmentId) return false
    if (p.id === excludeId) return false
    if (p.status !== '未开始' && p.status !== '执行中') return false
    const pStart = dayjs(p.planTime)
    const pEnd = dayjs(p.planEndTime || p.planTime).add(1, 'hour')
    // 时间段重叠检测
    return start.isBefore(pEnd) && end.isAfter(pStart)
  })
}

// ========== 生命周期 ==========
onMounted(() => {
  // 确保设备列表加载
  if (equipmentStore.equipmentList.length > 0) {
    deviceOptions.value = [...equipmentStore.equipmentList]
  } else {
    // 等待种子数据加载（实际种子已就位）
    setTimeout(() => {
      deviceOptions.value = [...equipmentStore.equipmentList]
    }, 100)
  }
})
</script>

<style scoped lang="scss">
@use './MaintenanceSchedule.scss' as *;
</style>