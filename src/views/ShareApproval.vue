<template>
  <div class="page-share_approval">
    <!-- 顶部统计卡片 -->
    <div class="approval-header">
      <div class="stat-card">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待审批</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ approvedCount }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ rejectedCount }}</div>
        <div class="stat-label">已驳回</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ passRate }}</div>
        <div class="stat-label">通过率</div>
      </div>
    </div>

    <!-- 筛选行 -->
    <div class="approval-filter">
      <el-input v-model="searchKeyword" placeholder="搜索模型名称/申请人" clearable style="width:220px" @input="handleSearch" />
      <el-select v-model="filterStatus" style="width:140px;margin-left:12px">
        <el-option label="全部" value="全部" />
        <el-option label="待审批" value="待审批" />
        <el-option label="已通过" value="已通过" />
        <el-option label="已驳回" value="已驳回" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="申请开始日期"
        end-placeholder="申请结束日期"
        style="width:260px;margin-left:12px"
        value-format="YYYY-MM-DD"
        @change="handleDateRangeChange"
      />
      <el-button type="primary" style="margin-left:12px" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <div class="approval-batch">
        <el-button type="warning" :disabled="batchSelected.length===0" @click="openBatchApprove">批量审批</el-button>
      </div>
    </div>

    <!-- 主体：左侧主舞台 + 右侧列表 -->
    <div class="approval-body">
      <!-- 左侧：审批流程链 + 请求详情 -->
      <div class="approval-main">
        <div class="approval-chain">
          <div class="chain-title">审批流程</div>
          <!-- SVG 流程链 -->
          <svg viewBox="0 0 500 120" class="chain-svg">
            <!-- 连接线 -->
            <line x1="160" y1="60" x2="240" y2="60" :stroke="linkLineColor1" stroke-width="3" marker-end="url(#arrow1)" />
            <line x1="310" y1="60" x2="390" y2="60" :stroke="linkLineColor2" stroke-width="3" marker-end="url(#arrow2)" />
            <defs>
              <marker id="arrow1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path :d="`M0,0 L8,3 L0,6 Z`" :fill="linkLineColor1" />
              </marker>
              <marker id="arrow2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path :d="`M0,0 L8,3 L0,6 Z`" :fill="linkLineColor2" />
              </marker>
            </defs>
            <!-- 申请节点 -->
            <rect x="40" y="35" width="120" height="50" rx="8" :fill="nodeColor1" stroke="#ccc" stroke-width="1" />
            <text x="100" y="65" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">申请提交</text>
            <!-- 审批节点 -->
            <rect x="240" y="35" width="120" height="50" rx="8" :fill="nodeColor2" stroke="#ccc" stroke-width="1" />
            <text x="300" y="65" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">审批处理</text>
            <!-- 结果节点 -->
            <rect x="390" y="20" width="100" height="80" rx="12" :fill="nodeColor3" stroke="#ccc" stroke-width="1" />
            <text x="440" y="60" text-anchor="middle" fill="#fff" font-size="14" font-weight="600" v-if="currentRequest.status === '已通过'">已通过</text>
            <text x="440" y="60" text-anchor="middle" fill="#fff" font-size="14" font-weight="600" v-else-if="currentRequest.status === '已驳回'">已驳回</text>
            <text x="440" y="60" text-anchor="middle" fill="#999" font-size="14" font-weight="600" v-else>待结果</text>
          </svg>
        </div>
        <!-- 请求详情卡片 -->
        <div class="approval-detail" v-if="currentRequest.id">
          <div class="detail-header">请求详情</div>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">模型名称</span><span class="value">{{ modelName }}</span></div>
            <div class="detail-item"><span class="label">版本</span><span class="value">{{ modelVersion }}</span></div>
            <div class="detail-item"><span class="label">申请人</span><span class="value">{{ currentRequest.applicantName }}</span></div>
            <div class="detail-item"><span class="label">申请理由</span><span class="value">{{ currentRequest.reason }}</span></div>
            <div class="detail-item"><span class="label">创建时间</span><span class="value">{{ currentRequest.createdAt }}</span></div>
          </div>
        </div>
        <el-empty description="选择一条请求查看详情" v-else />
      </div>

      <!-- 右侧：待审批列表 -->
      <div class="approval-list">
        <div class="list-title">请求列表</div>
        <el-table
          :data="filteredList"
          border
          stripe
          highlight-current-row
          style="width:100%"
          height="calc(100% - 50px)"
          @selection-change="batchSelected = $event"
          @row-click="handleRowClick"
          :default-sort="{prop:'createdAt',order:'descending'}"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column type="index" label="序号" width="50" />
          <el-table-column prop="modelName" label="模型资产名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="version" label="版本" width="60" />
          <el-table-column prop="applicantName" label="申请人" width="80" />
          <el-table-column label="部门" width="80">
            <template #default="{row}">
              <span>{{ row.department || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" width="160" sortable />
          <el-table-column label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{row}">
              <el-button link type="primary" size="small" @click.stop="handleDetail(row)">详情</el-button>
              <el-button
                link
                type="success"
                size="small"
                :disabled="row.status !== '待审批'"
                @click.stop="openApprove(row)"
              >审批</el-button>
              <el-button
                v-if="currentUserRole === '管理员'"
                link
                type="danger"
                size="small"
                :disabled="row.status !== '待审批'"
                @click.stop="handleDelete(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:currentPage="currentPage"
          :page-size="pageSize"
          :total="filteredList.length"
          layout="prev, pager, next, total"
          background
          style="margin-top:10px;text-align:right"
        />
      </div>
    </div>

    <!-- 底部审批历史时间轴 -->
    <div class="approval-footer">
      <div class="footer-title">最近审批记录</div>
      <div class="timeline" v-if="recentRecords.length">
        <div class="timeline-item" v-for="rec in recentRecords" :key="rec.id">
          <div class="timeline-dot" :style="{ background: rec.action === '通过' ? 'var(--page-primary, #EA580C)' : '#dc3545' }"></div>
          <div class="timeline-content">
            <div class="timeline-title">{{ rec.action }} · {{ rec.approverId }}</div>
            <div class="timeline-comment">{{ rec.comment || '无备注' }}</div>
            <div class="timeline-time">{{ rec.createdAt }}</div>
          </div>
        </div>
      </div>
      <el-empty description="暂无审批记录" v-else />
    </div>

    <!-- 审批操作弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="审批操作" width="min(480px,90vw)" draggable>
      <el-form label-position="top">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveResult">
            <el-radio label="通过">通过</el-radio>
            <el-radio label="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approveComment"
            type="textarea"
            :rows="3"
            :placeholder="approveResult === '驳回' ? '驳回时请输入审批意见（必填）' : '选填'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量审批弹窗 -->
    <el-dialog v-model="batchApproveDialogVisible" title="批量审批" width="min(600px,90vw)" draggable>
      <div class="batch-summary">
        <div class="batch-count">已选 <strong>{{ batchSelected.length }}</strong> 条请求</div>
        <el-table :data="batchSelected" style="width:100%" max-height="200">
          <el-table-column prop="applicantName" label="申请人" width="80" />
          <el-table-column prop="modelName" label="模型" min-width="120" />
          <el-table-column prop="reason" label="申请理由" min-width="140" show-overflow-tooltip />
        </el-table>
      </div>
      <el-form label-position="top" style="margin-top:12px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="batchApproveResult">
            <el-radio label="通过">全部通过</el-radio>
            <el-radio label="驳回">全部驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统一审批意见">
          <el-input
            v-model="batchApproveComment"
            type="textarea"
            :rows="3"
            :placeholder="batchApproveResult === '驳回' ? '驳回时请输入审批意见（必填）' : '选填'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchApproveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchApprove">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="请求详情" size="min(520px,85vw)" direction="rtl">
      <template #default>
        <div v-if="detailRequest" class="drawer-content">
          <div class="drawer-section">
            <div class="section-title">基本信息</div>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">资产名称</span><span class="value">{{ detailModelName }}</span></div>
              <div class="detail-item"><span class="label">资产类型</span><span class="value">{{ detailModelCategory }}</span></div>
              <div class="detail-item"><span class="label">版本</span><span class="value">{{ detailModelVersion }}</span></div>
              <div class="detail-item"><span class="label">申请人</span><span class="value">{{ detailRequest.applicantName }}</span></div>
              <div class="detail-item"><span class="label">申请理由</span><span class="value">{{ detailRequest.reason }}</span></div>
              <div class="detail-item"><span class="label">附件</span><span class="value">无</span></div>
            </div>
          </div>
          <div class="drawer-section" v-if="detailApprovalRecords.length">
            <div class="section-title">审批历史</div>
            <div v-for="rec in detailApprovalRecords" :key="rec.id" class="history-item">
              <div class="history-result">
                <el-tag :type="rec.action === '通过' ? 'success' : 'danger'" size="small">{{ rec.action }}</el-tag>
              </div>
              <div class="history-info">
                <div>审批人：{{ rec.approverId }}</div>
                <div>意见：{{ rec.comment || '无' }}</div>
                <div>时间：{{ rec.createdAt }}</div>
              </div>
            </div>
          </div>
          <el-empty description="暂无审批历史" v-else />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useShareRequestStore } from '@/stores/shareRequest'
import { useModelStore } from '@/stores/model'
import { useModelVersionStore } from '@/stores/modelVersion'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useTeamMemberStore } from '@/stores/teamMember'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { ElMessage, ElMessageBox } from 'element-plus'

