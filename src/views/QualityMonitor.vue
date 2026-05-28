<template>
  <div class="page-quality_monitor">
    <!-- 顶部筛选卡片 -->
    <div class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="规则名称">
          <el-input v-model="keyword" placeholder="搜索规则名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="ruleTypeFilter" placeholder="全部" clearable style="width:120px">
            <el-option label="全部" value="" />
            <el-option label="完整性" value="完整性" />
            <el-option label="准确性" value="准确性" />
            <el-option label="一致性" value="一致性" />
            <el-option label="及时性" value="及时性" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width:120px">
            <el-option label="全部" value="" />
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
            <el-option label="异常" value="异常" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 主内容区：左60% 右40% -->
    <div class="main-content">
      <!-- 左侧：质量仪表盘+排行榜 -->
      <div class="left-panel">
        <div class="score-gauge-card">
          <h3 class="card-title">• 质量评分仪表盘</h3>
          <div class="gauge-container">
            <svg viewBox="0 0 200 130" width="100%" height="130">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#E74C3C" />
                  <stop offset="50%" stop-color="#F39C12" />
                  <stop offset="100%" stop-color="#27AE60" />
                </linearGradient>
              </defs>
              <!-- 背景半圆 -->
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e8e8e8" stroke-width="20" stroke-linecap="round" />
              <!-- 彩色填充弧，动态偏移 -->
              <path
                d="M20 100 A80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#scoreGradient)"
                stroke-width="20"
                stroke-linecap="round"
                :stroke-dasharray="arcLength"
                :stroke-dashoffset="arcLength * (1 - gaugeScore / 100)"
              />
              <!-- 指针 -->
              <g :transform="`rotate(${pointerAngle}, 100, 100)`">
                <polygon points="96,100 104,100 100,28" fill="#333" />
                <circle cx="100" cy="100" r="6" fill="#333" />
              </g>
              <!-- 分数数字 -->
              <text x="100" y="124" text-anchor="middle" font-size="22" font-weight="bold" fill="#1E3A5F">{{ gaugeScore.toFixed(0) }} 分</text>
            </svg>
          </div>
        </div>

        <div class="ranking-card">
          <h3 class="card-title">• 数据资产质量排名</h3>
          <div class="ranking-list">
            <div
              v-for="(item, index) in rankedAssets"
              :key="item.assetId"
              class="ranking-item"
              :class="{ 'top1': index === 0, 'top2': index === 1, 'top3': index === 2, 'selected': selectedAssetId === item.assetId }"
              @click="selectAsset(item)"
            >
              <span class="rank-badge" v-if="index < 3">{{ ['🥇', '🥈', '🥉'][index] }}</span>
              <span class="rank-badge plain" v-else>{{ index + 1 }}</span>
              <div class="asset-info">
                <span class="asset-name">{{ item.name }}</span>
                <span class="asset-score">{{ item.score.toFixed(1) }} 分</span>
              </div>
              <el-progress :percentage="item.score" :stroke-width="6" :color="scoreColor(item.score)" />
            </div>
            <div v-if="rankedAssets.length === 0" class="empty-tip">暂无数据资产评分</div>
          </div>
        </div>
      </div>

      <!-- 右侧：规则列表 + 异常记录 -->
      <div class="right-panel">
        <div class="rules-card">
          <div class="card-toolbar">
            <h3 class="card-title">• 质量规则列表</h3>
            <div class="toolbar-actions">
              <el-button type="primary" @click="openAddDialog">新增规则</el-button>
              <el-button :disabled="selectedRules.length === 0" @click="handleExport">导出选中</el-button>
            </div>
          </div>
          <el-table
            ref="tableRef"
            :data="filteredRules"
            stripe
            style="width:100%"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="40" />
            <el-table-column prop="name" label="规则名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="ruleType" label="类型" width="80" />
            <el-table-column label="目标资产" width="110" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ getAssetName(row.targetAssetId) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="320" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
                <el-button link type="primary" :disabled="row.status === '启用'" @click="openEditDialog(row)">编辑</el-button>
                <el-button link type="primary" @click="toggleStatus(row)">{{ row.status === '启用' ? '停用' : '启用' }}</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                <el-button link type="primary" @click="triggerDetection(row)">检测</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="anomaly-card">
          <h3 class="card-title">• 最近异常记录</h3>
          <div class="anomaly-list">
            <div v-for="item in recentAnomalies" :key="item.id" class="anomaly-item">
              <span class="anomaly-time">{{ item.executionTime }}</span>
              <span class="anomaly-rule">{{ getRuleName(item.ruleId) }}</span>
              <span class="anomaly-errors">{{ item.errorCount }} 个异常</span>
              <el-tag :type="item.status === '失败' ? 'danger' : item.status === '运行中' ? 'warning' : 'success'" size="small">{{ item.status }}</el-tag>
            </div>
            <div v-if="recentAnomalies.length === 0" class="empty-tip">暂无异常记录</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新增规则'" width="min(640px,92vw)" @close="resetForm">
      <el-form ref="formRef" :model="ruleForm" :rules="formRules" label-width="110px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" maxlength="50" show-word-limit placeholder="不超过50字符" />
        </el-form-item>
        <el-form-item label="目标数据源" prop="targetAssetId">
          <el-select v-model="ruleForm.targetAssetId" filterable placeholder="选择数据资产" style="width:100%">
            <el-option v-for="asset in dataAssetStore.dataAssetList" :key="asset.id" :label="asset.name" :value="asset.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="监控类型" prop="ruleType">
          <el-select v-model="ruleForm.ruleType" placeholder="选择类型" style="width:100%">
            <el-option label="完整性" value="完整性" />
            <el-option label="准确性" value="准确性" />
            <el-option label="一致性" value="一致性" />
            <el-option label="及时性" value="及时性" />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="ruleForm.cronExpression" placeholder="如 0 0 2 * * ?" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ruleForm.description" type="textarea" :rows="3" placeholder="规则说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 规则详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="规则详情" size="min(500px,85vw)" @close="drawerVisible = false">
      <template #default>
        <div v-if="currentRule" class="detail-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div><span class="label">规则名称</span><span>{{ currentRule.name }}</span></div>
              <div><span class="label">数据源</span><span>{{ getAssetName(currentRule.targetAssetId) }}</span></div>
              <div><span class="label">类型</span><span>{{ currentRule.ruleType }}</span></div>
              <div><span class="label">状态</span><el-tag :type="currentRule.status === '启用' ? 'success' : 'info'" size="small">{{ currentRule.status }}</el-tag></div>
              <div><span class="label">Cron</span><span>{{ currentRule.cronExpression }}</span></div>
              <div><span class="label">描述</span><span>{{ currentRule.description }}</span></div>
            </div>
          </div>
          <div class="detail-section">
            <h4>最近 5 次执行结果</h4>
            <el-table :data="recentExecutions" stripe style="width:100%">
              <el-table-column prop="executionTime" label="执行时间" width="160" />
              <el-table-column prop="score" label="得分" width="80">
                <template #default="{ row }">
                  <span :style="{ color: row.score > 80 ? '#27AE60' : row.score > 60 ? '#F39C12' : '#E74C3C' }">{{ row.score }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="errorCount" label="异常数" width="80" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === '成功' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="recentExecutions.length === 0" class="empty-tip" style="margin-top:8px">暂无执行记录</div>
          </div>
          <div class="detail-section">
            <h4>异常明细</h4>
            <div v-if="currentRuleDetailErrors.length === 0" class="empty-tip">无异常</div>
            <div v-else v-for="(err, idx) in currentRuleDetailErrors" :key="idx" class="error-item">{{ err }}</div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQualityRuleStore } from '@/stores/qualityRule'
