<template>
  <div class="page-maintenance_orders">
    <!-- 顶部筛选和操作 -->
    <div class="toolbar">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item>
          <el-input v-model="filterForm.keyword" placeholder="搜索工单编号/设备名称" clearable style="width:240px" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width:130px">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="待质检" value="待质检" />
            <el-option label="已归档" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="filterForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="计划开始"
            end-placeholder="计划结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width:320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleAdd">+ 新增工单</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧工单列表 -->
      <div class="left-panel">
        <div v-if="paginatedOrders.length === 0" class="empty-placeholder">
          <el-empty description="暂无工单" />
        </div>
        <div v-else class="order-list">
          <div
            v-for="(order, index) in paginatedOrders"
            :key="order.id"
            class="order-card"
            :class="{ 'order-card--urgent': order.priority === '紧急', 'order-card--overdue': isOverdue(order), 'order-card--selected': selectedOrderId === order.id }"
            @click="selectOrder(order)"
          >
            <div class="order-status-bar" :style="{ background: statusColor(order.status) }"></div>
            <div class="order-main">
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <el-tag :type="statusTagType(order.status)" size="small">{{ statusLabel(order.status) }}</el-tag>
                <el-tag v-if="order.priority === '紧急'" type="danger" size="small" effect="dark">紧急</el-tag>
                <el-tag v-if="isOverdue(order)" type="danger" size="small" effect="dark" class="overdue-tag">逾期</el-tag>
              </div>
              <div class="order-body">
                <span class="order-device">{{ getEquipmentName(order.equipmentId) }}</span>
                <span class="order-assignee">{{ order.assignee || '-' }}</span>
              </div>
              <div class="order-footer">
                <el-button size="small" type="primary" link @click.stop="handleDetail(order)">详情</el-button>
                <el-button v-if="order.status === '待处理'" size="small" link @click.stop="handleEdit(order)">编辑</el-button>
                <el-button v-if="order.status === '待处理'" size="small" type="danger" link @click.stop="handleDelete(order)">删除</el-button>
                <el-button v-if="order.status === '待处理'" size="small" link @click.stop="handleStart(order)">开始处理</el-button>
                <el-button v-if="order.status === '处理中'" size="small" link @click.stop="handleComplete(order)">完成维修</el-button>
                <el-button v-if="order.status === '待质检'" size="small" link type="success" @click.stop="handleQaPass(order)">审核通过</el-button>
                <el-button v-if="order.status === '待质检'" size="small" link type="danger" @click.stop="handleQaReject(order)">审核驳回</el-button>
              </div>
            </div>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[15, 30, 50]"
            layout="total, sizes, prev, pager, next"
            :total="filteredOrders.length"
            small
          />
        </div>
      </div>

      <!-- 右侧主区域 -->
      <div class="right-panel">
        <div v-if="selectedOrder" class="selected-order-summary">
          <div class="summary-header">
            <span class="summary-id">{{ selectedOrder.id }}</span>
            <el-tag :type="statusTagType(selectedOrder.status)" size="small">{{ statusLabel(selectedOrder.status) }}</el-tag>
            <el-tag v-if="selectedOrder.priority === '紧急'" type="danger" size="small" effect="dark">紧急</el-tag>
          </div>
          <div class="summary-details">
            <div><label>设备：</label>{{ getEquipmentName(selectedOrder.equipmentId) }}</div>
            <div><label>负责人：</label>{{ selectedOrder.assignee || '-' }}</div>
            <div><label>计划时间：</label>{{ selectedOrder.planStartTime || '-' }} ~ {{ selectedOrder.planEndTime || '-' }}</div>
            <div><label>实际完成：</label>{{ selectedOrder.completeTime || '-' }}</div>
            <div><label>工单描述：</label>{{ selectedOrder.description }}</div>
          </div>
          <div class="summary-actions">
            <el-button size="small" @click="handleDetail(selectedOrder)">查看详情</el-button>
          </div>
        </div>
        <div class="device-dashboard">
          <div class="dashboard-title">设备健康仪表盘</div>
          <div class="dashboard-content">
            <div class="gauge-wrapper">
              <svg viewBox="0 0 200 120" class="gauge-svg">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#22c55e" />
                    <stop offset="50%" stop-color="#eab308" />
                    <stop offset="100%" stop-color="#ef4444" />
                  </linearGradient>
                </defs>
                <path d="M20,110 A90,90 0 0,1 180,110" fill="none" :stroke="gaugeArcColor" stroke-width="20" stroke-linecap="round" />
                <line :x1="gaugePointer.x1" :y1="gaugePointer.y1" :x2="gaugePointer.x2" :y2="gaugePointer.y2" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
                <circle cx="100" cy="110" r="6" fill="#1e293b" />
                <text x="100" y="95" text-anchor="middle" font-size="28" font-weight="bold" fill="#0f766e">{{ gaugeScore }}%</text>
              </svg>
            </div>
            <div class="gauge-info">
              <div class="info-item"><span class="label">设备名称</span><span class="value">{{ gaugeDeviceName || '-' }}</span></div>
              <div class="info-item"><span class="label">健康评分</span><span class="value">{{ gaugeScore }}</span></div>
              <div class="info-item"><span class="label">设备状态</span><span class="value" :style="{ color: gaugeStatusColor }">{{ gaugeStatus }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工单' : '新增工单'" width="min(800px, 92vw)" top="5vh" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="top" class="order-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单类型" prop="orderType">
              <el-select v-model="formData.orderType" placeholder="请选择">
                <el-option label="故障维修" value="故障维修" />
                <el-option label="定期维护" value="定期维护" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联设备" prop="equipmentId">
              <el-select v-model="formData.equipmentId" placeholder="请选择设备" filterable>
                <el-option-group v-for="line in productionLineList" :key="line.id" :label="line.name">
                  <el-option v-for="eq in lineEquipments(line.id)" :key="eq.id" :label="eq.name" :value="eq.id" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="formData.priority" placeholder="请选择">
                <el-option label="低" value="低" />
                <el-option label="中" value="中" />
                <el-option label="高" value="高" />
                <el-option label="紧急" value="紧急" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="assignee">
              <el-select v-model="formData.assignee" placeholder="请选择" multiple filterable allow-create default-first-option>
                <el-option v-for="user in userList" :key="user" :label="user" :value="user" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始时间" prop="planStartTime">
              <el-date-picker v-model="formData.planStartTime" type="datetime" placeholder="选择日期时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划完成时间" prop="planEndTime">
              <el-date-picker v-model="formData.planEndTime" type="datetime" placeholder="选择日期时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计工时(小时)" prop="estimatedHours">
              <el-input-number v-model="formData.estimatedHours" :min="0.5" :step="0.5" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修类型" prop="repairType">
              <el-select v-model="formData.repairType" placeholder="请选择">
                <el-option label="机械" value="机械" />
                <el-option label="电气" value="电气" />
                <el-option label="软件" value="软件" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否影响生产">
              <el-switch v-model="formData.affectProduction" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联报警">
              <el-select v-model="formData.alarmId" placeholder="选择未关闭报警" filterable clearable>
                <el-option v-for="alarm in openAlarms" :key="alarm.id" :label="alarm.description" :value="alarm.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工单描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="至少20字符" />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload ref="uploadRef" :file-list="formData.attachmentList" multiple accept=".jpg,.jpeg,.png,.pdf" :limit="5" :auto-upload="false">
            <el-button size="small" type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持jpg/png/pdf，单文件≤10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 流转弹窗：开始处理(简单确认) -->
    <el-dialog v-model="startDialogVisible" title="开始处理" width="400px">
      <p>确认开始处理工单【{{ selectedOrder?.id }}】？系统将记录开始时间并分配负责人。</p>
      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStart">确认</el-button>
      </template>
    </el-dialog>

    <!-- 完成维修弹窗 -->
    <el-dialog v-model="completeDialogVisible" title="完成维修" width="600px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="实际维修结果" required>
          <el-input v-model="completeForm.repairResult" type="textarea" :rows="3" placeholder="请填写维修结果" />
        </el-form-item>
        <el-form-item label="实际工时(小时)" required>
          <el-input-number v-model="completeForm.actualHours" :min="0.5" :step="0.5" :precision="1" />
        </el-form-item>
        <el-form-item label="更换备件">
          <el-select v-model="completeForm.spareParts" multiple filterable allow-create default-first-option placeholder="输入备件名称(可选)">
            <el-option v-for="sp in []" :key="sp" :label="sp" :value="sp" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认</el-button>
      </template>
    </el-dialog>

    <!-- 质检通过弹窗 -->
    <el-dialog v-model="qaPassDialogVisible" title="质检通过" width="500px">
      <el-form :model="qaForm" label-width="100px">
        <el-form-item label="质检结论" required>
          <el-input v-model="qaForm.conclusion" type="textarea" placeholder="填写质检结论" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qaPassDialogVisible = false">取消</el-button>
        <el-button type="success" @click="confirmQaPass">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 质检驳回弹窗 -->
    <el-dialog v-model="qaRejectDialogVisible" title="质检驳回" width="500px">
      <el-form :model="qaRejectForm" label-width="100px">
        <el-form-item label="驳回原因" required>
          <el-input v-model="qaRejectForm.reason" type="textarea" placeholder="填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qaRejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmQaReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="工单详情" size="700px" direction="rtl">
      <template v-if="detailOrder">
        <div class="detail-grid">
          <div class="detail-item"><label>工单编号</label><span>{{ detailOrder.id }}</span></div>
          <div class="detail-item"><label>工单类型</label><span>{{ detailOrder.orderType }}</span></div>
          <div class="detail-item"><label>关联设备</label><span>{{ getEquipmentName(detailOrder.equipmentId) }}</span></div>
          <div class="detail-item"><label>优先级</label><span>{{ detailOrder.priority }}</span></div>
          <div class="detail-item"><label>创建人</label><span>{{ detailOrder.assignee || '-' }}</span></div>
          <div class="detail-item"><label>创建时间</label><span>{{ detailOrder.planStartTime || '-' }}</span></div>
          <div class="detail-item"><label>状态</label><span>{{ statusLabel(detailOrder.status) }}</span></div>
          <div class="detail-item"><label>负责人</label><span>{{ detailOrder.assignee || '-' }}</span></div>
          <div class="detail-item"><label>计划开始时间</label><span>{{ detailOrder.planStartTime || '-' }}</span></div>
          <div class="detail-item"><label>计划完成时间</label><span>{{ detailOrder.planEndTime || '-' }}</span></div>
          <div class="detail-item"><label>实际开始时间</label><span>{{ detailOrder.actualStartTime || '-' }}</span></div>
          <div class="detail-item"><label>实际完成时间</label><span>{{ detailOrder.completeTime || '-' }}</span></div>
          <div class="detail-item"><label>预计工时</label><span>{{ detailOrder.estimatedHours || '-' }}小时</span></div>
          <div class="detail-item"><label>实际工时</label><span>{{ detailOrder.actualHours || '-' }}小时</span></div>
          <div class="detail-item"><label>维修结果</label><span>{{ detailOrder.repairResult || '-' }}</span></div>
          <div class="detail-item"><label>质检结果</label><span>{{ detailOrder.qualityResult || '-' }}</span></div>
          <div class="detail-item"><label>驳回原因</label><span>{{ detailOrder.rejectReason || '-' }}</span></div>
          <div class="detail-item full-width"><label>附件列表</label><span>{{ detailOrder.attachmentList ? detailOrder.attachmentList.map(f=>f.name).join(', ') : '无' }}</span></div>
        </div>
        <el-divider>关联数据</el-divider>
        <div class="related-section">
          <h4>设备信息</h4>
          <p>设备状态：{{ getEquipmentStatus(detailOrder.equipmentId) }}</p>
          <p>安装日期：{{ getEquipmentInstallDate(detailOrder.equipmentId) }}</p>
        </div>
        <div class="related-section">
          <h4>维修日志</h4>
          <p class="empty-text">暂无维修日志</p>
        </div>
        <div class="related-section">
          <h4>备件使用记录</h4>
          <p class="empty-text">暂无备件使用记录</p>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMaintenanceOrderStore } from '@/stores/maintenanceOrder'
