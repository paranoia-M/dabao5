<template>
  <div class="page-result-input">
    <!-- 顶部提示条 -->
    <div class="top-banner">
      <el-icon><WarningFilled /></el-icon>
      <span>检测结果录入区：请根据实验数据如实填写，标注<b>“超限”</b>的记录将触发预警通知。</span>
    </div>

    <!-- 筛选与批量操作区 -->
    <div class="filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="5">
          <el-input
            v-model="filterKeyword"
            placeholder="样品编号/任务编号"
            clearable
            @clear="handleQuery"
          />
        </el-col>
        <el-col :span="5">
          <el-select
            v-model="filterStatus"
            multiple
            placeholder="全部状态"
            clearable
            collapse-tags
          >
            <el-option label="待提交" value="待提交" />
            <el-option label="已提交" value="已提交" />
            <el-option label="已审核" value="已审核" />
            <el-option label="已驳回" value="已驳回" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="filterDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            style="width:100%"
          />
        </el-col>
        <el-col :span="2">
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </el-col>
        <el-col :span="2">
          <el-button @click="handleReset">重置</el-button>
        </el-col>
        <el-col :span="4" style="text-align:right">
          <el-button type="success" @click="showBatchImport = true">批量导入</el-button>
          <el-button type="warning" :disabled="selectedIds.length===0" @click="handleSubmitReview">提交审核</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 主舞台 + 快速录入 -->
    <div class="main-content">
      <!-- 左栏：标准限值比较图 -->
      <div class="left-chart-panel">
        <div class="panel-title">
          <span class="title-decor"></span>
          标准限值比较图
        </div>
        <div class="chart-container">
          <svg viewBox="0 0 600 320" class="limit-chart-svg" preserveAspectRatio="xMidYMid meet">
            <!-- 背景标尺 -->
            <line x1="60" y1="50" x2="560" y2="50" stroke="#555" stroke-width="2" />
            <line x1="60" y1="50" x2="60" y2="270" stroke="#555" stroke-width="1" stroke-dasharray="4,4" />
            <line x1="560" y1="50" x2="560" y2="270" stroke="#555" stroke-width="1" stroke-dasharray="4,4" />
            <!-- 限值范围条 -->
            <rect :x="limitBarX" y="80" :width="limitBarWidth" height="40" :fill="limitBarColor" rx="4" opacity="0.3" />
            <text :x="limitBarX+limitBarWidth/2" y="105" text-anchor="middle" fill="#fff" font-size="12">{{ currentLimitText }}</text>
            <!-- 当前检测值标记 -->
            <circle v-if="currentValue !== null" :cx="valueX" cy="100" r="8" fill="#f56c6c" stroke="#fff" stroke-width="2" />
            <text v-if="currentValue !== null" :x="valueX" y="135" text-anchor="middle" fill="#f56c6c" font-size="14" font-weight="bold">{{ currentValue }} {{ currentUnit }}</text>
            <!-- 图例 -->
            <rect x="80" y="200" width="20" height="12" fill="#409EFF" opacity="0.3" rx="2" />
            <text x="110" y="212" fill="#aaa" font-size="12">标准限值范围</text>
            <circle cx="220" cy="206" r="6" fill="#f56c6c" />
            <text x="240" y="212" fill="#aaa" font-size="12">当前检测值</text>
            <!-- hover信息区 -->
            <rect v-if="showStandardInfo" x="80" y="240" width="300" height="60" fill="#333" rx="6" opacity="0.9" />
            <text v-if="showStandardInfo" x="95" y="260" fill="#fff" font-size="12">标准名称：{{ selectedStandardName || '-' }}</text>
            <text v-if="showStandardInfo" x="95" y="280" fill="#fff" font-size="12">限值要求：{{ selectedStandardLimit || '-' }}</text>
            <text v-if="showStandardInfo" x="95" y="300" fill="#fff" font-size="12">标准来源：{{ selectedStandardSource || '-' }}</text>
          </svg>
          <div class="chart-fallback" v-if="!hasSelectedStandard">
            <el-empty description="请从右侧表单选择检测标准" />
          </div>
        </div>
      </div>

      <!-- 右栏：快速录入表单 -->
      <div class="right-form-panel">
        <div class="panel-title">
          <span class="title-decor"></span>
          快速录入
        </div>
        <el-form :model="fastForm" label-width="80px" size="small" class="fast-form">
          <el-form-item label="样品">
            <el-select v-model="fastForm.sampleId" filterable placeholder="选择样品" style="width:100%" @change="onSampleChange">
              <el-option v-for="s in sampleStore.sampleList" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="检测标准">
            <el-select v-model="fastForm.standardId" filterable placeholder="选择标准" style="width:100%" @change="onStandardChange">
              <el-option v-for="st in standardStore.detectStandardList" :key="st.id" :label="st.itemName" :value="st.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="实测值">
            <el-input-number v-model="fastForm.value" :min="0" :step="0.01" :precision="3" style="width:100%" @change="onValueChange" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input :model-value="fastForm.unit" disabled />
          </el-form-item>
          <el-form-item label="判定结论">
            <el-tag :type="fastForm.conclusion==='合格'?'success':'danger'" size="large">
              {{ fastForm.conclusion || '待判定' }}
            </el-tag>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="computeConclusion">计算判定</el-button>
            <el-button type="success" :disabled="!fastForm.conclusion" @click="saveFastResult">保存录入</el-button>
          </el-form-item>
        </el-form>
        <div v-if="fastForm.conclusion" class="computed-result">
          <span class="result-label">判定结果：</span>
          <el-tag :type="fastForm.conclusion==='合格'?'success':'danger'" size="large" effect="dark">
            {{ fastForm.conclusion }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 底部表格 -->
    <div class="table-section">
      <div class="section-title">
        <span class="title-decor"></span>
        检测结果列表
        <span class="item-count">（共 {{ filteredList.length }} 条）</span>
      </div>
      <el-table
        :data="filteredList"
        stripe
        border
        style="width:100%"
        @selection-change="onSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="任务编号" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="样品名称" width="120">
          <template #default="{ row }">
            {{ getSampleName(row.taskId) }}
          </template>
        </el-table-column>
        <el-table-column label="检测项目" width="140" prop="itemName" :show-overflow-tooltip="true" />
        <el-table-column label="实测值" width="100" prop="value" />
        <el-table-column label="单位" width="70" prop="unit" />
        <el-table-column label="结论" width="80">
          <template #default="{ row }">
            <el-tag :type="row.conclusion==='合格'?'success':'danger'" size="small">{{ row.conclusion }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.resultStatus)" size="small">{{ row.resultStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测日期" width="110" prop="testDate" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.resultStatus==='待提交' || row.resultStatus==='已驳回'"
              type="primary"
              size="small"
              @click="openEditDialog(row)"
            >录入/编辑</el-button>
            <el-button
              v-if="row.resultStatus==='已提交'"
              type="info"
              size="small"
              disabled
            >已提交</el-button>
            <el-button
              size="small"
              @click="openDetailDrawer(row)"
            >详情</el-button>
            <el-button
              v-if="row.resultStatus==='待提交' || row.resultStatus==='已驳回'"
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑 dialog -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑检测结果' : '录入检测结果'"
      width="min(740px,92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" label-width="100px" size="small" :rules="editFormRules">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="样品编号" prop="sampleId">
              <el-select v-model="editForm.sampleId" filterable disabled style="width:100%">
                <el-option v-for="s in sampleStore.sampleList" :key="s.id" :label="s.id + '-' + s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测项目" prop="itemName">
              <el-select v-model="editForm.itemName" filterable placeholder="选择检测项目" style="width:100%">
                <el-option v-for="st in standardStore.detectStandardList" :key="st.id" :label="st.itemName" :value="st.itemName" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="实测数值" prop="value">
              <el-input-number v-model="editForm.value" :min="0" :step="0.01" :precision="3" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="editForm.unit" placeholder="自动带出" style="width:100%">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="检测方法" prop="method">
              <el-input v-model="editForm.method" placeholder="填写检测方法" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测人" prop="inspector">
              <el-input v-model="editForm.inspector" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测日期" prop="testDate">
              <el-date-picker v-model="editForm.testDate" type="date" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="判定结论" prop="conclusion">
          <el-radio-group v-model="editForm.conclusion">
            <el-radio label="合格">合格</el-radio>
            <el-radio label="不合格">不合格</el-radio>
            <el-radio label="待定">待定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情 drawer -->
    <el-drawer v-model="detailDrawerVisible" title="检测结果详情" direction="rtl" size="500px">
      <template #default>
        <div v-if="detailItem" class="detail-container">
          <div class="detail-section">
            <h4 class="detail-section-title">样品信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="样品编号">{{ detailItem.sampleId }}</el-descriptions-item>
              <el-descriptions-item label="样品名称">{{ getSampleNameFromId(detailItem.sampleId) }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="detail-section">
            <h4 class="detail-section-title">检测结果</h4>
            <el-table :data="[detailItem]" border size="small" style="width:100%">
              <el-table-column prop="itemName" label="项目名称" />
              <el-table-column prop="value" label="实测值" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="conclusion" label="判定">
                <template #default="{ row }">
                  <el-tag :type="row.conclusion==='合格'?'success':'danger'" size="small">{{ row.conclusion }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="detail-section">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="检测人员">{{ detailItem.inspector || '-' }}</el-descriptions-item>
              <el-descriptions-item label="检测日期">{{ detailItem.testDate }}</el-descriptions-item>
              <el-descriptions-item label="总判定">{{ detailItem.conclusion }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{ detailItem.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="printDetail">打印</el-button>
        <el-button @click="detailDrawerVisible=false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 批量导入 dialog -->
    <el-dialog v-model="showBatchImport" title="批量导入检测结果" width="min(700px,92vw)">
      <el-upload
        ref="uploadRef"
        action="#"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        :on-exceed="()=>{}"
      >
        <el-button slot="trigger" size="small" type="primary">选取Excel文件</el-button>
      </el-upload>
      <div v-if="importPreview.length>0" style="margin-top:16px;">
        <el-table :data="importPreview" border size="small" max-height="300">
          <el-table-column prop="itemName" label="项目名称" />
          <el-table-column prop="value" label="实测值" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="conclusion" label="结论" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showBatchImport=false">取消</el-button>
        <el-button type="primary" :disabled="importPreview.length===0" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useDetectStandardStore } from '@/stores/detectStandard'

const sampleStore = useSampleStore()
const taskStore = useDetectTaskStore()
const resultStore = useInspectionResultStore()
const standardStore = useDetectStandardStore()

// ========= 筛选 =========
const filterKeyword = ref('')
const filterStatus = ref([])
const filterDateRange = ref([])

const selectedIds = ref([])

function handleQuery() {
  // computed 自动响应
  ElMessage.info('已更新筛选条件')
}
function handleReset() {
  filterKeyword.value = ''
  filterStatus.value = []
  filterDateRange.value = []
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

// 筛选结果
const filteredList = computed(() => {
  let list = resultStore.inspectionResultList
  // 关键词
  if (filterKeyword.value) {
    const kw = filterKeyword.value.trim().toLowerCase()
    list = list.filter(r => r.id.toLowerCase().includes(kw) || (r.itemName && r.itemName.toLowerCase().includes(kw)))
  }
  // 状态
  if (filterStatus.value.length > 0) {
    list = list.filter(r => filterStatus.value.includes(r.resultStatus))
  }
  // 日期范围
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    list = list.filter(r => r.testDate >= start && r.testDate <= end)
  }
  // 默认排序：按创建时间降序，但无createDate字段，使用testDate降序
  list.sort((a,b) => (b.testDate||'').localeCompare(a.testDate||''))
  return list
})

// ========= 右侧快速录入 =========
const fastForm = ref({
  sampleId: '',
  standardId: '',
  value: 0,
  unit: '',
  conclusion: ''
})
const hasSelectedStandard = ref(false)
const currentLimitText = ref('')
const currentValue = ref(null)
const currentUnit = ref('')
const limitBarX = ref(60)
const limitBarWidth = ref(500)
const limitBarColor = ref('#409EFF')
const valueX = ref(60)
const showStandardInfo = ref(false)
const selectedStandardName = ref('')
const selectedStandardLimit = ref('')
const selectedStandardSource = ref('')

function parseLimitValue(limitStr) {
  // 简化解析："≤0.02 mg/kg" => {min: 0, max: 0.02, op: '≤'}
  const match = limitStr.match(/^([≤≥])\s*([\d.]+)\s*(.*)$/)
  if (match) {
    const op = match[1]
    const val = parseFloat(match[2])
    const unit = match[3].trim()
    if (op === '≤') return { min: 0, max: val, unit }
    if (op === '≥') return { min: val, max: Infinity, unit }
    return { min: 0, max: val, unit }
  }
  // 尝试范围："0.1~0.5 mg/kg"
  const matchRange = limitStr.match(/^([\d.]+)\s*~\s*([\d.]+)\s*(.*)$/)
  if (matchRange) {
    return { min: parseFloat(matchRange[1]), max: parseFloat(matchRange[2]), unit: matchRange[3].trim() }
  }
  // 简单数字
  const simple = parseFloat(limitStr)
  if (!isNaN(simple)) return { min: 0, max: simple, unit: '' }
  return { min: 0, max: Infinity, unit: '' }
}

function onSampleChange(val) {
  // 可做操作
}

function onStandardChange(val) {
  if (!val) {
    hasSelectedStandard.value = false
    return
  }
  const st = standardStore.detectStandardList.find(s => s.id === val)
  if (!st) return
  hasSelectedStandard.value = true
  selectedStandardName.value = st.name
  selectedStandardLimit.value = st.limitValue
  selectedStandardSource.value = st.source
  const parsed = parseLimitValue(st.limitValue)
  fastForm.value.unit = parsed.unit || ''
  // 更新SVG限值条
  // 假设最大显示范围是0~max*1.5，最小值0
  const maxVal = Number.isFinite(parsed.max) ? parsed.max : 100
  const range = [0, maxVal * 1.5]
  // 限值条位置
  const svgWidth = 500
  const svgPadding = 60
  const scale = (val) => ( (val - range[0]) / (range[1] - range[0]) ) * svgWidth
  const minX = scale(parsed.min) + svgPadding
  const maxX = scale(parsed.max) + svgPadding
  limitBarX.value = Math.max(svgPadding, minX)
  limitBarWidth.value = Math.max(10, Math.min(svgWidth, maxX - minX))
  limitBarColor.value = '#409EFF'
  // 如果当前有输入值，更新
  if (fastForm.value.value > 0) {
    updateValueMarker(range)
  }
  currentLimitText.value = st.limitValue
  showStandardInfo.value = true
}

function updateValueMarker(range) {
  const val = Number(fastForm.value.value)
  if (!Number.isFinite(val) || val <= 0) {
    currentValue.value = null
    return
  }
  currentValue.value = val
  currentUnit.value = fastForm.value.unit || ''
  const svgWidth = 500
  const svgPadding = 60
  const scale = (v) => ((v - range[0]) / (range[1] - range[0])) * svgWidth
  valueX.value = Math.min(scale(val) + svgPadding, svgPadding + svgWidth)
}

function onValueChange(val) {
  if (!hasSelectedStandard.value) return
  const st = standardStore.detectStandardList.find(s => s.id === fastForm.value.standardId)
  if (!st) return
  const parsed = parseLimitValue(st.limitValue)
  const range = [0, Number.isFinite(parsed.max) ? parsed.max * 1.5 : 100]
  updateValueMarker(range)
}

function computeConclusion() {
  if (!fastForm.value.standardId || fastForm.value.value <= 0) {
    ElMessage.warning('请选择检测标准并输入实测值')
    return
  }
  const st = standardStore.detectStandardList.find(s => s.id === fastForm.value.standardId)
  if (!st) return
  const parsed = parseLimitValue(st.limitValue)
  const value = Number(fastForm.value.value)
  let conclusion = '合格'
  if (value < parsed.min || value > parsed.max) {
    // 超限
    conclusion = '不合格'
    // 弹出超限提醒
    ElMessageBox.confirm(
      `实测值 ${value} ${fastForm.value.unit} 超出标准限值 (${st.limitValue})，是否继续保存并标记为“不合格”？`,
      '超限提醒',
      { confirmButtonText: '确认保存', cancelButtonText: '取消', type: 'warning' }
    ).then(() => {
      fastForm.value.conclusion = conclusion
      fastForm.value.remark = (fastForm.value.remark||'') + '【超限提醒】'
    }).catch(() => {
      // 取消，可将结论设为待定或不清除
      fastForm.value.conclusion = ''
      ElMessage.info('已取消')
    })
  } else {
    fastForm.value.conclusion = conclusion
    ElMessage.success('判定结果：合格')
  }
}

function saveFastResult() {
  if (!fastForm.value.sampleId || !fastForm.value.standardId || !fastForm.value.conclusion) {
    ElMessage.warning('请填写完整：样品、标准、判定结论')
    return
  }
  const st = standardStore.detectStandardList.find(s => s.id === fastForm.value.standardId)
  const newResult = {
    id: 'result_' + Date.now(),
    taskId: '', // 快速录入可能不关联任务
    standardId: fastForm.value.standardId,
    itemName: st ? st.itemName : '',
    value: fastForm.value.value.toString(),
    unit: fastForm.value.unit,
    conclusion: fastForm.value.conclusion,
    resultStatus: '待提交',
    testDate: new Date().toISOString().slice(0,10),
    remark: fastForm.value.remark || ''
  }
  resultStore.add(newResult)
  ElMessage.success('保存成功')
  // 重置快速表单
  fastForm.value = { sampleId: '', standardId: '', value: 0, unit: '', conclusion: '' }
  currentValue.value = null
  hasSelectedStandard.value = false
}

// ========= Dialog 编辑 =========
const editDialogVisible = ref(false)
const isEdit = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  sampleId: '',
  itemName: '',
  value: 0,
  unit: '',
  method: '',
  inspector: '当前用户', // 从种子或登录获取
  testDate: new Date().toISOString().slice(0,10),
  conclusion: '合格',
  remark: ''
})
const editFormRules = {
  itemName: [{ required: true, message: '请选择检测项目', trigger: 'change' }],
  value: [{ required: true, message: '请输入实测数值', trigger: 'blur' }]
}
const unitOptions = ['mg/kg','CFU/g','μg/g','mg/L','%','个/100g']


// 修正编辑保存：需要在全局存储编辑的行id
let editingRowId = null

function openEditDialog(row) {
  isEdit.value = true
  editingRowId = row.id
  // ... 同上
  // 需要从result获取字段
  const target = resultStore.findById(row.id)
  if (!target) return
  editForm.value = {
    sampleId: target.sampleId || '',
    itemName: target.itemName || '',
    value: Number(target.value) || 0,
    unit: target.unit || '',
    method: target.method || '',
    inspector: target.inspector || '当前用户',
    testDate: target.testDate || '',
    conclusion: target.conclusion || '合格',
    remark: target.remark || ''
  }
  editDialogVisible.value = true
}

function doSaveEdit() {
  if (!editingRowId) return
  const patch = {
    itemName: editForm.value.itemName,
    value: editForm.value.value.toString(),
    unit: editForm.value.unit,
    conclusion: editForm.value.conclusion,
    testDate: editForm.value.testDate,
    remark: editForm.value.remark
  }
  resultStore.update(editingRowId, patch)
  ElMessage.success('编辑成功')
  editDialogVisible.value = false
}

// 确保confirmEdit引用doSaveEdit
function confirmEdit() {
  editFormRef.value.validate(valid => {
    if (!valid) return
    // 超限检查
    const st = standardStore.detectStandardList.find(s => s.itemName === editForm.value.itemName)
    if (st) {
      const parsed = parseLimitValue(st.limitValue)
      const val = Number(editForm.value.value)
      if (val < parsed.min || val > parsed.max) {
        ElMessageBox.confirm(`实测值超出标准限值，是否继续保存？`,'超限提醒',{type:'warning'}).then(()=>doSaveEdit()).catch(()=>{})
        return
      }
    }
    doSaveEdit()
  })
}

// ========= 详情 Drawer =========
const detailDrawerVisible = ref(false)
const detailItem = ref(null)

function openDetailDrawer(row) {
  const result = resultStore.findById(row.id)
  if (result) {
    // 补充样品名称
    detailItem.value = { ...result, sampleId: result.sampleId || '' }
    detailDrawerVisible.value = true
  }
}

function getSampleNameFromId(id) {
  const s = sampleStore.sampleList.find(item => item.id === id)
  return s ? s.name : ''
}

function getSampleName(taskId) {
  const task = taskStore.detectTaskList.find(t => t.id === taskId)
  if (!task) return '-'
  const s = sampleStore.sampleList.find(item => item.id === task.sampleId)
  return s ? s.name : task.sampleId
}

function printDetail() {
  ElMessage.info('打印功能调用（模拟）')
}

// ========= 删除 =========
function handleDelete(row) {
  if (row.resultStatus === '待审核' || row.resultStatus === '已审核') {
    ElMessage.warning('该状态禁止删除')
    return
  }
  ElMessageBox.confirm(`确认删除结果编号 "${row.id}" ？`, '删除确认', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => {
    resultStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// ========= 提交审核 =========
function handleSubmitReview() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择需要提交的检测结果')
    return
  }
  ElMessageBox.confirm(`确认将选中的 ${selectedIds.value.length} 条结果提交审核？提交后不可编辑。`, '提交审核', { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning' }).then(() => {
    selectedIds.value.forEach(id => {
      resultStore.update(id, { resultStatus: '已提交' })
    })
    ElMessage.success('提交成功，等待审核')
    selectedIds.value = []
  }).catch(() => {})
}

// ========= 批量导入 =========
const showBatchImport = ref(false)
const importPreview = ref([])
let importedFile = null

function handleFileChange(uploadFile) {
  importedFile = uploadFile.raw
  // 模拟解析：生成几条预览数据
  importPreview.value = [
    { itemName: '甲胺磷', value: '0.01', unit: 'mg/kg', conclusion: '合格' },
    { itemName: '菌落总数', value: '45000', unit: 'CFU/g', conclusion: '不合格' }
  ]
  ElMessage.info('文件已读取，预览数据如上（模拟解析）')
}

function confirmImport() {
  // 批量添加到store
  importPreview.value.forEach(item => {
    resultStore.add({
      id: 'result_import_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
      taskId: '',
      standardId: '',
      itemName: item.itemName,
      value: item.value,
      unit: item.unit,
      conclusion: item.conclusion,
      resultStatus: '待提交',
      testDate: new Date().toISOString().slice(0,10),
      remark: '批量导入'
    })
  })
  ElMessage.success(`成功导入 ${importPreview.value.length} 条结果`)
  importPreview.value = []
  showBatchImport.value = false
  importedFile = null
}

// ========= 辅助图标 & 状态 =========
function statusTagType(status) {
  const map = {
    '待提交': 'info',
    '已提交': 'warning',
    '已审核': 'success',
    '已驳回': 'danger'
  }
  return map[status] || 'info'
}
</script>

<style scoped lang="scss">
@use './ResultInput.scss' as *;
</style>