import { useDetectionResultStore } from '@/stores/detectionResult'
import { useDataAssetStore } from '@/stores/dataAsset'
import { useExportRecordStore } from '@/stores/exportRecord'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'

// ── stores ──
const qualityRuleStore = useQualityRuleStore()
const detectionResultStore = useDetectionResultStore()
const dataAssetStore = useDataAssetStore()
const exportRecordStore = useExportRecordStore()

// ── 筛选状态 ──
const keyword = ref('')
const ruleTypeFilter = ref('')
const statusFilter = ref('')
const resetFilters = () => {
  keyword.value = ''
  ruleTypeFilter.value = ''
  statusFilter.value = ''
}

// ── 排名计算 ──
function computeAssetScore(assetId) {
  const ruleIds = qualityRuleStore.qualityRuleList
    .filter(r => r.targetAssetId === assetId)
    .map(r => r.id)
  if (ruleIds.length === 0) return 0
  const results = detectionResultStore.detectionResultList.filter(d => ruleIds.includes(d.ruleId))
  if (results.length === 0) return 0
  const validScores = results.map(d => d.score).filter(s => Number.isFinite(s))
  if (validScores.length === 0) return 0
  return validScores.reduce((a, b) => a + b, 0) / validScores.length
}

const rankedAssets = computed(() => {
  const assets = dataAssetStore.dataAssetList.map(a => ({
    assetId: a.id,
    name: a.name,
    score: computeAssetScore(a.id)
  }))
  return assets.sort((a, b) => b.score - a.score)
})

