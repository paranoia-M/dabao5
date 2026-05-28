<template>
  <div class="page-grant_approval">
    <!-- KPI 状态分布卡片 -->
    <div class="kpi-row">
      <div v-for="s in stateCounts" :key="s.label" class="kpi-card" :style="{ '--kpi-color': s.color }">
        <span class="kpi-num">{{ s.count }}</span>
        <span class="kpi-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索申请人/API名称/申请单号"
        clearable
        style="width:240px"
      />
      <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:140px">
        <el-option label="全部" value="" />
        <el-option label="待审批" value="待审批" />
        <el-option label="已通过" value="已通过" />
        <el-option label="已驳回" value="已驳回" />
        <el-option label="已撤销" value="已撤销" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width:260px"
      />
    </div>

    <!-- 主体区域 -->
    <div class="main-area">
      <!-- 左侧申请列表 -->
      <div class="left-list">
        <div class="list-header">
          <span>申请列表</span>
          <span class="list-count">共 {{ filteredList.length }} 条</span>
        </div>
        <div
          v-for="item in pagedList"
          :key="item.id"
          class="list-item"
          :class="{ active: selectedId === item.id }"
          @click="selectedId = item.id"
        >
          <div class="item-info">
            <div class="item-applicant">{{ getRealName(item.applicantId) }}</div>
            <div class="item-time">{{ item.createdAt.slice(0,10) }}</div>
          </div>
          <el-tag :type="statusTagType(item.status)" size="small">{{ item.status }}</el-tag>
          <div class="item-operate">
            <el-button
              v-if="item.status === '待审批'"
              size="small"
              type="primary"
              plain
              @click.stop="openApproveDialog(item)"
            >
              审批
            </el-button>
            <el-button
              v-if="item.status === '待审批'"
              size="small"
              type="danger"
              plain
              @click.stop="handleDelete(item)"
            >
              删除
            </el-button>
            <el-button size="small" link type="primary" @click.stop="openDetailDrawer(item)">
              详情
            </el-button>
          </div>
        </div>
        <el-empty v-if="filteredList.length === 0" description="暂无授权申请" />
        <el-pagination
          v-if="filteredList.length > pageSize"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="filteredList.length"
          small
        />
      </div>

      <!-- 中央状态机区域 -->
      <div class="center-state-machine">
        <svg class="state-svg" viewBox="0 0 400 240" width="100%" height="240">
          <!-- 连线 -->
          <path d="M100,60 Q200,50 280,60" stroke="#DCDFE6" stroke-width="2" fill="none" marker-end="url(#arrow)" />
          <path d="M100,60 Q100,120 100,170" stroke="#DCDFE6" stroke-width="2" fill="none" marker-end="url(#arrow)" />
          <path d="M280,60 Q280,120 280,170" stroke="#DCDFE6" stroke-width="2" fill="none" marker-end="url(#arrow)" />
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="#DCDFE6" />
            </marker>
          </defs>

          <!-- 节点：待审批 -->
          <circle
            cx="100" cy="60" r="32"
            :fill="selectedApp?.status === '待审批' ? '#EA580C' : '#F0F0F0'"
            :stroke="selectedApp?.status === '待审批' ? '#EA580C' : '#DCDFE6'"
            stroke-width="3"
            class="state-node"
            @click="showStateInfo('待审批')"
          />
          <text x="100" y="65" text-anchor="middle" fill="#333" font-size="13" font-weight="600">待审批</text>

          <!-- 节点：已通过 -->
          <circle
            cx="280" cy="60" r="32"
            :fill="selectedApp?.status === '已通过' ? '#67C23A' : '#F0F0F0'"
            :stroke="selectedApp?.status === '已通过' ? '#67C23A' : '#DCDFE6'"
            stroke-width="3"
            class="state-node"
            @click="showStateInfo('已通过')"
          />
          <text x="280" y="65" text-anchor="middle" fill="#333" font-size="13" font-weight="600">已通过</text>

          <!-- 节点：已驳回 -->
          <circle
            cx="100" cy="170" r="32"
            :fill="selectedApp?.status === '已驳回' ? '#F56C6C' : '#F0F0F0'"
            :stroke="selectedApp?.status === '已驳回' ? '#F56C6C' : '#DCDFE6'"
            stroke-width="3"
            class="state-node"
            @click="showStateInfo('已驳回')"
          />
          <text x="100" y="175" text-anchor="middle" fill="#333" font-size="13" font-weight="600">已驳回</text>

          <!-- 节点：已撤销 -->
          <circle
            cx="280" cy="170" r="32"
            :fill="selectedApp?.status === '已撤销' ? '#909399' : '#F0F0F0'"
            :stroke="selectedApp?.status === '已撤销' ? '#909399' : '#DCDFE6'"
            stroke-width="3"
            class="state-node"
            @click="showStateInfo('已撤销')"
          />
          <text x="280" y="175" text-anchor="middle" fill="#333" font-size="13" font-weight="600">已撤销</text>

          <!-- 箭头标签 -->
          <text x="190" y="50" text-anchor="middle" fill="#67C23A" font-size="11">通过</text>
          <text x="85" y="120" text-anchor="middle" fill="#F56C6C" font-size="11">驳回</text>
          <text x="290" y="120" text-anchor="middle" fill="#909399" font-size="11">撤销</text>
        </svg>

        <!-- 状态流转操作按钮 -->
        <div class="action-zone" v-if="selectedApp && selectedApp.status === '待审批'">
          <el-button type="success" @click="openApproveDialog(selectedApp, '通过')">通过</el-button>
          <el-button type="danger" @click="openApproveDialog(selectedApp, '驳回')">驳回</el-button>
        </div>
        <div class="action-zone" v-else-if="selectedApp">
          <span class="state-hint">当前状态：<el-tag :type="statusTagType(selectedApp.status)" effect="dark">{{ selectedApp.status }}</el-tag></span>
        </div>
      </div>

      <!-- 右侧审批时间线 -->
      <div class="right-timeline">
        <div class="timeline-header">审批记录</div>
        <el-timeline v-if="approvalRecords.length > 0">
          <el-timeline-item
            v-for="rec in approvalRecords"
            :key="rec.id"
            :timestamp="rec.createdAt"
            :type="rec.action === '通过' ? 'success' : 'danger'"
          >
            <div class="tl-approver">{{ getRealName(rec.approverId) }}</div>
            <div class="tl-action">{{ rec.action }}</div>
            <div v-if="rec.comment" class="tl-comment">{{ rec.comment }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审批记录" :image-size="60" />
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div class="batch-bar">
      <el-checkbox v-model="selectAll" :indeterminate="indeterminate" @change="onSelectAll">全选</el-checkbox>
      <span style="margin-left:8px;color:#606266;">已选 {{ selectedIds.length }} 项</span>
      <el-button type="primary" plain :disabled="selectedIds.length===0" @click="batchApprove">批量审批</el-button>
      <el-button type="warning" plain @click="exportData">导出</el-button>
    </div>

    <!-- 审批弹窗（单个/批量共用） -->
    <el-dialog v-model="approveDialogVisible" title="审批操作" width="min(480px,90vw)" append-to-body>
      <el-form :model="approveForm" ref="approveFormRef" :rules="approveRules" label-width="80px">
        <el-form-item label="审批结果" prop="action">
          <el-select v-model="approveForm.action" placeholder="请选择">
            <el-option label="通过" value="通过" />
            <el-option label="驳回" value="驳回" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment" :required="approveForm.action==='驳回'">
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" maxlength="100" show-word-limit placeholder="驳回时必填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="申请详情" size="min(520px,85vw)" append-to-body>
      <template v-if="detailApp">
        <div class="detail-section">
          <div class="detail-row"><span class="label">申请单号</span><span>{{ detailApp.id }}</span></div>
          <div class="detail-row"><span class="label">申请人</span><span>{{ getRealName(detailApp.applicantId) }}</span></div>
          <div class="detail-row"><span class="label">申请时间</span><span>{{ detailApp.createdAt }}</span></div>
          <div class="detail-row"><span class="label">数据服务名称</span><span>{{ getApiName(detailApp.apiId) }}</span></div>
          <div class="detail-row"><span class="label">授权资源</span><span>{{ getApiPath(detailApp.apiId) }}</span></div>
          <div class="detail-row"><span class="label">申请原因</span><span>{{ detailApp.reason }}</span></div>
          <div class="detail-row"><span class="label">当前状态</span><el-tag :type="statusTagType(detailApp.status)">{{ detailApp.status }}</el-tag></div>
        </div>
        <div class="detail-divider"></div>
        <div class="detail-section">
          <div class="detail-title">审批历史</div>
          <el-timeline v-if="approvalRecords.length > 0">
            <el-timeline-item v-for="r in approvalRecords" :key="r.id" :timestamp="r.createdAt" :type="r.action==='通过'?'success':'danger'">
              <div>{{ getRealName(r.approverId) }} — {{ r.action }}</div>
              <div v-if="r.comment" style="margin-top:4px;font-size:13px;color:#909399;">意见：{{ r.comment }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无审批历史" :image-size="50" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGrantApplicationStore } from '@/stores/grantApplication'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useUserStore } from '@/stores/user'
import { useApiDefinitionStore } from '@/stores/apiDefinition'
import { useExportRecordStore } from '@/stores/exportRecord'
import dayjs from 'dayjs'

const grantStore = useGrantApplicationStore()
const approvalRecordStore = useApprovalRecordStore()
const userStore = useUserStore()
const apiDefStore = useApiDefinitionStore()
const exportRecordStore = useExportRecordStore()

// 筛选
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])

