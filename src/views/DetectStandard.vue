<template>
  <div class="page-detect-standard">
    <!-- 顶部筛选 + 操作区 -->
    <div class="top-bar">
      <div class="filter-row">
        <el-input
          v-model="filterKeyword"
          placeholder="输入标准名称或检测项目"
          clearable
          style="width:240px; margin-right:12px"
        />
        <el-select
          v-model="filterStatus"
          placeholder="全部状态"
          clearable
          style="width:130px; margin-right:12px"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
        <el-date-picker
          v-model="filterDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="创建开始"
          end-placeholder="创建结束"
          value-format="YYYY-MM-DD"
          style="width:260px; margin-right:12px"
        />
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="action-row">
        <el-button type="primary" @click="openAddDialog">新增标准</el-button>
        <el-button @click="handleBatchToggle(true)" :disabled="selectedIds.length===0">批量启用</el-button>
        <el-button @click="handleBatchToggle(false)" :disabled="selectedIds.length===0">批量禁用</el-button>
        <el-button @click="handleExport" :disabled="filteredList.length===0">导出</el-button>
      </div>
    </div>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- 左侧：标准限值比较图 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">标准限值比较图</span>
          <span v-if="selectedStandard" class="selected-label">{{ selectedStandard.name }}</span>
        </div>
        <div v-if="selectedStandard" class="comparison-chart">
          <svg
            width="100%"
            height="200"
            viewBox="0 0 600 200"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- 背景条 -->
            <rect x="50" y="70" width="500" height="20" fill="#e9ecef" rx="4" />
            <!-- 标准限值垂直虚线 -->
            <line
              :x1="limitX"
              :y1="50"
              :x2="limitX"
              :y2="110"
              stroke="#e74c3c"
              stroke-width="2"
              stroke-dasharray="4"
            />
            <text :x="limitX" y="45" text-anchor="middle" font-size="12" fill="#e74c3c">
              上限 {{ parsedLimit }}
            </text>
            <!-- 检测值点 -->
            <g v-for="(item, idx) in relatedResults" :key="idx">
              <circle
                :cx="getPointX(item.numValue)"
                :cy="80"
                r="6"
                :fill="item.conclusion==='合格'?'#27ae60':'#e74c3c'"
                stroke="#fff"
                stroke-width="2"
                @mouseenter="showResultTooltip($event, item)"
                @mouseleave="hideResultTooltip"
              />
            </g>
            <!-- 刻度标签 -->
            <text x="50" y="140" font-size="10" fill="#888">0</text>
            <text :x="maxScaleX" y="140" text-anchor="end" font-size="10" fill="#888">
              {{ maxScale }}
            </text>
          </svg>
          <!-- 悬浮提示 -->
          <div
            v-if="hoverResult"
            class="tooltip-box"
            :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
          >
            <p>检测值：{{ hoverResult.value }}{{ parsedUnit }}</p>
            <p>结论：{{ hoverResult.conclusion }}</p>
          </div>
        </div>
        <el-empty v-else description="请从右侧列表选择一条标准查看比较图" />
      </div>

      <!-- 右侧：标准列表 -->
      <div class="right-panel">
        <div class="panel-header">检测标准列表</div>
        <el-table
          :data="filteredList"
          style="width:100%"
          height="calc(100vh - 300px)"
          stripe
          @row-click="handleRowClick"
          @selection-change="handleSelectionChange"
          highlight-current-row
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="standardCode" label="标准编号" width="120" />
          <el-table-column prop="name" label="标准名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="itemName" label="检测项目" width="100" />
          <el-table-column prop="limitValue" label="限量值" width="120" />
          <el-table-column prop="category" label="食品类别" width="100" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <el-tag :type="row.status?'success':'danger'" size="small">
                {{ row.status?'启用':'禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
              <el-button link type="primary" size="small" @click.stop="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 底部：标准有效期时间线 -->
    <div class="timeline-bar">
      <div class="panel-header" style="margin-bottom:0;">标准有效期时间线</div>
      <div class="timeline-scroll">
        <div class="timeline-track">
          <div
            v-for="(std, idx) in timelineStandards"
            :key="std.id"
            class="timeline-node"
            :style="{ left: getTimelineLeft(std) + '%' }"
          >
            <div class="timeline-dot" :class="{ active: std.status }" />
            <div class="timeline-label">{{ std.name.slice(0,12) }}{{ std.name.length>12?'...':'' }}</div>
            <div class="timeline-date">{{ std.effectiveDate }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :model-value="dialogVisible"
      :title="isEdit?'编辑标准':'新增标准'"
      width="min(640px,92vw)"
      @update:model-value="val => dialogVisible = val"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="top">
        <el-form-item label="标准名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入标准名称" />
        </el-form-item>
        <el-form-item label="检测项目" prop="itemName">
          <el-select v-model="formData.itemName" placeholder="请选择检测项目" style="width:100%">
            <el-option
              v-for="item in itemNameOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="限量值" prop="limitValue">
          <el-input-number
            v-model="formData.limitValueNum"
            :min="0"
            :precision="2"
            :controls="false"
            style="width:calc(100% - 90px)"
            placeholder="请输入限量数值"
          />
          <el-select v-model="formData.unit" placeholder="单位" style="width:80px; margin-left:8px;">
            <el-option label="mg/kg" value="mg/kg" />
            <el-option label="μg/kg" value="μg/kg" />
            <el-option label="%" value="%" />
            <el-option label="CFU/g" value="CFU/g" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用食品类别" prop="category">
          <el-select
            v-model="formData.category"
            multiple
            placeholder="请选择食品类别"
            style="width:100%"
          >
            <el-option
              v-for="cat in categoryOptions"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标准来源" prop="source">
          <el-input v-model="formData.source" placeholder="例如：国家标准、行业标准" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :model-value="drawerVisible"
      @update:model-value="val => drawerVisible = val"
      title="标准详情"
      size="460px"
      :destroy-on-close="true"
    >
      <template v-if="detailStandard">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">标准名称</span>
            <span class="value">{{ detailStandard.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">标准编号</span>
            <span class="value">{{ detailStandard.standardCode }}</span>
          </div>
          <div class="detail-item">
            <span class="label">检测项目</span>
            <span class="value">{{ detailStandard.itemName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">限量值</span>
            <span class="value">{{ detailStandard.limitValue }}</span>
          </div>
          <div class="detail-item">
            <span class="label">适用食品类别</span>
            <span class="value">
              <el-tag v-for="cat in categoryArray(detailStandard.category)" :key="cat" size="small" style="margin-right:4px;">
                {{ cat }}
              </el-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">标准来源</span>
            <span class="value">{{ detailStandard.source || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">生效日期</span>
            <span class="value">{{ detailStandard.effectiveDate }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态</span>
            <span class="value">
              <el-tag :type="detailStandard.status?'success':'danger'" size="small">
                {{ detailStandard.status?'启用':'禁用' }}
              </el-tag>
            </span>
          </div>
          <div class="detail-item" style="grid-column:1/-1;">
            <span class="label">备注</span>
            <span class="value">{{ detailStandard.remark || '-' }}</span>
          </div>
        </div>
        <el-divider>关联预警规则</el-divider>
        <div v-if="relatedAlerts.length>0">
          <el-table :data="relatedAlerts" stripe size="small">
            <el-table-column prop="name" label="规则名称" min-width="120" />
            <el-table-column prop="ruleType" label="规则类型" width="90" />
            <el-table-column prop="threshold" label="阈值" width="80" />
            <el-table-column label="状态" width="60">
              <template #default="{ row }">
                <el-tag :type="row.status?'success':'danger'" size="mini">{{ row.status?'启用':'禁用' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="无关联预警规则" :image-size="60" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDetectStandardStore } from '@/stores/detectStandard'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useAlertConfigStore } from '@/stores/alertConfig'

const standardStore = useDetectStandardStore()
const resultStore = useInspectionResultStore()
const alertStore = useAlertConfigStore()

// ---------- 筛选 ----------
const filterKeyword = ref('')
const filterStatus = ref('')
const filterDateRange = ref([])

const filteredList = computed(() => {
  let list = [...standardStore.detectStandardList]
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw) || s.itemName.toLowerCase().includes(kw))
  }
  if (filterStatus.value !== '' && filterStatus.value !== null) {
    list = list.filter(s => s.status === filterStatus.value)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    list = list.filter(s => {
      const d = s.effectiveDate || ''
      return d >= start && d <= end
    })
  }
  return list.sort((a, b) => (a.effectiveDate || '') < (b.effectiveDate || '') ? 1 : -1)
})

function handleQuery() {
  // computed already reactive
}
function handleReset() {
  filterKeyword.value = ''
  filterStatus.value = ''
  filterDateRange.value = []
}

// ---------- 选择行 ----------
const selectedStandard = ref(null)
const selectedIds = ref([])

function handleRowClick(row) {
  selectedStandard.value = row
}
function handleSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id)
}

// ---------- 标准限值比较图 ----------
const relatedResults = computed(() => {
  if (!selectedStandard.value) return []
  const stdId = selectedStandard.value.id
  return resultStore.inspectionResultList
    .filter(r => r.standardId === stdId)
    .map(r => ({
      ...r,
      numValue: parseFloat(r.value.replace(/[≤≥<>=]/g,'')) || 0
    }))
})

const parsedLimit = computed(() => {
  const lv = selectedStandard.value?.limitValue || ''
  const match = lv.match(/[\d.]+/)
  return match ? match[0] : '0'
})
const parsedUnit = computed(() => {
  const lv = selectedStandard.value?.limitValue || ''
  const match = lv.match(/[a-zA-Z%/μg]+/)
  return match ? match[0] : ''
})
const maxNumeric = computed(() => {
  const nums = relatedResults.value.map(r => r.numValue)
  const limit = parseFloat(parsedLimit.value) || 1
  const max = Math.max(...nums, limit)
  return max > 0 ? max * 1.3 : limit * 2
})
const maxScale = computed(() => maxNumeric.value.toFixed(2) + (parsedUnit.value ? ' ' + parsedUnit.value : ''))
const maxScaleX = computed(() => {
  const max = maxNumeric.value
  return max > 0 ? 50 + 500 * (max / max) : 550
})
const limitX = computed(() => {
  const max = maxNumeric.value
  const l = parseFloat(parsedLimit.value) || 0
  return max > 0 ? 50 + 500 * (l / max) : 50
})

function getPointX(val) {
  const max = maxNumeric.value
  if (max <= 0) return 50
  return 50 + 500 * (val / max)
}

// 悬浮提示
const hoverResult = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
function showResultTooltip(e, item) {
  hoverResult.value = item
  tooltipX.value = e.offsetX + 10
  tooltipY.value = e.offsetY + 10
}
function hideResultTooltip() {
  hoverResult.value = null
}

// ---------- 底部时间线 ----------
const timelineStandards = computed(() => {
  return standardStore.detectStandardList
    .filter(s => s.effectiveDate)
    .sort((a, b) => (a.effectiveDate || '') < (b.effectiveDate || '') ? -1 : 1)
})
const minDate = computed(() => {
  if (timelineStandards.value.length === 0) return '2025-01-01'
  return timelineStandards.value[0].effectiveDate
})
const maxDate = computed(() => {
  if (timelineStandards.value.length === 0) return '2026-12-31'
  return timelineStandards.value[timelineStandards.value.length - 1].effectiveDate
})
function getTimelineLeft(std) {
  const start = new Date(minDate.value).getTime()
  const end = new Date(maxDate.value).getTime()
  const cur = new Date(std.effectiveDate).getTime()
  if (end === start) return 0
  return ((cur - start) / (end - start)) * 90 + 5
}

// ---------- 新增/编辑 ----------
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const formRef = ref(null)
const formData = ref({
  name: '',
  itemName: '',
  limitValueNum: null,
  unit: 'mg/kg',
  category: [],
  source: '',
  remark: ''
})

// 选项列表
const itemNameOptions = computed(() => {
  const set = new Set(standardStore.detectStandardList.map(s => s.itemName))
  return Array.from(set)
})
const categoryOptions = computed(() => {
  const set = new Set(standardStore.detectStandardList.map(s => s.category))
  return Array.from(set)
})

const formRules = {
  name: [{ required: true, message: '请输入标准名称', trigger: 'blur' }],
  itemName: [{ required: true, message: '请选择检测项目', trigger: 'change' }],
  limitValueNum: [{ required: true, message: '请输入限量值', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  category: [{ required: true, message: '请选择适用食品类别', trigger: 'change' }]
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = ''
  formData.value = { name: '', itemName: '', limitValueNum: null, unit: 'mg/kg', category: [], source: '', remark: '' }
  dialogVisible.value = true
}
function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  const limitMatch = row.limitValue.match(/^[≤≥<>=]*([\d.]+)\s*(.*)$/)
  const num = limitMatch ? parseFloat(limitMatch[1]) : 0
  const unit = limitMatch ? limitMatch[2] : ''
  formData.value = {
    name: row.name,
    itemName: row.itemName,
    limitValueNum: num,
    unit: unit || 'mg/kg',
    category: row.category ? [row.category] : [],
    source: row.source || '',
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

function submitForm() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    // 检查限量值正数
    if (Number.isFinite(formData.value.limitValueNum) && formData.value.limitValueNum <= 0) {
      ElMessage.warning('限量值必须为正数')
      return
    }
    // 构造 limitValue 字符串
    const limitStr = `≤${formData.value.limitValueNum} ${formData.value.unit}`
    // 检查唯一性（除了自身）
    const duplicate = standardStore.detectStandardList.find(s => {
      if (isEdit.value && s.id === editingId.value) return false
      return s.name === formData.value.name
        && s.itemName === formData.value.itemName
        && s.category === formData.value.category[0] // store.category 是单字符串，多选只取第一个
    })
    if (duplicate) {
      ElMessage.error('该标准已存在（相同名称+检测项目+食品类别）')
      return
    }
    // 如果是编辑且限量值改变，且该标准被检测结果引用，二次确认
    if (isEdit.value) {
      const oldStandard = standardStore.findById(editingId.value)
      if (oldStandard && oldStandard.limitValue !== limitStr) {
        const isReferenced = resultStore.inspectionResultList.some(r => r.standardId === editingId.value)
        if (isReferenced) {
          try {
            await ElMessageBox.confirm('修改限量值会影响已有判定结果，是否继续？', '提示', { confirmButtonText:'继续', cancelButtonText:'取消', type:'warning' })
          } catch {
            return
          }
        }
      }
    }
    // 提交
    const payload = {
      name: formData.value.name,
      itemName: formData.value.itemName,
      limitValue: limitStr,
      category: formData.value.category[0] || '',
      source: formData.value.source || '',
      remark: formData.value.remark || '',
      status: true,
      effectiveDate: new Date().toISOString().slice(0,10)
    }
    if (isEdit.value) {
      standardStore.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      standardStore.add(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
  })
}

// ---------- 删除 ----------
async function handleDelete(row) {
  // 检查是否被检测结果引用
  const referenced = resultStore.inspectionResultList.some(r => r.standardId === row.id)
  if (referenced) {
    ElMessage.warning('该标准已被检测任务引用，无法删除，请先解除引用')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该标准吗？删除后不可恢复。', '确认删除', { confirmButtonText:'确定', cancelButtonText:'取消', type:'warning' })
  } catch {
    return
  }
  // 级联删除关联预警规则
  const alertConfigsToDelete = alertStore.alertConfigList.filter(a => a.standardId === row.id)
  alertConfigsToDelete.forEach(a => alertStore.remove(a.id))
  standardStore.remove(row.id)
  ElMessage.success('删除成功')
  if (selectedStandard.value?.id === row.id) {
    selectedStandard.value = null
  }
}

// ---------- 批量启用/禁用 ----------
async function handleBatchToggle(enable) {
  const action = enable ? '启用' : '禁用'
  // 检查禁用时是否被引用
  if (!enable) {
    const referenced = selectedIds.value.some(id => resultStore.inspectionResultList.some(r => r.standardId === id))
    if (referenced) {
      ElMessage.warning('存在被检测任务引用的标准，禁用可能导致任务判定失败，请先处理相关任务')
      return
    }
  }
  try {
    await ElMessageBox.confirm(`确定要${action}选中的 ${selectedIds.value.length} 条标准吗？`, '提示', { confirmButtonText:'确定', cancelButtonText:'取消', type:'info' })
  } catch {
    return
  }
  selectedIds.value.forEach(id => standardStore.update(id, { status: enable }))
  ElMessage.success(`已${action} ${selectedIds.value.length} 条标准`)
}

// ---------- 导出 ----------
function handleExport() {
  ElMessage.success('检测标准列表导出成功（模拟）')
}

// ---------- 详情抽屉 ----------
const drawerVisible = ref(false)
const detailStandard = ref(null)
const relatedAlerts = ref([])

function openDetailDrawer(row) {
  detailStandard.value = row
  relatedAlerts.value = alertStore.alertConfigList.filter(a => a.standardId === row.id)
  drawerVisible.value = true
}
function categoryArray(cat) {
  if (!cat) return []
  return cat.split(',').map(c => c.trim())
}
</script>

<style scoped lang="scss">
@use './DetectStandard.scss' as *;
</style>