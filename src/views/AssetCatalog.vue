<template>
  <div class="page-asset_catalog">
    <!-- 顶部横幅：标题 + 操作按钮 -->
    <div class="catalog-header">
      <div class="header-left">
        <h2 class="page-title">数据资产目录</h2>
        <span class="header-subtitle">管理与维护所有已注册数据资产</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>新增资产
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-form :inline="true" label-width="80px">
        <el-form-item label="关键词">
          <el-input
            v-model="keyword"
            placeholder="资产名称/编码"
            clearable
            style="width:200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="statusFilter"
            multiple
            placeholder="全选"
            clearable
            style="width:150px"
          >
            <el-option label="草稿" value="草稿" />
            <el-option label="待审核" value="待审核" />
            <el-option label="已发布" value="已发布" />
            <el-option label="已下架" value="已下架" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="typeFilter"
            multiple
            placeholder="全选"
            clearable
            style="width:150px"
          >
            <el-option label="数据库表" value="数据库表" />
            <el-option label="文件" value="文件" />
            <el-option label="API接口" value="API接口" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务域">
          <el-select
            v-model="domainFilter"
            placeholder="全部"
            clearable
            style="width:150px"
          >
            <el-option
              v-for="d in domainOptions"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 主舞台：数据资产血缘图 + 列表 -->
    <div class="main-stage">
      <!-- 数据资产血缘图（招牌业务积木） -->
      <div class="blood-graph">
        <svg
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          class="blood-svg"
          @click="svgClick"
        >
          <g v-for="(node, idx) in graphNodes" :key="node.id">
            <circle
              :cx="node.x"
              :cy="node.y"
              :r="node.r"
              :fill="node.color"
              :opacity="hoverNodeId && hoverNodeId !== node.id ? 0.4 : 0.9"
              :stroke="node.id === clickNodeId ? '#0D9488' : 'none'"
              :stroke-width="node.id === clickNodeId ? 3 : 0"
              class="blood-node"
              @mouseenter="hoverNodeId = node.id"
              @mouseleave="hoverNodeId = null"
              @click.stop="selectNode(node)"
            />
            <text
              :x="node.x"
              :y="node.y"
              text-anchor="middle"
              :dy="4"
              font-size="11"
              fill="#fff"
              pointer-events="none"
            >
              {{ node.name.length > 6 ? node.name.slice(0,6)+'...' : node.name }}
            </text>
            <text
              v-if="node.fieldCount > 0"
              :x="node.x"
              :y="node.y - node.r - 6"
              text-anchor="middle"
              font-size="10"
              fill="#aaa"
            >
              {{ node.fieldCount }} 字段
            </text>
          </g>
          <!-- 当无节点时显示提示 -->
          <text
            v-if="graphNodes.length === 0"
            x="50%"
            y="50%"
            text-anchor="middle"
            fill="#999"
          >
            暂无资产数据
          </text>
        </svg>
        <div class="graph-legend">
          <span
            v-for="s in statusOptions"
            :key="s"
            class="legend-item"
            :style="{ background: statusColor[s], color: '#fff' }"
          >
            {{ s }}
          </span>
        </div>
      </div>

      <!-- 资产明细列表 -->
      <div class="asset-table-wrapper">
        <el-table
          :data="filteredList"
          stripe
          border
          style="width:100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="name" label="资产名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="code" label="资产编码" min-width="120" show-overflow-tooltip />
          <el-table-column prop="sourceType" label="类型" width="90" />
          <el-table-column prop="domain" label="业务域" width="100" />
          <el-table-column label="负责人" width="100">
            <template #default="{ row }">
              {{ getUserName(row.ownerId) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="viewDetail(row)">
                详情
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="row.status === '已发布'"
                @click.stop="openEditDialog(row)"
              >
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click.stop="confirmDelete(row)">
                删除
              </el-button>
              <el-button link type="warning" size="small" @click.stop="handleAssign(row)">
                分配
              </el-button>
              <!-- 状态流转 -->
              <template v-if="row.status === '草稿'">
                <el-button link type="success" size="small" @click.stop="submitReview(row)">
                  提交审核
                </el-button>
              </template>
              <template v-if="row.status === '待审核'">
                <el-button link type="success" size="small" @click.stop="approve(row)">
                  批准
                </el-button>
                <el-button link type="danger" size="small" @click.stop="reject(row)">
                  驳回
                </el-button>
              </template>
              <template v-if="row.status === '已发布'">
                <el-button link type="info" size="small" @click.stop="archive(row)">
                  归档
                </el-button>
                <el-button link type="warning" size="small" @click.stop="withdraw(row)">
                  撤回
                </el-button>
              </template>
              <!-- 收藏 -->
              <el-button
                link
                :type="isFavorite(row.id) ? 'warning' : 'info'"
                size="small"
                @click.stop="toggleFavorite(row)"
              >
                <el-icon>
                  <Star v-if="isFavorite(row.id)" />
                  <StarFilled v-else />
                </el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogType === 'add' ? '新增资产' : '编辑资产'"
      v-model="dialogVisible"
      width="min(540px, 92vw)"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        style="padding-right:16px"
      >
        <el-form-item label="资产名称" prop="name">
          <el-input
            v-model="formData.name"
            maxlength="60"
            placeholder="请输入资产名称"
          />
        </el-form-item>
        <el-form-item label="资产编码" prop="code">
          <el-input
            v-model="formData.code"
            :disabled="dialogType === 'edit'"
            placeholder="请输入资产编码"
          />
        </el-form-item>
        <el-form-item label="资产类型" prop="sourceType">
          <el-select v-model="formData.sourceType" placeholder="请选择类型" style="width:100%">
            <el-option label="数据库表" value="数据库表" />
            <el-option label="文件" value="文件" />
            <el-option label="API接口" value="API接口" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属业务域" prop="domain">
          <el-select v-model="formData.domain" placeholder="请选择业务域" style="width:100%">
            <el-option
              v-for="d in domainOptions"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="ownerId">
          <el-select v-model="formData.ownerId" placeholder="请选择负责人" style="width:100%">
            <el-option
              v-for="user in userStore.userList"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="可选填"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmForm">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配负责人弹窗 -->
    <el-dialog
      title="分配负责人"
      v-model="assignVisible"
      width="400px"
    >
      <el-select
        v-model="assignUserId"
        placeholder="请选择负责人"
        style="width:100%"
      >
        <el-option
          v-for="user in userStore.userList"
          :key="user.id"
          :label="user.realName"
          :value="user.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="资产详情"
      size="min(600px, 85vw)"
      direction="rtl"
    >
      <template v-if="selectedAsset.id">
        <div style="margin-bottom:16px">
          <el-button type="primary" link @click="router.push(`/asset-profile/${selectedAsset.id}`)">
            查看完整详情页
          </el-button>
        </div>
        <div class="detail-grid">
          <div class="detail-field">
            <span class="label">资产名称</span>
            <span class="value">{{ selectedAsset.name }}</span>
          </div>
          <div class="detail-field">
            <span class="label">资产编码</span>
            <span class="value">{{ selectedAsset.code }}</span>
          </div>
          <div class="detail-field">
            <span class="label">类型</span>
            <span class="value">{{ selectedAsset.sourceType }}</span>
          </div>
          <div class="detail-field">
            <span class="label">业务域</span>
            <span class="value">{{ selectedAsset.domain }}</span>
          </div>
          <div class="detail-field">
            <span class="label">负责人</span>
            <span class="value">{{ getUserName(selectedAsset.ownerId) }}</span>
          </div>
          <div class="detail-field">
            <span class="label">状态</span>
            <span class="value">
              <el-tag :type="statusTag(selectedAsset.status)" size="small">
                {{ selectedAsset.status }}
              </el-tag>
            </span>
          </div>
          <div class="detail-field">
            <span class="label">字段数量</span>
            <span class="value">{{ fieldCount(selectedAsset.id) }}</span>
          </div>
          <div class="detail-field">
            <span class="label">描述</span>
            <span class="value">{{ selectedAsset.description || '—' }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-tabs">
          <el-tabs>
            <el-tab-pane label="关联质量规则">
              <el-table :data="relatedRules" empty-text="暂无关联规则" size="small">
                <el-table-column prop="name" label="规则名称" />
                <el-table-column prop="ruleType" label="类型" width="80" />
                <el-table-column prop="status" label="状态" width="80" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="关联集成任务">
              <el-table :data="relatedTasks" empty-text="暂无关联任务" size="small">
                <el-table-column prop="name" label="任务名称" />
                <el-table-column prop="taskType" label="类型" width="100" />
                <el-table-column prop="status" label="状态" width="80" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="关联服务接口">
              <el-table :data="relatedApis" empty-text="暂无关联接口" size="small">
                <el-table-column prop="name" label="接口名称" />
                <el-table-column prop="path" label="路径" />
                <el-table-column prop="method" label="方法" width="80" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
      <template #empty>
        <el-empty description="请选择资产" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Star, StarFilled } from '@element-plus/icons-vue'
import { useDataAssetStore } from '@/stores/dataAsset'
import { useDataAssetFieldStore } from '@/stores/dataAssetField'
import { useDataAssetFavoriteStore } from '@/stores/dataAssetFavorite'
import { useQualityRuleStore } from '@/stores/qualityRule'
import { useUserStore } from '@/stores/user'
import { useExportRecordStore } from '@/stores/exportRecord'
import { useIntegrationPlanStore } from '@/stores/integrationPlan'
import { useApiDefinitionStore } from '@/stores/apiDefinition'

// stores
const router = useRouter()
const assetStore = useDataAssetStore()
const fieldStore = useDataAssetFieldStore()
const favoriteStore = useDataAssetFavoriteStore()
const qualityRuleStore = useQualityRuleStore()
const userStore = useUserStore()
const exportRecordStore = useExportRecordStore()
const integrationPlanStore = useIntegrationPlanStore()
const apiDefStore = useApiDefinitionStore()

// 当前用户（假设取第一个用户）
const currentUserId = computed(() => userStore.userList[0]?.id || 'user_1000')

// 可用业务域列表（从种子中提取）
const domainOptions = computed(() => {
  const domains = new Set(assetStore.dataAssetList.map(a => a.domain).filter(Boolean))
  return [...domains]
})

// 状态选项
const statusOptions = ['草稿', '待审核', '已发布', '已下架']
const statusColor = {
  '草稿': '#909399',
  '待审核': '#E6A23C',
  '已发布': '#67C23A',
  '已下架': '#F56C6C'
}
const statusTag = (s) => {
  const map = { '草稿': 'info', '待审核': 'warning', '已发布': 'success', '已下架': 'danger' }
  return map[s] || 'info'
}

// 筛选
const keyword = ref('')
const statusFilter = ref([])
const typeFilter = ref([])
const domainFilter = ref('')
const triggerSearch = ref(0)

function handleSearch() {
  triggerSearch.value++
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = []
  typeFilter.value = []
  domainFilter.value = ''
  triggerSearch.value++
}

const filteredList = computed(() => {
  // 强制依赖 triggerSearch 以响应重置
  // 其实 computed 会响应所有 ref，但为逻辑清晰
  const _ = triggerSearch.value
  let list = assetStore.dataAssetList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(kw) || a.code.toLowerCase().includes(kw))
  }
  if (statusFilter.value.length) {
    list = list.filter(a => statusFilter.value.includes(a.status))
  }
  if (typeFilter.value.length) {
    list = list.filter(a => typeFilter.value.includes(a.sourceType))
  }
  if (domainFilter.value) {
    list = list.filter(a => a.domain === domainFilter.value)
  }
  return list
})