const filteredList = computed(() => {
  let list = grantStore.grantApplicationList
  // 关键词搜索（申请人姓名、API名称、单号）
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(item => {
      const name = userStore.findById(item.applicantId)?.realName?.toLowerCase() || ''
      const apiName = apiDefStore.findById(item.apiId)?.name?.toLowerCase() || ''
      const id = item.id.toLowerCase()
      return name.includes(kw) || apiName.includes(kw) || id.includes(kw)
    })
  }
  // 状态筛选
  if (statusFilter.value) {
    list = list.filter(item => item.status === statusFilter.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dayjs(dateRange.value[0]).startOf('day').valueOf()
    const end = dayjs(dateRange.value[1]).endOf('day').valueOf()
    list = list.filter(item => {
      const t = dayjs(item.createdAt).valueOf()
      return t >= start && t <= end
    })
  }
  // 按创建时间降序
  return [...list].sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
})

// 分页
const currentPage = ref(1)
const pageSize = 20
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})
watch(filteredList, () => { currentPage.value = 1 })

// 选中
const selectedId = ref(grantStore.grantApplicationList[0]?.id || '')
const selectedApp = computed(() => grantStore.findById(selectedId.value))
// 详情抽屉用
const detailDrawerVisible = ref(false)
const detailApp = ref(null)

