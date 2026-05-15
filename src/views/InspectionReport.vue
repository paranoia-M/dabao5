<template>
  <div class="page-inspection-report">
    <!-- 顶部信息条 -->
    <div class="top-banner">
      <div class="banner-left">
        <div class="banner-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="banner-info">
          <span class="banner-title">检测报告管理中心</span>
          <span class="banner-count">共 {{ store.total }} 份报告</span>
        </div>
      </div>
      <div class="banner-right">
        <el-button type="primary" @click="openAddDialog" class="btn-primary">生成报告</el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="报告编号/样品名称"
          clearable
          class="filter-input"
          @input="onFilterChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="报告状态" clearable class="filter-select" @change="onFilterChange">
          <el-option label="全部" value="" />
          <el-option label="草稿" value="草稿" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已审核" value="已审核" />
          <el-option label="已签发" value="已签发" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="签发开始日期"
          end-placeholder="签发结束日期"
          value-format="YYYY-MM-DD"
          class="filter-date"
          @change="onFilterChange"
        />
      </div>
    </div>

    <!-- 主内容区：左侧水印图章 + 右侧列表 + 底部记录 -->
    <div class="content-grid">
      <!-- 左侧 55%：报告水印图章（招牌业务积木） -->
      <div class="left-stamp" @mouseenter="showStampInfo = true" @mouseleave="showStampInfo = false">
        <div class="stamp-header">
          <span class="stamp-title">报告水印图章</span>
          <span v-if="stampReport" class="stamp-subtitle">{{ stampReport.reportNo }}</span>
        </div>
        <div v-if="stampReport" class="stamp-svg-container">
          <svg viewBox="0 0 400 560" class="stamp-svg">
            <!-- 报告卡片背景 -->
            <rect x="10" y="10" width="380" height="540" rx="8" fill="#1a1a2e" stroke="#374151" stroke-width="2"/>
            <!-- 标题 -->
            <text x="200" y="60" text-anchor="middle" fill="#e5e7eb" font-size="22" font-weight="bold">食品质量安全检测报告</text>
            <line x1="60" y1="75" x2="340" y2="75" stroke="#374151" stroke-width="1"/>
            <!-- 报告编号 -->
            <text x="40" y="110" fill="#9ca3af" font-size="13">报告编号：</text>
            <text x="160" y="110" fill="#f3f4f6" font-size="14" font-weight="bold">{{ stampReport.reportNo }}</text>
            <!-- 样品名称 -->
            <text x="40" y="145" fill="#9ca3af" font-size="13">样品名称：</text>
            <text x="160" y="145" fill="#f3f4f6" font-size="14">{{ stampSampleName }}</text>
            <!-- 检测人 -->
            <text x="40" y="180" fill="#9ca3af" font-size="13">检测人：</text>
            <text x="160" y="180" fill="#f3f4f6" font-size="14">{{ stampReport.generator }}</text>
            <!-- 生成日期 -->
            <text x="40" y="215" fill="#9ca3af" font-size="13">生成日期：</text>
            <text x="160" y="215" fill="#f3f4f6" font-size="14">{{ stampFormatDate(stampReport.generateDate) }}</text>
            <!-- 分隔线 -->
            <line x1="40" y1="235" x2="360" y2="235" stroke="#374151" stroke-width="1" stroke-dasharray="4,4"/>
            <!-- 结论图章 -->
            <g transform="translate(300, 160)">
              <circle cx="0" cy="0" r="45" :fill="stampReport.finalResult === '合格' ? '#065f46' : (stampReport.finalResult === '不合格' ? '#991b1b' : '#52525b')" fill-opacity="0.85"/>
              <circle cx="0" cy="0" r="42" fill="none" :stroke="stampReport.finalResult === '合格' ? '#10b981' : (stampReport.finalResult === '不合格' ? '#ef4444' : '#a1a1aa')" stroke-width="2"/>
              <text x="0" y="-8" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">{{ stampReport.finalResult }}</text>
              <text x="0" y="16" text-anchor="middle" fill="#d1d5db" font-size="11">章</text>
            </g>
            <!-- 检测项目列表 -->
            <text x="40" y="270" fill="#9ca3af" font-size="13">主要检测项目：</text>
            <g v-for="(item, idx) in stampItems.slice(0, 5)" :key="idx">
              <rect x="40" :y="285 + idx * 30" width="320" height="24" rx="4" :fill="item.conclusion === '合格' ? '#064e3b' : (item.conclusion === '不合格' ? '#7f1d1d' : '#292524')" fill-opacity="0.5"/>
              <text x="50" :y="302 + idx * 30" fill="#e5e7eb" font-size="12">{{ item.itemName }}</text>
              <text x="270" :y="302 + idx * 30" :fill="item.conclusion === '合格' ? '#34d399' : (item.conclusion === '不合格' ? '#f87171' : '#a3a3a3')" font-size="12" font-weight="bold">{{ item.conclusion }}</text>
            </g>
            <!-- 审核信息（hover 显示） -->
            <g v-if="showStampInfo && stampReport.approveDate">
              <rect x="40" y="460" width="320" height="50" rx="4" fill="#1e293b" fill-opacity="0.8"/>
              <text x="50" y="480" fill="#fbbf24" font-size="12">审核信息</text>
              <text x="50" y="498" fill="#d1d5db" font-size="11">审核人：{{ stampReport.generator }} | 审核日：{{ stampFormatDate(stampReport.approveDate) }}</text>
            </g>
            <!-- 水印文字 -->
            <text x="200" y="520" text-anchor="middle" fill="#374151" font-size="14" transform="rotate(-20, 200, 520)" fill-opacity="0.6">检测报告 — 官方签发</text>
          </svg>
          <p class="stamp-hint">鼠标悬停显示审核信息</p>
        </div>
        <el-empty v-else description="请从右侧列表选择一份报告" class="stamp-empty" />
      </div>

      <!-- 右侧 30%：报告列表表格 -->
      <div class="right-list">
        <div class="list-header">
          <span class="list-title">报告列表</span>
          <el-tag type="info" size="small">{{ filteredList.length }} 条</el-tag>
        </div>
        <div class="list-table-wrap">
          <el-table
            :data="filteredList"
            stripe
            highlight-current-row
            @row-click="handleRowClick"
            class="report-table"
            height="100%"
          >
            <el-table-column prop="reportNo" label="报告编号" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="cell-reportno">{{ row.reportNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="报告标题" min-width="120" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="generator" label="编制人" width="90" />
            <el-table-column prop="generateDate" label="生成日期" width="110" />
            <el-table-column label="结论" width="72">
              <template #default="{ row }">
                <span :class="row.finalResult === '不合格' ? 'text-danger' : (row.finalResult === '合格' ? 'text-success' : 'text-warning')">{{ row.finalResult }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
                <el-button v-if="row.status === '草稿' || row.status === '待审核'" link type="warning" size="small" @click.stop="openEditDialog(row)">编辑</el-button>
                <el-button v-if="row.status === '待审核'" link type="success" size="small" @click.stop="openAuditDialog(row)">审核</el-button>
                <el-button v-if="row.status === '已签发'" link type="primary" size="small" @click.stop="handleExport(row)">导出</el-button>
                <el-button v-if="row.status === '已签发'" link type="info" size="small" @click.stop="handlePrint(row)">打印</el-button>
                <el-button v-if="row.status === '草稿' || row.status === '待审核'" link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 底部区域 15%：审核记录/备注 -->
    <div class="bottom-area">
      <div class="bottom-left">
        <span class="bottom-label">审核记录</span>
        <div v-if="auditRecords.length > 0" class="audit-list">
          <div v-for="(rec, idx) in auditRecords.slice(0, 3)" :key="idx" class="audit-item">
            <span class="audit-time">{{ rec.time }}</span>
            <el-tag :type="rec.action === '通过' ? 'success' : (rec.action === '驳回' ? 'danger' : 'info')" size="mini">{{ rec.action }}</el-tag>
            <span class="audit-actor">{{ rec.actor }}</span>
            <span v-if="rec.comment" class="audit-comment">：{{ rec.comment }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无审核记录" :image-size="40" />
      </div>
      <div class="bottom-right">
        <span class="bottom-label">报告备注</span>
        <p class="remark-text">当前选中报告：{{ stampReport ? stampReport.reportNo : '无' }} — 请通过右侧列表查看详情。</p>
      </div>
    </div>

    <!-- ====== 弹窗/抽屉 ====== -->

    <!-- 新增报告 Dialog -->
    <el-dialog v-model="addDialogVisible" title="生成新报告" :width="min(680, 92) + 'vw'" top="4vh" class="report-dialog" destroy-on-close>
      <el-form :model="addForm" label-width="100px" class="add-form" @submit.prevent>
        <div class="form-grid">
          <el-form-item label="报告标题" required>
            <el-input v-model="addForm.title" placeholder="请输入报告标题" />
          </el-form-item>
          <el-form-item label="样品批次" required>
            <el-select v-model="addForm.sampleId" placeholder="选择样品批次" filterable class="full-width">
              <el-option v-for="s in sampleList" :key="s.id" :label="s.name + ' (' + s.source + ')'" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测项目" required>
            <el-select v-model="addForm.itemNames" multiple placeholder="至少选1项" class="full-width">
              <el-option v-for="std in standardList" :key="std.id" :label="std.itemName + ' (' + std.name + ')'" :value="std.itemName" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测标准" required>
            <el-select v-model="addForm.standardId" placeholder="选择检测标准" filterable class="full-width">
              <el-option v-for="std in standardList" :key="std.id" :label="std.name + ' — ' + std.standardCode" :value="std.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测结果">
            <el-input v-model="addForm.value" placeholder="自动填充可编辑" />
          </el-form-item>
          <el-form-item label="报告类型" required>
            <el-radio-group v-model="addForm.reportType">
              <el-radio label="常规">常规</el-radio>
              <el-radio label="加急">加急</el-radio>
              <el-radio label="复检">复检</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认生成</el-button>
      </template>
    </el-dialog>

    <!-- 编辑 Dialog（复用新增表单） -->
    <el-dialog v-model="editDialogVisible" title="编辑报告" :width="min(680, 92) + 'vw'" top="4vh" class="report-dialog" destroy-on-close>
      <el-form :model="editForm" label-width="100px" class="add-form" @submit.prevent>
        <div class="form-grid">
          <el-form-item label="报告标题" required>
            <el-input v-model="editForm.title" placeholder="请输入报告标题" />
          </el-form-item>
          <el-form-item label="样品批次" required>
            <el-select v-model="editForm.sampleId" placeholder="选择样品批次" filterable class="full-width">
              <el-option v-for="s in sampleList" :key="s.id" :label="s.name + ' (' + s.source + ')'" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测项目" required>
            <el-select v-model="editForm.itemNames" multiple placeholder="至少选1项" class="full-width">
              <el-option v-for="std in standardList" :key="std.id" :label="std.itemName + ' (' + std.name + ')'" :value="std.itemName" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测标准" required>
            <el-select v-model="editForm.standardId" placeholder="选择检测标准" filterable class="full-width">
              <el-option v-for="std in standardList" :key="std.id" :label="std.name + ' — ' + std.standardCode" :value="std.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测结果">
            <el-input v-model="editForm.value" placeholder="自动填充可编辑" />
          </el-form-item>
          <el-form-item label="报告类型" required>
            <el-radio-group v-model="editForm.reportType">
              <el-radio label="常规">常规</el-radio>
              <el-radio label="加急">加急</el-radio>
              <el-radio label="复检">复检</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 审核 Dialog -->
    <el-dialog v-model="auditDialogVisible" title="审核报告" width="420px" class="audit-dialog" destroy-on-close>
      <p class="audit-report-info">报告编号：{{ auditTarget?.reportNo }}</p>
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="auditForm.action">
            <el-radio value="通过">通过</el-radio>
            <el-radio value="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.action === '驳回'" label="驳回原因" required>
          <el-input v-model="auditForm.comment" type="textarea" rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="detailDrawerVisible" title="报告详情" size="480px" class="detail-drawer" destroy-on-close>
      <div v-if="detailReport" class="detail-content">
        <div class="detail-field"><span class="detail-label">报告编号</span><span class="detail-value">{{ detailReport.reportNo }}</span></div>
        <div class="detail-field"><span class="detail-label">报告标题</span><span class="detail-value">{{ detailReport.title }}</span></div>
        <div class="detail-field"><span class="detail-label">样品名称</span><span class="detail-value">{{ detailSampleName }}</span></div>
        <div class="detail-field"><span class="detail-label">样品批号</span><span class="detail-value">{{ detailSample?.id || '-' }}</span></div>
        <div class="detail-field"><span class="detail-label">状态</span><span class="detail-value"><el-tag :type="statusTagType(detailReport.status)" size="small">{{ detailReport.status }}</el-tag></span></div>
        <div class="detail-field"><span class="detail-label">检测结论</span><span class="detail-value" :class="detailReport.finalResult === '不合格' ? 'text-danger' : ''">{{ detailReport.finalResult }}</span></div>
        <div class="detail-field"><span class="detail-label">编制人</span><span class="detail-value">{{ detailReport.generator }}</span></div>
        <div class="detail-field"><span class="detail-label">生成日期</span><span class="detail-value">{{ formatDateTime(detailReport.generateDate) }}</span></div>
        <div class="detail-field"><span class="detail-label">审核日期</span><span class="detail-value">{{ detailReport.approveDate ? formatDateTime(detailReport.approveDate) : '-' }}</span></div>
        <div class="detail-field" style="grid-column: 1 / -1;"><span class="detail-label">检测项目列表</span></div>
        <div v-if="detailItems.length > 0" class="detail-items" style="grid-column: 1 / -1;">
          <div v-for="item in detailItems" :key="item.id" class="detail-item-row">
            <span class="item-name">{{ item.itemName }}</span>
            <span class="item-value">{{ item.value }} {{ item.unit }}</span>
            <el-tag :type="item.conclusion === '合格' ? 'success' : (item.conclusion === '不合格' ? 'danger' : 'warning')" size="mini">{{ item.conclusion }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无检测项目数据" :image-size="40" style="grid-column: 1 / -1;" />
        <div class="detail-actions" style="grid-column: 1 / -1; margin-top: 20px;">
          <el-button type="primary" @click="handlePrint(detailReport)">打印预览</el-button>
          <el-button @click="detailDrawerVisible = false">关闭</el-button>
        </div>
      </div>
      <el-empty v-else description="无法获取详情" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useInspectionReportStore } from '@/stores/inspectionReport'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useDetectStandardStore } from '@/stores/detectStandard'

// ========== stores ==========
const reportStore = useInspectionReportStore()
const sampleStore = useSampleStore()
const taskStore = useDetectTaskStore()
const resultStore = useInspectionResultStore()
const standardStore = useDetectStandardStore()

const store = reportStore

// ========== 数据 ==========
const sampleList = computed(() => sampleStore.sampleList)
const standardList = computed(() => standardStore.detectStandardList)

// ========== 筛选 ==========
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])

const filteredList = computed(() => {
  let list = store.inspectionReportList
  // 关键词
  if (keyword.value && keyword.value.trim() !== '') {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(r => r.reportNo.toLowerCase().includes(kw) || r.title.toLowerCase().includes(kw))
  }
  // 状态
  if (statusFilter.value && statusFilter.value !== '') {
    list = list.filter(r => r.status === statusFilter.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(r => {
      if (!r.approveDate) return false
      const d = r.approveDate.slice(0, 10)
      return d >= start && d <= end
    })
  }
  return list.slice().sort((a, b) => {
    const da = new Date(b.generateDate).getTime()
    const db = new Date(a.generateDate).getTime()
    return da - db
  })
})

const onFilterChange = () => {
  // computed 自动响应
}

// ========== 水印图章（主舞台）相关 ==========
const showStampInfo = ref(false)
const selectedReportId = ref(null)
const stampReport = computed(() => {
  if (!selectedReportId.value) {
    // 默认选中第一条
    if (filteredList.value.length > 0) {
      selectedReportId.value = filteredList.value[0].id
    }
  }
  return selectedReportId.value ? store.findById(selectedReportId.value) || null : null
})

const stampSampleName = computed(() => {
  if (!stampReport.value) return ''
  const task = taskStore.findById(stampReport.value.taskId)
  if (!task) return ''
  const sample = sampleStore.findById(task.sampleId)
  return sample ? sample.name : ''
})

const stampItems = computed(() => {
  if (!stampReport.value) return []
  const task = taskStore.findById(stampReport.value.taskId)
  if (!task) return []
  return resultStore.inspectionResultList.filter(r => r.taskId === task.id)
})

const stampFormatDate = (d) => {
  if (!d) return '-'
  return d.slice(0, 10)
}

const handleRowClick = (row) => {
  selectedReportId.value = row.id
}

// ========== 新增 ==========
const addDialogVisible = ref(false)
const addForm = ref({
  title: '',
  sampleId: '',
  itemNames: [],
  standardId: '',
  value: '',
  reportType: '常规'
})

const openAddDialog = () => {
  addForm.value = { title: '', sampleId: '', itemNames: [], standardId: '', value: '', reportType: '常规' }
  addDialogVisible.value = true
}

const confirmAdd = () => {
  const f = addForm.value
  if (!f.title || !f.sampleId || f.itemNames.length === 0 || !f.standardId) {
    ElMessage.warning('请填写必填字段')
    return
  }
  // 生成报告编号
  const now = new Date()
  const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  const reportNo = 'RPT-' + datePart + '-' + rand
  // 查询样品关联的任务
  const sample = sampleStore.findById(f.sampleId)
  const tasks = taskStore.detectTaskList.filter(t => t.sampleId === f.sampleId)
  const taskId = tasks.length > 0 ? tasks[0].id : ''
  // 自动判断结论（不合格标记）
  let finalResult = '合格'
  const std = standardStore.findById(f.standardId)
  if (std) {
    // 检测结果不符合标准——标记不合格
    if (f.value && std.limitValue) {
      // 简单数值比较逻辑（非严格，仅演示）
      const valNum = parseFloat(f.value)
      const limitStr = std.limitValue.replace(/[^0-9.]/g, '')
      const limitNum = parseFloat(limitStr)
      if (!isNaN(valNum) && !isNaN(limitNum) && valNum > limitNum) {
        finalResult = '不合格'
      }
    }
  }
  // 创建报告
  store.add({
    id: 'inspectionreport_' + Date.now(),
    taskId: taskId,
    title: f.title,
    reportNo: reportNo,
    status: '草稿',
    generator: '编制员',
    generateDate: now.toISOString().slice(0, 16).replace('T', ' '),
    approveDate: '',
    finalResult: finalResult
  })
  ElMessage.success('报告草稿已生成，编号：' + reportNo)
  addDialogVisible.value = false
}

// ========== 编辑 ==========
const editDialogVisible = ref(false)
const editForm = ref({ title: '', sampleId: '', itemNames: [], standardId: '', value: '', reportType: '常规' })
let editTargetId = ''

const openEditDialog = (row) => {
  editTargetId = row.id
  const task = taskStore.findById(row.taskId)
  editForm.value = {
    title: row.title,
    sampleId: task ? task.sampleId : '',
    itemNames: [],
    standardId: '',
    value: '',
    reportType: '常规'
  }
  editDialogVisible.value = true
}

const confirmEdit = () => {
  const f = editForm.value
  if (!f.title) {
    ElMessage.warning('报告标题不能为空')
    return
  }
  store.update(editTargetId, { title: f.title })
  ElMessage.success('报告已更新')
  editDialogVisible.value = false
}

// ========== 删除 ==========
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除报告「' + row.reportNo + '」？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.remove(row.id)
    ElMessage.success('报告已删除')
    if (selectedReportId.value === row.id) {
      selectedReportId.value = null
    }
  }).catch(() => {
    // 取消
  })
}