const shareRequestStore = useShareRequestStore()
const modelStore = useModelStore()
const versionStore = useModelVersionStore()
const approvalRecordStore = useApprovalRecordStore()
const teamMemberStore = useTeamMemberStore()
const categoryStore = useModelCategoryStore()

const currentUserRole = ref('管理员')

// 筛选
const searchKeyword = ref('')
const filterStatus = ref('待审批')
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 选中
const selectedRequestId = ref(null)
const batchSelected = ref([])

// 弹窗控制
const approveDialogVisible = ref(false)
const batchApproveDialogVisible = ref(false)
const detailDrawerVisible = ref(false)

// 当前审批的请求
const currentRequestForApprove = ref(null)
const approveResult = ref('通过')
const approveComment = ref('')

const batchApproveResult = ref('通过')
const batchApproveComment = ref('')

const detailRequest = ref(null)

// 计算 filteredList
const filteredList = computed(() => {
  let list = shareRequestStore.shareRequestList
  if (filterStatus.value && filterStatus.value !== '全部') {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(item => {
      const model = modelStore.findById(item.modelId)
      const modelName = model ? model.name.toLowerCase() : ''
      return modelName.includes(kw) || item.applicantName.toLowerCase().includes(kw)
    })
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0])
    const end = new Date(dateRange.value[1])
    list = list.filter(item => {
      const d = new Date(item.createdAt.split(' ')[0])
      return d >= start && d <= end
    })
  }
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// 统计
const pendingCount = computed(() => shareRequestStore.shareRequestList.filter(s => s.status === '待审批').length)
const approvedCount = computed(() => shareRequestStore.shareRequestList.filter(s => s.status === '已通过').length)
const rejectedCount = computed(() => shareRequestStore.shareRequestList.filter(s => s.status === '已驳回').length)
const passRate = computed(() => {
  const total = approvedCount.value + rejectedCount.value
  if (total === 0) return '0%'
  return ((approvedCount.value / total) * 100).toFixed(1) + '%'
})

