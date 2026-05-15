<template>
  <div class="page-rectification_management" style="--page-primary: #EA580C;">
    <!-- 顶部信息条：KPI 状态分布 -->
    <div class="rect-kpi-row">
      <div class="rect-kpi-card" v-for="kpi in kpiList" :key="kpi.label" @click="filterByStatus(kpi.statusKey)">
        <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.count }}</div>
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-trend" v-if="kpi.trend !== undefined">
          <span :class="kpi.trend >= 0 ? 'up' : 'down'">
            <el-icon><ArrowUp v-if="kpi.trend >= 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(kpi.trend) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="rect-filter-bar">
      <el-input v-model="filterKeyword" placeholder="搜索整改编号 / 设备名称 / 负责人" clearable style="width: 260px" />
      <el-select v-model="filterStatus" multiple placeholder="状态筛选" style="width: 200px" clearable>
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-date-picker v-model="filterDateRange" type="datetimerange" range-separator="至" start-placeholder="计划完成开始" end-placeholder="计划完成结束" value-format="YYYY-MM-DD HH:mm:ss" style="width: 380px" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="showAddDialog = true">+ 新增整改</el-button>
      <el-button type="warning" @click="handleExport">导出 Excel</el-button>
    </div>

    <!-- 主舞台：整改甘特条列表 -->
    <div class="rect-main-stage">
      <!-- 甘特表头 -->
      <div class="rect-gantt-header">
        <span class="col-id">编号</span>
        <span class="col-device">设备名称</span>
        <span class="col-desc">隐患描述</span>
        <span class="col-person">负责人</span>
        <span class="col-gantt">计划 vs 实际</span>
        <span class="col-status">状态</span>
        <span class="col-actions">操作</span>
      </div>
      <div class="rect-gantt-body" v-if="filteredSortedList.length">
        <div class="rect-gantt-row" v-for="item in pagedList" :key="item.id">
          <span class="col-id">{{ item.id.slice(-6) }}</span>
          <span class="col-device" :title="getDeviceName(item)">{{ getDeviceName(item) }}</span>
          <span class="col-desc" :title="getHazardDesc(item)">{{ getHazardDesc(item) }}</span>
          <span class="col-person">{{ item.implementer }}</span>
          <span class="col-gantt">
            <div class="gantt-bar-wrapper">
              <div class="gantt-bar-plan" :style="{ left: ganttLeft(item) + '%', width: ganttWidth(item) + '%' }">
                <span class="gantt-label">{{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}</span>
              </div>
              <div class="gantt-bar-actual" v-if="item.actualEndDate" :style="{ left: ganttLeftActual(item) + '%', width: ganttWidthActual(item) + '%' }">
                <span class="gantt-label-actual">{{ formatDate(item.actualEndDate) }}</span>
              </div>
            </div>
          </span>
          <span class="col-status">
            <el-tag :type="statusTagType(item)" size="small">{{ displayStatus(item) }}</el-tag>
          </span>
          <span class="col-actions">
            <!-- 待审批状态：可审核、编辑、删除 -->
            <template v-if="item.approvalStatus === '待审批'">
              <el-button size="small" type="primary" @click="openAuditDialog(item)">审核</el-button>
              <el-button size="small" @click="openEditDialog(item)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(item)">删除</el-button>
            </template>
            <!-- 已通过待整改：显示开始整改（状态流转） -->
            <template v-else-if="item.approvalStatus === '通过' && item.status === '进行中'">
              <el-button size="small" type="success" @click="handleStartRectify(item)">开始整改</el-button>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
            <!-- 整改中：提交验收 -->
            <template v-else-if="item.status === '进行中' && item.approvalStatus === '通过' && item.startDate">
              <el-button size="small" type="warning" @click="handleSubmitAccept(item)">提交验收</el-button>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
            <!-- 已驳回 -->
            <template v-else-if="item.approvalStatus === '驳回' || item.status === '已驳回'">
              <el-tag type="danger">已驳回</el-tag>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
            <!-- 已完成 -->
            <template v-else-if="item.status === '已完成'">
              <el-tag type="success">已完成</el-tag>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
            <!-- 超期 -->
            <template v-else-if="isOverdue(item)">
              <el-tag type="danger">超期</el-tag>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
            <!-- 其他兜底 -->
            <template v-else>
              <el-button size="small" @click="openDetailDrawer(item)">详情</el-button>
            </template>
          </span>
        </div>
      </div>
      <div v-else class="rect-empty">
        <el-empty description="暂无整改任务数据" />
      </div>
    </div>

    <!-- 分页 -->
    <div class="rect-pagination" v-if="filteredSortedList.length">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredSortedList.length"
        layout="total, prev, pager, next"
        background
      />
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑整改任务' : '新增整改任务'" width="min(720px,92vw)" class="rect-dialog">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联设备" prop="equipmentId">
              <el-select v-model="form.equipmentId" placeholder="选择设备" filterable style="width:100%">
                <el-option v-for="eq in equipmentList" :key="eq.id" :label="eq.name" :value="eq.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改负责人" prop="implementer">
              <el-select v-model="form.implementer" placeholder="选择负责人" style="width:100%">
                <el-option v-for="p in personList" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划完成日期" prop="planDate">
              <el-date-picker v-model="form.planDate" type="date" placeholder="选择日期" :disabled-date="disablePast" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="隐患等级" prop="hazardType">
              <el-radio-group v-model="form.hazardType">
                <el-radio label="一般隐患">一般</el-radio>
                <el-radio label="重大隐患">重大</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="隐患描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="不少于10字" />
        </el-form-item>
        <el-form-item label="整改要求" prop="rectificationPlan">
          <el-input v-model="form.rectificationPlan" type="textarea" :rows="2" placeholder="输入整改要求" />
        </el-form-item>
        <el-form-item label="整改标准" prop="standard">
          <el-select v-model="form.standard" placeholder="选择标准" style="width:100%">
            <el-option v-for="std in standardOptions" :key="std" :label="std" :value="std" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 审核 Dialog -->
    <el-dialog v-model="showAuditDialog" title="整改审核" width="min(500px,90vw)" class="rect-dialog">
      <el-form :model="auditForm" :rules="auditRules" ref="auditFormRef" label-width="100px">
        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="auditForm.result">
            <el-radio label="通过">通过</el-radio>
            <el-radio label="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="opinion">
          <el-input v-model="auditForm.opinion" type="textarea" :rows="3" placeholder="至少5个字" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAuditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="showDetailDrawer" title="整改详情" size="600px" class="rect-drawer">
      <template v-if="detailItem">
        <div class="detail-grid">
          <div class="detail-field"><label>整改编号</label><span>{{ detailItem.id }}</span></div>
          <div class="detail-field"><label>关联设备</label><span>{{ getDeviceName(detailItem) }}</span></div>
          <div class="detail-field"><label>隐患描述</label><span>{{ getHazardDesc(detailItem) }}</span></div>
          <div class="detail-field"><label>隐患等级</label><span>{{ getHazardLevel(detailItem) }}</span></div>
          <div class="detail-field"><label>整改负责人</label><span>{{ detailItem.implementer }}</span></div>
          <div class="detail-field"><label>计划完成日期</label><span>{{ formatDate(detailItem.endDate) }}</span></div>
          <div class="detail-field"><label>实际完成日期</label><span>{{ formatDate(detailItem.actualEndDate) || '未完成' }}</span></div>
          <div class="detail-field"><label>整改状态</label><span>{{ displayStatus(detailItem) }}</span></div>
          <div class="detail-field"><label>审核意见</label><span>{{ detailItem.remarks || '无' }}</span></div>
          <div class="detail-field"><label>审批人</label><span>{{ detailItem.auditor || '待审批' }}</span></div>
        </div>
        <div class="detail-section">
          <h4>整改照片</h4>
          <div class="evidence-list">
            <div class="evidence-thumb" v-for="(ev, idx) in (detailItem.evidence || [])" :key="idx">{{ ev }}</div>
            <el-empty v-if="!detailItem.evidence || !detailItem.evidence.length" description="暂无照片/附件" />
          </div>
        </div>
        <div class="detail-section">
          <h4>附件列表</h4>
          <div class="attach-list">
            <div v-for="(ev, idx) in (detailItem.evidence || [])" :key="idx" class="attach-item">
              <el-icon size="16"><Document /></el-icon> {{ ev }} <el-button link size="small" @click="downloadMock">下载</el-button>
            </div>
            <el-empty v-if="!detailItem.evidence || !detailItem.evidence.length" description="暂无附件" />
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown, Document } from '@element-plus/icons-vue'
import { useRectificationStore } from '@/stores/rectification'
import { useHazardRecordStore } from '@/stores/hazardRecord'
import { useEquipmentStore } from '@/stores/equipment'

