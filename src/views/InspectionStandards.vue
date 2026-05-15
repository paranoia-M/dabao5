<template>
  <div class="page-inspection_standards">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="top-bar__left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标准名称/编号"
          clearable
          style="width:240px"
          @input="debouncedSearch"
        />
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width:130px"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-select
          v-model="filterProductLines"
          multiple
          placeholder="产品线"
          collapse-tags
          collapse-tags-tooltip
          style="width:180px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="pl in productLineOptions"
            :key="pl"
            :label="pl"
            :value="pl"
          />
        </el-select>
        <el-button type="primary" plain @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="top-bar__right">
        <el-checkbox
          v-model="selectAll"
          :indeterminate="selectIndeterminate"
          @change="handleSelectAll"
        >
          全选
        </el-checkbox>
        <el-button type="primary" @click="openAddDialog">
          <el-icon style="margin-right:4px"><Plus /></el-icon>
          新增标准
        </el-button>
        <el-button
          :disabled="selectedIds.length === 0"
          @click="handleBatchExport"
        >
          <el-icon style="margin-right:4px"><Download /></el-icon>
          批量导出
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="main-body">
      <!-- 左侧 40% -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">检测标准列表</span>
          <el-tag type="info" size="small">{{ filteredList.length }} 项</el-tag>
        </div>
        <div class="card-list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="standard-card"
            :class="{ 'is-active': selectedId === item.id, 'is-disabled': item.status === '停用' }"
            @click="selectStandard(item)"
          >
            <div class="card-top">
              <el-checkbox
                :model-value="selectedIds.includes(item.id)"
                @click.stop
                @change="(val) => handleCheckboxChange(item.id, val)"
              />
              <span class="card-code">{{ item.id.replace('inspectionstandard_', 'STD-') }}</span>
              <el-tag
                :type="item.status === '启用' ? 'success' : 'danger'"
                size="small"
                effect="plain"
              >
                {{ item.status }}
              </el-tag>
            </div>
            <div class="card-name" :title="item.itemName">{{ item.itemName }}</div>
            <div class="card-meta">
              <span class="meta-product">{{ item.productLine }}</span>
              <span class="meta-range">{{ item.minValue }} ~ {{ item.maxValue }} {{ item.unit }}</span>
            </div>
          </div>
          <el-empty v-if="filteredList.length === 0" description="暂无匹配标准" :image-size="80" />
        </div>
      </div>

      <!-- 右侧 60% -->
      <div class="right-panel">
        <template v-if="selectedStandard">
          <div class="detail-header">
            <div class="detail-title">
              <span class="detail-code">{{ selectedStandard.id.replace('inspectionstandard_', 'STD-') }}</span>
              <span class="detail-name">{{ selectedStandard.itemName }}</span>
              <el-switch
                :model-value="selectedStandard.status === '启用'"
                active-text="启用"
                inactive-text="停用"
                inline-prompt
                @change="(val) => handleToggleStatus(val)"
              />
            </div>
            <div class="detail-actions">
              <el-button size="small" @click="openEditDialog(selectedStandard)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(selectedStandard)">
                <el-icon><Delete /></el-icon> 作废
              </el-button>
              <el-button size="small" @click="openDetailDrawer(selectedStandard)">
                <el-icon><Document /></el-icon> 详情
              </el-button>
            </div>
          </div>

          <div class="detail-info">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="检测项">{{ selectedStandard.itemName }}</el-descriptions-item>
              <el-descriptions-item label="产品线">{{ selectedStandard.productLine }}</el-descriptions-item>
              <el-descriptions-item label="版本">v{{ selectedStandard.version }}</el-descriptions-item>
              <el-descriptions-item label="下限值">{{ Number.isFinite(selectedStandard.minValue) ? selectedStandard.minValue : 0 }}</el-descriptions-item>
              <el-descriptions-item label="上限值">{{ Number.isFinite(selectedStandard.maxValue) ? selectedStandard.maxValue : 0 }}</el-descriptions-item>
              <el-descriptions-item label="单位">{{ selectedStandard.unit }}</el-descriptions-item>
              <el-descriptions-item label="生效日期">{{ selectedStandard.effectiveDate || '—' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedStandard.status === '启用' ? 'success' : 'danger'" size="small">
                  {{ selectedStandard.status }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 招牌业务积木：检测标准限值标尺 -->
          <div class="gauge-block">
            <div class="gauge-header">
              <span class="gauge-title">检测标准限值标尺</span>
              <span class="gauge-unit">单位：{{ selectedStandard.unit }}</span>
            </div>
            <div class="gauge-svg-wrapper">
              <svg
                :viewBox="`0 0 600 ${svgHeight}`"
                width="100%"
                height="160"
                preserveAspectRatio="xMidYMid meet"
                class="gauge-svg"
              >
                <!-- 背景刻度线 -->
                <line
                  x1="40" :y1="labelY" x2="560" :y2="labelY"
                  stroke="#CBD5E1" stroke-width="2"
                />
                <!-- 刻度 -->
                <template v-for="(tick, idx) in ticks" :key="idx">
                  <line
                    :x1="tick.x" :y1="labelY - 8" :x2="tick.x" :y2="labelY + 8"
                    stroke="#94A3B8" stroke-width="1.5"
                  />
                  <text
                    :x="tick.x" :y="labelY + 22"
                    text-anchor="middle" font-size="11" fill="#64748B"
                  >
                    {{ Number.isFinite(tick.val) ? tick.val : 0 }}
                  </text>
                </template>
                <!-- 允许范围色带 -->
                <rect
                  :x="rangeRect.x" :y="labelY - 20"
                  :width="rangeRect.width" height="18"
                  fill="rgba(15, 118, 110, 0.25)" rx="4"
                />
                <line
                  :x1="rangeRect.x" :y1="labelY - 12"
                  :x2="rangeRect.x + rangeRect.width" :y2="labelY - 12"
                  stroke="#0F766E" stroke-width="4" stroke-linecap="round"
                />
                <!-- 范围标签 -->
                <text
                  :x="rangeRect.x" :y="labelY - 28"
                  text-anchor="middle" font-size="10" fill="#0F766E"
                >
                  下限 {{ Number.isFinite(selectedStandard.minValue) ? selectedStandard.minValue : 0 }}
                </text>
                <text
                  :x="rangeRect.x + rangeRect.width" :y="labelY - 28"
                  text-anchor="middle" font-size="10" fill="#0F766E"
                >
                  上限 {{ Number.isFinite(selectedStandard.maxValue) ? selectedStandard.maxValue : 0 }}
                </text>
                <!-- 实测标记点 -->
                <template v-for="(pt, pIdx) in gaugePoints" :key="pIdx">
                  <polygon
                    :points="`${pt.x},${labelY + 6} ${pt.x - 6},${labelY - 6} ${pt.x + 6},${labelY - 6}`"
                    :fill="pt.color" opacity="0.85"
                  />
                  <text
                    :x="pt.x" :y="labelY - 38 - pIdx * 18"
                    text-anchor="middle" font-size="10" :fill="pt.color"
                  >
                    {{ pt.label }}: {{ Number.isFinite(pt.val) ? pt.val : 0 }}
                  </text>
                </template>
                <!-- 超限警告线 -->
                <line
                  v-if="outOfLimitPoint"
                  :x1="outOfLimitPoint.x" :y1="labelY - 22"
                  :x2="outOfLimitPoint.x" :y2="labelY + 22"
                  stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4,3"
                />
              </svg>
            </div>
            <div class="gauge-legend">
              <span class="legend-item"><span class="dot dot-range" /> 允许范围</span>
              <span class="legend-item"><span class="dot dot-measure" /> 实测值</span>
              <span v-if="outOfLimitPoint" class="legend-item"><span class="dot dot-warn" /> 超限</span>
            </div>
          </div>

          <!-- 底部关联检测任务 -->
          <div class="related-tasks">
            <div class="related-header">
              <span class="related-title">关联检测任务</span>
              <el-link type="primary" :underline="false" @click="openTaskDrawer">
                <el-icon><View /></el-icon> 查看全部
              </el-link>
            </div>
            <div class="related-list">
              <div v-for="task in recentTasks" :key="task.id" class="task-chip">
                <span class="task-batch">{{ task.batchNo }}</span>
                <el-tag :type="task.result === '合格' ? 'success' : task.result === '不合格' ? 'danger' : 'warning'" size="small">
                  {{ task.result }}
                </el-tag>
              </div>
              <el-empty v-if="recentTasks.length === 0" description="暂无关联任务" :image-size="50" />
            </div>
          </div>
        </template>

        <template v-else>
          <el-empty description="请从左侧选择一个检测标准" :image-size="120" />
        </template>
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑检测标准' : '新增检测标准'"
      :width="min(720, 92) + 'vw'"
      top="6vh"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
        label-position="right"
        class="standard-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标准编号" prop="id">
              <el-input
                v-model="form.id"
                :disabled="isEdit"
                placeholder="自动生成或手动输入"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测项名称" prop="itemName">
              <el-select
                v-model="form.itemName"
                filterable
                allow-create
                :disabled="isEdit"
                placeholder="选择或输入检测项"
                style="width:100%"
              >
                <el-option
                  v-for="opt in itemDict"
                  :key="opt"
                  :label="opt"
                  :value="opt"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用产品线" prop="productLine">
              <el-select
                v-model="form.productLine"
                filterable
                placeholder="选择产品线"
                style="width:100%"
              >
                <el-option
                  v-for="pl in productLineOptions"
                  :key="pl"
                  :label="pl"
                  :value="pl"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="选择单位" style="width:100%">
                <el-option
                  v-for="u in unitOptions"
                  :key="u"
                  :label="u"
                  :value="u"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下限值" prop="minValue">
              <el-input-number
                v-model="form.minValue"
                :min="0"
                :max="99999"
                :step="0.1"
                style="width:100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上限值" prop="maxValue">
              <el-input-number
                v-model="form.maxValue"
                :min="0"
                :max="99999"
                :step="0.1"
                style="width:100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期日期">
              <el-date-picker
                v-model="form.expireDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选填"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            rows="2"
            placeholder="选填，补充说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="检测标准详情"
      size="min(720px, 90vw)"
      destroy-on-close
    >
      <template v-if="detailItem">
        <div class="drawer-body">
          <div class="drawer-section">
            <h3 class="section-title">基本信息</h3>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="标准编号">{{ detailItem.id.replace('inspectionstandard_', 'STD-') }}</el-descriptions-item>
              <el-descriptions-item label="检测项名称">{{ detailItem.itemName }}</el-descriptions-item>
              <el-descriptions-item label="下限值">{{ Number.isFinite(detailItem.minValue) ? detailItem.minValue : 0 }}</el-descriptions-item>
              <el-descriptions-item label="上限值">{{ Number.isFinite(detailItem.maxValue) ? detailItem.maxValue : 0 }}</el-descriptions-item>
              <el-descriptions-item label="单位">{{ detailItem.unit }}</el-descriptions-item>
              <el-descriptions-item label="适用产品线">{{ detailItem.productLine }}</el-descriptions-item>
              <el-descriptions-item label="生效日期">{{ detailItem.effectiveDate || '—' }}</el-descriptions-item>
              <el-descriptions-item label="当前版本">v{{ detailItem.version }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="detailItem.status === '启用' ? 'success' : 'danger'" size="small">
                  {{ detailItem.status }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="drawer-section">
            <h3 class="section-title">版本历史</h3>
            <el-table :data="versionHistory" border stripe size="small" max-height="240">
              <el-table-column prop="version" label="版本" width="70">
                <template #default="{ row }">v{{ row.version }}</template>
              </el-table-column>
              <el-table-column prop="modifyTime" label="修改时间" width="160" />
              <el-table-column prop="modifyUser" label="修改人" width="100" />
              <el-table-column prop="changeDesc" label="变更说明" min-width="160" show-overflow-tooltip />
            </el-table>
            <el-empty v-if="versionHistory.length === 0" description="暂无版本历史" :image-size="60" />
          </div>

          <div class="drawer-section">
            <h3 class="section-title">引用批次</h3>
            <el-table :data="refTasks" border stripe size="small" max-height="200">
              <el-table-column prop="batchNo" label="批次号" width="150" />
              <el-table-column prop="result" label="结果" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.result === '合格' ? 'success' : row.result === '不合格' ? 'danger' : 'warning'" size="small">
                    {{ row.result }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="planTime" label="检测时间" width="160" />
              <el-table-column prop="executor" label="执行人" width="80" />
            </el-table>
            <el-empty v-if="refTasks.length === 0" description="暂无引用批次" :image-size="60" />
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 导出结果区 -->
    <div v-if="exportRecords.length > 0" class="export-area">
      <div class="export-header">
        <span class="export-title">📦 导出记录</span>
        <el-button text @click="exportRecords = []">清空</el-button>
      </div>
      <div class="export-chip-list">
        <el-tag
          v-for="(rec, idx) in exportRecords"
          :key="idx"
          closable
          @close="exportRecords.splice(idx, 1)"
        >
          {{ rec.fileName }} — {{ rec.count }} 条 — {{ rec.time }}
        </el-tag>
      </div>
    </div>

    <!-- 查看全部任务抽屉 -->
    <el-drawer
      v-model="taskDrawerVisible"
      title="全部检测任务"
      size="min(560px, 85vw)"
      destroy-on-close
    >
      <el-table :data="inspectionTaskStore.inspectionTaskList" border stripe size="small" max-height="70vh">
        <el-table-column prop="batchNo" label="批次号" width="150" />
        <el-table-column prop="taskType" label="任务类型" width="100" />
        <el-table-column prop="result" label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.result === '合格' ? 'success' : row.result === '不合格' ? 'danger' : 'warning'" size="small">
              {{ row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planTime" label="计划时间" width="160" />
        <el-table-column prop="executor" label="执行人" width="80" />
        <el-table-column prop="status" label="状态" width="80" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Edit, Delete, Document, View } from '@element-plus/icons-vue'
import { useInspectionStandardStore } from '@/stores/inspectionStandard'
import { useProductionLineStore } from '@/stores/productionLine'
import { useInspectionTaskStore } from '@/stores/inspectionTask'

/* ---------- stores ---------- */
const standardStore = useInspectionStandardStore()
const productionLineStore = useProductionLineStore()
const inspectionTaskStore = useInspectionTaskStore()

/* ---------- 工具函数 ---------- */
const min = (a, b) => a < b ? a : b
let debounceTimer = null
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // computed 自动响应
  }, 300)
}

/* ---------- 筛选 ---------- */
const searchKeyword = ref('')
const filterStatus = ref('')
const filterProductLines = ref([])

const filteredList = computed(() => {
  let list = standardStore.inspectionStandardList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(s => s.itemName.toLowerCase().includes(kw) || s.id.toLowerCase().includes(kw))
  }
  if (filterStatus.value) {
    list = list.filter(s => s.status === filterStatus.value)
  }
  if (filterProductLines.value.length > 0) {
    list = list.filter(s => filterProductLines.value.includes(s.productLine))
  }
  return list
})

function handleSearch() {
  // computed 已自动响应
}
function handleFilterChange() {
  // computed 已自动响应
}
function handleReset() {
  searchKeyword.value = ''
  filterStatus.value = ''
  filterProductLines.value = []
}

/* ---------- 选择 ---------- */
const selectedId = ref('')
const selectedStandard = computed(() => {
  if (!selectedId.value) return null
  return standardStore.findById(selectedId.value) || null
})

const selectAll = ref(false)
const selectIndeterminate = ref(false)
const selectedIds = ref([])

watch(filteredList, () => {
  selectAll.value = filteredList.value.length > 0 && selectedIds.value.length === filteredList.value.length
  selectIndeterminate.value = selectedIds.value.length > 0 && selectedIds.value.length < filteredList.value.length
}, { immediate: true })

function handleSelectAll(val) {
  if (val) {
    selectedIds.value = filteredList.value.map(s => s.id)
  } else {
    selectedIds.value = []
  }
  selectIndeterminate.value = false
}

function handleCheckboxChange(id, val) {
  if (val) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(x => x !== id)
  }
}

function selectStandard(item) {
  selectedId.value = item.id
}

/* ---------- 产品线选项 ---------- */
const productLineOptions = computed(() => {
  const fromStore = productionLineStore.productionLineList.map(p => p.name)
  const fromStandards = standardStore.inspectionStandardList.map(s => s.productLine)
  const merged = new Set([...fromStore, ...fromStandards])
  return Array.from(merged).filter(Boolean)
})

/* ---------- 数据字典 & 单位 ---------- */
const itemDict = [
  '灌装温度', '杀菌温度', '包装密封性', '金属异物', '微生物指标',
  '水分含量', '蛋白质含量', '脂肪含量', '盐分含量', 'pH值',
  '总糖含量', '酸价', '过氧化值', '菌落总数', '大肠菌群'
]
const unitOptions = ['℃', 'g', 'ml', '%', 'pH', 'mg/kg', 'CFU/g', 'MPa', 'mm', 'N']

/* ---------- 限值标尺 ---------- */
const labelY = 60
const svgHeight = 140

function computeScale(minV, maxV) {
  if (!Number.isFinite(minV) || !Number.isFinite(maxV) || minV >= maxV) {
    return { start: 0, end: 100, range: 100 }
  }
  const margin = (maxV - minV) * 0.15
  const start = Math.max(0, minV - margin)
  const end = maxV + margin
  const range = end - start
  return { start, end, range }
}

const ticks = computed(() => {
  if (!selectedStandard.value) return []
  const { start, end, range } = computeScale(
    selectedStandard.value.minValue,
    selectedStandard.value.maxValue
  )
  if (!range || range <= 0) return []
  const count = 6
  const arr = []
  for (let i = 0; i <= count; i++) {
    const val = start + (range * i) / count
    const x = 40 + (520 * (val - start)) / range
    arr.push({ val: Math.round(val * 10) / 10, x })
  }
  return arr
})

const rangeRect = computed(() => {
  if (!selectedStandard.value) return { x: 40, width: 0 }
  const { start, range } = computeScale(
    selectedStandard.value.minValue,
    selectedStandard.value.maxValue
  )
  if (!range || range <= 0) return { x: 40, width: 0 }
  const minV = selectedStandard.value.minValue
  const maxV = selectedStandard.value.maxValue
  const x1 = 40 + (520 * (minV - start)) / range
  const x2 = 40 + (520 * (maxV - start)) / range
  return { x: x1, width: Math.max(0, x2 - x1) }
})

const gaugePoints = computed(() => {
  if (!selectedStandard.value) return []
  const { start, range } = computeScale(
    selectedStandard.value.minValue,
    selectedStandard.value.maxValue
  )
  if (!range || range <= 0) return []
  const minV = selectedStandard.value.minValue
  const maxV = selectedStandard.value.maxValue
  // 生成 3 个模拟实测点
  const points = []
  const seeds = [
    { label: '批次A', base: (minV + maxV) / 2, offset: (maxV - minV) * 0.12 },
    { label: '批次B', base: minV + (maxV - minV) * 0.3, offset: (maxV - minV) * 0.05 },
    { label: '批次C', base: maxV - (maxV - minV) * 0.2, offset: (maxV - minV) * 0.08 }
  ]
  seeds.forEach((s, idx) => {
    let val = s.base + (idx % 2 === 0 ? s.offset : -s.offset)
    val = Math.round(val * 10) / 10
    const x = 40 + (520 * (val - start)) / range
    const color = val >= minV && val <= maxV ? '#0F766E' : '#EF4444'
    points.push({ val, x, label: s.label, color })
  })
  return points
})

const outOfLimitPoint = computed(() => {
  return gaugePoints.value.find(p => p.color === '#EF4444') || null
})

/* ---------- 版本历史 ---------- */
const versionHistory = reactive([])

function pushVersionHistory(item, changeDesc) {
  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN', { hour12: false })
  versionHistory.unshift({
    version: item.version,
    modifyTime: timeStr,
    modifyUser: '质检员',
    changeDesc: changeDesc || '更新标准配置'
  })
}

/* ---------- 弹窗 ---------- */
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: '',
  itemName: '',
  minValue: 0,
  maxValue: 100,
  unit: '℃',
  productLine: '',
  effectiveDate: '',
  expireDate: '',
  remark: '',
  status: '启用',
  version: 1
})