// 状态计数（KPI）
const states = ['待审批', '已通过', '已驳回', '已撤销']
const stateColors = ['#EA580C', '#67C23A', '#F56C6C', '#909399']
const stateCounts = computed(() => {
  const counts = { '待审批':0,'已通过':0,'已驳回':0,'已撤销':0 }
  grantStore.grantApplicationList.forEach(item => {
    if (counts[item.status] !== undefined) counts[item.status]++
  })
  return states.map((label, i) => ({ label, count: counts[label], color: stateColors[i] }))
})

// 辅助函数
function getRealName(userId) {
  return userStore.findById(userId)?.realName || '未知'
}
function getApiName(apiId) {
  return apiDefStore.findById(apiId)?.name || '未知API'
}
function getApiPath(apiId) {
  const api = apiDefStore.findById(apiId)
  return api ? `${api.method} ${api.path}` : '未知'
}
function statusTagType(status) {
  const map = { '待审批':'warning','已通过':'success','已驳回':'danger','已撤销':'info' }
  return map[status] || 'info'
}

// 打开审批弹窗（单个）
const approveDialogVisible = ref(false)
const approveForm = ref({ action: '', comment: '' })
const approveFormRef = ref(null)
const approveRules = {
  action: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  comment: [
    { max: 100, message: '不超过100字', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (approveForm.value.action === '驳回' && (!value || value.trim() === '')) {
          callback(new Error('驳回时审批意见不能为空'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
let approveTargetIds = [] // 待审批的ID列表（单个时长度为1）

function openApproveDialog(item, presetAction) {
  approveTargetIds = [item.id]
  approveForm.value = { action: presetAction || '', comment: '' }
  approveDialogVisible.value = true
  nextTick(() => { approveFormRef.value?.clearValidate() })
}

function submitApprove() {
  approveFormRef.value.validate(valid => {
    if (!valid) return
    const { action, comment } = approveForm.value
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const adminId = userStore.userList[0]?.id || 'user_1000'
    approveTargetIds.forEach(id => {
      const app = grantStore.findById(id)
      if (app && app.status === '待审批') {
        const newStatus = action === '通过' ? '已通过' : '已驳回'
        grantStore.update(id, { status: newStatus, updatedAt: now })
        approvalRecordStore.add({
          id: 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          bizType: '授权申请',
          bizId: id,
          approverId: adminId,
          action: action,
          comment: comment || '',
          createdAt: now
        })
      }
    })
    approveDialogVisible.value = false
    ElMessage.success(`已${action} ${approveTargetIds.length} 条申请`)
    approveTargetIds = []
  })
}

// 删除
function handleDelete(item) {
  if (item.status !== '待审批') {
    ElMessage.warning('已审批申请不可删除')
    return
  }
  ElMessageBox.confirm(`确定删除申请"${item.id}"吗？`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    grantStore.remove(item.id)
    ElMessage.success('已删除')
    if (selectedId.value === item.id) {
      selectedId.value = grantStore.grantApplicationList[0]?.id || ''
    }
  }).catch(() => {})
}

// 详情抽屉
function openDetailDrawer(item) {
  detailApp.value = item
  detailDrawerVisible.value = true
}

// 审批记录
const approvalRecords = computed(() => {
  if (!selectedId.value) return []
  return approvalRecordStore.approvalRecordList
    .filter(r => r.bizType === '授权申请' && r.bizId === selectedId.value)
    .sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
})

// 批量选择
const selectAll = ref(false)
const indeterminate = ref(false)
const selectedIds = ref([])
function onSelectAll(val) {
  selectedIds.value = val ? filteredList.value.map(item => item.id) : []
  indeterminate.value = false
}
watch(pagedList, () => {
  // 当页切换时清空选中
  selectedIds.value = []
  selectAll.value = false
  indeterminate.value = false
})
watch(selectedIds, (newVal) => {
  const total = filteredList.value.length
  if (newVal.length === 0) {
    selectAll.value = false
    indeterminate.value = false
  } else if (newVal.length === total) {
    selectAll.value = true
    indeterminate.value = false
  } else {
    selectAll.value = false
    indeterminate.value = true
  }
})

function batchApprove() {
  if (selectedIds.value.length === 0) return
  // 检查是否有非待审批
  const invalid = selectedIds.value.filter(id => {
    const app = grantStore.findById(id)
    return app && app.status !== '待审批'
  })
  if (invalid.length > 0) {
    ElMessage.warning(`已跳过 ${invalid.length} 条非待审批记录`)
    selectedIds.value = selectedIds.value.filter(id => !invalid.includes(id))
  }
  if (selectedIds.value.length === 0) return
  approveTargetIds = selectedIds.value
  approveForm.value = { action: '', comment: '' }
  approveDialogVisible.value = true
}

// 导出
function exportData() {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const adminId = userStore.userList[0]?.id || 'user_1000'
  exportRecordStore.add({
    id: 'exp_' + Date.now() + Math.random().toString(36).substr(2, 4),
    userId: adminId,
    module: '授权审批',
    fileName: `授权审批记录_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`,
    fileSize: 0,
    status: '生成中',
    createdAt: now
  })
  ElMessage.success('导出任务已创建，请到导出记录查看')
}

// 状态节点点击
function showStateInfo(state) {
  if (selectedApp.value && selectedApp.value.status === state) {
    detailApp.value = selectedApp.value
    detailDrawerVisible.value = true
  } else {
    ElMessage.info(`状态"${state}" — 当前选中申请状态为"${selectedApp.value?.status || '无'}"`)
  }
}
</script>

<style scoped lang="scss">
@use './GrantApproval.scss' as *;
</style>