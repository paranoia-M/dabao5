<template>
  <div class="page-asset_profile">
    <!-- 顶部操作栏 -->
    <div class="top-actions">
      <el-button type="primary" @click="handleEdit" :disabled="asset.status==='已发布'">编辑</el-button>
      <el-button type="danger" @click="handleDelete" :disabled="asset.status!=='草稿'">删除</el-button>
      <el-button type="warning" @click="handleSubmitApproval" :disabled="asset.status==='待审核' || asset.status==='已发布'">提交审批</el-button>
      <el-button @click="handleExport" :loading="exporting">导出</el-button>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <el-card class="info-card" shadow="never">
          <h3>基础信息</h3>
          <div class="info-grid">
            <div class="info-item"><label>资产名称</label><span>{{ asset.name }}</span></div>
            <div class="info-item"><label>资产编码</label><span>{{ asset.code }}</span></div>
            <div class="info-item"><label>所属域</label><span>{{ asset.domain }}</span></div>
            <div class="info-item"><label>数据源类型</label><span>{{ asset.sourceType }}</span></div>
            <div class="info-item"><label>负责人</label><span>{{ ownerName }}</span></div>
            <div class="info-item"><label>状态</label><el-tag :type="statusTagType">{{ asset.status }}</el-tag></div>
            <div class="info-item full"><label>描述</label><span>{{ asset.description }}</span></div>
          </div>
        </el-card>

        <el-card class="export-card" shadow="never">
          <h3>最近导出</h3>
          <div v-if="recentExports.length===0" class="empty">暂无导出记录</div>
          <div v-for="rec in recentExports" :key="rec.id" class="export-item">
            <span class="file-name">{{ rec.fileName }}</span>
            <el-tag :type="rec.status==='完成'?'success':'warning'" size="small">{{ rec.status }}</el-tag>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <div class="lineage-section">
          <h3>数据资产血缘图</h3>
          <div class="lineage-container" ref="lineageContainer">
            <VueFlow
              :nodes="lineageNodes"
              :edges="lineageEdges"
              @node-click="onNodeClickHandler"
              @node-mouse-enter="onNodeEnterHandler"
              @node-mouse-leave="onNodeLeaveHandler"
              :fit-view-on-init="true"
            >
              <template #node-default="{ id, data, label, class: nodeClass }">
                <div
                  v-if="data"
                  :class="['flow-node', data.type, nodeClass]"
                  :style="{
                    width: data.width + 'px',
                    height: data.height + 'px',
                    backgroundColor: data.bgColor
                  }"
                >
                  <span>{{ label }}</span>
                </div>
              </template>
            </VueFlow>
          </div>
        </div>

        <div class="tabs-section">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="字段列表" name="fields">
              <div class="field-toolbar">
                <el-input
                  v-model="fieldSearch"
                  placeholder="搜索字段名"
                  clearable
                  style="width:200px"
                />
              </div>
              <el-table
                :data="filteredFields"
                stripe
                highlight-current-row
                @row-click="handleFieldRowClick"
                style="width:100%"
                max-height="220"
              >
                <el-table-column prop="fieldName" label="字段名" min-width="120" show-overflow-tooltip />
                <el-table-column prop="fieldType" label="类型" width="80" />
                <el-table-column prop="sensitivityLevel" label="敏感级别" width="100">
                  <template #default="scope">
                    <el-tag :type="sensitivityTagType(scope.row.sensitivityLevel)" size="small">
                      {{ scope.row.sensitivityLevel }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="scope">
                    <el-button link type="primary" size="small" @click.stop="handleFieldDetail(scope.row)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="质量评分" name="quality">
              <div class="quality-content">
                <div class="score-card">
                  <div class="score-value">{{ latestScore !== null ? latestScore : '-' }}</div>
                  <div class="score-label">最新评分</div>
                </div>
                <div class="sparkline-container">
                  <svg :width="sparklineWidth" :height="sparklineHeight" v-if="scoreHistory.length>1">
                    <polyline
                      :points="sparklinePoints"
                      fill="none"
                      stroke="#4B5563"
                      stroke-width="2"
                    />
                  </svg>
                  <span v-else>暂无足够评分数据</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑资产" width="min(640px,92vw)">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="资产名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="资产编码">
          <el-input :model-value="asset.code" disabled />
        </el-form-item>
        <el-form-item label="所属域" prop="domain">
          <el-select v-model="editForm.domain" placeholder="请选择" style="width:100%">
            <el-option label="客户域" value="客户域" />
            <el-option label="产品域" value="产品域" />
            <el-option label="订单域" value="订单域" />
            <el-option label="财务域" value="财务域" />
            <el-option label="供应链域" value="供应链域" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源类型" prop="sourceType">
          <el-select v-model="editForm.sourceType" placeholder="请选择" style="width:100%">
            <el-option label="数据库表" value="数据库表" />
            <el-option label="文件" value="文件" />
            <el-option label="API接口" value="API接口" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任人" prop="ownerId">
          <el-select v-model="editForm.ownerId" placeholder="请选择" style="width:100%">
            <el-option v-for="u in userList" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字段详情抽屉 -->
    <el-drawer v-model="fieldDetailVisible" title="字段详情" size="min(500px,85vw)" direction="rtl">
      <div class="field-detail-grid" v-if="currentField">
        <div class="detail-item"><label>字段名</label><span>{{ currentField.fieldName }}</span></div>
        <div class="detail-item"><label>类型</label><span>{{ currentField.fieldType }}</span></div>
        <div class="detail-item"><label>长度</label><span>{{ currentField.maxLength ?? '-' }}</span></div>
        <div class="detail-item"><label>精度</label><span>-</span></div>
        <div class="detail-item"><label>是否主键</label><span>{{ currentField.isPrimaryKey ? '是' : '否' }}</span></div>
        <div class="detail-item"><label>是否索引</label><span>-</span></div>
        <div class="detail-item"><label>默认值</label><span>-</span></div>
        <div class="detail-item"><label>描述</label><span>{{ currentField.description }}</span></div>
        <div class="detail-item"><label>敏感级别</label><span>{{ currentField.sensitivityLevel }}</span></div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VueFlow } from '@vue-flow/core'