import { useEquipmentStore } from '@/stores/equipment'
import { useProductionLineStore } from '@/stores/productionLine'
import { useAlarmRecordStore } from '@/stores/alarmRecord'
import { ElMessage, ElMessageBox } from 'element-plus'

const maintenanceOrderStore = useMaintenanceOrderStore()
const equipmentStore = useEquipmentStore()
const productionLineStore = useProductionLineStore()
const alarmRecordStore = useAlarmRecordStore()

// ---------- 数据 ----------
const allOrders = computed(() => maintenanceOrderStore.maintenanceOrderList || [])
const equipmentList = computed(() => equipmentStore.equipmentList || [])
const productionLineList = computed(() => productionLineStore.productionLineList || [])
const alarmRecordList = computed(() => alarmRecordStore.alarmRecordList || [])

// 当前用户（模拟登录用户为 张伟）
const currentUser = '张伟'

// 负责人列表（从各store提取）
const userList = computed(() => {
  const users = new Set()
  allOrders.value.forEach(o => {
    if (o.assignee) users.add(o.assignee)
    if (o.handler) users.add(o.handler)
  })
  productionLineList.value.forEach(p => { if (p.manager) users.add(p.manager) })
  maintenanceOrderList?.length // 触发依赖
  return Array.from(users).length > 0 ? Array.from(users) : ['张伟', '李娜', '王芳', '刘洋']
})

