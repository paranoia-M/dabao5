<template>
  <div class="page-repair-task">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="top-left">
        <h2>🧰 维修任务</h2>
        <el-radio-group v-model="currentView" size="small">
          <el-radio-button value="all">全部任务</el-radio-button>
          <el-radio-button value="mine">我的任务</el-radio-button>
        </el-radio-group>
      </div>
      <div class="top-right">
        <el-button type="primary" @click="openAddDialog">
          <el-icon style="margin-right:4px"><Plus /></el-icon>新增任务
        </el-button>
        <el-button @click="handleExport">
          <el-icon style="margin-right:4px"><Download /></el-icon>导出
        </el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索工单编号 / 报修内容" clearable style="width:260px" />
      <el-select v-model="filterStatus" placeholder="任务状态" clearable style="width:150px">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:280px" />
      <div class="filter-stats">
        <span>共 <strong>{{ filteredList.length }}</strong> 条任务</span>
      </div>
    </div>

    <!-- 主舞台 -->
    <div class="main-stage">
      <!-- 左侧看板列 -->
      <div class="kanban-area">
        <div class="kanban-column" v-for="col in kanbanColumns" :key="col.key">
          <div class="col-header">
            <span class="col-dot" :style="{ background: col.color }"></span>
            <span class="col-title">{{ col.label }}</span>
            <el-tag size="small" :type="col.tagType" effect="plain">{{ col.tasks.length }}</el-tag>
          </div>
          <div class="col-body" ref="colBodyRefs">
            <div
              class="task-card"
              v-for="task in col.tasks"
              :key="task.id"
              @click="selectTask(task)"
              :class="{ 'is-selected': selectedTask?.id === task.id }"
            >
              <div class="priority-strip" :class="'p-' + (task.priority || '低')"></div>
              <div class="card-inner">
                <div class="card-title" :title="task.title">{{ task.title }}</div>
                <div class="card-meta">
                  <span class="meta-room">{{ getRoomFullName(task.roomId) }}</span>
                  <span class="meta-user">{{ getUserName(task.userId) }}</span>
                </div>
                <div class="card-tags">
                  <el-tag :type="priorityTagType(task.priority)" size="small" effect="dark">{{ task.priority }}</el-tag>
                  <el-tag type="info" size="small" effect="plain">{{ getStatusLabel(task.status) }}</el-tag>
                </div>
                <div class="card-time">{{ formatDate(task.createdAt) }}</div>
              </div>
              <div class="card-actions" @click.stop v-if="canOperate(task)">
                <el-button v-if="task.status === '待审核'" size="small" type="primary" @click="openAssignDialog(task)">分配</el-button>
                <el-button v-if="task.status === '待审核'" size="small" @click="openEditDialog(task)">编辑</el-button>
                <el-button v-if="task.status === '待审核'" size="small" type="danger" @click="handleDelete(task)">删除</el-button>
                <el-button v-if="task.status === '已受理'" size="small" type="primary" @click="handleAccept(task)">接受</el-button>
                <el-button v-if="task.status === '已受理'" size="small" @click="handleReject(task)">退回</el-button>
                <el-button v-if="task.status === '处理中'" size="small" type="success" @click="handleComplete(task)">完成</el-button>
                <el-button v-if="task.status === '处理中'" size="small" @click="handleReject(task)">退回</el-button>
                <el-button v-if="['已完成','已驳回','已取消'].includes(task.status)" size="small" @click="openDrawer(task)">详情</el-button>
              </div>
            </div>
            <el-empty v-if="col.tasks.length === 0" :description="'暂无' + col.label + '任务'" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="detail-panel" v-if="selectedTask">
        <div class="panel-header">
          <span class="panel-title">📋 任务详情</span>
          <el-button text @click="selectedTask = null" style="font-size:18px">✕</el-button>
        </div>
        <div class="panel-body">
          <div class="detail-field">
            <label>工单编号</label>
            <span class="field-value code">{{ selectedTask.id }}</span>
          </div>
          <div class="detail-field">
            <label>宿舍位置</label>
            <span class="field-value">{{ getRoomFullName(selectedTask.roomId) }}</span>
          </div>
          <div class="detail-field">
            <label>报修内容</label>
            <span class="field-value">{{ selectedTask.description || selectedTask.title }}</span>
          </div>
          <div class="detail-field">
            <label>紧急程度</label>
            <el-tag :type="priorityTagType(selectedTask.priority)" size="small" effect="dark">{{ selectedTask.priority }}</el-tag>
          </div>
          <div class="detail-field">
            <label>报修人</label>
            <span class="field-value">{{ getUserName(selectedTask.userId) }}</span>
          </div>
          <div class="detail-field">
            <label>指定工人</label>
            <span class="field-value">{{ getWorkerName(selectedTask.assignedUserId) || '未分配' }}</span>
          </div>
          <div class="detail-field">
            <label>状态</label>
            <span class="field-value status-tag">{{ getStatusLabel(selectedTask.status) }}</span>
          </div>
          <div class="detail-field">
            <label>创建时间</label>
            <span class="field-value">{{ formatDate(selectedTask.createdAt) }}</span>
          </div>
          <div class="detail-field" v-if="selectedTask.completedAt">
            <label>完成时间</label>
            <span class="field-value">{{ formatDate(selectedTask.completedAt) }}</span>
          </div>
        </div>
        <div class="panel-actions">
          <template v-if="selectedTask.status === '待审核'">
            <el-button type="primary" size="default" @click="openAssignDialog(selectedTask)">分配任务</el-button>
            <el-button size="default" @click="openEditDialog(selectedTask)">编辑</el-button>
            <el-button type="danger" size="default" @click="handleDelete(selectedTask)">删除</el-button>
          </template>
          <template v-if="selectedTask.status === '已受理'">
            <el-button type="primary" size="default" @click="handleAccept(selectedTask)">接受任务</el-button>
            <el-button size="default" @click="handleReject(selectedTask)">退回</el-button>
          </template>
          <template v-if="selectedTask.status === '处理中'">
            <el-button type="success" size="default" @click="handleComplete(selectedTask)">完成维修</el-button>
            <el-button size="default" @click="handleReject(selectedTask)">退回</el-button>
          </template>
          <template v-if="['已完成','已驳回','已取消'].includes(selectedTask.status)">
            <el-button size="default" @click="openDrawer(selectedTask)">查看完整详情</el-button>
          </template>
        </div>
      </div>
      <div class="detail-panel detail-empty" v-else>
        <div class="empty-hint">👈 点击左侧任务卡片查看详情</div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="bottom-bar">
      <div class="bottom-left">
        <span class="progress-label">总完成率</span>
        <el-progress :percentage="completionRate" :stroke-width="14" :color="progressColor" style="width:320px" />
      </div>
      <div class="bottom-right">
        <span>已完成 <strong>{{ completedCount }}</strong> / {{ totalCount }} 项</span>
        <span class="divider">|</span>
        <span>今日完成 <strong>{{ todayCompleted }}</strong> 项</span>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑维修任务' : '新增维修任务'" width="min(640px, 92vw)" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="formRules" status-icon>
        <el-form-item label="工单编号" v-if="isEdit">
          <el-input v-model="form.id" disabled />
        </el-form-item>
        <el-form-item label="宿舍楼栋" prop="blockId">
          <el-select v-model="form.blockId" placeholder="请选择楼栋" @change="onBlockChange">
            <el-option v-for="b in blocks" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间号" prop="roomId">
          <el-select v-model="form.roomId" placeholder="请选择房间" :disabled="!form.blockId">
            <el-option v-for="r in filteredRooms" :key="r.id" :label="r.roomNumber" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="报修内容" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请详细描述报修问题" />
        </el-form-item>
        <el-form-item label="维修类型" prop="repairType">
          <el-select v-model="form.repairType" placeholder="选择维修类型">
            <el-option label="水电" value="水电" />
            <el-option label="家具" value="家具" />
            <el-option label="门窗" value="门窗" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度" prop="priority">
          <el-select v-model="form.priority" placeholder="选择紧急程度">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定工人" prop="assignedUserId">
          <el-select v-model="form.assignedUserId" placeholder="可选" clearable>
            <el-option v-for="w in workers" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="其他补充信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 分配任务 Dialog -->
    <el-dialog v-model="assignVisible" title="分配维修任务" width="420px" :close-on-click-modal="false">
      <div class="assign-task-info">
        <div class="assign-field"><label>工单编号</label><span>{{ assignTask?.id }}</span></div>
        <div class="assign-field"><label>报修内容</label><span>{{ assignTask?.title }}</span></div>
      </div>
      <el-form label-width="90px">
        <el-form-item label="维修工人">
          <el-select v-model="assignWorkerId" placeholder="请选择维修工人" style="width:100%">
            <el-option v-for="w in workers" :key="w.id" :label="w.name + ' (' + w.phone + ')'" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="drawerVisible" title="任务完整详情" size="480px" :close-on-click-modal="false">
      <div class="drawer-body" v-if="drawerTask">
        <div class="drawer-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-grid">
            <div class="grid-item">
              <label>工单编号</label>
              <span class="code">{{ drawerTask.id }}</span>
            </div>
            <div class="grid-item">
              <label>宿舍位置</label>
              <span>{{ getRoomFullName(drawerTask.roomId) }}</span>
            </div>
            <div class="grid-item full">
              <label>报修内容</label>
              <span>{{ drawerTask.description || drawerTask.title }}</span>
            </div>
            <div class="grid-item">
              <label>维修类型</label>
              <span>{{ getRepairType(drawerTask) }}</span>
            </div>
            <div class="grid-item">
              <label>紧急程度</label>
              <el-tag :type="priorityTagType(drawerTask.priority)" size="small" effect="dark">{{ drawerTask.priority }}</el-tag>
            </div>
            <div class="grid-item">
              <label>报修人</label>
              <span>{{ getUserName(drawerTask.userId) }}</span>
            </div>
            <div class="grid-item">
              <label>指定工人</label>
              <span>{{ getWorkerName(drawerTask.assignedUserId) || '未分配' }}</span>
            </div>
            <div class="grid-item">
              <label>状态</label>
              <span class="status-badge">{{ getStatusLabel(drawerTask.status) }}</span>
            </div>
            <div class="grid-item">
              <label>创建时间</label>
              <span>{{ formatDate(drawerTask.createdAt) }}</span>
            </div>
            <div class="grid-item" v-if="drawerTask.completedAt">
              <label>完成时间</label>
              <span>{{ formatDate(drawerTask.completedAt) }}</span>
            </div>
          </div>
        </div>
        <div class="drawer-section">
          <h4 class="section-title">维修记录时间线</h4>
          <el-timeline>
            <el-timeline-item
              :timestamp="formatDate(drawerTask.createdAt)"
              placement="top"
              type="primary"
            >
              <div class="timeline-node">
                <strong>创建工单</strong>
                <p>工单创建，状态：待审核</p>
                <p class="timeline-operator">操作人：{{ getUserName(drawerTask.userId) }}</p>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-if="drawerTask.assignedUserId"
              :timestamp="formatDate(drawerTask.createdAt)"
              placement="top"
              type="warning"
            >
              <div class="timeline-node">
                <strong>分配工人</strong>
                <p>指定维修工人：{{ getWorkerName(drawerTask.assignedUserId) }}</p>
                <p class="timeline-operator">状态变更为：已受理</p>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-if="drawerTask.status === '处理中' || drawerTask.status === '已完成'"
              placement="top"
              type="warning"
            >
              <div class="timeline-node">
                <strong>开始维修</strong>
                <p>维修工人已接受任务，开始处理</p>
                <p class="timeline-operator">状态变更为：处理中</p>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-if="drawerTask.status === '已完成' && drawerTask.completedAt"
              :timestamp="formatDate(drawerTask.completedAt)"
              placement="top"
              type="success"
            >
              <div class="timeline-node">
                <strong>维修完成</strong>
                <p>维修任务已完成，工单关闭</p>
                <p class="timeline-operator">状态变更为：已完成</p>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-if="drawerTask.status === '已驳回'"
              placement="top"
              type="danger"
            >
              <div class="timeline-node">
                <strong>任务退回</strong>
                <p>维修任务被退回</p>
                <p class="timeline-operator">状态变更为：已驳回</p>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-if="drawerTask.status === '已取消'"
              placement="top"
              type="info"
            >
              <div class="timeline-node">
                <strong>任务取消</strong>
                <p>维修任务已取消</p>
                <p class="timeline-operator">状态变更为：已取消</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useUserStore } from '@/stores/user'