// ========== 审核 ==========
const auditDialogVisible = ref(false)
const auditTarget = shallowRef(null)
const auditForm = ref({ action: '通过', comment: '' })

const openAuditDialog = (row) => {
  auditTarget.value = row
  auditForm.value = { action: '通过', comment: '' }
  auditDialogVisible.value = true
}

const confirmAudit = () => {
  if (!auditTarget.value) return
  const act = auditForm.value.action
  if (act === '驳回' && !auditForm.value.comment.trim()) {
    ElMessage.warning('驳回必须填写原因')
    return
  }
  const newStatus = act === '通过' ? '已签发' : '已驳回'
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  store.update(auditTarget.value.id, { status: newStatus, approveDate: now })
  // 记录审核记录
  auditRecords.value.unshift({
    time: now,
    action: act,
    actor: '审核员',
    comment: auditForm.value.comment
  })
  ElMessage.success('报告已' + (act === '通过' ? '通过并签发' : '驳回'))
  auditDialogVisible.value = false
}

// ========== 导出 ==========
const handleExport = (row) => {
  ElMessage.success('正在导出报告 ' + row.reportNo + ' 的PDF文件')
  // 模拟：触发下载（真实场景调API）
  const link = document.createElement('a')
  link.href = '#'
  link.download = row.reportNo + '.pdf'
  link.click()
}