// 打开报警列表（未关闭）
const openAlarms = computed(() => alarmRecordList.value.filter(a => a.status !== '已处理'))

// ---------- 筛选 ----------
const filterForm = ref({
  keyword: '',
  status: '', // 全部
  dateRange: [] // 初始空数组
})

const resetFilter = () => {
  filterForm.value = { keyword: '', status: '', dateRange: [] }
}

const filteredOrders = computed(() => {
  let list = allOrders.value
  const { keyword, status, dateRange } = filterForm.value
  if (keyword) {
    const kw = keyword.toLowerCase()
    list = list.filter(o => o.id.toLowerCase().includes(kw) || getEquipmentName(o.equipmentId).toLowerCase().includes(kw))
  }
  if (status) {
    list = list.filter(o => (status === '已归档' ? o.status === '已完成' : o.status === status))
  }
  if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
    const start = new Date(dateRange[0]).getTime()
    const end = new Date(dateRange[1]).getTime()
    list = list.filter(o => {
      const t = o.planStartTime ? new Date(o.planStartTime).getTime() : null
      return t && t >= start && t <= end
    })
  }
  // 按创建时间降序（用id中的数字部分模拟）
  list.sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0
    return numB - numA
  })
  return list
})

// 分页
const currentPage = ref(1)
const pageSize = ref(15)
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})
watch(filteredOrders, () => { currentPage.value = 1 })