import { useRepairOrderStore } from '@/stores/repairOrder'

// ==================== Store ====================
const blockStore = useDormitoryBlockStore()
const roomStore = useDormitoryRoomStore()
const userStore = useUserStore()
const orderStore = useRepairOrderStore()

// ==================== 状态 & 数据 ====================
const currentView = ref('all')
const searchKeyword = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const selectedTask = ref(null)

// Dialog
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  id: '',
  blockId: '',
  roomId: '',
  description: '',
  repairType: '水电',
  priority: '中',
  assignedUserId: '',
  remark: ''
})

// 分配
const assignVisible = ref(false)
const assignTask = ref(null)
const assignWorkerId = ref('')

// Drawer
const drawerVisible = ref(false)
const drawerTask = ref(null)

// ==================== 过滤 & 计算 ====================
const workers = computed(() => {
  return userStore.userList.filter(u => u.role === '维修工人')
})

const blocks = computed(() => {
  return blockStore.dormitoryBlockList
})

const filteredRooms = computed(() => {
  if (!form.value.blockId) return []
  return roomStore.dormitoryRoomList.filter(r => r.blockId === form.value.blockId)
})

const allOrders = computed(() => orderStore.repairOrderList)

const filteredList = computed(() => {
  let list = allOrders.value

  // 我的任务
  if (currentView.value === 'mine') {
    const workerIds = workers.value.map(w => w.id)
    list = list.filter(t => t.assignedUserId && workerIds.includes(t.assignedUserId))
  }

  // 关键词
  if (searchKeyword.value) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(t =>
      (t.id && t.id.toLowerCase().includes(kw)) ||
      (t.title && t.title.toLowerCase().includes(kw)) ||
      (t.description && t.description.toLowerCase().includes(kw))
    )
  }

  // 状态
  if (filterStatus.value) {
    list = list.filter(t => mapStatusColumn(t.status) === filterStatus.value)
  }

  // 日期
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(t => {
      const d = new Date(t.createdAt).getTime()
      return d >= start && d <= end
    })
  }

  return list
})