import { useDataAssetStore } from '@/stores/dataAsset'
import { useDataAssetFieldStore } from '@/stores/dataAssetField'
import { useQualityRuleStore } from '@/stores/qualityRule'
import { useDetectionResultStore } from '@/stores/detectionResult'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useExportRecordStore } from '@/stores/exportRecord'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()

const assetStore = useDataAssetStore()
const fieldStore = useDataAssetFieldStore()
const qualityRuleStore = useQualityRuleStore()
const detectionResultStore = useDetectionResultStore()
const approvalRecordStore = useApprovalRecordStore()
const exportRecordStore = useExportRecordStore()
const userStore = useUserStore()

// ---- 主资产数据 ----
const assetId = computed(() => route.params.id || '')
const asset = computed(() => assetStore.findById(assetId.value) || {})

// 资产不存在处理（仅在 store 有数据但找不到该资产时跳转）
watch(
  () => assetStore.dataAssetList.length,
  () => {
    if (assetStore.dataAssetList.length > 0 && !asset.value.id) {
      ElMessage.error('资产不存在')
      router.push('/asset-catalog')
    }
  },
  { immediate: true }
)

const ownerName = computed(() => {
  if (!asset.value.ownerId) return '-'
  const user = userStore.findById(asset.value.ownerId)
  return user ? user.realName : '-'
})

const statusTagType = computed(() => {
  const map = { 草稿: 'info', 待审核: 'warning', 已发布: 'success', 已下架: 'danger' }
  return map[asset.value.status] || 'info'
})

const userList = computed(() => userStore.userList)