const rectStore = useRectificationStore()
const hazardStore = useHazardRecordStore()
const equipStore = useEquipmentStore()

// 人员候选
const personList = ['张伟', '李娜', '王芳', '刘洋', '陈静', '赵鑫', '孙丽', '周磊', '吴敏']

// 整改标准候选
const standardOptions = ['国标GB/T 12345', '行标JB/T 6789', '企标Q/ABC 001', '设备说明书']

// 状态选项（用于筛选）
const statusOptions = [
  { label: '待审核', value: '待审核' },
  { label: '待整改', value: '待整改' },
  { label: '整改中', value: '整改中' },
  { label: '验收中', value: '验收中' },
  { label: '已完成', value: '已完成' },
  { label: '已驳回', value: '已驳回' },
  { label: '超期', value: '超期' }
]

// 筛选器
const filterKeyword = ref('')
const filterStatus = ref([])
const filterDateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// 列表数据（全量）
const rawList = computed(() => rectStore.rectificationList || [])

// 关联数据
const hazardMap = computed(() => {
  const m = {}
  hazardStore.hazardRecordList.forEach(h => { m[h.id] = h })
  return m
})
const equipMap = computed(() => {
  const m = {}
  equipStore.equipmentList.forEach(e => { m[e.id] = e })
  return m
})