// ---------- 选择 & 工具函数 ----------
const selectedOrderId = ref(null)
const selectedOrder = computed(() => allOrders.value.find(o => o.id === selectedOrderId.value) || null)
const selectOrder = (order) => { selectedOrderId.value = order.id }

// 设备信息
const getEquipmentName = (id) => {
  const eq = equipmentList.value.find(e => e.id === id)
  return eq ? eq.name : '未知设备'
}
const lineEquipments = (lineId) => equipmentList.value.filter(e => e.productionLineId === lineId)
const getEquipmentStatus = (id) => {
  const eq = equipmentList.value.find(e => e.id === id)
  return eq ? eq.status : '-'
}
const getEquipmentInstallDate = (id) => {
  const eq = equipmentList.value.find(e => e.id === id)
  return eq ? eq.installDate : '-'
}

// 状态映射
const statusLabel = (status) => {
  const map = { '待处理': '待处理', '处理中': '处理中', '待质检': '待质检', '已完成': '已归档', '驳回': '处理中' }
  return map[status] || status
}
const statusColor = (status) => {
  const map = { '待处理': '#f59e0b', '处理中': '#3b82f6', '待质检': '#8b5cf6', '已完成': '#22c55e', '驳回': '#ef4444' }
  return map[status] || '#9ca3af'
}
const statusTagType = (status) => {
  const map = { '待处理': 'warning', '处理中': 'primary', '待质检': '', '已完成': 'success', '驳回': 'danger' }
  return map[status] || 'info'
}
const isOverdue = (order) => {
  if (!order.planEndTime) return false
  if (order.status === '已完成' || order.status === '待质检') return false
  return new Date(order.planEndTime).getTime() < Date.now()
}