const mapStatusColumn = (status) => {
  if (['待审核', '已受理'].includes(status)) return 'pending'
  if (status === '处理中') return 'processing'
  if (['已完成', '已驳回', '已取消'].includes(status)) return 'completed'
  return 'pending'
}

const kanbanColumns = computed(() => {
  const pending = filteredList.value.filter(t => mapStatusColumn(t.status) === 'pending')
  const processing = filteredList.value.filter(t => mapStatusColumn(t.status) === 'processing')
  const completed = filteredList.value.filter(t => mapStatusColumn(t.status) === 'completed')

  return [
    { key: 'pending',  label: '待处理',   color: '#F59E0B', tagType: 'warning', tasks: pending },
    { key: 'processing', label: '处理中', color: '#3B82F6', tagType: 'primary', tasks: processing },
    { key: 'completed',  label: '已完成',   color: '#10B981', tagType: 'success', tasks: completed }
  ]
})

const totalCount = computed(() => allOrders.value.length)
const completedCount = computed(() => allOrders.value.filter(t => t.status === '已完成').length)
const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const todayCompleted = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const prefix = `${y}-${m}-${d}`
  return allOrders.value.filter(t =>
    t.status === '已完成' &&
    t.completedAt &&
    String(t.completedAt).startsWith(prefix)
  ).length
})

