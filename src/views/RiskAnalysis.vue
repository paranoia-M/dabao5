<template>
  <div class="page-risk_analysis">
    <!-- 顶部操作栏 -->
    <div class="top-actions">
      <div class="action-left">
        <el-button type="primary" @click="openCreateDialog">新增风险分析</el-button>
        <el-button @click="handleExport">导出风险清单</el-button>
        <el-button @click="handleBatchReassess" :disabled="!selectedIds.length">批量重新评定</el-button>
      </div>
      <div class="stat-summary">
        <span v-for="lv in riskLevelStats" :key="lv.label" class="stat-item">
          <span class="stat-dot" :style="{ background: lv.color }"></span>
          {{ lv.label }}：<strong>{{ lv.count }}</strong>
        </span>
      </div>
    </div>

    <!-- 主体：计算面板 + 雷达 -->
    <div class="main-body">
      <!-- 计算面板 -->
      <div class="calc-panel">
        <h3 class="panel-title">风险评估计算</h3>
        <el-form :model="calcForm" label-position="top" size="small">
          <el-form-item label="隐患来源" required>
            <el-select v-model="calcForm.hazardId" filterable placeholder="请选择隐患" @change="onHazardChange">
              <el-option v-for="h in hazardOptions" :key="h.id" :label="h.desc" :value="h.id">
                <span>{{ h.desc }}</span>
                <span style="float:right;font-size:12px;color:#999">{{ h.equipName }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="关联设备">
            <el-input :model-value="calcEquipName" readonly />
          </el-form-item>
          <el-form-item label="风险类型">
            <el-select v-model="calcForm.riskType" placeholder="选择类型">
              <el-option label="设备故障" value="设备故障" />
              <el-option label="操作失误" value="操作失误" />
              <el-option label="环境因素" value="环境因素" />
              <el-option label="管理缺陷" value="管理缺陷" />
            </el-select>
          </el-form-item>
          <el-form-item label="严重程度" required>
            <el-select v-model="calcForm.severity" placeholder="选择严重程度">
              <el-option label="轻微" value="轻微" />
              <el-option label="一般" value="一般" />
              <el-option label="严重" value="严重" />
            </el-select>
          </el-form-item>
          <el-form-item label="发生可能性" required>
            <el-select v-model="calcForm.probability" placeholder="选择可能性">
              <el-option label="低" value="低" />
              <el-option label="中" value="中" />
              <el-option label="高" value="高" />
            </el-select>
          </el-form-item>
          <el-form-item label="控制措施">
            <el-input v-model="calcForm.controlMeasures" type="textarea" :rows="2" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="calcAndSave" :loading="calcLoading">计算并保存</el-button>
            <el-button @click="resetCalcForm">重置</el-button>
          </el-form-item>
        </el-form>
        <div v-if="calcResult.riskLevel" class="calc-result">
          <span class="result-label">计算结果：</span>
          <span class="result-value" :style="{ color: levelColor(calcResult.riskLevel) }">{{ calcResult.riskLevel }}</span>
          <span class="result-score">风险分值：{{ calcResult.score }}</span>
        </div>
      </div>

      <!-- 雷达图 -->
      <div class="radar-panel">
        <h3 class="panel-title">风险评估雷达</h3>
        <div class="radar-container">
          <svg viewBox="0 0 420 420" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <!-- 五边形网格 -->
            <polygon v-for="(lv, i) in [0.2,0.4,0.6,0.8,1]" :key="i" :points="gridPoints(lv)" fill="none" stroke="#e0e0e0" stroke-width="1" />
            <!-- 轴 -->
            <line v-for="(dim, idx) in dimensions" :key="'axis'+idx" :x1="cx" :y1="cy" :x2="dim.x" :y2="dim.y" stroke="#cfd8dc" stroke-width="0.8" />
            <!-- 数据多边形 -->
            <polygon v-if="radarData" :points="dataPolygon" fill="rgba(5,150,101,0.25)" stroke="#059669" stroke-width="2" stroke-linejoin="round" />
            <!-- 数据点 -->
            <circle v-for="(d, idx) in radarPoints" :key="'pt'+idx" :cx="d.x" :cy="d.y" r="4" fill="#059669" stroke="white" stroke-width="2" />
            <!-- 维度标签 -->
            <text v-for="(dim, idx) in dimensions" :key="'label'+idx" :x="dim.labelX" :y="dim.labelY" text-anchor="middle" font-size="12" fill="#374151" dy=".35em">{{ dim.label }}</text>
            <!-- tooltip 悬停 -->
            <g v-for="(d, idx) in radarPoints" :key="'tooltip'+idx" style="cursor:pointer">
              <circle :cx="d.x" :cy="d.y" r="8" fill="transparent" stroke="none" @mouseenter="showTooltip($event, idx)" @mouseleave="hideTooltip" />
            </g>
          </svg>
          <div v-if="tooltipVisible" class="radar-tooltip" :style="{ left: tooltipLeft + 'px', top: tooltipTop + 'px' }">
            <div v-for="(dim, idx) in dimensions" :key="idx" class="tooltip-row">
              <span class="tooltip-label">{{ dim.label }}：</span>
              <span class="tooltip-value">{{ radarData ? radarData[dim.key] : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-input v-model="filterKeyword" placeholder="搜索设备名称或风险描述" clearable style="width:280px" />
      <el-select v-model="filterRiskLevel" placeholder="风险等级" clearable style="width:180px">
        <el-option label="全部" value="" />
        <el-option label="红色(重大风险)" value="红色(重大风险)" />
        <el-option label="橙色(较大风险)" value="橙色(较大风险)" />
        <el-option label="黄色(一般风险)" value="黄色(一般风险)" />
        <el-option label="蓝色(低风险)" value="蓝色(低风险)" />
      </el-select>
      <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至" start-placeholder="评估开始日期" end-placeholder="评估结束日期" value-format="YYYY-MM-DD" style="width:280px" />
    </div>

    <!-- 记录表格 -->
    <el-table :data="filteredList" stripe border highlight-current-row @row-click="handleRowClick" style="width:100%;margin-top:16px">
      <el-table-column type="selection" width="50" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column label="设备名称" min-width="160">
        <template #default="{ row }">
          {{ getEquipName(row.equipmentId) }}
        </template>
      </el-table-column>
      <el-table-column prop="riskType" label="风险类型" min-width="120" />
      <el-table-column prop="severity" label="严重程度" width="80" />
      <el-table-column prop="probability" label="可能性" width="80" />
      <el-table-column prop="riskLevel" label="风险等级" width="150">
        <template #default="{ row }">
          <el-tag :style="{ backgroundColor: levelColor(row.riskLevel)+'20', color: levelColor(row.riskLevel), borderColor: levelColor(row.riskLevel) }">
            {{ row.riskLevel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assessmentDate" label="评估日期" width="120" />
      <el-table-column prop="assessor" label="评估人" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="handleView(row)">查看</el-button>
          <el-button link type="primary" @click.stop="handleEdit(row)" :disabled="isEditDisabled(row)">编辑</el-button>
          <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          <el-button link type="warning" @click.stop="handleReassess(row)">重新评定</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 结果摘要区（批量重新评定） -->
    <div v-if="batchResult.visible" class="batch-result">
      <el-alert :title="batchResult.title" :description="batchResult.description" :type="batchResult.type" show-icon closable @close="batchResult.visible=false" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode==='create'?'新增风险分析':'编辑风险分析'" width="min(640px,92vw)" top="5vh" :close-on-click-modal="false" @close="resetDialog">
      <el-form ref="dialogFormRef" :model="dialogForm" label-width="100px" :rules="dialogRules" size="small">
        <el-form-item label="隐患来源" prop="hazardId" required>
          <el-select v-model="dialogForm.hazardId" filterable placeholder="选择隐患" @change="onDialogHazardChange">
            <el-option v-for="h in hazardOptions" :key="h.id" :label="h.desc" :value="h.id">
              <span>{{ h.desc }}</span>
              <span style="float:right;font-size:12px;color:#999">{{ h.equipName }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input :model-value="dialogEquipName" readonly />
        </el-form-item>
        <el-form-item label="风险类型" prop="riskType">
          <el-select v-model="dialogForm.riskType" placeholder="选择类型">
            <el-option label="设备故障" value="设备故障" />
            <el-option label="操作失误" value="操作失误" />
            <el-option label="环境因素" value="环境因素" />
            <el-option label="管理缺陷" value="管理缺陷" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险描述" prop="description">
          <el-input v-model="dialogForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity" required>
          <el-select v-model="dialogForm.severity" placeholder="选择严重程度">
            <el-option label="轻微" value="轻微" />
            <el-option label="一般" value="一般" />
            <el-option label="严重" value="严重" />
          </el-select>
        </el-form-item>
        <el-form-item label="可能性" prop="probability" required>
          <el-select v-model="dialogForm.probability" placeholder="选择可能性">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="dialogForm.riskLevel" placeholder="可自动计算或手动选择" :disabled="dialogRiskDisabled">
            <el-option label="蓝色(低风险)" value="蓝色(低风险)" />
            <el-option label="黄色(一般风险)" value="黄色(一般风险)" />
            <el-option label="橙色(较大风险)" value="橙色(较大风险)" />
            <el-option label="红色(重大风险)" value="红色(重大风险)" />
          </el-select>
          <el-button link @click="autoCalcRiskLevel" :disabled="!dialogForm.severity || !dialogForm.probability">自动计算</el-button>
        </el-form-item>
        <el-form-item label="控制措施" prop="controlMeasures">
          <el-input v-model="dialogForm.controlMeasures" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="评估人" prop="assessor">
          <el-input v-model="dialogForm.assessor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitDialog" :loading="dialogLoading">{{ dialogMode==='create'?'提交':'保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="风险分析详情" size="500px">
      <template v-if="currentDetail">
        <div class="drawer-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="设备名称">{{ getEquipName(currentDetail.equipmentId) }}</el-descriptions-item>
              <el-descriptions-item label="隐患来源">{{ getHazardDesc(currentDetail.hazardId) }}</el-descriptions-item>
              <el-descriptions-item label="风险类型">{{ currentDetail.riskType }}</el-descriptions-item>
              <el-descriptions-item label="评估方法">{{ currentDetail.assessmentMethod }}</el-descriptions-item>
              <el-descriptions-item label="评估日期">{{ currentDetail.assessmentDate }}</el-descriptions-item>
              <el-descriptions-item label="评估人">{{ currentDetail.assessor }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusTagType(currentDetail.status)" size="small">{{ currentDetail.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :color="levelColor(currentDetail.riskLevel)" style="color:#fff">{{ currentDetail.riskLevel }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="detail-section">
            <h4>风险因子</h4>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="严重程度">{{ currentDetail.severity }}</el-descriptions-item>
              <el-descriptions-item label="概率等级">{{ currentDetail.probability }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="detail-section">
            <h4>控制措施</h4>
            <p>{{ currentDetail.controlMeasures || '无' }}</p>
          </div>
          <div class="detail-section">
            <h4>附件</h4>
            <p>（暂无附件）</p>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 导出清单结果区 -->
    <div v-if="exportResult.visible" class="export-result">
      <el-card shadow="never">
        <div class="export-header">
          <span>最近导出</span>
          <el-button link @click="exportResult.visible=false">关闭</el-button>
        </div>
        <div class="export-item">
          <el-icon><Document /></el-icon>
          <span>{{ exportResult.title }}</span>
          <span class="export-time">{{ exportResult.createTime }}</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'
import { useRectificationStore } from '@/stores/rectification'
import { useRiskAssessmentStore } from '@/stores/riskAssessment'
import { useReportStore } from '@/stores/report'

const equipmentStore = useEquipmentStore()
const hazardStore = useHazardRecordStore()
const rectStore = useRectificationStore()
const riskStore = useRiskAssessmentStore()
const reportStore = useReportStore()

// ---------- 数据 ----------
const cx = 210, cy = 210, maxR = 160
const dimensions = [
  { key: 'severityScore', label: '严重性', idx: 0 },
  { key: 'probabilityScore', label: '可能性', idx: 1 },
  { key: 'riskLevelScore', label: '风险等级', idx: 2 },
  { key: 'controlScore', label: '控制措施', idx: 3 },
  { key: 'frequencyScore', label: '历史频次', idx: 4 }
]

// 当前雷达显示记录
const currentRadarId = ref(null)
const radarData = ref(null)

function computeRadarScore(item) {
  if (!item) return null
  const severityMap = { '轻微': 20, '一般': 50, '严重': 80 }
  const probMap = { '低': 20, '中': 50, '高': 80 }
  const riskMap = { '蓝色(低风险)': 25, '黄色(一般风险)': 50, '橙色(较大风险)': 75, '红色(重大风险)': 100 }
  const sevScore = severityMap[item.severity] || 0
  const probScore = probMap[item.probability] || 0
  const riskScore = riskMap[item.riskLevel] || 0
  const controlScore = (item.controlMeasures && item.controlMeasures.trim().length > 0) ? 80 : 20
  // 频次：该设备风险评估记录数
  const freq = riskStore.riskAssessmentList.filter(r => r.equipmentId === item.equipmentId).length
  const freqScore = Math.min(freq * 10, 100)
  return { severityScore: sevScore, probabilityScore: probScore, riskLevelScore: riskScore, controlScore, frequencyScore: freqScore }
}

watch(() => riskStore.riskAssessmentList, (list) => {
  if (list.length > 0 && !currentRadarId.value) {
    const last = list[list.length - 1]
    radarData.value = computeRadarScore(last)
  }
}, { immediate: true })

function updateRadar(id) {
  const item = riskStore.riskAssessmentList.find(r => r.id === id)
  if (item) {
    radarData.value = computeRadarScore(item)
    currentRadarId.value = id
  }
}

// 坐标计算
function getAngle(i) {
  return (2 * Math.PI / 5) * i - Math.PI / 2
}
function getPoint(ratio, i) {
  const angle = getAngle(i)
  return { x: cx + maxR * ratio * Math.cos(angle), y: cy + maxR * ratio * Math.sin(angle) }
}
function gridPoints(ratio) {
  return dimensions.map((d, i) => {
    const p = getPoint(ratio, i)
    return `${p.x},${p.y}`
  }).join(' ')
}
const dataPolygon = computed(() => {
  if (!radarData.value) return ''
  return dimensions.map((d, i) => {
    const val = Number(radarData.value[d.key]) || 20
    const ratio = Math.min(val / 100, 1)
    const p = getPoint(ratio, i)
    return `${p.x},${p.y}`
  }).join(' ')
})
const radarPoints = computed(() => {
  if (!radarData.value) return []
  return dimensions.map((d, i) => {
    const val = Number(radarData.value[d.key]) || 20
    const ratio = Math.min(val / 100, 1)
    const p = getPoint(ratio, i)
    return { x: p.x, y: p.y, value: val }
  })
})
// 维度标签位置稍微外扩
const dimensionsLabel = computed(() => {
  return dimensions.map((d, i) => {
    const angle = getAngle(i)
    const r = maxR + 25
    return { label: d.label, labelX: cx + r * Math.cos(angle), labelY: cy + r * Math.sin(angle) }
  })
})

// Tooltip
const tooltipVisible = ref(false)
const tooltipLeft = ref(0), tooltipTop = ref(0)

function showTooltip(e, idx) {
  const rect = e.target.getBoundingClientRect()
  tooltipLeft.value = rect.left + 10
  tooltipTop.value = rect.top - 10
  tooltipVisible.value = true
}
function hideTooltip() {
  tooltipVisible.value = false
}

// ---------- 计算面板 ----------
const calcForm = ref({
  hazardId: '',
  riskType: '',
  severity: '',
  probability: '',
  controlMeasures: ''
})
const calcLoading = ref(false)
const calcResult = ref({ riskLevel: '', score: 0 })
const calcEquipName = ref('')

const hazardOptions = computed(() => {
  return hazardStore.hazardRecordList.map(h => {
    const eq = equipmentStore.findById(h.equipmentId)
    return { id: h.id, desc: h.description, equipName: eq ? eq.name : '未知设备' }
  })
})

function getEquipName(equipId) {
  const eq = equipmentStore.findById(equipId)
  return eq ? eq.name : '-'
}
function getHazardDesc(hazardId) {
  const h = hazardStore.findById(hazardId)
  return h ? h.description : '-'
}

function onHazardChange(id) {
  const h = hazardStore.findById(id)
  if (h) {
    const eq = equipmentStore.findById(h.equipmentId)
    calcEquipName.value = eq ? eq.name : ''
    calcForm.value.riskType = '设备故障' // 默认
  } else {
    calcEquipName.value = ''
  }
}

function calcLevel(sev, prob) {
  const matrix = {
    '轻微': { '低': '蓝色(低风险)', '中': '黄色(一般风险)', '高': '橙色(较大风险)' },
    '一般': { '低': '黄色(一般风险)', '中': '橙色(较大风险)', '高': '红色(重大风险)' },
    '严重': { '低': '橙色(较大风险)', '中': '红色(重大风险)', '高': '红色(重大风险)' }
  }
  return (matrix[sev] && matrix[sev][prob]) || '蓝色(低风险)'
}

function calcScore(sev, prob) {
  const sevMap = { '轻微': 1, '一般': 2, '严重': 3 }
  const probMap = { '低': 1, '中': 2, '高': 3 }
  const s = sevMap[sev] || 1
  const p = probMap[prob] || 1
  return s * p * 50  // 简单计算分
}

function calcAndSave() {
  if (!calcForm.value.hazardId || !calcForm.value.severity || !calcForm.value.probability) {
    ElMessage.warning('请选择隐患来源、严重程度和发生可能性')
    return
  }
  calcLoading.value = true
  const h = hazardStore.findById(calcForm.value.hazardId)
  if (!h) { calcLoading.value = false; return }
  const riskLevel = calcLevel(calcForm.value.severity, calcForm.value.probability)
  const score = calcScore(calcForm.value.severity, calcForm.value.probability)
  const newRecord = {
    id: 'risk_' + Date.now(),
    hazardId: calcForm.value.hazardId,
    equipmentId: h.equipmentId || '',
    riskType: calcForm.value.riskType || '设备故障',
    assessmentMethod: '风险矩阵法',
    severity: calcForm.value.severity,
    probability: calcForm.value.probability,
    riskLevel: riskLevel,
    controlMeasures: calcForm.value.controlMeasures || '',
    assessmentDate: new Date().toISOString().slice(0,10),
    assessor: '当前用户',
    status: '草稿'
  }
  riskStore.add(newRecord)
  calcResult.value = { riskLevel, score }
  // 更新雷达
  updateRadar(newRecord.id)
  ElMessage.success('风险分析记录已保存')
  resetCalcForm()
  calcLoading.value = false
}
function resetCalcForm() {
  calcForm.value = { hazardId: '', riskType: '', severity: '', probability: '', controlMeasures: '' }
  calcEquipName.value = ''
}

// ---------- 筛选 ----------
const filterKeyword = ref('')
const filterRiskLevel = ref('')
const filterDateRange = ref([])

const filteredList = computed(() => {
  let list = [...riskStore.riskAssessmentList]
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(r => {
      const name = getEquipName(r.equipmentId).toLowerCase()
      const desc = getHazardDesc(r.hazardId).toLowerCase()
      return name.includes(kw) || desc.includes(kw)
    })
  }
  if (filterRiskLevel.value) {
    list = list.filter(r => r.riskLevel === filterRiskLevel.value)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    list = list.filter(r => r.assessmentDate >= start && r.assessmentDate <= end)
  }
  // 按风险等级降序
  const levelOrder = { '红色(重大风险)': 4, '橙色(较大风险)': 3, '黄色(一般风险)': 2, '蓝色(低风险)': 1 }
  list.sort((a, b) => (levelOrder[b.riskLevel] || 0) - (levelOrder[a.riskLevel] || 0))
  return list
})

// 选中行
const selectedIds = ref([])
function handleSelectionChange(selection) {
  selectedIds.value = selection.map(r => r.id)
}
// 行点击更新雷达
function handleRowClick(row) {
  updateRadar(row.id)
}

// ---------- 查看详情 ----------
const drawerVisible = ref(false)
const currentDetail = ref(null)
function handleView(row) {
  currentDetail.value = row
  drawerVisible.value = true
}

// ---------- 编辑 ----------
const dialogVisible = ref(false)
const dialogMode = ref('create')
const dialogForm = ref({})
const dialogFormRef = ref(null)
const dialogLoading = ref(false)
const dialogEquipName = ref('')
const dialogRiskDisabled = ref(false)

function openCreateDialog() {
  dialogMode.value = 'create'
  dialogForm.value = {
    hazardId: '', riskType: '', description: '', severity: '', probability: '', riskLevel: '', controlMeasures: '', assessor: ''
  }
  dialogEquipName.value = ''
  dialogRiskDisabled.value = false
  dialogVisible.value = true
}
function handleEdit(row) {
  const editingId = row.id
  // 检查是否关联进行中整改
  const hasActiveRect = rectStore.rectificationList.some(r => r.hazardId === row.hazardId && (r.status === '进行中' || r.status === '待验收'))
  if (hasActiveRect) {
    dialogRiskDisabled.value = true
  } else {
    dialogRiskDisabled.value = false
  }
  dialogMode.value = 'edit'
  dialogForm.value = { ...row }
  // 根据hazardId带出设备名
  const h = hazardStore.findById(row.hazardId)
  if (h) {
    const eq = equipmentStore.findById(h.equipmentId)
    dialogEquipName.value = eq ? eq.name : ''
  }
  dialogVisible.value = true
}
function onDialogHazardChange(id) {
  const h = hazardStore.findById(id)
  if (h) {
    const eq = equipmentStore.findById(h.equipmentId)
    dialogEquipName.value = eq ? eq.name : ''
    if (!dialogForm.value.riskType) dialogForm.value.riskType = '设备故障'
  } else {
    dialogEquipName.value = ''
  }
}
function autoCalcRiskLevel() {
  if (dialogForm.value.severity && dialogForm.value.probability) {
    dialogForm.value.riskLevel = calcLevel(dialogForm.value.severity, dialogForm.value.probability)
  }
}
const dialogRules = {
  hazardId: [{ required: true, message: '请选择隐患来源', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  probability: [{ required: true, message: '请选择可能性', trigger: 'change' }]
}
function submitDialog() {
  dialogFormRef.value.validate(valid => {
    if (!valid) return
    dialogLoading.value = true
    const form = { ...dialogForm.value }
    // 补充日期、评估人默认
    if (!form.assessmentDate) form.assessmentDate = new Date().toISOString().slice(0,10)
    if (!form.assessor) form.assessor = '当前用户'
    if (!form.status) form.status = '草稿'
    if (!form.assessmentMethod) form.assessmentMethod = '风险矩阵法'
    if (dialogMode.value === 'create') {
      form.id = 'risk_' + Date.now()
      riskStore.add(form)
      ElMessage.success('新增成功')
    } else {
      riskStore.update(form.id, form)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    dialogLoading.value = false
  })
}
function resetDialog() {
  dialogFormRef.value?.resetFields()
  dialogEquipName.value = ''
}

function isEditDisabled(row) {
  const hasActive = rectStore.rectificationList.some(r => r.hazardId === row.hazardId && r.status === '进行中')
  return hasActive
}

// ---------- 删除 ----------
function handleDelete(row) {
  const hasCompleted = rectStore.rectificationList.some(r => r.hazardId === row.hazardId && (r.status === '已完成' || r.status === '已驳回'))
  const hasActive = rectStore.rectificationList.some(r => r.hazardId === row.hazardId && r.status === '进行中')
  if (hasActive) {
    ElMessage.error('请先结束关联整改任务')
    return
  }
  let msg = '确认删除该风险分析记录？'
  if (hasCompleted) {
    msg = '该风险已关联整改完成，删除将导致数据不一致，确认删除？'
  }
  ElMessageBox.confirm(msg, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    riskStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// ---------- 重新评定（单条） ----------
function handleReassess(row) {
  if (!row.severity || !row.probability) {
    ElMessage.warning('该记录缺少严重程度或可能性，无法重新评定')
    return
  }
  const newLevel = calcLevel(row.severity, row.probability)
  riskStore.update(row.id, { riskLevel: newLevel })
  ElMessage.success('重新评定完成')
  updateRadar(row.id)
}

// ---------- 批量重新评定 ----------
const batchResult = ref({ visible: false, title: '', description: '', type: 'info' })
function handleBatchReassess() {
  if (!selectedIds.value.length) return
  let success = 0, fail = 0, failIds = []
  selectedIds.value.forEach(id => {
    const item = riskStore.riskAssessmentList.find(r => r.id === id)
    if (!item) return
    if (!item.severity || !item.probability) {
      fail++
      failIds.push(id)
      return
    }
    const newLevel = calcLevel(item.severity, item.probability)
    riskStore.update(id, { riskLevel: newLevel })
    success++
  })
  batchResult.value = {
    visible: true,
    title: `批量重新评定完成`,
    description: `共 ${selectedIds.value.length} 条，成功 ${success} 条` + (fail ? `，${fail} 条因数据不全失败（记录ID: ${failIds.join(', ')}）` : ''),
    type: fail ? 'warning' : 'success'
  }
  selectedIds.value = []
}

// ---------- 导出 ----------
const exportResult = ref({ visible: false, title: '', createTime: '' })
function handleExport() {
  // 导出当前筛选结果作为 CSV 并保存一条报告记录
  const data = filteredList.value
  const header = 'ID,隐患来源,设备,风险类型,严重程度,可能性,风险等级,评估日期,评估人,状态\n'
  const rows = data.map(r => {
    const hazardDesc = getHazardDesc(r.hazardId).replace(/,/g, ' ')
    const equipName = getEquipName(r.equipmentId).replace(/,/g, ' ')
    return `${r.id},${hazardDesc},${equipName},${r.riskType},${r.severity},${r.probability},${r.riskLevel},${r.assessmentDate},${r.assessor},${r.status}`
  }).join('\n')
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const now = new Date()
  const fileName = `风险清单_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)

  // 添加报告记录
  const report = {
    id: 'report_' + Date.now(),
    title: `风险评估清单导出 ${fileName}`,
    reportType: '风险评估报告',
    generationMethod: '自动',
    status: '已审核',
    relatedEntityType: '风险分析',
    relatedEntityId: '',
    content: { summary: `导出 ${data.length} 条风险分析记录` },
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    auditBy: '系统',
    auditTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }
  reportStore.add(report)
  exportResult.value = { visible: true, title: report.title, createTime: report.createTime }
  ElMessage.success('导出成功，已添加至报告记录')
}

// ---------- 统计（顶部） ----------
const riskLevelStats = computed(() => {
  const counts = { '红色(重大风险)': 0, '橙色(较大风险)': 0, '黄色(一般风险)': 0, '蓝色(低风险)': 0 }
  const colors = { '红色(重大风险)': '#e74c3c', '橙色(较大风险)': '#e67e22', '黄色(一般风险)': '#f1c40f', '蓝色(低风险)': '#3498db' }
  riskStore.riskAssessmentList.forEach(r => {
    if (counts.hasOwnProperty(r.riskLevel)) counts[r.riskLevel]++
  })
  return Object.entries(counts).map(([label, count]) => ({ label, count, color: colors[label] }))
})

function levelColor(level) {
  const map = { '红色(重大风险)': '#e74c3c', '橙色(较大风险)': '#e67e22', '黄色(一般风险)': '#f1c40f', '蓝色(低风险)': '#3498db' }
  return map[level] || '#909399'
}

function statusTagType(status) {
  return status === '草稿' ? 'info' : status === '已确认' ? 'success' : status === '已复核' ? 'warning' : 'info'
}
</script>

<style scoped lang="scss">
@use './RiskAnalysis.scss' as *;
</style>