// ---- 字段列表 ----
const fields = computed(() => fieldStore.dataAssetFieldList.filter((f) => f.assetId === assetId.value))
const fieldSearch = ref('')
const filteredFields = computed(() => {
  if (!fieldSearch.value) return fields.value
  return fields.value.filter((f) => f.fieldName.toLowerCase().includes(fieldSearch.value.toLowerCase()))
})

function handleFieldSearch() {
  // 搜索已通过 computed 实时响应
}

// ---- 编辑弹窗 ----
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({ name: '', domain: '', sourceType: '', ownerId: '', description: '' })
const editRules = {
  name: [{ required: true, message: '必填字段不能为空', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择所属域' }],
  sourceType: [{ required: true, message: '请选择数据源类型' }],
  ownerId: [{ required: true, message: '请选择责任人' }]
}

function handleEdit() {
  if (asset.value.status === '已发布') {
    ElMessage.warning('已发布资产禁止编辑，请先取消发布')
    return
  }
  editForm.value = {
    name: asset.value.name,
    domain: asset.value.domain,
    sourceType: asset.value.sourceType,
    ownerId: asset.value.ownerId,
    description: asset.value.description
  }
  editDialogVisible.value = true
}

async function handleEditSave() {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  // 检查名称唯一性（排除自身）
  const exist = assetStore.dataAssetList.find((a) => a.name === editForm.value.name && a.id !== assetId.value)
  if (exist) {
    ElMessage.error('名称已存在')
    return
  }
  assetStore.update(assetId.value, editForm.value)
  ElMessage.success('保存成功')
  editDialogVisible.value = false
}

// ---- 删除 ----
async function handleDelete() {
  // 检查是否有运行中的关联任务（此处简化，假设无）
  try {
    await ElMessageBox.confirm('确认删除该资产？删除后不可恢复', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    assetStore.remove(assetId.value)
    ElMessage.success('删除成功')
    router.push('/asset-catalog')
  } catch {
    // cancelled
  }
}

// ---- 提交审批 ----
function handleSubmitApproval() {
  if (asset.value.status === '待审核') {
    ElMessage.warning('审批中不可重复提交')
    return
  }
  ElMessageBox.confirm('确认提交资产发布审批？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
    .then(() => {
      assetStore.update(assetId.value, { status: '待审核' })
      ElMessage.success('审批已提交，等待审核')
    })
    .catch(() => {})
}

// ---- 导出 ----
const exporting = ref(false)
function handleExport() {
  exporting.value = true
  setTimeout(() => {
    exportRecordStore.add({
      id: 'export_' + Date.now(),
      userId: 'user_1000',
      module: '数据资产',
      fileName: asset.value.name + '_元数据.xlsx',
      fileSize: Math.floor(Math.random() * 500000) + 50000,
      status: '完成',
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    ElMessage.success('导出成功，请查看导出记录')
    exporting.value = false
  }, 1000)
}

const recentExports = computed(() => {
  return exportRecordStore.exportRecordList.slice(-3).reverse()
})

// ---- 质量评分 ----
const qualityRules = computed(() => qualityRuleStore.qualityRuleList.filter((r) => r.targetAssetId === assetId.value))
const ruleIds = computed(() => qualityRules.value.map((r) => r.id))
const detectionResults = computed(() =>
  detectionResultStore.detectionResultList.filter((d) => ruleIds.value.includes(d.ruleId))
)
const sortedResults = computed(() =>
  detectionResults.value.slice().sort((a, b) => new Date(a.executionTime) - new Date(b.executionTime))
)
const latestScore = computed(() => {
  if (sortedResults.value.length === 0) return null
  return sortedResults.value[sortedResults.value.length - 1].score
})

const sparklineWidth = 200
const sparklineHeight = 50
const scoreHistory = computed(() => sortedResults.value.map((d) => d.score))
const sparklinePoints = computed(() => {
  if (scoreHistory.value.length < 2) return ''
  const scores = scoreHistory.value
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const range = max - min || 1
  const stepX = sparklineWidth / (scores.length - 1)
  return scores
    .map((s, i) => {
      const x = i * stepX
      const y = sparklineHeight - ((s - min) / range) * (sparklineHeight - 10) - 5
      return `${x},${y}`
    })
    .join(' ')
})

// ---- 字段详情抽屉 ----
const fieldDetailVisible = ref(false)
const currentField = ref(null)

function handleFieldDetail(row) {
  currentField.value = row
  fieldDetailVisible.value = true
}

function handleFieldRowClick(row) {
  handleFieldDetail(row)
}

function sensitivityTagType(level) {
  const map = { 公开: 'info', 内部: 'primary', 敏感: 'warning', 机密: 'danger' }
  return map[level] || 'info'
}

// ---- 血缘图 ----
const lineageNodes = ref([])
const lineageEdges = ref([])
const lineageContainer = ref(null)
const activeTab = ref('fields')

function statusToColor(status) {
  const map = { 草稿: '#d9d9d9', 待审核: '#faad14', 已发布: '#52c41a', 已下架: '#ff4d4f' }
  return map[status] || '#ccc'
}

function sensitivityToColor(level) {
  const map = { 公开: '#e6f7ff', 内部: '#bae7ff', 敏感: '#ffd591', 机密: '#ffa39e' }
  return map[level] || '#e6f7ff'
}

function buildLineage() {
  if (!asset.value.id) return
  const fList = fields.value
  const assetNode = {
    id: asset.value.id,
    type: 'default',
    label: asset.value.name,
    position: { x: 200, y: 100 },
    data: {
      type: 'asset',
      width: 120 + fList.length * 5,
      height: 60,
      bgColor: statusToColor(asset.value.status)
    },
    class: ''
  }
  const fieldNodes = fList.map((f, i) => ({
    id: f.id,
    type: 'default',
    label: f.fieldName,
    position: { x: 50 + (i % 4) * 120, y: 200 + Math.floor(i / 4) * 60 },
    data: {
      type: 'field',
      width: 100,
      height: 40,
      bgColor: sensitivityToColor(f.sensitivityLevel)
    },
    class: ''
  }))
  const edgeList = fList.map((f) => ({
    id: `e-${asset.value.id}-${f.id}`,
    source: asset.value.id,
    target: f.id,
    animated: false,
    markerEnd: { type: 'arrowclosed' }
  }))
  lineageNodes.value = [assetNode, ...fieldNodes]
  lineageEdges.value = edgeList
  nextTick(() => {
    // 触发 fitView（但 VueFlow 有 fit-view-on-init 会自动做）
  })
}

function clearNodeClasses() {
  lineageNodes.value.forEach((n) => {
    n.class = ''
  })
}

function onNodeClickHandler({ node }) {
  if (!node?.data) return
  if (node.data.type === 'asset' && node.id !== assetId.value) {
    router.push(`/asset-profile/${node.id}`)
  } else if (node.data.type === 'field') {
    const field = fieldStore.findById(node.id)
    if (field) handleFieldDetail(field)
  }
}

function onNodeEnterHandler({ node }) {
  if (!node?.data) return
  clearNodeClasses()
  node.class = 'hovered'
  if (node.data.type === 'asset') {
    lineageNodes.value.forEach((n) => {
      if (
        n.data && n.data.type === 'field' &&
        lineageEdges.value.some((e) => e.source === node.id && e.target === n.id)
      ) {
        n.class = 'highlight'
      }
    })
  } else if (node.data.type === 'field') {
    const edge = lineageEdges.value.find((e) => e.target === node.id)
    if (edge) {
      const assetNode = lineageNodes.value.find((n) => n.id === edge.source)
      if (assetNode) assetNode.class = 'highlight'
    }
  }
}

function onNodeLeaveHandler() {
  clearNodeClasses()
}

onMounted(() => {
  buildLineage()
})

watch(asset, () => {
  buildLineage()
})
</script>

<style scoped lang="scss">
@use './AssetProfile.scss' as *;
</style>