// 仪表盘数据
const gaugeScore = computed(() => {
  if (!selectedOrder.value) return 0
  const eq = equipmentList.value.find(e => e.id === selectedOrder.value.equipmentId)
  return eq ? (Number.isFinite(eq.healthScore) ? eq.healthScore : 0) : 0
})
const gaugeDeviceName = computed(() => getEquipmentName(selectedOrder.value?.equipmentId))
const gaugeStatus = computed(() => getEquipmentStatus(selectedOrder.value?.equipmentId))
const gaugeStatusColor = computed(() => {
  const s = gaugeStatus.value
  if (s === '运行') return '#22c55e'
  if (s === '警告') return '#eab308'
  if (s === '故障') return '#ef4444'
  if (s === '停机') return '#9ca3af'
  return '#6b7280'
})
const gaugeArcColor = computed(() => {
  const s = gaugeScore.value
  if (s >= 80) return '#22c55e'
  if (s >= 60) return '#eab308'
  return '#ef4444'
})
const gaugePointer = computed(() => {
  const score = Math.min(100, Math.max(0, gaugeScore.value))
  const angle = (score / 100) * Math.PI // 0~π
  const r = 80
  const cx = 100, cy = 110
  const x1 = cx - r * Math.cos(angle)
  const y1 = cy - r * Math.sin(angle)
  const x2 = cx + r * Math.cos(angle)
  const y2 = cy - r * Math.sin(angle)
  // 指针从圆弧顶点指向圆心到刻度点
  return {
    x1: cx - (r - 10) * Math.cos(angle),
    y1: cy - (r - 10) * Math.sin(angle),
    x2: cx - 30 * Math.cos(angle),
    y2: cy - 30 * Math.sin(angle)
  }
})

// 默认选中第一个工单
onMounted(() => {
  if (allOrders.value.length > 0) {
    selectedOrderId.value = allOrders.value[0].id
  }
})

// ---------- 新增/编辑 ----------
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const editId = ref('')
const defaultForm = () => ({
  orderType: '故障维修',
  equipmentId: '',
  priority: '中',
  assignee: [],
  planStartTime: '',
  planEndTime: '',
  estimatedHours: 1,
  repairType: '机械',
  affectProduction: false,
  alarmId: '',
  description: '',
  attachmentList: []
})
const formData = ref({ ...defaultForm() })

const formRules = {
  orderType: [{ required: true, message: '请选择工单类型' }],
  equipmentId: [{ required: true, message: '请选择设备' }],
  priority: [{ required: true, message: '请选择优先级' }],
  assignee: [{ required: true, message: '请选择负责人' }],
  planStartTime: [{ required: true, message: '请选择计划开始时间' }],
  planEndTime: [{ required: true, message: '请选择计划完成时间' }],
  description: [
    { required: true, message: '请填写工单描述' },
    { min: 20, message: '描述至少20个字符' }
  ]
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = ''
  formData.value = { ...defaultForm() }
  dialogVisible.value = true
}

const handleEdit = (order) => {
  isEdit.value = true
  editId.value = order.id
  formData.value = {
    orderType: order.orderType || '故障维修',
    equipmentId: order.equipmentId || '',
    priority: order.priority || '中',
    assignee: order.assignee ? order.assignee.split(',') : [],
    planStartTime: order.planStartTime || '',
    planEndTime: order.planEndTime || '',
    estimatedHours: order.estimatedHours || 1,
    repairType: order.repairType || '机械',
    affectProduction: order.affectProduction || false,
    alarmId: order.alarmId || '',
    description: order.description || '',
    attachmentList: order.attachmentList || []
  }
  dialogVisible.value = true
}

const confirmForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const form = { ...formData.value }
  form.assignee = Array.isArray(form.assignee) ? form.assignee.join(',') : form.assignee
  if (isEdit.value) {
    maintenanceOrderStore.update(editId.value, form)
    ElMessage.success('编辑成功')
  } else {
    // 生成编号
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
    const maxSeq = allOrders.value.reduce((max, o) => {
      const m = o.id.match(/MT\d{8}(\d{4})/)
      return m ? Math.max(max, parseInt(m[1])) : max
    }, 0)
    const newSeq = String(maxSeq + 1).padStart(4, '0')
    const newId = `MT${dateStr}${newSeq}`
    const newOrder = {
      id: newId,
      ...form,
      status: '待处理',
      createTime: now.toISOString()
    }
    maintenanceOrderStore.add(newOrder)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
}

// ---------- 删除 ----------
const handleDelete = async (order) => {
  await ElMessageBox.confirm(
    `确定删除工单[${order.id}]？删除后不可恢复。若已关联备件/日志，不允许删除。`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  )
  // 这里模拟检查关联（无备件和日志store，默认允许）
  maintenanceOrderStore.remove(order.id)
  ElMessage.success('删除成功')
}