// 获取设备名称
function getDeviceName(item) {
  const hazard = hazardMap.value[item.hazardId]
  if (!hazard) return '未知设备'
  const equip = equipMap.value[hazard.equipmentId]
  return equip ? equip.name : '未知设备'
}

// 获取隐患描述
function getHazardDesc(item) {
  const hazard = hazardMap.value[item.hazardId]
  return hazard ? hazard.description : '无描述'
}

// 获取隐患等级
function getHazardLevel(item) {
  const hazard = hazardMap.value[item.hazardId]
  return hazard ? hazard.hazardType : '未知'
}

// 计算显示状态
function displayStatus(item) {
  const now = new Date()
  const end = new Date(item.endDate)
  if (item.status === '已完成') return '已完成'
  if (item.approvalStatus === '驳回' || item.status === '已驳回') return '已驳回'
  if (item.approvalStatus === '待审批') return '待审核'
  if (item.status === '进行中' && item.approvalStatus === '通过') {
    // 根据是否超期判断
    if (end < now) return '超期'
    // 再细分：若actualEndDate存在且大于startDate? 但没有actualEndDate就判断为整改中
    // 这里简单：如果 startDate 已经过了且没有actualEndDate 视为整改中
    const start = new Date(item.startDate)
    if (start <= now && !item.actualEndDate) return '整改中'
    return '待整改'
  }
  return item.approvalStatus || '未知'
}

function statusTagType(item) {
  const st = displayStatus(item)
  if (st === '已完成') return 'success'
  if (st === '已驳回' || st === '超期') return 'danger'
  if (st === '待审核') return 'info'
  if (st === '待整改') return 'warning'
  if (st === '整改中') return 'primary'
  if (st === '验收中') return 'warning'
  return 'info'
}

function isOverdue(item) {
  return displayStatus(item) === '超期'
}

// 过滤计算
const filteredSortedList = computed(() => {
  let list = rawList.value
  // 关键词搜索：id, 设备名称, 负责人
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(item => {
      const idMatch = item.id.toLowerCase().includes(kw)
      const deviceMatch = getDeviceName(item).toLowerCase().includes(kw)
      const personMatch = item.implementer.toLowerCase().includes(kw)
      return idMatch || deviceMatch || personMatch
    })
  }
  // 状态筛选
  if (filterStatus.value.length > 0) {
    list = list.filter(item => {
      const st = displayStatus(item)
      return filterStatus.value.includes(st)
    })
  }
  // 日期范围筛选（计划完成日期 endDate）
  if (filterDateRange.value && filterDateRange.value[0] && filterDateRange.value[1]) {
    const start = new Date(filterDateRange.value[0])
    const end = new Date(filterDateRange.value[1])
    list = list.filter(item => {
      const d = new Date(item.endDate)
      return d >= start && d <= end
    })
  }
  // 按创建时间降序（使用id或假设有createTime，这里用id后几位当作时间？种子数据有createTime？rectification没有，用id降序）
  list.sort((a, b) => b.id.localeCompare(a.id))
  return list
})

// 分页
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSortedList.value.slice(start, start + pageSize.value)
})