// 血缘图相关
const svgWidth = 800
const svgHeight = 400
const hoverNodeId = ref(null)
const clickNodeId = ref(null)

const graphNodes = computed(() => {
  const list = filteredList.value.length ? filteredList.value : assetStore.dataAssetList.slice(0, 10)
  const fieldCounts = {}
  fieldStore.dataAssetFieldList.forEach(f => {
    fieldCounts[f.assetId] = (fieldCounts[f.assetId] || 0) + 1
  })
  const total = list.length
  const radius = Math.min(svgWidth / (total + 1), 80)
  const nodeRadius = (id) => {
    const count = fieldCounts[id] || 0
    return Math.min(20 + count * 5, 60)
  }
  const nodes = list.map((a, i) => {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2
    const cx = svgWidth / 2 + (svgWidth / 2 - 80) * Math.cos(angle)
    const cy = svgHeight / 2 + (svgHeight / 2 - 60) * Math.sin(angle)
    return {
      id: a.id,
      name: a.name,
      x: cx,
      y: cy,
      r: nodeRadius(a.id),
      color: statusColor[a.status] || '#909399',
      fieldCount: fieldCounts[a.id] || 0
    }
  })
  return nodes
})

function selectNode(node) {
  clickNodeId.value = node.id
  const asset = assetStore.dataAssetList.find(a => a.id === node.id)
  if (asset) {
    selectedAsset.value = asset
    detailVisible.value = true
  }
}

