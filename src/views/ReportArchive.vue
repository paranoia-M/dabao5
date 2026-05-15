<template>
  <div class="page-report_archive">
    <!-- 顶部统计信息条 -->
    <div class="archive-stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(stats.total) }}</span>
        <span class="stat-label">报告总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value draft">{{ formatNumber(stats.draft) }}</span>
        <span class="stat-label">草稿</span>
      </div>
      <div class="stat-item">
        <span class="stat-value submitted">{{ formatNumber(stats.submitted) }}</span>
        <span class="stat-label">已提交</span>
      </div>
      <div class="stat-item">
        <span class="stat-value audited">{{ formatNumber(stats.audited) }}</span>
        <span class="stat-label">已审核</span>
      </div>
      <div class="stat-item">
        <span class="stat-value archived">{{ formatNumber(stats.archived) }}</span>
        <span class="stat-label">已归档</span>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="archive-filter">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索报告标题/编号"
          clearable
          class="filter-input"
          @clear="handleSearch"
        />
        <el-select v-model="filterReportType" placeholder="报告类型" clearable class="filter-select" @change="handleSearch">
          <el-option label="全部类型" value="" />
          <el-option label="隐患排查报告" value="隐患排查报告" />
          <el-option label="风险评估报告" value="风险评估报告" />
          <el-option label="整改跟踪报告" value="整改跟踪报告" />
          <el-option label="综合报告" value="综合报告" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-select" @change="handleSearch">
          <el-option label="全部状态" value="" />
          <el-option label="草稿" value="草稿" />
          <el-option label="已提交" value="已提交" />
          <el-option label="已审核" value="已审核" />
          <el-option label="已归档" value="已归档" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="生成开始"
          end-placeholder="生成结束"
          value-format="YYYY-MM-DD"
          class="filter-date"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon> 搜索
        </el-button>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增报告
        </el-button>
        <el-button :disabled="selectedIds.length === 0" @click="handleBatchExport">
          <el-icon><Download /></el-icon> 导出({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <!-- 主体区：环图 + 列表 -->
    <div class="archive-body">
      <!-- 左：设备状态环图 -->
      <div class="body-ring">
        <div class="ring-header">
          <span class="ring-title">设备状态分布</span>
          <span class="ring-subtitle">hover 查看数量，点击筛选报告</span>
        </div>
        <div class="ring-container">
          <div
            class="ring-canvas"
            :style="{ background: ringGradient }"
            @mouseleave="ringHoverIndex = -1"
          >
            <div class="ring-center">
              <span class="ring-center-value">{{ equipmentStore.equipmentList.length }}</span>
              <span class="ring-center-label">总设备</span>
            </div>
            <!-- 悬浮提示层 -->
            <div
              v-for="(seg, idx) in ringSegments"
              :key="idx"
              class="ring-segment-hover"
              :style="segmentHoverStyle(idx)"
              @mouseenter="ringHoverIndex = idx"
              @click="handleRingClick(seg.status)"
            />
          </div>
          <div class="ring-legend">
            <div
              v-for="(seg, idx) in ringSegments"
              :key="seg.status"
              class="legend-item"
              :class="{ 'legend-active': ringHoverIndex === idx }"
              @mouseenter="ringHoverIndex = idx"
              @mouseleave="ringHoverIndex = -1"
              @click="handleRingClick(seg.status)"
            >
              <span class="legend-dot" :style="{ background: seg.color }" />
              <span class="legend-label">{{ seg.status }}</span>
              <span class="legend-value">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：报告列表 -->
      <div class="body-list">
        <el-table
          ref="tableRef"
          :data="pagedList"
          stripe
          row-class-name="report-row"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          table-layout="fixed"
        >
          <el-table-column type="selection" width="44" fixed />
          <el-table-column label="报告编号" prop="id" min-width="120" show-overflow-tooltip />
          <el-table-column label="报告标题" prop="title" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="报告类型" prop="reportType" width="130">
            <template #default="{ row }">
              <el-tag :type="reportTypeTag(row.reportType)" size="small">{{ row.reportType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="关联设备" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getEquipmentName(row.relatedEntityId) }}
            </template>
          </el-table-column>
          <el-table-column label="生成方式" prop="generationMethod" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small" effect="plain">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生成日期" width="110">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <div class="action-btns">
                <el-button link size="small" @click="openDetail(row)">详情</el-button>
                <el-button
                  v-if="row.status === '草稿'"
                  link
                  size="small"
                  type="primary"
                  @click="openEditDialog(row)"
                >编辑</el-button>
                <el-button
                  v-if="row.status === '草稿'"
                  link
                  size="small"
                  type="warning"
                  @click="handleDelete(row)"
                >删除</el-button>
                <el-button
                  v-if="row.status === '草稿'"
                  link
                  size="small"
                  type="success"
                  @click="handleSubmitAudit(row)"
                >提交审核</el-button>
                <el-button
                  v-if="row.status === '已提交'"
                  link
                  size="small"
                  type="success"
                  @click="openAuditDialog(row, '通过')"
                >通过</el-button>
                <el-button
                  v-if="row.status === '已提交'"
                  link
                  size="small"
                  type="danger"
                  @click="openAuditDialog(row, '驳回')"
                >驳回</el-button>
                <el-button
                  v-if="row.status === '已审核'"
                  link
                  size="small"
                  @click="handleArchive(row)"
                >归档</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredList.length"
            layout="total, prev, pager, next"
            background
            small
          />
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑 dialog -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEditing ? '编辑报告' : '新增报告'"
      :width="Math.min(720, 92) + 'vw'"
      top="4vh"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
        class="report-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入报告标题" maxlength="120" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报告类型" prop="reportType">
              <el-select v-model="formData.reportType" placeholder="选择报告类型" style="width:100%">
                <el-option label="隐患排查报告" value="隐患排查报告" />
                <el-option label="风险评估报告" value="风险评估报告" />
                <el-option label="整改跟踪报告" value="整改跟踪报告" />
                <el-option label="综合报告" value="综合报告" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联设备" prop="relatedEntityId">
              <el-cascader
                v-model="formData.relatedEntityId"
                :options="equipmentOptions"
                placeholder="选择关联设备"
                style="width:100%"
                clearable
                :props="{ expandTrigger: 'hover', value: 'id', label: 'name', children: 'devices' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生成日期" prop="createTime">
              <el-date-picker
                v-model="formData.createTime"
                type="date"
                placeholder="选择生成日期"
                style="width:100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报告摘要" prop="summary">
          <el-input v-model="formData.summary" type="textarea" :rows="3" placeholder="请输入报告摘要（选填）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" placeholder="请输入备注（选填）" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="上传附件" prop="attachments">
          <el-upload
            v-model:file-list="formData.attachments"
            action="#"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            :auto-upload="false"
            :limit="5"
            list-type="text"
          >
            <el-button size="small" type="default">
              <el-icon><Upload /></el-icon> 选择文件（PDF/Word/Excel）
            </el-button>
            <template #tip>
              <span class="upload-tip">最多5个文件，每个不超过10MB</span>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEditing ? '保存修改' : '确认创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情 drawer -->
    <el-drawer
      v-model="detailVisible"
      title="报告详情"
      direction="rtl"
      size="min(520px, 90vw)"
      destroy-on-close
    >
      <template v-if="detailData">
        <div class="detail-grid">
          <div class="detail-field">
            <span class="field-label">报告编号</span>
            <span class="field-value">{{ detailData.id }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">报告标题</span>
            <span class="field-value">{{ detailData.title }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">报告类型</span>
            <span class="field-value">
              <el-tag size="small" :type="reportTypeTag(detailData.reportType)">{{ detailData.reportType }}</el-tag>
            </span>
          </div>
          <div class="detail-field">
            <span class="field-label">关联设备</span>
            <span class="field-value">{{ getEquipmentName(detailData.relatedEntityId) }}（{{ detailData.relatedEntityId }}）</span>
          </div>
          <div class="detail-field">
            <span class="field-label">生成方式</span>
            <span class="field-value">{{ detailData.generationMethod }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">生成人</span>
            <span class="field-value">{{ detailData.auditBy || '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">生成日期</span>
            <span class="field-value">{{ formatDate(detailData.createTime) }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">审核人</span>
            <span class="field-value">{{ detailData.auditBy || '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">审核日期</span>
            <span class="field-value">{{ detailData.auditTime ? formatDate(detailData.auditTime) : '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">归档人</span>
            <span class="field-value">{{ detailData.content?.archiveBy || '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">归档日期</span>
            <span class="field-value">{{ detailData.content?.archiveTime ? formatDate(detailData.content.archiveTime) : '—' }}</span>
          </div>
          <div class="detail-field full-width">
            <span class="field-label">报告摘要</span>
            <p class="field-text">{{ detailData.content?.summary || '无' }}</p>
          </div>
          <div v-if="detailData.content?.findings?.length" class="detail-field full-width">
            <span class="field-label">主要发现</span>
            <ul class="field-list">
              <li v-for="(f, i) in detailData.content.findings" :key="i">{{ f }}</li>
            </ul>
          </div>
          <div v-if="detailData.content?.attachments?.length" class="detail-field full-width">
            <span class="field-label">附件列表</span>
            <div class="attach-list">
              <div v-for="(att, i) in detailData.content.attachments" :key="i" class="attach-item">
                <el-icon><Document /></el-icon>
                <span class="attach-name">{{ att.name || att }}</span>
                <el-button link size="small" type="primary" @click="handleDownload(att)">下载</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 审核意见 dialog -->
    <el-dialog
      v-model="auditDialogVisible"
      title="审核意见"
      width="min(480px, 90vw)"
      destroy-on-close
    >
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="auditAction === '通过' ? 'success' : 'danger'" size="large">
            {{ auditAction === '通过' ? '✅ 审核通过' : '❌ 驳回' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="auditForm.comment"
            type="textarea"
            :rows="4"
            :placeholder="auditAction === '通过' ? '请输入审核通过意见（选填）' : '请填写驳回原因（必填）'"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditing" @click="confirmAudit">确认{{ auditAction }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import { useReportStore } from '@/stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Upload, Document } from '@element-plus/icons-vue'

const equipmentStore = useEquipmentStore()
const reportStore = useReportStore()

// ─── 工具 ───
function formatNumber(n) {
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('zh-CN')
}

function reportTypeTag(type) {
  const map = { '隐患排查报告': '', '风险评估报告': 'warning', '整改跟踪报告': 'success', '综合报告': 'info' }
  return map[type] || ''
}

function statusTag(s) {
  const map = { '草稿': 'info', '已提交': 'warning', '已审核': 'success', '已归档': 'default' }
  return map[s] || 'info'
}

function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `RP-${ts}${rand}`
}

// ─── 统计 ───
const stats = computed(() => {
  const list = reportStore.reportList || []
  const total = list.length
  const draft = list.filter(r => r.status === '草稿').length
  const submitted = list.filter(r => r.status === '已提交').length
  const audited = list.filter(r => r.status === '已审核').length
  const archived = list.filter(r => r.status === '已归档').length
  return { total, draft, submitted, audited, archived }
})

// ─── 筛选 ───
const searchKeyword = ref('')
const filterReportType = ref('')
const filterStatus = ref('')
const dateRange = ref([])

function handleDateRangeChange(val) {
  if (val && val.length === 2) {
    const start = new Date(val[0])
    const end = new Date(val[1])
    const diff = (end - start) / (1000 * 60 * 60 * 24)
    if (diff > 365) {
      ElMessage.warning('日期范围不能超过一年')
      dateRange.value = []
    }
  }
  handleSearch()
}

function handleSearch() {
  currentPage.value = 1
}

// 计算 filteredList（先筛选后排序）
const filteredList = computed(() => {
  let list = reportStore.reportList || []
  // 关键词
  const kw = (searchKeyword.value || '').trim().toLowerCase()
  if (kw) {
    list = list.filter(r => {
      const title = (r.title || '').toLowerCase()
      const id = (r.id || '').toLowerCase()
      const code = (r.content?.reportCode || '').toLowerCase()
      return title.includes(kw) || id.includes(kw) || code.includes(kw)
    })
  }
  // 报告类型
  if (filterReportType.value) {
    list = list.filter(r => r.reportType === filterReportType.value)
  }
  // 状态
  if (filterStatus.value) {
    list = list.filter(r => r.status === filterStatus.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(r => {
      const t = new Date(r.createTime).getTime()
      return t >= start && t < end
    })
  }
  // 默认按创建时间倒序
  list = [...list].sort((a, b) => {
    const ta = new Date(a.createTime || 0).getTime()
    const tb = new Date(b.createTime || 0).getTime()
    return tb - ta
  })
  return list
})

// ─── 分页 ───
const currentPage = ref(1)
const pageSize = ref(10)
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// ─── 多选导出 ───
const selectedIds = ref([])
const tableRef = ref(null)

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function handleBatchExport() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一条报告')
    return
  }
  const selected = reportStore.reportList.filter(r => selectedIds.value.includes(r.id))
  const hasNonArchived = selected.some(r => r.status !== '已归档')
  if (!hasNonArchived) {
    ElMessage.warning('所选报告均为已归档状态，无法导出')
    return
  }
  ElMessage.success(`已生成导出任务：报告台账_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)
}

// ─── 设备状态环图 ───
const ringHoverIndex = ref(-1)

const ringSegments = computed(() => {
  const list = equipmentStore.equipmentList || []
  const statusMap = {}
  const colorMap = {
    '正常': '#10B981',
    '待检验': '#F59E0B',
    '超期未检': '#EF4444',
    '停用': '#6B7280',
    '报废': '#1F2937'
  }
  list.forEach(eq => {
    const s = eq.status || '其他'
    statusMap[s] = (statusMap[s] || 0) + 1
  })
  const entries = Object.entries(statusMap)
  const total = list.length || 1
  let acc = 0
  return entries.map(([status, count]) => {
    const pct = count / total
    const start = acc * 360
    const end = (acc + pct) * 360
    acc += pct
    return {
      status,
      count,
      pct,
      color: colorMap[status] || '#9CA3AF',
      startDeg: start,
      endDeg: end
    }
  })
})

const ringGradient = computed(() => {
  if (!ringSegments.value.length) return 'conic-gradient(#E5E7EB 0deg, #E5E7EB 360deg)'
  const parts = ringSegments.value.map(s => {
    return `${s.color} ${s.startDeg}deg ${s.endDeg}deg`
  })
  return `conic-gradient(${parts.join(', ')})`
})

function segmentHoverStyle(idx) {
  const seg = ringSegments.value[idx]
  if (!seg) return { display: 'none' }
  const center = (seg.startDeg + seg.endDeg) / 2
  const r = 46
  const rad = (center - 90) * Math.PI / 180
  const x = 50 + r * Math.cos(rad)
  const y = 50 + r * Math.sin(rad)
  return {
    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(seg.startDeg * Math.PI / 180)}% ${50 + 50 * Math.sin(seg.startDeg * Math.PI / 180)}%, ${50 + 50 * Math.cos(seg.endDeg * Math.PI / 180)}% ${50 + 50 * Math.sin(seg.endDeg * Math.PI / 180)}%)`,
    position: 'absolute',
    width: '100%',
    height: '100%',
    cursor: 'pointer'
  }
}

function handleRingClick(status) {
  filterStatus.value = status
  handleSearch()
}

// ─── 设备选项（级联） ───
const equipmentOptions = computed(() => {
  const map = {}
  ;(equipmentStore.equipmentList || []).forEach(eq => {
    const type = eq.equipmentType || '其他'
    if (!map[type]) map[type] = []
    map[type].push({ id: eq.id, name: eq.name })
  })
  return Object.entries(map).map(([type, devices]) => ({
    id: type,
    name: type,
    devices
  }))
})

function getEquipmentName(id) {
  if (!id) return '—'
  const eq = equipmentStore.findById(id)
  return eq ? eq.name : id
}

// ─── 新增 / 编辑 ───
const formDialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const formData = reactive({
  title: '',
  reportType: '',
  relatedEntityId: '',
  createTime: '',
  summary: '',
  remarks: '',
  attachments: []
})

const formRules = {
  title: [
    { required: true, message: '报告标题不能为空', trigger: 'blur' }
  ],
  reportType: [
    { required: true, message: '请选择报告类型', trigger: 'change' }
  ],
  relatedEntityId: [
    { required: true, message: '请选择关联设备', trigger: 'change' }
  ],
  createTime: [
    { required: true, message: '请选择生成日期', trigger: 'change' }
  ]
}

function resetForm() {
  formData.title = ''
  formData.reportType = ''
  formData.relatedEntityId = ''
  formData.createTime = ''
  formData.summary = ''
  formData.remarks = ''
  formData.attachments = []
  isEditing.value = false
  editingId.value = null
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

function openAddDialog() {
  formData.createTime = new Date().toISOString().slice(0, 10)
  isEditing.value = false
  editingId.value = null
  formDialogVisible.value = true
}

function openEditDialog(row) {
  if (row.status !== '草稿') {
    ElMessage.warning('仅草稿状态的报告可以编辑')
    return
  }
  isEditing.value = true
  editingId.value = row.id
  formData.title = row.title
  formData.reportType = row.reportType
  formData.relatedEntityId = row.relatedEntityId
  formData.createTime = row.createTime ? row.createTime.slice(0, 10) : ''
  formData.summary = row.content?.summary || ''
  formData.remarks = row.content?.remarks || ''
  formData.attachments = row.content?.attachments?.map(a => ({
    name: typeof a === 'string' ? a : a.name,
    url: typeof a === 'string' ? a : a.url
  })) || []
  formDialogVisible.value = true
}

function checkDuplicate(title, reportType, entityId, excludeId) {
  return (reportStore.reportList || []).some(r => {
    if (excludeId && r.id === excludeId) return false
    return r.title === title && r.reportType === reportType && r.relatedEntityId === entityId
  })
}

function submitForm() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    // 重复校验
    if (checkDuplicate(formData.title, formData.reportType, formData.relatedEntityId, editingId.value)) {
      ElMessage.warning('该设备此类型报告已存在，请使用其他标题')
      return
    }
    submitting.value = true
    try {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const content = {
        summary: formData.summary || '',
        remarks: formData.remarks || '',
        findings: [],
        score: 0,
        attachments: formData.attachments.map(a => a.name || a)
      }
      if (isEditing.value && editingId.value) {
        reportStore.update(editingId.value, {
          title: formData.title,
          reportType: formData.reportType,
          relatedEntityId: formData.relatedEntityId,
          createTime: formData.createTime + ' 00:00:00',
          content,
          auditBy: ''
        })
        ElMessage.success('报告已更新')
      } else {
        const newId = generateReportId()
        reportStore.add({
          id: newId,
          title: formData.title,
          reportType: formData.reportType,
          generationMethod: '手动',
          status: '草稿',
          relatedEntityType: '设备',
          relatedEntityId: formData.relatedEntityId,
          content,
          createTime: formData.createTime + ' 00:00:00',
          auditBy: '',
          auditTime: ''
        })
        ElMessage.success('报告创建成功')
      }
      formDialogVisible.value = false
    } finally {
      submitting.value = false
    }
  })
}

// ─── 删除 ───
function handleDelete(row) {
  if (row.status !== '草稿') {
    ElMessage.warning('仅草稿状态的报告可以删除')
    return
  }
  ElMessageBox.confirm(
    `确定删除报告【${row.title}】？删除后不可恢复。`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    reportStore.remove(row.id)
    ElMessage.success('报告已删除')
  }).catch(() => {})
}

// ─── 详情 ───
const detailVisible = ref(false)
const detailData = ref(null)

function openDetail(row) {
  detailData.value = row
  detailVisible.value = true
}

function handleDownload(att) {
  const name = typeof att === 'string' ? att : att.name
  ElMessage.success(`开始下载：${name}`)
}

// ─── 提交审核 ───
function handleSubmitAudit(row) {
  if (row.status !== '草稿') {
    ElMessage.warning('仅草稿状态的报告可以提交审核')
    return
  }
  ElMessageBox.confirm(
    `确定将报告【${row.title}】提交审核？`,
    '提交审核',
    { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    reportStore.update(row.id, {
      status: '已提交',
      auditBy: '',
      auditTime: ''
    })
    ElMessage.success('已提交审核，等待审核人处理')
  }).catch(() => {})
}

// ─── 审核 ───
const auditDialogVisible = ref(false)
const auditAction = ref('通过')
const auditTargetId = ref(null)
const auditing = ref(false)
const auditFormRef = ref(null)
const auditForm = reactive({ comment: '' })
const auditRules = {
  comment: [
    {
      validator: (rule, value, callback) => {
        if (auditAction.value === '驳回' && (!value || !value.trim())) {
          callback(new Error('驳回时必须填写原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function openAuditDialog(row, action) {
  auditAction.value = action
  auditTargetId.value = row.id
  auditForm.comment = ''
  auditDialogVisible.value = true
  nextTick(() => {
    auditFormRef.value?.clearValidate()
  })
}

function confirmAudit() {
  auditFormRef.value?.validate(async (valid) => {
    if (!valid) return
    auditing.value = true
    try {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      if (auditAction.value === '通过') {
        reportStore.update(auditTargetId.value, {
          status: '已审核',
          auditBy: '审核员',
          auditTime: now,
          content: {
            ...(reportStore.findById(auditTargetId.value)?.content || {}),
            auditComment: auditForm.comment
          }
        })
        ElMessage.success('审核通过')
      } else {
        reportStore.update(auditTargetId.value, {
          status: '草稿',
          auditBy: '',
          auditTime: '',
          content: {
            ...(reportStore.findById(auditTargetId.value)?.content || {}),
            rejectReason: auditForm.comment
          }
        })
        ElMessage.success('已驳回，报告回退至草稿')
      }
      auditDialogVisible.value = false
    } finally {
      auditing.value = false
    }
  })
}

// ─── 归档 ───
function handleArchive(row) {
  if (row.status !== '已审核') {
    ElMessage.warning('仅已审核状态的报告可以归档')
    return
  }
  ElMessageBox.confirm(
    `确定将报告【${row.title}】归档？归档后仅可查看和导出。`,
    '归档确认',
    { confirmButtonText: '确认归档', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    reportStore.update(row.id, {
      status: '已归档',
      content: {
        ...(row.content || {}),
        archiveBy: '管理员',
        archiveTime: now
      }
    })
    ElMessage.success('报告已归档')
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
@use './ReportArchive.scss' as *;
</style>