// 计算KPI
const kpiList = computed(() => {
  const counts = { '待审核': 0, '待整改': 0, '整改中': 0, '验收中': 0, '已完成': 0, '已驳回': 0, '超期': 0 }
  rawList.value.forEach(item => {
    const st = displayStatus(item)
    if (counts[st] !== undefined) counts[st]++
  })
  return [
    { label: '待审核', count: counts['待审核'], color: '#909399', statusKey: '待审核' },
    { label: '待整改', count: counts['待整改'], color: '#E6A23C', statusKey: '待整改' },
    { label: '整改中', count: counts['整改中'], color: '#409EFF', statusKey: '整改中' },
    { label: '已完成', count: counts['已完成'], color: '#67C23A', statusKey: '已完成' },
    { label: '已驳回', count: counts['已驳回'], color: '#F56C6C', statusKey: '已驳回' },
    { label: '超期', count: counts['超期'], color: '#C0C4CC', statusKey: '超期' }
  ]
})

function filterByStatus(statusKey) {
  filterStatus.value = [statusKey]
}

// 新增/编辑Dialog控制
const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const form = ref({
  equipmentId: '',
  description: '',
  implementer: '',
  planDate: '',
  hazardType: '',
  rectificationPlan: '',
  standard: ''
})
const formRules = {
  equipmentId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  description: [
    { required: true, message: '请输入隐患描述', trigger: 'blur' },
    { min: 10, message: '至少10字', trigger: 'blur' }
  ],
  implementer: [{ required: true, message: '请选择整改负责人', trigger: 'change' }],
  planDate: [{ required: true, message: '请选择计划完成日期', trigger: 'change' }],
  hazardType: [{ required: true, message: '请选择隐患等级', trigger: 'change' }]
}

function disablePast(time) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return time.getTime() < today.getTime()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  form.value = { equipmentId: '', description: '', implementer: '', planDate: '', hazardType: '', rectificationPlan: '', standard: '' }
  showAddDialog.value = true
}

function openEditDialog(item) {
  isEdit.value = true
  editId.value = item.id
  const hazard = hazardMap.value[item.hazardId]
  form.value = {
    equipmentId: hazard ? hazard.equipmentId : '',
    description: hazard ? hazard.description : '',
    implementer: item.implementer,
    planDate: item.endDate,
    hazardType: hazard ? hazard.hazardType : '',
    rectificationPlan: item.rectificationPlan,
    standard: item.remarks || ''
  }
  showAddDialog.value = true
}

async function submitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    // 更新
    const rect = rectStore.findById(editId.value)
    if (!rect) return
    // 同时更新hazardRecord
    const hazard = hazardMap.value[rect.hazardId]
    if (hazard) {
      hazardStore.update(hazard.id, {
        equipmentId: form.value.equipmentId,
        description: form.value.description,
        hazardType: form.value.hazardType,
        rectificationDeadline: form.value.planDate
      })
    }
    rectStore.update(editId.value, {
      implementer: form.value.implementer,
      rectificationPlan: form.value.rectificationPlan,
      endDate: form.value.planDate,
      remarks: form.value.standard,
      updatedAt: new Date().toISOString()
    })
    ElMessage.success('整改任务已更新')
  } else {
    // 新增：先创建hazardRecord，再创建rectification
    const hazardId = 'hazard_' + Date.now()
    const newHazard = {
      id: hazardId,
      equipmentId: form.value.equipmentId,
      description: form.value.description,
      hazardType: form.value.hazardType,
      severity: '一般',
      probability: '中',
      riskLevel: '黄色(一般风险)',
      status: '待整改',
      assignedTo: form.value.implementer,
      rectificationDeadline: form.value.planDate,
      discoveredDate: new Date().toISOString().slice(0, 10),
      inspectionTaskId: ''
    }
    hazardStore.add(newHazard)

    const newRect = {
      id: 'rect_' + Date.now(),
      hazardId: hazardId,
      rectificationPlan: form.value.rectificationPlan,
      implementer: form.value.implementer,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: form.value.planDate,
      actualEndDate: null,
      status: '进行中',
      approvalStatus: '待审批',
      evidence: [],
      remarks: form.value.standard
    }
    rectStore.add(newRect)
    ElMessage.success('整改任务已创建')
  }
  showAddDialog.value = false
}

// 审核Dialog
const showAuditDialog = ref(false)
const auditTarget = ref(null)
const auditFormRef = ref(null)
const auditForm = ref({ result: '通过', opinion: '' })
const auditRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  opinion: [
    { required: true, message: '请填写审核意见', trigger: 'blur' },
    { min: 5, message: '至少5个字', trigger: 'blur' }
  ]
}

function openAuditDialog(item) {
  auditTarget.value = item
  auditForm.value = { result: '通过', opinion: '' }
  showAuditDialog.value = true
}