// 当前请求（用于主舞台）
const currentRequest = computed(() => {
  if (selectedRequestId.value) {
    return shareRequestStore.findById(selectedRequestId.value) || {}
  }
  return {}
})

const modelName = computed(() => {
  if (!currentRequest.value.modelId) return '--'
  const model = modelStore.findById(currentRequest.value.modelId)
  return model ? model.name : '--'
})
const modelVersion = computed(() => {
  if (!currentRequest.value.modelId) return '--'
  const versions = versionStore.versionList.filter(v => v.modelId === currentRequest.value.modelId)
  if (versions.length === 0) return '--'
  const current = versions.find(v => v.isCurrent) || versions[versions.length - 1]
  return current.versionNumber
})

// 流程链节点颜色
const nodeColor1 = computed(() => '#1890ff') // 申请节点始终蓝色
const nodeColor2 = computed(() => {
  if (currentRequest.value.status === '待审批') return '#d9d9d9'
  return '#ea580c' // 处理过则橙色
})
const nodeColor3 = computed(() => {
  if (currentRequest.value.status === '已通过') return '#52c41a'
  if (currentRequest.value.status === '已驳回') return '#f5222d'
  return '#d9d9d9'
})
const linkLineColor1 = computed(() => nodeColor2.value === '#d9d9d9' ? '#d9d9d9' : '#ea580c')
const linkLineColor2 = computed(() => nodeColor3.value === '#d9d9d9' ? '#d9d9d9' : (currentRequest.value.status === '已通过' ? '#52c41a' : '#f5222d'))

// 状态标签类型
function statusTagType(status) {
  switch (status) {
    case '待审批': return 'warning'
    case '已通过': return 'success'
    case '已驳回': return 'danger'
    default: return 'info'
  }
}

