<template>
  <div class="page-repair-order">
    <!-- 顶部状态 KPI 卡 -->
    <div class="status-kpi-row">
      <div class="kpi-card" v-for="kpi in statusKPIs" :key="kpi.label">
        <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</div>
        <div class="kpi-label">{{ kpi.label }}</div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="工单ID/房间号/报修人"
        clearable
        style="width: 280px"
      />
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="待处理" />
        <el-option label="已派单" value="已派单" />
        <el-option label="维修中" value="维修中" />
        <el-option label="已完成" value="已完成" />
        <el-option label="已取消" value="已取消" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
        clearable
      />
      <el-button type="primary" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button type="primary" class="btn-add" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增工单
      </el-button>
    </div>

    <!-- 主内容区：左侧时间轴 + 右侧详情 -->
    <div class="main-content">
      <div class="timeline-area">
        <div class="timeline-heading">维修工单时间轴</div>
        <div class="timeline-list" v-if="filteredOrders.length > 0">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="timeline-item"
            :class="{ active: selectedOrderId === order.id }"
            @click="selectOrder(order)"
          >
            <div class="timeline-dot-wrapper">
              <svg class="timeline-dot" width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="7" :fill="priorityColor(order.priority)" />
              </svg>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">
                <el-tag :type="priorityTagType(order.priority)" size="small" class="p-tag">
                  {{ order.priority }}
                </el-tag>
                {{ order.title }}
              </div>
              <div class="timeline-meta">
                <span class="meta-room">{{ getRoomNumber(order.roomId) }}</span>
                <el-tag :type="statusTagType(order.status)" size="small" class="status-tag">
                  {{ mapStatus(order.status) }}
                </el-tag>
                <span class="meta-date">{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无符合条件的工单" />
      </div>

      <div class="detail-panel" v-if="selectedOrder">
        <div class="detail-header">工单详情</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">工单ID</span>
            <span class="detail-value">{{ selectedOrder.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">房间号</span>
            <span class="detail-value">{{ getRoomNumber(selectedOrder.roomId) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">报修类别</span>
            <span class="detail-value">{{ getCategory(selectedOrder) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <el-tag :type="statusTagType(selectedOrder.status)" size="small">{{ mapStatus(selectedOrder.status) }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">报修人</span>
            <span class="detail-value">{{ getReporterName(selectedOrder.userId) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">联系电话</span>
            <span class="detail-value">{{ getReporterPhone(selectedOrder.userId) }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">报修描述</span>
            <span class="detail-value desc">{{ selectedOrder.description }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatDate(selectedOrder.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">完成时间</span>
            <span class="detail-value">{{ selectedOrder.completedAt ? formatDate(selectedOrder.completedAt) : '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">维修工人</span>
            <span class="detail-value">{{ getWorkerName(selectedOrder.assignedUserId) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">优先级</span>
            <span class="detail-value">{{ selectedOrder.priority }}</span>
          </div>
        </div>
        <div class="action-history">
          <div class="history-title">操作记录</div>
          <div class="history-list">
            <div class="history-node">
              <svg width="10" height="10" viewBox="0 0 10 10" class="history-dot">
                <circle cx="5" cy="5" r="4" fill="#059669" />
              </svg>
              <span class="history-time">{{ formatDate(selectedOrder.createdAt) }}</span>
              <span class="history-action-text">创建工单</span>
            </div>
            <div v-if="selectedOrder.completedAt" class="history-node">
              <svg width="10" height="10" viewBox="0 0 10 10" class="history-dot">
                <circle cx="5" cy="5" r="4" fill="#059669" />
              </svg>
              <span class="history-time">{{ formatDate(selectedOrder.completedAt) }}</span>
              <span class="history-action-text">完成工单</span>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <el-button type="primary" size="small" @click="showDetailDrawer = true">查看完整详情</el-button>
        </div>
      </div>
      <el-empty v-else description="点击左侧工单查看详情" class="empty-detail" />
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增工单
      </el-button>
      <el-button
        v-if="selectedOrder && mapStatus(selectedOrder.status) === '待处理'"
        type="warning"
        @click="handleAssign(selectedOrder)"
      >
        <el-icon><User /></el-icon>
        重新指派
      </el-button>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑工单' : '新增工单'"
      width="min(680px, 92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="报修房间" prop="roomId">
          <el-cascader
            v-model="form.roomId"
            :options="cascadeOptions"
            :props="{ expandTrigger: 'hover', emitPath: false }"
            placeholder="选择楼栋与房间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报修类别" prop="category">
          <el-select v-model="form.category" placeholder="选择报修类别" style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="报修描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="请描述故障情况，不超过500字"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="报修人" prop="userId">
          <el-select v-model="form.userId" placeholder="选择报修人（学生）" filterable style="width: 100%">
            <el-option
              v-for="s in studentList"
              :key="s.id"
              :label="s.name + ' (' + s.studentId + ')'"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <template v-if="isEdit">
          <el-form-item label="分配工人" prop="assignedUserId">
            <el-select v-model="form.assignedUserId" placeholder="选择维修工人" clearable filterable style="width: 100%">
              <el-option
                v-for="w in workerList"
                :key="w.id"
                :label="w.name"
                :value="w.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态变更" prop="status">
            <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
              <el-option v-if="mapStatus(selectedOrder?.status) === '待处理'" label="已派单" value="已受理" />
              <el-option v-if="mapStatus(selectedOrder?.status) === '已派单'" label="维修中" value="处理中" />
              <el-option v-if="mapStatus(selectedOrder?.status) === '维修中'" label="已完成" value="已完成" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分配工人弹窗 -->
    <el-dialog v-model="showAssignDialog" title="分配维修工人" width="420px">
      <el-select v-model="assignWorkerId" placeholder="请选择工人" filterable style="width: 100%">
        <el-option
          v-for="w in workerList"
          :key="w.id"
          :label="w.name + ' (' + w.phone + ')'"
          :value="w.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAssignConfirm">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="工单完整信息" size="480px">
      <template v-if="selectedOrder">
        <div class="drawer-section">
          <div class="drawer-row">
            <span class="drawer-label">工单ID</span>
            <span class="drawer-value">{{ selectedOrder.id }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">房间号</span>
            <span class="drawer-value">{{ getRoomNumber(selectedOrder.roomId) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">报修类别</span>
            <span class="drawer-value">{{ getCategory(selectedOrder) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">状态</span>
            <el-tag :type="statusTagType(selectedOrder.status)" size="small">{{ mapStatus(selectedOrder.status) }}</el-tag>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">报修人</span>
            <span class="drawer-value">{{ getReporterName(selectedOrder.userId) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">联系电话</span>
            <span class="drawer-value">{{ getReporterPhone(selectedOrder.userId) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">报修描述</span>
            <span class="drawer-value desc">{{ selectedOrder.description }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">创建时间</span>
            <span class="drawer-value">{{ formatDate(selectedOrder.createdAt) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">完成时间</span>
            <span class="drawer-value">{{ selectedOrder.completedAt ? formatDate(selectedOrder.completedAt) : '—' }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">维修工人</span>
            <span class="drawer-value">{{ getWorkerName(selectedOrder.assignedUserId) }}</span>
          </div>
          <div class="drawer-row">
            <span class="drawer-label">优先级</span>
            <span class="drawer-value">{{ selectedOrder.priority }}</span>
          </div>
        </div>
        <div class="drawer-section">
          <div class="history-title">操作记录</div>
          <div class="history-list">
            <div class="history-node">
              <svg width="10" height="10" viewBox="0 0 10 10" class="history-dot">
                <circle cx="5" cy="5" r="4" fill="#059669" />
              </svg>
              <span class="history-time">{{ formatDate(selectedOrder.createdAt) }}</span>
              <span class="history-action-text">创建工单</span>
            </div>
            <div v-if="selectedOrder.completedAt" class="history-node">
              <svg width="10" height="10" viewBox="0 0 10 10" class="history-dot">
                <circle cx="5" cy="5" r="4" fill="#059669" />
              </svg>
              <span class="history-time">{{ formatDate(selectedOrder.completedAt) }}</span>
              <span class="history-action-text">完成工单</span>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 操作列弹窗：详情抽屉已整合，行内状态流转按钮 -->
    <!-- 表格视图（移动端/窄屏降级） -->
    <div class="table-view">
      <el-table :data="filteredOrders" stripe style="width: 100%" max-height="480" v-if="filteredOrders.length > 0">
        <el-table-column prop="title" label="工单标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="房间" width="130">
          <template #default="{ row }">{{ getRoomNumber(row.roomId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ mapStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="70">
          <template #default="{ row }">
            <el-tag :type="priorityTagType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维修工人" width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ getWorkerName(row.assignedUserId) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button
              v-for="t in getTransitions(row)"
              :key="t.to"
              :type="t.action === 'cancel' ? 'danger' : 'warning'"
              size="small"
              link
              @click="t.action === 'assign' ? handleAssign(row) : handleTransition(row, t.to)"
            >
              {{ t.label }}
            </el-button>
            <el-button
              v-if="mapStatus(row.status) !== '已完成' && mapStatus(row.status) !== '已取消'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="mapStatus(row.status) !== '已完成' && mapStatus(row.status) !== '已取消'"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:page-size="pageSize"
          v-model:current-page="currentPage"
          :total="filteredOrders.length"
          layout="prev, pager, next, total"
          :page-size="20"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, User } from '@element-plus/icons-vue'
import { useRepairOrderStore } from '@/stores/repairOrder'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useUserStore } from '@/stores/user'

const repairOrderStore = useRepairOrderStore()
const blockStore = useDormitoryBlockStore()
const roomStore = useDormitoryRoomStore()
const userStore = useUserStore()

// ---------- 筛选 ----------
const searchKeyword = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// ---------- 弹窗状态 ----------
const showAddDialog = ref(false)
const showAssignDialog = ref(false)
const showDetailDrawer = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const assignOrderId = ref(null)
const assignWorkerId = ref('')
const formRef = ref(null)

// ---------- 选中工单 ----------
const selectedOrderId = ref(null)

// ---------- 辅助计算 ----------
const studentList = computed(() => {
  return userStore.userList.filter(u => u.role === '学生' && u.enabled)
})
const workerList = computed(() => {
  return userStore.userList.filter(u => u.role === '维修工人' && u.enabled)
})

const cascadeOptions = computed(() => {
  return blockStore.dormitoryBlockList.map(block => ({
    value: block.id,
    label: block.name,
    children: roomStore.dormitoryRoomList
      .filter(room => room.blockId === block.id)
      .map(room => ({
        value: room.id,
        label: room.roomNumber
      }))
  }))
})

const categoryOptions = ['水', '电', '木', '其他']

// ---------- 表单 ----------
const form = ref({
  roomId: '',
  category: '',
  description: '',
  phone: '',
  userId: '',
  assignedUserId: '',
  status: '待审核',
  priority: '低'
})

const formRules = {
  roomId: [{ required: true, message: '请选择报修房间', trigger: 'change' }],
  category: [{ required: true, message: '请选择报修类别', trigger: 'change' }],
  description: [
    { required: true, message: '请填写报修描述', trigger: 'blur' },
    { max: 500, message: '不超过500字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  userId: [{ required: true, message: '请选择报修人', trigger: 'change' }]
}

function resetForm() {
  form.value = {
    roomId: '',
    category: '',
    description: '',
    phone: '',
    userId: '',
    assignedUserId: '',
    status: '待审核',
    priority: '低'
  }
  isEdit.value = false
  editId.value = null
}

// ---------- 过滤 & 排序 ----------
const filteredOrders = computed(() => {
  let list = repairOrderStore.repairOrderList

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(order => {
      const room = getRoomNumber(order.roomId).toLowerCase()
      const reporter = getReporterName(order.userId).toLowerCase()
      return order.id.toLowerCase().includes(kw) || room.includes(kw) || reporter.includes(kw)
    })
  }

  if (filterStatus.value) {
    list = list.filter(order => mapStatus(order.status) === filterStatus.value)
  }

  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(order => {
      const t = new Date(order.createdAt).getTime()
      return t >= start && t <= end
    })
  }

  return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const selectedOrder = computed(() => {
  if (!selectedOrderId.value) return null
  return repairOrderStore.repairOrderList.find(o => o.id === selectedOrderId.value) || null
})

// ---------- KPI ----------
const statusKPIs = computed(() => {
  const list = repairOrderStore.repairOrderList
  const counts = {
    '待处理': 0,
    '已派单': 0,
    '维修中': 0,
    '已完成': 0,
    '已取消': 0
  }
  list.forEach(o => {
    const s = mapStatus(o.status)
    if (counts.hasOwnProperty(s)) counts[s]++
  })
  return [
    { label: '待处理', value: counts['待处理'], color: '#F59E0B' },
    { label: '已派单', value: counts['已派单'], color: '#3B82F6' },
    { label: '维修中', value: counts['维修中'], color: '#8B5CF6' },
    { label: '已完成', value: counts['已完成'], color: '#10B981' },
    { label: '已取消', value: counts['已取消'], color: '#6B7280' }
  ]
})

// ---------- 映射 ----------
function mapStatus(status) {
  const map = {
    '待审核': '待处理',
    '已受理': '已派单',
    '处理中': '维修中',
    '已完成': '已完成',
    '已驳回': '已取消',
    '已取消': '已取消'
  }
  return map[status] || status
}

function statusTagType(status) {
  const map = {
    '待审核': 'warning',
    '已受理': 'primary',
    '处理中': 'info',
    '已完成': 'success',
    '已驳回': 'danger',
    '已取消': 'info'
  }
  return map[status] || 'info'
}

function priorityColor(priority) {
  const c = { '低': '#6B7280', '中': '#3B82F6', '高': '#F59E0B', '紧急': '#EF4444' }
  return c[priority] || '#6B7280'
}

function priorityTagType(priority) {
  const c = { '低': 'info', '中': 'primary', '高': 'warning', '紧急': 'danger' }
  return c[priority] || 'info'
}

// ---------- 辅助函数 ----------
function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (!Number.isFinite(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getRoomNumber(roomId) {
  if (!roomId) return ''
  const room = roomStore.dormitoryRoomList.find(r => r.id === roomId)
  if (!room) return ''
  const block = blockStore.dormitoryBlockList.find(b => b.id === room.blockId)
  return block ? `${block.name} ${room.roomNumber}` : room.roomNumber
}

function getReporterName(userId) {
  if (!userId) return ''
  const u = userStore.userList.find(u => u.id === userId)
  return u ? u.name : ''
}

function getReporterPhone(userId) {
  if (!userId) return ''
  const u = userStore.userList.find(u => u.id === userId)
  return u ? u.phone : ''
}

function getWorkerName(userId) {
  if (!userId) return '未分配'
  const u = userStore.userList.find(u => u.id === userId)
  return u ? u.name : '未知'
}

function getCategory(order) {
  // 使用 description 的前几个字模拟类别，或根据种子数据推断
  // 这里从 form 中取，但种子数据没有 category 字段，用一个默认值
  return order.description ? (order.description.includes('水') ? '水' : order.description.includes('电') ? '电' : order.description.includes('木') ? '木' : '其他') : '其他'
}

// ---------- 状态流转 ----------
function getTransitions(order) {
  const mapped = mapStatus(order.status)
  if (mapped === '待处理') return [{ label: '派单', to: '已受理', action: 'assign' }, { label: '取消', to: '已取消', action: 'cancel' }]
  if (mapped === '已派单') return [{ label: '开始维修', to: '处理中', action: 'start' }]
  if (mapped === '维修中') return [{ label: '完成维修', to: '已完成', action: 'complete' }, { label: '取消维修', to: '已取消', action: 'cancel' }]
  return []
}

function handleTransition(order, target) {
  const patch = { status: target }
  if (target === '已完成') {
    patch.completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
  }
  repairOrderStore.update(order.id, patch)
  ElMessage.success('状态已更新')
}

// ---------- 增删改 ----------
function openAddDialog() {
  resetForm()
  isEdit.value = false
  showAddDialog.value = true
}

function openEdit(order) {
  isEdit.value = true
  editId.value = order.id
  form.value = {
    roomId: order.roomId,
    category: getCategory(order),
    description: order.description,
    phone: getReporterPhone(order.userId),
    userId: order.userId,
    assignedUserId: order.assignedUserId || '',
    status: order.status,
    priority: order.priority
  }
  showAddDialog.value = true
}

async function handleFormSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    repairOrderStore.update(editId.value, {
      roomId: form.value.roomId,
      description: form.value.description,
      phone: form.value.phone,
      userId: form.value.userId,
      assignedUserId: form.value.assignedUserId,
      status: form.value.status,
      priority: form.value.priority
    })
    ElMessage.success('工单已更新')
  } else {
    const newOrder = {
      id: 'repairorder_' + Date.now(),
      title: form.value.description.slice(0, 30) || '新增报修',
      description: form.value.description,
      userId: form.value.userId,
      roomId: form.value.roomId,
      assignedUserId: form.value.assignedUserId || '',
      status: '待审核',
      priority: form.value.priority || '低',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      completedAt: null
    }
    repairOrderStore.add(newOrder)
    ElMessage.success('工单创建成功')
  }
  showAddDialog.value = false
  resetForm()
}

function handleDelete(order) {
  let msg = '确定要删除该工单吗？'
  if (order.assignedUserId) {
    msg = '该工单已有维修工人处理，确定要删除？'
  }
  ElMessageBox.confirm(msg, '确认删除', { type: 'warning' })
    .then(() => {
      repairOrderStore.remove(order.id)
      if (selectedOrderId.value === order.id) selectedOrderId.value = null
      ElMessage.success('工单已删除')
    })
    .catch(() => {})
}

function showDetail(order) {
  selectedOrderId.value = order.id
  showDetailDrawer.value = true
}

function selectOrder(order) {
  selectedOrderId.value = order.id
}

// ---------- 分配 ----------
function handleAssign(order) {
  assignOrderId.value = order.id
  assignWorkerId.value = order.assignedUserId || ''
  showAssignDialog.value = true
}

function handleAssignConfirm() {
  if (!assignWorkerId.value) {
    ElMessage.warning('请选择维修工人')
    return
  }
  repairOrderStore.update(assignOrderId.value, {
    assignedUserId: assignWorkerId.value,
    status: '已受理'
  })
  showAssignDialog.value = false
  ElMessage.success('分配成功，工单已转为“已派单”')
}

// ---------- 导出 ----------
function handleExport() {
  const list = filteredOrders.value
  if (list.length === 0) {
    ElMessage.info('没有可导出的数据')
    return
  }
  const headers = '工单ID,标题,房间,状态,报修人,电话,创建时间,完成时间,维修工人'
  const rows = list.map(o => {
    const room = getRoomNumber(o.roomId)
    const reporter = getReporterName(o.userId)
    const phone = getReporterPhone(o.userId)
    const status = mapStatus(o.status)
    const worker = getWorkerName(o.assignedUserId)
    const completed = o.completedAt ? formatDate(o.completedAt) : ''
    return [o.id, o.title, room, status, reporter, phone, formatDate(o.createdAt), completed, worker].join(',')
  })
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `维修工单_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
@use './RepairOrder.scss' as *;
</style>