async function submitAudit() {
  const valid = await auditFormRef.value.validate().catch(() => false)
  if (!valid) return
  const updateData = {
    approvalStatus: auditForm.value.result === '通过' ? '通过' : '驳回',
    remarks: auditForm.value.opinion,
    auditor: '当前审批人' // 可改进
  }
  if (auditForm.value.result === '驳回') {
    updateData.status = '已驳回'
  }
  rectStore.update(auditTarget.value.id, updateData)
  ElMessage.success('审核完成')
  showAuditDialog.value = false
}

// 开始整改
function handleStartRectify(item) {
  rectStore.update(item.id, { status: '进行中', startDate: new Date().toISOString().slice(0, 10) })
  ElMessage.success('已开始整改')
}

// 提交验收
function handleSubmitAccept(item) {
  rectStore.update(item.id, { actualEndDate: new Date().toISOString().slice(0, 10), status: '已完成' })
  ElMessage.success('已提交验收，状态更新为已完成')
}

// 删除
function handleDelete(item) {
  const hasEvidence = item.evidence && item.evidence.length > 0
  const msg = hasEvidence ? '该任务存在附件，删除将一并清除，确认删除？' : '确认删除该整改任务？'
  ElMessageBox.confirm(msg, '确认删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => {
    rectStore.remove(item.id)
    // 同时删除关联hazardRecord
    if (item.hazardId) {
      hazardStore.remove(item.hazardId)
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 详情Drawer
const showDetailDrawer = ref(false)
const detailItem = ref(null)

function openDetailDrawer(item) {
  detailItem.value = item
  showDetailDrawer.value = true
}

// 导出
function handleExport() {
  // 简单导出CSV
  const data = filteredSortedList.value.map(item => ({
    id: item.id,
    device: getDeviceName(item),
    desc: getHazardDesc(item),
    implementer: item.implementer,
    endDate: item.endDate,
    actualEndDate: item.actualEndDate || '',
    status: displayStatus(item)
  }))
  const header = '整改编号,设备名称,隐患描述,负责人,计划完成日期,实际完成日期,状态\n'
  const rows = data.map(r => `${r.id},${r.device},${r.desc},${r.implementer},${r.endDate},${r.actualEndDate},${r.status}`).join('\n')
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `整改任务列表_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

// 甘特条计算
const ganttMinDate = computed(() => {
  const dates = rawList.value.map(r => new Date(r.startDate)).filter(d => !isNaN(d.getTime()))
  if (!dates.length) return new Date()
  return new Date(Math.min(...dates))
})
const ganttMaxDate = computed(() => {
  const dates = rawList.value.map(r => new Date(r.endDate)).filter(d => !isNaN(d.getTime()))
  if (!dates.length) return new Date()
  return new Date(Math.max(...dates))
})

function ganttLeft(item) {
  const start = new Date(item.startDate)
  const min = ganttMinDate.value
  const max = ganttMaxDate.value
  const totalMs = max.getTime() - min.getTime()
  if (totalMs <= 0) return 0
  return ((start.getTime() - min.getTime()) / totalMs) * 100
}
function ganttWidth(item) {
  const start = new Date(item.startDate)
  const end = new Date(item.endDate)
  const min = ganttMinDate.value
  const max = ganttMaxDate.value
  const totalMs = max.getTime() - min.getTime()
  if (totalMs <= 0) return 0
  const planMs = end.getTime() - start.getTime()
  if (planMs <= 0) return 1
  return (planMs / totalMs) * 100
}
function ganttLeftActual(item) {
  if (!item.actualEndDate) return 0
  const actual = new Date(item.actualEndDate)
  const min = ganttMinDate.value
  const max = ganttMaxDate.value
  const totalMs = max.getTime() - min.getTime()
  if (totalMs <= 0) return 0
  return ((actual.getTime() - min.getTime()) / totalMs) * 100
}
function ganttWidthActual(item) {
  if (!item.actualEndDate) return 0
  const start = new Date(item.startDate)
  const actual = new Date(item.actualEndDate)
  const min = ganttMinDate.value
  const max = ganttMaxDate.value
  const totalMs = max.getTime() - min.getTime()
  if (totalMs <= 0) return 0
  const actualMs = actual.getTime() - start.getTime()
  if (actualMs <= 0) return 1
  return (actualMs / totalMs) * 100
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  return dt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 初始化重置筛选
function handleSearch() {
  currentPage.value = 1
}
function handleReset() {
  filterKeyword.value = ''
  filterStatus.value = []
  filterDateRange.value = []
  currentPage.value = 1
}

// 下载mock
function downloadMock() {
  ElMessage.info('下载功能演示')
}
</script>

<style scoped lang="scss">
@use './RectificationManagement.scss' as *;
</style>