function svgClick() {
  // 点击空白取消选中
  clickNodeId.value = null
}

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogType = ref('add')
const editingAssetId = ref(null)
const formRef = ref(null)
const submitting = ref(false)
const formData = ref({
  name: '',
  code: '',
  sourceType: '',
  domain: '',
  ownerId: '',
  description: ''
})
const formRules = {
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入资产编码', trigger: 'blur' }],
  sourceType: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
  domain: [{ required: true, message: '请选择业务域', trigger: 'change' }],
  ownerId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

function openAddDialog() {
  dialogType.value = 'add'
  editingAssetId.value = null
  formData.value = { name: '', code: '', sourceType: '', domain: '', ownerId: '', description: '' }
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogType.value = 'edit'
  editingAssetId.value = row.id
  formData.value = {
    name: row.name,
    code: row.code,
    sourceType: row.sourceType,
    domain: row.domain,
    ownerId: row.ownerId,
    description: row.description
  }
  dialogVisible.value = true
}

function confirmForm() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      // 检查唯一性（名称或编码重复）
      const exist = assetStore.dataAssetList.find(a => {
        if (editingAssetId.value && a.id === editingAssetId.value) return false
        return (a.name === formData.value.name || a.code === formData.value.code)
      })
      if (exist) {
        ElMessage.error('资产名称/编码重复，请重新输入')
        return
      }
      if (dialogType.value === 'add') {
        assetStore.add({
          id: 'dataasset_' + Date.now(),
          name: formData.value.name,
          code: formData.value.code,
          sourceType: formData.value.sourceType,
          domain: formData.value.domain,
          ownerId: formData.value.ownerId,
          status: '草稿',
          description: formData.value.description
        })
        ElMessage.success('新增成功')
      } else {
        assetStore.update(editingAssetId.value, {
          name: formData.value.name,
          sourceType: formData.value.sourceType,
          domain: formData.value.domain,
          ownerId: formData.value.ownerId,
          description: formData.value.description,
          status: '草稿' // 修改后状态变为待发布（这里用草稿对应）
        })
        ElMessage.success('编辑成功')
      }
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  })
}