// 日期范围限制
function handleDateRangeChange(range) {
  if (range && range.length === 2) {
    const start = new Date(range[0])
    const end = new Date(range[1])
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24))
    if (days > 30) {
      ElMessage.warning('最多查询近30天内记录')
      dateRange.value = []
    }
  }
}

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => {
  searchKeyword.value = ''
  filterStatus.value = '待审批'
  dateRange.value = []
  currentPage.value = 1
}

// 行点击 => 选中
function handleRowClick(row) {
  selectedRequestId.value = row.id
}

// 详情抽屉
function handleDetail(row) {
  detailRequest.value = row
  detailDrawerVisible.value = true
}

const detailModelName = computed(() => {
  if (!detailRequest.value?.modelId) return '--'
  const model = modelStore.findById(detailRequest.value.modelId)
  return model ? model.name : '--'
})
const detailModelCategory = computed(() => {
  if (!detailRequest.value?.modelId) return '--'
  const model = modelStore.findById(detailRequest.value.modelId)
  if (!model) return '--'
  const cat = categoryStore.findById(model.categoryId)
  return cat ? cat.name : '--'
})
const detailModelVersion = computed(() => {
  if (!detailRequest.value?.modelId) return '--'
  const versions = versionStore.versionList.filter(v => v.modelId === detailRequest.value.modelId)
  if (versions.length === 0) return '--'
  const current = versions.find(v => v.isCurrent) || versions[versions.length - 1]
  return current.versionNumber
})
const detailApprovalRecords = computed(() => {
  if (!detailRequest.value?.id) return []
  return approvalRecordStore.approvalRecordList.filter(r => r.shareRequestId === detailRequest.value.id)
})

// 打开审批弹窗
function openApprove(row) {
  currentRequestForApprove.value = row
  approveResult.value = '通过'
  approveComment.value = ''
  approveDialogVisible.value = true
}

// 提交单个审批
function submitApprove() {
  const req = currentRequestForApprove.value
  if (!req) return
  if (approveResult.value === '驳回' && !approveComment.value.trim()) {
    ElMessage.warning('驳回时审批意见不能为空')
    return
  }
  const newStatus = approveResult.value === '通过' ? '已通过' : '已驳回'
  shareRequestStore.update(req.id, {
    status: newStatus,
    approverId: 'A001', // 模拟当前审批人
    approvedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  approvalRecordStore.add({
    id: 'approval_' + Date.now(),
    shareRequestId: req.id,
    approverId: 'A001',
    action: approveResult.value,
    comment: approveComment.value,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  approveDialogVisible.value = false
  ElMessage.success(`请求已${newStatus}`)
  currentRequestForApprove.value = null
}

// 批量审批弹窗
function openBatchApprove() {
  const invalid = batchSelected.value.filter(r => r.status !== '待审批')
  if (invalid.length > 0) {
    ElMessage.warning('只能批量审批状态为"待审批"的请求')
    return
  }
  batchApproveResult.value = '通过'
  batchApproveComment.value = ''
  batchApproveDialogVisible.value = true
}

function submitBatchApprove() {
  if (batchApproveResult.value === '驳回' && !batchApproveComment.value.trim()) {
    ElMessage.warning('驳回时审批意见不能为空')
    return
  }
  const newStatus = batchApproveResult.value === '通过' ? '已通过' : '已驳回'
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  batchSelected.value.forEach(req => {
    shareRequestStore.update(req.id, {
      status: newStatus,
      approverId: 'A001',
      approvedAt: now
    })
    approvalRecordStore.add({
      id: 'approval_' + Date.now() + '_' + req.id,
      shareRequestId: req.id,
      approverId: 'A001',
      action: batchApproveResult.value,
      comment: batchApproveComment.value,
      createdAt: now
    })
  })
  batchApproveDialogVisible.value = false
  batchSelected.value = []
  ElMessage.success(`已批量${newStatus}`)
}

// 删除
function handleDelete(row) {
  ElMessageBox.confirm('确认删除该请求？删除后不可恢复', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    shareRequestStore.remove(row.id)
    ElMessage.success('删除成功')
    if (selectedRequestId.value === row.id) {
      selectedRequestId.value = null
    }
  }).catch(() => {})
}

// 最近审批记录（底部时间轴）
const recentRecords = computed(() => {
  return approvalRecordStore.approvalRecordList.slice(-5).reverse()
})

// 默认选中第一个待审批
watch(() => shareRequestStore.shareRequestList, (list) => {
  if (!selectedRequestId.value && list.length > 0) {
    const firstPending = list.find(s => s.status === '待审批') || list[0]
    selectedRequestId.value = firstPending.id
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use './ShareApproval.scss' as *;
</style>