const progressColor = computed(() => {
  if (completionRate.value >= 80) return '#10B981'
  if (completionRate.value >= 50) return '#F59E0B'
  return '#EF4444'
})

// ==================== 辅助函数 ====================
const getRoomFullName = (roomId) => {
  if (!roomId) return '未知'
  const room = roomStore.dormitoryRoomList.find(r => r.id === roomId)
  if (!room) return '未知房间'
  const block = blockStore.dormitoryBlockList.find(b => b.id === room.blockId)
  const blockName = block ? block.name : '未知楼栋'
  return `${blockName} ${room.roomNumber}室`
}

const getUserName = (userId) => {
  if (!userId) return '未知'
  const u = userStore.userList.find(u => u.id === userId)
  return u ? u.name : '未知用户'
}

const getWorkerName = (userId) => {
  if (!userId) return ''
  const u = workers.value.find(w => w.id === userId)
  return u ? u.name : ''
}

const getStatusLabel = (status) => {
  const map = {
    '待审核': '待分配',
    '已受理': '已分配',
    '处理中': '进行中',
    '已完成': '已完成',
    '已驳回': '已关闭',
    '已取消': '已取消'
  }
  return map[status] || status
}

const getRepairType = (task) => {
  if (!task || !task.description) return '其他'
  const match = task.description.match(/^\[(水电|家具|门窗|其他)\]/)
  return match ? match[1] : '其他'
}

const priorityTagType = (p) => {
  const map = { '低': 'info', '中': 'warning', '高': 'danger', '紧急': 'danger' }
  return map[p] || 'info'
}