// 删除
function confirmDelete(row) {
  // 检查关联质量规则
  const relatedRules = qualityRuleStore.qualityRuleList.filter(r => r.targetAssetId === row.id)
  let msg = '确定删除该资产吗？此操作不可撤销。'
  if (relatedRules.length > 0) {
    msg = `该资产存在 ${relatedRules.length} 条关联质量规则，删除后规则将失效。确定删除吗？`
  }
  ElMessageBox.confirm(msg, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    assetStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 分配负责人
const assignVisible = ref(false)
const assignAssetId = ref(null)
const assignUserId = ref('')
function handleAssign(row) {
  assignAssetId.value = row.id
  assignUserId.value = row.ownerId || ''
  assignVisible.value = true
}
function confirmAssign() {
  if (!assignUserId.value) {
    ElMessage.warning('请选择负责人')
    return
  }
  assetStore.update(assignAssetId.value, { ownerId: assignUserId.value })
  ElMessage.success('负责人已更新')
  assignVisible.value = false
}

// 收藏
function isFavorite(assetId) {
  return favoriteStore.favoriteList.some(f => f.userId === currentUserId.value && f.assetId === assetId)
}
function toggleFavorite(row) {
  const existing = favoriteStore.favoriteList.find(f => f.userId === currentUserId.value && f.assetId === row.id)
  if (existing) {
    favoriteStore.remove(existing.id)
    ElMessage.success('已取消收藏')
  } else {
    favoriteStore.add({
      id: 'dataassetfavorite_' + Date.now(),
      userId: currentUserId.value,
      assetId: row.id,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    ElMessage.success('收藏成功')
  }
}

// 状态流转
function submitReview(row) {
  assetStore.update(row.id, { status: '待审核' })
  ElMessage.success('已提交审核')
}
function approve(row) {
  assetStore.update(row.id, { status: '已发布' })
  ElMessage.success('审核通过，已发布')
}
function reject(row) {
  assetStore.update(row.id, { status: '草稿' })
  ElMessage.success('已驳回，状态回退至草稿')
}
function archive(row) {
  // 检查是否关联服务接口（已发布且关联API）
  const relatedApis = apiDefStore.apiDefinitionList.filter(api => {
    // 简化：检查描述是否包含资产id？无直接关联，跳过检查
    return false
  })
  if (relatedApis.length > 0) {
    ElMessage.error('该资产已关联服务接口，请先解除关联')
    return
  }
  assetStore.update(row.id, { status: '已下架' })
  ElMessage.success('已归档')
}
function withdraw(row) {
  assetStore.update(row.id, { status: '草稿' })
  ElMessage.success('已撤回，状态回退至草稿')
}

// 导出
function handleExport() {
  const fileName = `数据资产目录_${new Date().toISOString().slice(0,10)}.xlsx`
  exportRecordStore.add({
    id: 'exportrecord_' + Date.now(),
    userId: currentUserId.value,
    module: '数据资产',
    fileName,
    fileSize: 0,
    status: '生成中',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  // 模拟完成
  setTimeout(() => {
    const newRecord = exportRecordStore.exportRecordList.find(r => r.fileName === fileName)
    if (newRecord) {
      exportRecordStore.update(newRecord.id, { status: '完成', fileSize: Math.floor(Math.random() * 50000 + 10000) })
    }
    ElMessage.success('导出申请已提交，文件生成中')
  }, 1500)
  ElMessage.success('正在导出...')
}

// 详情抽屉
const detailVisible = ref(false)
const selectedAsset = ref({})
function viewDetail(row) {
  selectedAsset.value = row
  detailVisible.value = true
}

function fieldCount(assetId) {
  return fieldStore.dataAssetFieldList.filter(f => f.assetId === assetId).length
}

const relatedRules = computed(() => {
  if (!selectedAsset.value.id) return []
  return qualityRuleStore.qualityRuleList.filter(r => r.targetAssetId === selectedAsset.value.id)
})
const relatedTasks = computed(() => {
  // 集成计划没有直接关联资产字段，这里简化返回空
  return []
})
const relatedApis = computed(() => {
  // API定义没有直接关联资产字段，返回空
  return []
})

function getUserName(ownerId) {
  if (!ownerId) return '—'
  const user = userStore.userList.find(u => u.id === ownerId)
  return user ? user.realName : '未知'
}

// 表格行点击打开详情
function handleRowClick(row) {
  viewDetail(row)
}
</script>

<style scoped lang="scss">
@use './AssetCatalog.scss' as *;
</style>