// ── 选中资产（用于仪表盘显示） ──
const selectedAssetId = ref(null)
const selectedAssetScore = computed(() => {
  if (!selectedAssetId.value) {
    if (rankedAssets.value.length > 0) return rankedAssets.value[0].score
    return 0
  }
  const found = rankedAssets.value.find(a => a.assetId === selectedAssetId.value)
  return found ? found.score : 0
})
const gaugeScore = computed(() => {
  return Math.min(100, Math.max(0, Number.isFinite(selectedAssetScore.value) ? selectedAssetScore.value : 0))
})

function selectAsset(item) {
  selectedAssetId.value = item.assetId
}

// 默认选中第一个
watch(() => rankedAssets.value.length, (len) => {
  if (len > 0 && !selectedAssetId.value) {
    selectedAssetId.value = rankedAssets.value[0].assetId
  }
}, { immediate: true })

// ── SVG 仪表盘参数 ──
const arcLength = 251.327 // 半径为80的半圆弧长 path: M20 100 A80 80 0 0 1 180 100
const pointerAngle = computed(() => {
  return -90 + (gaugeScore.value / 100) * 180
})

// ── 筛选规则 ──
const filteredRules = computed(() => {
  let list = qualityRuleStore.qualityRuleList
  if (keyword.value) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(r => r.name.toLowerCase().includes(kw))
  }
  if (ruleTypeFilter.value) {
    list = list.filter(r => r.ruleType === ruleTypeFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value)
  }
  return list
})

// ── 表格选中 ──
const tableRef = ref(null)
const selectedRules = ref([])
const onSelectionChange = (selection) => {
  selectedRules.value = selection
}