const formatDate = (val) => {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

const canOperate = (task) => {
  if (currentView.value === 'mine') {
    return task.assignedUserId === workers.value[0]?.id
  }
  return true
}

// ==================== 表单校验 ====================
const formRules = {
  blockId: [{ required: true, message: '请选择宿舍楼栋', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择房间号', trigger: 'change' }],
  description: [{ required: true, message: '请填写报修内容', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择紧急程度', trigger: 'change' }]
}

// ==================== 操作方法 ====================
const openAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: '',
    blockId: '',
    roomId: '',
    description: '',
    repairType: '水电',
    priority: '中',
    assignedUserId: '',
    remark: ''
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const openEditDialog = (task) => {
  isEdit.value = true
  const room = roomStore.dormitoryRoomList.find(r => r.id === task.roomId)
  const blockId = room ? room.blockId : ''
  form.value = {
    id: task.id,
    blockId: blockId,
    roomId: task.roomId || '',
    description: (task.description || task.title || '').replace(/^\[(水电|家具|门窗|其他)\]\s*/, ''),
    repairType: getRepairType(task),
    priority: task.priority || '中',
    assignedUserId: task.assignedUserId || '',
    remark: ''
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const repairType = form.value.repairType || '其他'
    const desc = `[${repairType}] ${form.value.description}${form.value.remark ? '\n备注：' + form.value.remark : ''}`

    const title = form.value.description.slice(0, 30)

    if (isEdit.value) {
      orderStore.update(form.value.id, {
        title: title,
        description: desc,
        roomId: form.value.roomId,
        priority: form.value.priority,
        assignedUserId: form.value.assignedUserId || null,
        updatedAt: now
      })
      ElMessage.success('任务已更新')
    } else {
      const newId = `repairorder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      orderStore.add({
        id: newId,
        title: title,
        description: desc,
        userId: getDefaultReporter(),
        roomId: form.value.roomId,
        assignedUserId: form.value.assignedUserId || null,
        status: '待审核',
        priority: form.value.priority,
        createdAt: now,
        completedAt: null
      })
      ElMessage.success('任务创建成功，编号：' + newId)
    }

    dialogVisible.value = false
    selectedTask.value = null
  })
}

const getDefaultReporter = () => {
  const student = userStore.userList.find(u => u.role === '学生')
  return student ? student.id : (userStore.userList[0]?.id || '')
}

const handleDelete = (task) => {
  if (['处理中', '已完成', '已受理', '已驳回', '已取消'].includes(task.status)) {
    ElMessage.warning('该任务已开始处理，无法删除')
    return
  }
  ElMessageBox.confirm('确认删除该维修任务？', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    orderStore.remove(task.id)
    if (selectedTask.value?.id === task.id) selectedTask.value = null
    ElMessage.success('维修任务已删除')
  }).catch(() => {})
}

const openAssignDialog = (task) => {
  assignTask.value = task
  assignWorkerId.value = task.assignedUserId || ''
  assignVisible.value = true
}

const confirmAssign = () => {
  if (!assignWorkerId.value) {
    ElMessage.warning('请选择维修工人')
    return
  }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  orderStore.update(assignTask.value.id, {
    assignedUserId: assignWorkerId.value,
    status: '已受理',
    updatedAt: now
  })
  assignVisible.value = false
  selectedTask.value = null
  ElMessage.success(`任务已分配给 ${getWorkerName(assignWorkerId.value)}`)
}

const handleAccept = (task) => {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  orderStore.update(task.id, {
    status: '处理中',
    updatedAt: now
  })
  selectedTask.value = null
  ElMessage.success('任务已接受，开始处理')
}

const handleComplete = (task) => {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  orderStore.update(task.id, {
    status: '已完成',
    completedAt: now,
    updatedAt: now
  })
  selectedTask.value = null
  ElMessage.success('维修任务已完成')
}

const handleReject = (task) => {
  ElMessageBox.confirm('确认退回该维修任务？', '退回确认', {
    confirmButtonText: '确认退回',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    orderStore.update(task.id, {
      status: '已驳回',
      updatedAt: now
    })
    selectedTask.value = null
    ElMessage.success('任务已退回')
  }).catch(() => {})
}

const openDrawer = (task) => {
  drawerTask.value = task
  drawerVisible.value = true
}

const selectTask = (task) => {
  selectedTask.value = task
}

const onBlockChange = () => {
  form.value.roomId = ''
}

const handleExport = () => {
  const list = filteredList.value
  if (list.length === 0) {
    ElMessage.info('暂无数据可导出')
    return
  }
  const header = '工单编号,宿舍位置,报修内容,紧急程度,报修人,指定工人,状态,创建时间,完成时间\n'
  const rows = list.map(t => {
    const room = getRoomFullName(t.roomId)
    const user = getUserName(t.userId)
    const worker = getWorkerName(t.assignedUserId)
    const desc = (t.description || t.title || '').replace(/"/g, '""')
    return `"${t.id}","${room}","${desc}","${t.priority}","${user}","${worker || ''}","${getStatusLabel(t.status)}","${formatDate(t.createdAt)}","${formatDate(t.completedAt)}"`
  }).join('\n')
  const csv = '\uFEFF' + header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `维修任务导出_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  ElMessage.success(`已导出 ${list.length} 条任务`)
}
</script>

<style scoped lang="scss">
@use './RepairTask.scss' as *;
</style>