// ========== 打印 ==========
const handlePrint = (row) => {
  ElMessage.success('正在打开报告 ' + row.reportNo + ' 打印预览')
  window.print()
}

// ========== 详情 Drawer ==========
const detailDrawerVisible = ref(false)
const detailReport = shallowRef(null)
const detailSampleName = ref('')
const detailSample = shallowRef(null)
const detailItems = ref([])

const openDetailDrawer = (row) => {
  detailReport.value = row
  const task = taskStore.findById(row.taskId)
  if (task) {
    const sample = sampleStore.findById(task.sampleId)
    detailSample.value = sample || null
    detailSampleName.value = sample ? sample.name : ''
    detailItems.value = resultStore.inspectionResultList.filter(r => r.taskId === task.id)
  } else {
    detailSample.value = null
    detailSampleName.value = ''
    detailItems.value = []
  }
  detailDrawerVisible.value = true
}

// ========== 审核记录（底部区域） ==========
const auditRecords = ref([
  { time: '2026-03-05 10:30', action: '通过', actor: '张伟', comment: '检测数据符合标准' },
  { time: '2026-03-04 14:15', action: '驳回', actor: '李娜', comment: '菌落总数超限，需复检' }
])

// ========== 工具函数 ==========
const statusTagType = (status) => {
  switch (status) {
    case '草稿': return 'info'
    case '待审核': return 'warning'
    case '已审核': return 'primary'
    case '已签发': return 'success'
    case '已驳回': return 'danger'
    default: return 'info'
  }
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return d.slice(0, 16).replace('T', ' ')
}

const min = (a, b) => a > b ? b : a

// ========== 自动选中第一条 ==========
onMounted(() => {
  if (filteredList.value.length > 0 && !selectedReportId.value) {
    selectedReportId.value = filteredList.value[0].id
  }
})
</script>

<style scoped lang="scss">
@use './InspectionReport.scss' as *;
</style>