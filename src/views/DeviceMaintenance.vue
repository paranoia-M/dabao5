<template>
  <div class="page-device-maintenance">
    <!-- 顶部：筛选与操作区 -->
    <div class="top-bar">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索设备名称/故障描述"
          clearable
          style="width:260px"
          @input="onFilterChange"
        />
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:150px" @change="onFilterChange">
          <el-option label="全部" value="全部" />
          <el-option label="待处理" value="待处理" />
          <el-option label="处理中" value="处理中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="发起时间起"
          end-placeholder="发起时间止"
          value-format="YYYY-MM-DD"
          style="width:280px"
          @change="onFilterChange"
        />
        <el-button type="primary" @click="onFilterChange">查询</el-button>
        <el-button type="primary" @click="openAddDialog">新增工单</el-button>
        <el-button plain @click="exportCSV">导出</el-button>
      </div>
    </div>

    <!-- 主体区域：左侧节点图 + 右侧列表 -->
    <div class="main-body">
      <!-- 左侧审批流程节点图（60%） -->
      <div class="flow-chart-area">
        <div class="section-title">审批流程节点图</div>
        <div class="flow-chart">
          <div class="flow-node" :class="{ active: currentRecord?.status !== '待处理' }">
            <div class="node-dot" :class="{ done: currentRecord?.status !== '待处理', current: currentRecord?.status === '待处理' }">
              <span class="dot-inner"></span>
            </div>
            <div class="node-label">待处理</div>
            <div class="node-meta" v-if="currentRecord?.status === '待处理'">
              <span class="node-time">{{ currentRecord?.createTime }}</span>
            </div>
            <div class="node-meta" v-else-if="currentStep?.start">
              <span class="node-operator">{{ currentStep.start.operator }}</span>
              <span class="node-time">{{ currentStep.start.operateTime }}</span>
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" :class="{ active: currentRecord?.status === '处理中' || currentRecord?.status === '已完成' }">
            <div class="node-dot" :class="{ done: currentRecord?.status === '处理中' || currentRecord?.status === '已完成', current: currentRecord?.status === '处理中' }">
              <span class="dot-inner"></span>
            </div>
            <div class="node-label">处理中</div>
            <div class="node-meta" v-if="currentStep?.start">
              <span class="node-operator">{{ currentStep.start.operator }}</span>
              <span class="node-time">{{ currentStep.start.operateTime }}</span>
            </div>
            <div class="node-meta" v-else-if="currentRecord?.status === '待处理'">
              <span style="color:#909399">待开始</span>
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-node" :class="{ active: currentRecord?.status === '已完成' }">
            <div class="node-dot" :class="{ done: currentRecord?.status === '已完成', current: false }">
              <span class="dot-inner"></span>
            </div>
            <div class="node-label">已完成</div>
            <div class="node-meta" v-if="currentStep?.finish">
              <span class="node-operator">{{ currentStep.finish.operator }}</span>
              <span class="node-time">{{ currentStep.finish.operateTime }}</span>
            </div>
            <div class="node-meta" v-else-if="currentRecord?.status !== '已完成'">
              <span style="color:#909399">未完成</span>
            </div>
          </div>
        </div>
        <div class="flow-detail" v-if="currentRecord">
          <div class="flow-detail-title">维护记录摘要</div>
          <div class="flow-detail-grid">
            <div class="detail-item"><label>设备</label><span>{{ deviceName(currentRecord.deviceId) }}</span></div>
            <div class="detail-item"><label>维护类型</label><span>{{ currentRecord.maintenanceType }}</span></div>
            <div class="detail-item"><label>负责人</label><span>{{ currentRecord.assignee }}</span></div>
            <div class="detail-item"><label>状态</label><el-tag :type="statusTagType(currentRecord.status)" size="small">{{ currentRecord.status }}</el-tag></div>
          </div>
        </div>
      </div>

      <!-- 右侧维护任务列表（30%） -->
      <div class="task-list-area">
        <div class="section-title">维护任务列表</div>
        <el-table
          :data="filteredList"
          highlight-current-row
          @current-change="onRowSelect"
          height="calc(100vh - 240px)"
          style="width:100%"
          stripe
        >
          <el-table-column prop="id" label="编号" width="140" />
          <el-table-column label="设备" min-width="120">
            <template #default="{ row }">
              <span class="text-ellipsis">{{ deviceName(row.deviceId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="100" prop="assignee" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
              <el-button link type="primary" :disabled="row.status !== '待处理'" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" :disabled="row.status === '已完成'" @click="handleDelete(row)">删除</el-button>
              <el-button
                link
                type="warning"
                :disabled="row.status === '已完成'"
                @click="handleStatusFlow(row)"
              >
                {{ row.status === '待处理' ? '开始处理' : row.status === '处理中' ? '完成处理' : '' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 底部完成状态统计行 -->
    <div class="bottom-stats">
      <div class="stat-item">
        <span class="stat-label">全部</span>
        <span class="stat-value">{{ store.maintenanceList.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">待处理</span>
        <span class="stat-value pending">{{ stats.pending }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">处理中</span>
        <span class="stat-value processing">{{ stats.processing }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已完成</span>
        <span class="stat-value completed">{{ stats.completed }}</span>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑维护工单' : '新增维护工单'"
      width="min(600px,92vw)"
      class="device-maintenance-detail-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="设备名称" prop="deviceId">
          <el-select v-model="form.deviceId" placeholder="请选择设备" style="width:100%">
            <el-option
              v-for="d in deviceStore.deviceList"
              :key="d.id"
              :label="d.deviceName"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护类型" prop="maintenanceType">
          <el-input v-model="form.maintenanceType" placeholder="如：周期性巡检、故障维修" />
        </el-form-item>
        <el-form-item label="故障描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="申请人" prop="applicant">
          <el-input v-model="form.applicant" />
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="form.assignee" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer
      v-model="detailVisible"
      :size="detailDrawerSize"
      direction="rtl"
      class="device-maintenance-detail-drawer"
      title="维护工单详情"
    >
      <template #default>
        <div v-if="detailRecord" class="detail-content">
          <div class="detail-section">
            <div class="detail-grid">
              <div class="detail-item"><label>编号</label><span>{{ detailRecord.id }}</span></div>
              <div class="detail-item"><label>设备</label><span>{{ deviceName(detailRecord.deviceId) }}</span></div>
              <div class="detail-item"><label>维护类型</label><span>{{ detailRecord.maintenanceType }}</span></div>
              <div class="detail-item"><label>故障描述</label><span>{{ detailRecord.description }}</span></div>
              <div class="detail-item"><label>申请人</label><span>{{ detailRecord.applicant }}</span></div>
              <div class="detail-item"><label>负责人</label><span>{{ detailRecord.assignee }}</span></div>
              <div class="detail-item"><label>发起时间</label><span>{{ detailRecord.createTime }}</span></div>
              <div class="detail-item"><label>完成时间</label><span>{{ detailRecord.finishTime || '-' }}</span></div>
              <div class="detail-item"><label>状态</label><el-tag :type="statusTagType(detailRecord.status)" size="small">{{ detailRecord.status }}</el-tag></div>
            </div>
          </div>
          <div class="detail-section">
            <div class="timeline-title">维修步骤</div>
            <el-timeline v-if="approvalSteps.length > 0">
              <el-timeline-item
                v-for="step in approvalSteps"
                :key="step.id"
                :timestamp="step.operateTime"
                placement="top"
              >
                <div class="step-item">
                  <el-tag :type="step.action === '开始处理' ? 'warning' : 'success'" size="small">{{ step.action }}</el-tag>
                  <span class="step-operator">{{ step.operator }}</span>
                  <span class="step-comment">{{ step.comment }}</span>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无维修步骤记录" />
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMaintenanceRecordStore } from '@/stores/maintenanceRecord'
import { useDeviceStore } from '@/stores/device'
import { useMaintenanceApprovalStore } from '@/stores/maintenanceApproval'

const store = useMaintenanceRecordStore()
const deviceStore = useDeviceStore()
const approvalStore = useMaintenanceApprovalStore()

// 筛选条件
const keyword = ref('')
const statusFilter = ref('全部')
const dateRange = ref([])
const filteredList = computed(() => {
  let list = store.maintenanceList
  if (keyword.value) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(item => {
      const d = deviceStore.deviceList.find(d => d.id === item.deviceId)
      const dn = d ? d.deviceName.toLowerCase() : ''
      return dn.includes(kw) || item.description.toLowerCase().includes(kw)
    })
  }
  if (statusFilter.value && statusFilter.value !== '全部') {
    list = list.filter(item => item.status === statusFilter.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    list = list.filter(item => {
      const t = new Date(item.createTime).getTime()
      return t >= new Date(start).getTime() && t <= new Date(end).getTime() + 86399999
    })
  }
  return list.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

// 统计
const stats = computed(() => {
  const all = store.maintenanceList
  const pending = all.filter(i => i.status === '待处理').length
  const processing = all.filter(i => i.status === '处理中').length
  const completed = all.filter(i => i.status === '已完成').length
  return { total: all.length, pending, processing, completed }
})

// 当前选中记录（默认第一条）
const currentRecord = ref(null)
const currentStep = computed(() => {
  if (!currentRecord.value) return {}
  const rec = currentRecord.value
  const steps = approvalStore.maintenanceApprovalList.filter(s => s.maintenanceId === rec.id)
  const start = steps.find(s => s.action === '开始处理') || null
  const finish = steps.find(s => s.action === '完成') || null
  return { start, finish }
})
function onRowSelect(row) {
  currentRecord.value = row
}
// 默认选中第一条有审批记录的记录，否则第一条
onMounted(() => {
  if (store.maintenanceList.length > 0) {
    const firstWithApproval = store.maintenanceList.find(r =>
      approvalStore.maintenanceApprovalList.some(a => a.maintenanceId === r.id)
    )
    currentRecord.value = firstWithApproval || store.maintenanceList[0]
  }
})

function deviceName(id) {
  const d = deviceStore.deviceList.find(d => d.id === id)
  return d ? d.deviceName : id
}
function statusTagType(s) {
  const map = { '待处理': 'warning', '处理中': 'primary', '已完成': 'success' }
  return map[s] || 'info'
}
function onFilterChange() {
  // 自动更新 filteredList
}

// 新增/编辑 dialog
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref(null)
const form = ref({
  deviceId: '',
  maintenanceType: '',
  description: '',
  applicant: '',
  assignee: ''
})
const formRules = {
  deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  maintenanceType: [{ required: true, message: '请输入维护类型', trigger: 'blur' }],
  description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }],
  applicant: [{ required: true, message: '请输入申请人', trigger: 'blur' }],
  assignee: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}
function openAddDialog() {
  isEdit.value = false
  editId.value = ''
  form.value = { deviceId: '', maintenanceType: '', description: '', applicant: '', assignee: '' }
  dialogVisible.value = true
}
function openEditDialog(row) {
  if (row.status !== '待处理') {
    ElMessage.warning('仅可编辑待处理的工单')
    return
  }
  isEdit.value = true
  editId.value = row.id
  form.value = {
    deviceId: row.deviceId,
    maintenanceType: row.maintenanceType,
    description: row.description,
    applicant: row.applicant,
    assignee: row.assignee
  }
  dialogVisible.value = true
}
function submitForm() {
  formRef.value.validate(valid => {
    if (!valid) return
    // 检查同一天同设备未完成记录（新增时）
    if (!isEdit.value) {
      const today = new Date().toISOString().slice(0, 10)
      const conflict = store.maintenanceList.find(r =>
        r.deviceId === form.value.deviceId &&
        r.status !== '已完成' &&
        r.createTime &&
        r.createTime.slice(0, 10) === today
      )
      if (conflict) {
        ElMessage.warning('同一设备当天已存在未完成的维护记录，请勿重复创建')
        return
      }
    }
    const newRecord = {
      ...form.value
    }
    if (isEdit.value) {
      store.update(editId.value, newRecord)
      ElMessage.success('编辑成功')
    } else {
      newRecord.status = '待处理'
      newRecord.createTime = new Date().toLocaleString('zh-CN', { hour12: false })
      store.add(newRecord)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
  })
}

// 删除
function handleDelete(row) {
  // 检查是否有关联的 maintenanceApproval 记录（模拟耗材关联）
  const related = approvalStore.maintenanceApprovalList.some(a => a.maintenanceId === row.id)
  if (related) {
    ElMessage.error('该记录已关联耗材出库记录，不可删除')
    return
  }
  ElMessageBox.confirm('确定删除该维护记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 状态流转
function handleStatusFlow(row) {
  const current = row.status
  let next = ''
  let action = ''
  if (current === '待处理') { next = '处理中'; action = '开始处理' }
  else if (current === '处理中') { next = '已完成'; action = '完成' }
  else return
  ElMessageBox.confirm(`确认将工单状态从“${current}”流转为“${next}”吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    // 更新主记录
    store.update(row.id, { status: next, finishTime: next === '已完成' ? now : row.finishTime })
    // 添加审批记录
    approvalStore.add({
      id: 'approval_' + Date.now(),
      maintenanceId: row.id,
      action: action,
      operator: '当前用户',
      operateTime: now,
      comment: '',
      previousStatus: current,
      newStatus: next
    })
    ElMessage.success('状态流转成功')
  }).catch(() => {})
}

// 详情 drawer
const detailVisible = ref(false)
const detailRecord = ref(null)
const detailDrawerSize = 'min(500px, 92vw)'
const approvalSteps = computed(() => {
  if (!detailRecord.value) return []
  return approvalStore.maintenanceApprovalList.filter(s => s.maintenanceId === detailRecord.value.id)
})
function viewDetail(row) {
  detailRecord.value = row
  detailVisible.value = true
}

// 导出 CSV
function exportCSV() {
  const data = filteredList.value
  if (data.length === 0) {
    ElMessage.warning('无数据可导出')
    return
  }
  const header = '编号,设备,维护类型,故障描述,申请人,负责人,状态,发起时间,完成时间\n'
  const rows = data.map(r => {
    const dn = deviceName(r.deviceId)
    return [r.id, dn, r.maintenanceType, `"${r.description}"`, r.applicant, r.assignee, r.status, r.createTime, r.finishTime || ''].join(',')
  }).join('\n')
  const csv = '\uFEFF' + header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `设备维护记录_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="scss">
@use './DeviceMaintenance.scss' as *;
</style>