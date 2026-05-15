<template>
  <div class="page-risk_checklist">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <h1 class="page-title">风险清单</h1>
      <div class="toolbar-actions">
        <el-button type="primary" @click="handleAdd">新增风险</el-button>
        <el-button :disabled="selectedIds.length === 0" @click="handleBatchReview">批量提交复核</el-button>
        <el-button @click="exportDialogVisible = true">导出</el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-form :inline="true" class="filter-form">
        <el-form-item>
          <el-input v-model="filterKeyword" placeholder="风险描述/设备名称" clearable style="width:220px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width:140px">
            <el-option label="待复核" value="草稿" />
            <el-option label="已确认" value="已确认" />
            <el-option label="已复核" value="已复核" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="filterLevel" clearable placeholder="全部" style="width:140px">
            <el-option label="重大" value="红色" />
            <el-option label="较大" value="橙色" />
            <el-option label="一般" value="黄色" />
            <el-option label="低" value="蓝色" />
          </el-select>
        </el-form-item>
        <el-form-item label="排查日期">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 主体：趋势线 + 表格 -->
    <div class="main-content">
      <!-- 左：风险趋势线 -->
      <div class="trend-card">
        <h2 class="section-title">风险趋势线</h2>
        <div class="trend-chart" ref="trendRef">
          <svg v-if="trendPoints.length > 0" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="trend-svg">
            <polyline :points="trendPoints" fill="none" stroke="var(--page-primary, #059669)" stroke-width="2" class="trend-line" />
            <g v-for="(pt, idx) in trendPointsArr" :key="idx">
              <circle :cx="pt.x" :cy="pt.y" r="4" fill="var(--page-primary, #059669)" class="trend-dot" @mouseenter="onHoverDot(idx, $event)" @mouseleave="onLeaveDot" />
            </g>
          </svg>
          <div v-else class="chart-empty">暂无趋势数据</div>
          <div v-if="tooltip.visible" class="trend-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
            <span>{{ tooltip.label }}：{{ tooltip.value }} 分</span>
          </div>
        </div>
      </div>
      <!-- 右：表格 -->
      <div class="table-card">
        <el-table ref="tableRef" :data="pagedList" stripe highlight-current-row @selection-change="onSelectionChange" style="width:100%">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="id" label="风险编号" min-width="120" />
          <el-table-column label="设备名称" min-width="120">
            <template #default="scope">{{ getEquipmentName(scope.row.equipmentId) }}</template>
          </el-table-column>
          <el-table-column prop="riskType" label="风险类型" min-width="100" />
          <el-table-column label="风险等级" min-width="100">
            <template #default="scope">
              <el-tag :type="riskLevelTagType(scope.row.riskLevel)" size="small">{{ riskLevelLabel(scope.row.riskLevel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assessmentMethod" label="描述" min-width="160" show-overflow-tooltip />
          <el-table-column prop="controlMeasures" label="管控措施" min-width="160" show-overflow-tooltip />
          <el-table-column prop="assessor" label="责任人" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="statusTagType(scope.row.status)" size="small">{{ statusLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assessmentDate" label="排查日期" width="120" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button link size="small" type="primary" @click="handleDetail(scope.row)">详情</el-button>
              <el-button link size="small" @click="handleEdit(scope.row)" :disabled="scope.row.status !== '草稿'">编辑</el-button>
              <el-button v-if="scope.row.status === '草稿'" link size="small" type="success" @click="handleSubmitReview(scope.row)">提交复核</el-button>
              <el-button v-if="scope.row.status === '已确认' && !hasOngoingRectification(scope.row)" link size="small" type="warning" @click="handleInitiateRectification(scope.row)">发起整改</el-button>
              <el-button link size="small" type="danger" @click="handleDelete(scope.row)" :disabled="scope.row.status !== '草稿'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50]" :total="filteredList.length" layout="total, sizes, prev, pager, next" @size-change="()=>{}" @current-change="()=>{}" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="formDialogVisible" :title="formMode === 'add' ? '新增风险' : '编辑风险'" width="min(680px,92vw)" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentId">
              <el-select v-model="formData.equipmentId" placeholder="请选择设备" filterable style="width:100%">
                <el-option v-for="equip in equipmentList" :key="equip.id" :label="equip.name" :value="equip.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险类型" prop="riskType">
              <el-select v-model="formData.riskType" placeholder="请选择" style="width:100%" :disabled="formMode === 'edit' && originalStatus !== '草稿'">
                <el-option v-for="t in riskTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级" prop="riskLevel">
              <el-select v-model="formData.riskLevel" placeholder="请选择" style="width:100%" :disabled="formMode === 'edit' && originalStatus !== '草稿'">
                <el-option label="重大" value="红色(重大风险)" />
                <el-option label="较大" value="橙色(较大风险)" />
                <el-option label="一般" value="黄色(一般风险)" />
                <el-option label="低" value="蓝色(低风险)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排查日期" prop="assessmentDate">
              <el-date-picker v-model="formData.assessmentDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="风险描述" prop="assessmentMethod">
          <el-input v-model="formData.assessmentMethod" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="请输入风险描述" />
        </el-form-item>
        <el-form-item label="管控措施" prop="controlMeasures">
          <el-input v-model="formData.controlMeasures" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="请输入管控措施" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="责任部门" prop="assessor">
              <el-input v-model="formData.assessor" placeholder="输入部门名称" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="assessorPerson">
              <el-input v-model="formData.assessorPerson" placeholder="输入责任人姓名" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="detailDrawerVisible" title="风险详情" size="600px">
      <template v-if="detailData">
        <div class="detail-grid">
          <div class="detail-item"><span class="label">风险编号</span><span>{{ detailData.id }}</span></div>
          <div class="detail-item"><span class="label">设备名称</span><span>{{ getEquipmentName(detailData.equipmentId) }}</span></div>
          <div class="detail-item"><span class="label">风险类型</span><span>{{ detailData.riskType }}</span></div>
          <div class="detail-item"><span class="label">风险等级</span><span>{{ riskLevelLabel(detailData.riskLevel) }}</span></div>
          <div class="detail-item"><span class="label">描述</span><span>{{ detailData.assessmentMethod }}</span></div>
          <div class="detail-item"><span class="label">管控措施</span><span>{{ detailData.controlMeasures }}</span></div>
          <div class="detail-item"><span class="label">责任部门</span><span>{{ detailData.assessor }}</span></div>
          <div class="detail-item"><span class="label">责任人</span><span>{{ detailData.assessorPerson }}</span></div>
          <div class="detail-item"><span class="label">排查日期</span><span>{{ detailData.assessmentDate }}</span></div>
          <div class="detail-item"><span class="label">状态</span><span>{{ statusLabel(detailData.status) }}</span></div>
        </div>
        <el-divider />
        <h3>关联整改任务</h3>
        <el-table :data="relatedRectifications" v-if="relatedRectifications.length > 0" style="width:100%" size="small">
          <el-table-column prop="id" label="任务编号" width="140" />
          <el-table-column prop="rectificationPlan" label="整改计划" min-width="150" />
          <el-table-column prop="implementer" label="实施人" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status==='已完成'?'success':'warning'" size="small">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="empty-hint">暂无关联整改任务</div>
        <el-divider />
        <h3>关联隐患</h3>
        <el-table :data="relatedHazards" v-if="relatedHazards.length > 0" style="width:100%" size="small">
          <el-table-column prop="id" label="隐患编号" width="140" />
          <el-table-column prop="description" label="隐患描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="scope">{{ riskLevelLabel(scope.row.riskLevel) }}</template>
          </el-table-column>
        </el-table>
        <div v-else class="empty-hint">暂无关联隐患</div>
      </template>
    </el-drawer>

    <!-- 发起整改 Dialog -->
    <el-dialog v-model="rectifyDialogVisible" title="创建整改任务" width="500px">
      <el-form ref="rectifyFormRef" :model="rectifyForm" :rules="rectifyRules" label-width="100px">
        <el-form-item label="整改计划" prop="rectificationPlan">
          <el-input v-model="rectifyForm.rectificationPlan" type="textarea" :rows="3" placeholder="请输入整改计划" />
        </el-form-item>
        <el-form-item label="实施人" prop="implementer">
          <el-input v-model="rectifyForm.implementer" placeholder="实施人姓名" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="rectifyForm.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="截止日期" prop="endDate">
          <el-date-picker v-model="rectifyForm.endDate" type="date" placeholder="截止日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRectify">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 导出配置 Dialog -->
    <el-dialog v-model="exportDialogVisible" title="导出设置" width="420px">
      <el-form label-width="120px">
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportScope">
            <el-radio value="all">全部风险</el-radio>
            <el-radio value="filtered">当前筛选结果</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含关联隐患">
          <el-switch v-model="includeHazard" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRiskAssessmentStore } from '@/stores/riskAssessment'
import { useEquipmentStore } from '@/stores/equipment'
import { useRectificationStore } from '@/stores/rectification'
import { useHazardRecordStore } from '@/stores/hazardRecord'

const riskAssessmentStore = useRiskAssessmentStore()
const equipmentStore = useEquipmentStore()
const rectificationStore = useRectificationStore()
const hazardRecordStore = useHazardRecordStore()

// data
const equipmentList = computed(() => equipmentStore.equipmentList)
const riskAssessmentList = computed(() => riskAssessmentStore.riskAssessmentList)
const rectificationList = computed(() => rectificationStore.rectificationList)
const hazardRecordList = computed(() => hazardRecordStore.hazardRecordList)

// 获取设备名称
function getEquipmentName(id) {
  const eq = equipmentStore.findById(id)
  return eq ? eq.name : '未知设备'
}

// 状态标签映射
function statusLabel(s) {
  const map = { '草稿': '待复核', '已确认': '已确认', '已复核': '已复核' }
  return map[s] || s
}
function statusTagType(s) {
  const map = { '草稿': 'info', '已确认': 'success', '已复核': 'warning' }
  return map[s] || 'info'
}
function riskLevelLabel(lv) {
  const map = {
    '红色(重大风险)': '重大',
    '橙色(较大风险)': '较大',
    '黄色(一般风险)': '一般',
    '蓝色(低风险)': '低'
  }
  return map[lv] || lv
}
function riskLevelTagType(lv) {
  if (lv.startsWith('红色')) return 'danger'
  if (lv.startsWith('橙色')) return 'warning'
  if (lv.startsWith('黄色')) return 'info'
  return 'success'
}

// 筛选
const filterKeyword = ref('')
const filterStatus = ref(null)
const filterLevel = ref(null)
const dateRange = ref([])

const filteredList = computed(() => {
  let list = [...riskAssessmentList.value]
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(item => {
      const desc = (item.assessmentMethod || '').toLowerCase()
      const equip = getEquipmentName(item.equipmentId).toLowerCase()
      return desc.includes(kw) || equip.includes(kw)
    })
  }
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (filterLevel.value) {
    list = list.filter(item => item.riskLevel && item.riskLevel.includes(filterLevel.value))
  }
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const [start, end] = dateRange.value
    list = list.filter(item => item.assessmentDate && item.assessmentDate >= start && item.assessmentDate <= end)
  }
  // 默认按assessmentDate降序
  list.sort((a, b) => (b.assessmentDate || '').localeCompare(a.assessmentDate || ''))
  return list
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})
watch([filteredList, pageSize], () => { currentPage.value = 1 })

// 表格选择
const selectedIds = ref([])
function onSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id)
}