// ---------- 流转 ----------
const startDialogVisible = ref(false)
const handleStart = (order) => {
  selectedOrderId.value = order.id
  startDialogVisible.value = true
}
const confirmStart = () => {
  const order = selectedOrder.value
  if (!order) return
  maintenanceOrderStore.update(order.id, {
    status: '处理中',
    actualStartTime: new Date().toISOString(),
    assignee: currentUser
  })
  // 更新设备状态为维修中
  const eq = equipmentList.value.find(e => e.id === order.equipmentId)
  if (eq) equipmentStore.update(eq.id, { status: '故障' })
  // 关联报警改为已确认
  if (order.alarmId) alarmRecordStore.update(order.alarmId, { status: '已确认' })
  startDialogVisible.value = false
  ElMessage.success('工单已开始处理')
}

const completeDialogVisible = ref(false)
const completeForm = ref({ repairResult: '', actualHours: 1, spareParts: [] })
const handleComplete = (order) => {
  selectedOrderId.value = order.id
  completeForm.value = { repairResult: '', actualHours: 1, spareParts: [] }
  completeDialogVisible.value = true
}
const confirmComplete = () => {
  if (!completeForm.value.repairResult.trim()) {
    ElMessage.warning('请填写实际维修结果')
    return
  }
  const order = selectedOrder.value
  if (!order) return
  maintenanceOrderStore.update(order.id, {
    status: '待质检',
    repairResult: completeForm.value.repairResult,
    actualHours: completeForm.value.actualHours,
    completeTime: new Date().toISOString()
  })
  completeDialogVisible.value = false
  ElMessage.success('维修完成，等待质检')
}

const qaPassDialogVisible = ref(false)
const qaForm = ref({ conclusion: '' })
const handleQaPass = (order) => {
  selectedOrderId.value = order.id
  qaForm.value = { conclusion: '' }
  qaPassDialogVisible.value = true
}
const confirmQaPass = () => {
  if (!qaForm.value.conclusion.trim()) {
    ElMessage.warning('请填写质检结论')
    return
  }
  const order = selectedOrder.value
  if (!order) return
  maintenanceOrderStore.update(order.id, {
    status: '已完成',
    qualityResult: '通过',
    qualityComment: qaForm.value.conclusion
  })
  // 更新设备状态为正常
  const eq = equipmentList.value.find(e => e.id === order.equipmentId)
  if (eq) equipmentStore.update(eq.id, { status: '运行' })
  // 关联报警改为已处理
  if (order.alarmId) alarmRecordStore.update(order.alarmId, { status: '已处理' })
  qaPassDialogVisible.value = false
  ElMessage.success('质检通过，工单已归档')
}

const qaRejectDialogVisible = ref(false)
const qaRejectForm = ref({ reason: '' })
const handleQaReject = (order) => {
  selectedOrderId.value = order.id
  qaRejectForm.value = { reason: '' }
  qaRejectDialogVisible.value = true
}
const confirmQaReject = () => {
  if (!qaRejectForm.value.reason.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const order = selectedOrder.value
  if (!order) return
  maintenanceOrderStore.update(order.id, {
    status: '处理中',
    qualityResult: '驳回',
    rejectReason: qaRejectForm.value.reason
  })
  qaRejectDialogVisible.value = false
  ElMessage.success('质检驳回，工单已回退至处理中')
}

// ---------- 详情 ----------
const drawerVisible = ref(false)
const detailOrder = ref(null)
const handleDetail = (order) => {
  detailOrder.value = order
  drawerVisible.value = true
}

// ---------- 导出 ----------
const handleExport = () => {
  const data = filteredOrders.value.map(o => ({
    '工单编号': o.id,
    '设备名称': getEquipmentName(o.equipmentId),
    '工单类型': o.orderType,
    '优先级': o.priority,
    '状态': statusLabel(o.status),
    '负责人': o.assignee,
    '计划完成时间': o.planEndTime || '',
    '实际工时': o.actualHours || '',
    '质检结果': o.qualityResult || ''
  }))
  if (data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  if (data.length > 10000) {
    ElMessage.warning('数据量超过10000条，请分批导出')
    return
  }
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `工单导出_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
@use './MaintenanceOrders.scss' as *;
</style>