// ── 导出 ──
function handleExport() {
  if (selectedRules.value.length === 0) return
  const file = {
    id: `export_${Date.now()}`,
    userId: 'user_1001',
    module: '质量规则',
    fileName: `质量规则导出_${Date.now()}.json`,
    fileSize: 1024 * selectedRules.value.length,
    status: '完成',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  exportRecordStore.add(file)
  ElMessage.success(`已导出 ${selectedRules.value.length} 条规则`)
  tableRef.value.clearSelection()
}

// ── 新增/编辑 ──
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const ruleForm = ref({
  name: '',
  targetAssetId: '',
  ruleType: '',
  cronExpression: '',
  description: ''
})
const editId = ref('')

const formRules = {
  name: [
    { required: true, message: '规则名称不能为空', trigger: 'blur' },
    { max: 50, message: '不超过50字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const exist = qualityRuleStore.qualityRuleList.find(
          r => r.name === value && r.id !== editId.value && r.targetAssetId === ruleForm.value.targetAssetId
        )
        if (exist) {
          callback(new Error('该数据源下规则名称已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  targetAssetId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  ruleType: [{ required: true, message: '请选择监控类型', trigger: 'change' }]
}

function openAddDialog() {
  isEdit.value = false
  editId.value = ''
  ruleForm.value = { name: '', targetAssetId: '', ruleType: '', cronExpression: '', description: '' }
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  ruleForm.value = {
    name: row.name,
    targetAssetId: row.targetAssetId,
    ruleType: row.ruleType,
    cronExpression: row.cronExpression,
    description: row.description
  }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
}

async function submitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    qualityRuleStore.update(editId.value, { ...ruleForm.value })
    ElMessage.success('规则已更新')
  } else {
    const newId = `qualityrule_${Date.now()}`
    qualityRuleStore.add({
      id: newId,
      ...ruleForm.value,
      status: '停用'
    })
    ElMessage.success('规则已新增')
  }
  dialogVisible.value = false
}

// ── 启用/停用 ──
async function toggleStatus(row) {
  const newStatus = row.status === '启用' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${newStatus}规则「${row.name}」吗？`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    qualityRuleStore.update(row.id, { status: newStatus })
    ElMessage.success(`规则已${newStatus}`)
  } catch {
    // 取消
  }
}

// ── 删除 ──
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除规则「${row.name}」？删除后不可恢复。`, '警告', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' })
    qualityRuleStore.remove(row.id)
    ElMessage.success('规则已删除')
  } catch {
    // 取消
  }
}

// ── 手动触发检测 ──
function triggerDetection(row) {
  const now = new Date()
  const timeStr = now.toISOString().slice(0, 19).replace('T', ' ')
  const newResult = {
    id: `detection_${Date.now()}`,
    ruleId: row.id,
    executionTime: timeStr,
    score: 0,
    passed: false,
    errorCount: 0,
    errorDetails: [],
    status: '运行中'
  }
  detectionResultStore.add(newResult)
  ElMessage.success('检测任务已提交，正在运行...')
  // 模拟延迟后更新为成功
  setTimeout(() => {
    const score = Math.round(60 + Math.random() * 38 + 2)
    detectionResultStore.update(newResult.id, {
      score,
      passed: score >= 70,
      errorCount: score >= 90 ? 0 : Math.floor(Math.random() * 5) + 1,
      status: '成功'
    })
  }, 1500)
}

// ── 详情抽屉 ──
const drawerVisible = ref(false)
const currentRule = ref(null)
const recentExecutions = computed(() => {
  if (!currentRule.value) return []
  const all = detectionResultStore.detectionResultList
    .filter(d => d.ruleId === currentRule.value.id)
  return all.sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime)).slice(0, 5)
})
const currentRuleDetailErrors = computed(() => {
  if (!currentRule.value) return []
  const all = detectionResultStore.detectionResultList.filter(d => d.ruleId === currentRule.value.id)
  const details = []
  all.forEach(d => {
    if (d.errorDetails && d.errorDetails.length > 0) {
      d.errorDetails.forEach(e => {
        if (typeof e === 'string') details.push(e)
        else if (e.detail) details.push(e.detail)
        else details.push(JSON.stringify(e))
      })
    }
  })
  return details
})

function viewDetail(row) {
  currentRule.value = row
  drawerVisible.value = true
}

// ── 辅助函数 ──
function getAssetName(assetId) {
  const asset = dataAssetStore.dataAssetList.find(a => a.id === assetId)
  return asset ? asset.name : '-'
}

function getRuleName(ruleId) {
  const rule = qualityRuleStore.qualityRuleList.find(r => r.id === ruleId)
  return rule ? rule.name : '-'
}

function scoreColor(score) {
  if (score > 80) return '#27AE60'
  if (score > 60) return '#F39C12'
  return '#E74C3C'
}

// ── 异常记录 ──
const recentAnomalies = computed(() => {
  const anomalies = detectionResultStore.detectionResultList.filter(
    d => d.errorCount > 0 || !d.passed
  )
  return anomalies.sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime)).slice(0, 10)
})
</script>

<style scoped lang="scss">
@use './QualityMonitor.scss' as *;
</style>