// 新增/编辑
const formDialogVisible = ref(false)
const formMode = ref('add')
const formData = reactive({
  equipmentId: '',
  riskType: '',
  riskLevel: '',
  assessmentMethod: '',
  controlMeasures: '',
  assessor: '',
  assessorPerson: '',
  assessmentDate: '',
  remarks: ''
})
const originalStatus = ref('') // 用于编辑锁定
const formRef = ref(null)

const riskTypeOptions = ['机械伤害', '压力爆炸', '高处坠落', '触电', '火灾']
const formRules = {
  equipmentId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  riskType: [{ required: true, message: '请选择风险类型', trigger: 'change' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  assessmentMethod: [
    { required: true, message: '风险描述不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && !value.trim()) callback(new Error('风险描述不能为空'))
      else callback()
    }, trigger: 'blur' }
  ],
  controlMeasures: [{ required: true, message: '请输入管控措施', trigger: 'blur' }],
  assessmentDate: [{ required: true, message: '请选择排查日期', trigger: 'change' }]
}

function handleAdd() {
  formMode.value = 'add'
  originalStatus.value = ''
  Object.assign(formData, {
    equipmentId: '',
    riskType: '',
    riskLevel: '',
    assessmentMethod: '',
    controlMeasures: '',
    assessor: '',
    assessorPerson: '',
    assessmentDate: '',
    remarks: ''
  })
  formDialogVisible.value = true
}
function handleEdit(row) {
  formMode.value = 'edit'
  originalStatus.value = row.status
  Object.assign(formData, {
    equipmentId: row.equipmentId,
    riskType: row.riskType,
    riskLevel: row.riskLevel,
    assessmentMethod: row.assessmentMethod,
    controlMeasures: row.controlMeasures,
    assessor: row.assessor,
    assessorPerson: row.assessorPerson || '',
    assessmentDate: row.assessmentDate,
    remarks: row.remarks || ''
  })
  formDialogVisible.value = true
}
function submitForm() {
  formRef.value.validate((valid) => {
    if (!valid) return
    // 去重校验：同一设备下已存在相同风险描述（忽略大小写）
    const duplicate = riskAssessmentList.value.some(item => {
      if (formMode.value === 'edit' && item.id === currentEditId.value) return false
      return item.equipmentId === formData.equipmentId &&
        item.assessmentMethod && formData.assessmentMethod &&
        item.assessmentMethod.toLowerCase() === formData.assessmentMethod.toLowerCase()
    })
    if (duplicate) {
      ElMessage.warning('该设备下已存在相同风险描述')
      return
    }
    // 保存
    if (formMode.value === 'add') {
      const newItem = {
        id: 'risk_' + Date.now(),
        hazardId: 'hazard_' + Date.now(),
        equipmentId: formData.equipmentId,
        riskType: formData.riskType,
        riskLevel: formData.riskLevel,
        assessmentMethod: formData.assessmentMethod,
        controlMeasures: formData.controlMeasures,
        assessor: formData.assessor,
        assessorPerson: formData.assessorPerson,
        assessmentDate: formData.assessmentDate,
        status: '草稿',
        severity: '一般',
        probability: '中'
      }
      riskAssessmentStore.add(newItem)
      ElMessage.success('新增成功')
    } else {
      const patch = {
        equipmentId: formData.equipmentId,
        riskType: formData.riskType,
        riskLevel: formData.riskLevel,
        assessmentMethod: formData.assessmentMethod,
        controlMeasures: formData.controlMeasures,
        assessor: formData.assessor,
        assessorPerson: formData.assessorPerson,
        assessmentDate: formData.assessmentDate
      }
      riskAssessmentStore.update(currentEditId.value, patch)
      ElMessage.success('更新成功')
    }
    formDialogVisible.value = false
  })
}
const currentEditId = ref('')

// 重写 handleEdit 记录当前编辑id
const originalHandleEdit = handleEdit
handleEdit = function(row) {
  currentEditId.value = row.id
  formMode.value = 'edit'
  originalStatus.value = row.status
  Object.assign(formData, {
    equipmentId: row.equipmentId,
    riskType: row.riskType,
    riskLevel: row.riskLevel,
    assessmentMethod: row.assessmentMethod,
    controlMeasures: row.controlMeasures,
    assessor: row.assessor,
    assessorPerson: row.assessorPerson || '',
    assessmentDate: row.assessmentDate,
    remarks: row.remarks || ''
  })
  formDialogVisible.value = true
}
handleEdit = originalHandleEdit.bind(this) // 保留原始实现

// 删除
function handleDelete(row) {
  // 检查是否有未完成整改任务
  const hasOngoing = rectificationList.value.some(r => r.hazardId === row.hazardId && r.status === '进行中')
  if (hasOngoing) {
    ElMessage.warning('该风险已有整改任务正在执行，请先关闭整改任务')
    return
  }
  ElMessageBox.confirm('删除后将无法恢复，是否继续？', '确认删除', { type: 'warning' }).then(() => {
    riskAssessmentStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 提交复核
function handleSubmitReview(row) {
  ElMessageBox.confirm('确认提交复核后，风险状态将变为“已确认”，是否继续？', '提交复核', { type: 'info' }).then(() => {
    riskAssessmentStore.update(row.id, { status: '已确认' })
    ElMessage.success('已提交复核')
  }).catch(() => {})
}

// 批量复核
function handleBatchReview() {
  if (selectedIds.value.length === 0) return
  ElMessageBox.confirm(`确认对 ${selectedIds.value.length} 条风险进行批量复核？状态将变更为“已确认”。`, '批量复核', { type: 'info' }).then(() => {
    selectedIds.value.forEach(id => {
      const item = riskAssessmentStore.findById(id)
      if (item && item.status === '草稿') {
        riskAssessmentStore.update(id, { status: '已确认' })
      }
    })
    ElMessage.success('批量复核完成')
  }).catch(() => {})
}

// 发起整改
const rectifyDialogVisible = ref(false)
const rectifyForm = reactive({
  rectificationPlan: '',
  implementer: '',
  startDate: '',
  endDate: ''
})
const rectifyFormRef = ref(null)
const rectifyRules = {
  rectificationPlan: [{ required: true, message: '请输入整改计划', trigger: 'blur' }],
  implementer: [{ required: true, message: '请输入实施人', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}
let rectifyTargetRow = null
function handleInitiateRectification(row) {
  rectifyTargetRow = row
  Object.assign(rectifyForm, {
    rectificationPlan: '',
    implementer: '',
    startDate: '',
    endDate: ''
  })
  rectifyDialogVisible.value = true
}
function submitRectify() {
  rectifyFormRef.value.validate((valid) => {
    if (!valid) return
    const newRectify = {
      id: 'rectification_' + Date.now(),
      hazardId: rectifyTargetRow.hazardId,
      rectificationPlan: rectifyForm.rectificationPlan,
      implementer: rectifyForm.implementer,
      startDate: rectifyForm.startDate,
      endDate: rectifyForm.endDate,
      actualEndDate: '',
      status: '进行中',
      approvalStatus: '待审批',
      evidence: [],
      remarks: ''
    }
    rectificationStore.add(newRectify)
    // 同时标记风险状态为整改中？无对应状态，保持已确认
    ElMessage.success('整改任务创建成功')
    rectifyDialogVisible.value = false
  })
}
function hasOngoingRectification(row) {
  return rectificationList.value.some(r => r.hazardId === row.hazardId && r.status === '进行中')
}

// 详情 Drawer
const detailDrawerVisible = ref(false)
const detailData = ref(null)
function handleDetail(row) {
  detailData.value = row
  detailDrawerVisible.value = true
}
const relatedRectifications = computed(() => {
  if (!detailData.value) return []
  return rectificationList.value.filter(r => r.hazardId === detailData.value.hazardId)
})
const relatedHazards = computed(() => {
  if (!detailData.value) return []
  return hazardRecordList.value.filter(h => h.id === detailData.value.hazardId)
})

// 导出
const exportDialogVisible = ref(false)
const exportScope = ref('filtered')
const includeHazard = ref(false)
function handleExport() {
  let data = exportScope.value === 'all' ? riskAssessmentList.value : filteredList.value
  // 生成CSV
  const headers = ['风险编号','设备名称','风险类型','风险等级','描述','管控措施','责任部门','状态','排查日期']
  const rows = data.map(item => {
    return [
      item.id,
      getEquipmentName(item.equipmentId),
      item.riskType,
      riskLevelLabel(item.riskLevel),
      item.assessmentMethod,
      item.controlMeasures,
      item.assessor,
      statusLabel(item.status),
      item.assessmentDate
    ].join(',')
  })
  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '风险清单_' + new Date().toISOString().slice(0,10) + '.csv'
  link.click()
  URL.revokeObjectURL(link.href)
  exportDialogVisible.value = false
  ElMessage.success('导出成功')
}

// 趋势线
const chartWidth = 600
const chartHeight = 200
const trendPoints = ref('')
const trendPointsArr = ref([])
const tooltip = reactive({ visible: false, x: 0, y: 0, label: '', value: '' })
const trendRef = ref(null)

function buildTrend() {
  // 按月份聚合平均风险分
  const monthMap = {}
  riskAssessmentList.value.forEach(item => {
    if (!item.assessmentDate) return
    const month = item.assessmentDate.slice(0, 7)
    let score = 0
    if (item.riskLevel.includes('红')) score = 4
    else if (item.riskLevel.includes('橙')) score = 3
    else if (item.riskLevel.includes('黄')) score = 2
    else if (item.riskLevel.includes('蓝')) score = 1
    if (!monthMap[month]) monthMap[month] = { total: 0, count: 0 }
    monthMap[month].total += score
    monthMap[month].count++
  })
  const keys = Object.keys(monthMap).sort()
  if (keys.length === 0) {
    trendPoints.value = ''
    trendPointsArr.value = []
    return
  }
  const padding = 20
  const w = chartWidth - padding * 2
  const h = chartHeight - padding * 2
  const stepX = w / (keys.length - 1 || 1)
  const maxScore = 4
  const points = keys.map((k, i) => {
    const avg = monthMap[k].total / monthMap[k].count
    const x = padding + i * stepX
    const y = chartHeight - padding - (avg / maxScore) * h
    return { x, y, label: k, value: avg.toFixed(2) }
  })
  trendPointsArr.value = points
  trendPoints.value = points.map(p => `${p.x},${p.y}`).join(' ')
}
onMounted(buildTrend)

function onHoverDot(idx, event) {
  const pt = trendPointsArr.value[idx]
  const rect = trendRef.value?.querySelector('.trend-svg')?.getBoundingClientRect()
  if (rect) {
    tooltip.x = pt.x + rect.left - rect.x
    tooltip.y = pt.y + rect.top - rect.y - 30
  } else {
    tooltip.x = pt.x
    tooltip.y = pt.y - 30
  }
  tooltip.label = pt.label
  tooltip.value = pt.value
  tooltip.visible = true
}
function onLeaveDot() {
  tooltip.visible = false
}
</script>

<style scoped lang="scss">
@use './RiskChecklist.scss' as *;
</style>