const form = reactive(defaultForm())

const formRules = {
  id: [
    { required: true, message: '请输入标准编号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '仅支持字母、数字、下划线与横线', trigger: 'blur' },
    {
      validator: (rule, val, cb) => {
        if (!isEdit.value && standardStore.inspectionStandardList.some(s => s.id === val)) {
          cb(new Error('该编号已被占用'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ],
  itemName: [
    { required: true, message: '请选择或输入检测项名称', trigger: 'change' }
  ],
  productLine: [
    { required: true, message: '请选择适用产品线', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '请选择单位', trigger: 'change' }
  ],
  minValue: [
    { required: true, message: '请输入下限值', trigger: 'blur' }
  ],
  maxValue: [
    { required: true, message: '请输入上限值', trigger: 'blur' },
    {
      validator: (rule, val, cb) => {
        if (val < form.minValue) {
          cb(new Error('上限值不能小于下限值'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ],
  effectiveDate: [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ]
}

function openAddDialog() {
  isEdit.value = false
  Object.assign(form, defaultForm())
  form.id = 'inspectionstandard_' + Date.now()
  dialogVisible.value = true
}

function openEditDialog(item) {
  isEdit.value = true
  Object.assign(form, {
    id: item.id,
    itemName: item.itemName,
    minValue: item.minValue,
    maxValue: item.maxValue,
    unit: item.unit,
    productLine: item.productLine,
    effectiveDate: item.effectiveDate,
    expireDate: '',
    remark: '',
    status: item.status,
    version: item.version
  })
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = {
      itemName: form.itemName,
      minValue: form.minValue,
      maxValue: form.maxValue,
      unit: form.unit,
      productLine: form.productLine,
      effectiveDate: form.effectiveDate,
      status: form.status || '启用',
      version: 1
    }
    if (isEdit.value) {
      const old = standardStore.findById(form.id)
      const newVersion = (old?.version || 0) + 1
      payload.version = newVersion
      standardStore.update(form.id, payload)
      pushVersionHistory({ ...payload, version: newVersion }, '编辑标准配置')
      ElMessage.success('标准已更新')
    } else {
      payload.id = form.id
      payload.version = 1
      standardStore.add({ ...payload })
      pushVersionHistory(payload, '新建标准')
      ElMessage.success('标准已创建')
    }
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

/* ---------- 删除 ---------- */
function handleDelete(item) {
  ElMessageBox.confirm(
    '确定作废该标准吗？作废后下游检测将无法再引用此标准。',
    '作废确认',
    {
      confirmButtonText: '确定作废',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    standardStore.update(item.id, { status: '停用' })
    ElMessage.success('标准已作废')
    if (selectedId.value === item.id) {
      selectedId.value = ''
    }
  }).catch(() => {})
}

/* ---------- 启用/停用 ---------- */
function handleToggleStatus(val) {
  if (!selectedStandard.value) return
  const newStatus = val ? '启用' : '停用'
  ElMessageBox.confirm(
    `确认${val ? '启用' : '停用'}该标准吗？`,
    '状态变更确认',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    standardStore.update(selectedStandard.value.id, { status: newStatus })
    ElMessage.success(`标准已${val ? '启用' : '停用'}`)
  }).catch(() => {})
}

/* ---------- 详情抽屉 ---------- */
const drawerVisible = ref(false)
const detailItem = ref(null)

function openDetailDrawer(item) {
  detailItem.value = item
  drawerVisible.value = true
}

/* ---------- 关联任务 ---------- */
const recentTasks = computed(() => {
  return inspectionTaskStore.inspectionTaskList.slice(0, 6)
})

const refTasks = computed(() => {
  return inspectionTaskStore.inspectionTaskList.slice(0, 20)
})

const taskDrawerVisible = ref(false)

function openTaskDrawer() {
  taskDrawerVisible.value = true
}

/* ---------- 批量导出 ---------- */
const exportRecords = ref([])

function handleBatchExport() {
  const ids = selectedIds.value
  if (ids.length === 0) {
    ElMessage.warning('请至少选择一条标准')
    return
  }
  const items = standardStore.inspectionStandardList.filter(s => ids.includes(s.id))
  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN', { hour12: false })
  const fileName = `检测标准导出_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`
  exportRecords.value.unshift({
    fileName,
    count: items.length,
    time: timeStr,
    ids: [...ids]
  })
  ElMessage.success(`已导出 ${items.length} 条标准`)
}

/* ---------- 初始化 ---------- */
onMounted(() => {
  if (standardStore.inspectionStandardList.length > 0) {
    selectedId.value = standardStore.inspectionStandardList[0].id
  }
})
</script>

<style scoped lang="scss">
@use './InspectionStandards.scss' as *;
</style>