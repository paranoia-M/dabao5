<template>
  <div class="page-repair-center">
    <!-- 顶部提示条 -->
    <el-alert
      title="欢迎使用报修中心 — 请先点击左侧床位图选择房间，然后填写右侧报修表单提交"
      type="info"
      show-icon
      :closable="false"
      class="top-alert"
    />

    <!-- 筛选与操作区 -->
    <div class="filter-bar card-wrap">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="工单编号/报修人"
          clearable
          class="filter-item"
          @input="handleFilter"
        />
        <el-select v-model="filterStatus" placeholder="工单状态" clearable class="filter-item" @change="handleFilter">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="待审核" />
          <el-option label="待分配" value="待分配" />
          <el-option label="维修中" value="维修中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
        <el-date-picker
          v-model="filterDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
          class="filter-item"
          @change="handleFilter"
        />
        <el-button type="primary" @click="resetFilter" class="filter-item">重置</el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" @click="openAddDialog">新增报修</el-button>
        <el-button @click="handleExport">导出Excel</el-button>
      </div>
    </div>

    <!-- 主体区域：左床位图 + 右快速报修 -->
    <div class="main-body">
      <!-- 左：床位占用图 -->
      <div class="bed-map-wrapper card-wrap">
        <div class="section-header">
          <span class="header-dot" />
          <span>床位占用图</span>
        </div>
        <div class="bed-block-selector">
          <el-radio-group v-model="selectedBlockId" @change="onBlockChange">
            <el-radio-button
              v-for="block in dormitoryBlockList"
              :key="block.id"
              :value="block.id"
            >{{ block.name }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="bed-svg-container" ref="bedSvgRef">
          <svg
            :width="svgWidth"
            :height="svgHeight"
            :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g v-for="(room, idx) in currentBlockRooms" :key="room.id">
              <rect
                :x="room.x"
                :y="room.y"
                :width="roomCellW"
                :height="roomCellH"
                stroke="#ccc"
                stroke-width="1"
                :fill="room.bgColor"
                rx="4"
                class="room-rect"
                @click="selectRoom(room)"
              />
              <text
                :x="room.x + roomCellW / 2"
                :y="room.y + roomCellH / 2 - 4"
                text-anchor="middle"
                font-size="10"
                fill="#333"
                class="room-number"
              >{{ room.roomNumber }}</text>
              <text
                :x="room.x + roomCellW / 2"
                :y="room.y + roomCellH / 2 + 10"
                text-anchor="middle"
                font-size="8"
                :fill="room.occupyColor"
              >{{ room.occupied }}/{{ room.capacity }}</text>
            </g>
          </svg>
        </div>
        <div class="bed-legend">
          <span class="legend-item"><span class="dot green" />空闲/可住</span>
          <span class="legend-item"><span class="dot red" />已住满</span>
          <span class="legend-item"><span class="dot yellow" />维修中</span>
        </div>
      </div>

      <!-- 右：快速报修表单 + 当前房间信息 -->
      <div class="quick-repair-wrapper card-wrap">
        <div class="section-header">
          <span class="header-dot" />
          <span>快速报修</span>
        </div>
        <div class="current-room-info" v-if="selectedRoom">
          <el-descriptions title="当前选中房间" :column="2" border size="small">
            <el-descriptions-item label="楼栋">{{ selectedBlockName }}</el-descriptions-item>
            <el-descriptions-item label="房间号">{{ selectedRoom.roomNumber }}</el-descriptions-item>
            <el-descriptions-item label="楼层">{{ selectedRoom.floor }}</el-descriptions-item>
            <el-descriptions-item label="容量/已住">{{ selectedRoom.capacity }}/{{ selectedRoom.occupied }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedRoom.status === '空闲' ? 'success' : 'warning'">{{ selectedRoom.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-divider />
        <el-form :model="repairForm" label-width="80px" size="small" ref="repairFormRef">
          <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请填写报修标题' }]">
            <el-input v-model="repairForm.title" placeholder="如：灯管故障" />
          </el-form-item>
          <el-form-item label="故障类型" prop="faultType" :rules="[{ required: true, message: '请选择故障类型' }]">
            <el-select v-model="repairForm.faultType" placeholder="选择故障类型">
              <el-option label="水电故障" value="水电故障" />
              <el-option label="门窗家具" value="门窗家具" />
              <el-option label="电器设备" value="电器设备" />
              <el-option label="网络通讯" value="网络通讯" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述" prop="description" :rules="[{ required: true, message: '请描述故障' }, { max: 500, message: '不超过500字' }]">
            <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="详细描述故障情况（不超过500字）" />
          </el-form-item>
          <el-form-item label="联系人" prop="contactName" :rules="[{ required: true, message: '请输入联系人' }]">
            <el-input v-model="repairForm.contactName" placeholder="报修人姓名" />
          </el-form-item>
          <el-form-item label="手机号" prop="contactPhone" :rules="[{ required: true, pattern: /^1\d{10}$/, message: '请输入11位手机号' }]">
            <el-input v-model="repairForm.contactPhone" placeholder="报修人手机" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="repairForm.remark" placeholder="可选备注" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitRepair">提交报修</el-button>
            <el-button @click="resetRepairForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 工单明细列表 -->
    <div class="order-list-section card-wrap">
      <div class="section-header">
        <span class="header-dot" />
        <span>工单列表</span>
        <span class="order-count">（共 {{ filteredOrders.length }} 条）</span>
      </div>
      <el-table
        :data="paginatedOrders"
        stripe
        border
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="id" label="工单编号" width="180" />
        <el-table-column label="报修人" width="100">
          <template #default="{ row }">
            {{ getUserName(row.userId) }}
          </template>
        </el-table-column>
        <el-table-column label="房间" width="120">
          <template #default="{ row }">
            {{ getRoomInfo(row.roomId) }}
          </template>
        </el-table-column>
        <el-table-column prop="faultType" label="故障类型" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetailDrawer(row)">详情</el-button>
            <el-button link type="warning" @click.stop="openEditDialog(row)" v-if="row.status === '待审核' || row.status === '已驳回'">编辑</el-button>
            <el-button link type="danger" @click.stop="handleDelete(row)" v-if="row.status === '待审核' || row.status === '已驳回'">删除</el-button>
            <el-button link type="success" @click.stop="openAuditDialog(row)" v-if="currentUserRole === '宿舍管理员' && row.status === '待审核'">审核</el-button>
            <el-button link type="primary" @click.stop="openAssignDialog(row)" v-if="currentUserRole === '宿舍管理员' && row.status === '待分配'">分配</el-button>
            <el-button link type="warning" @click.stop="startRepair(row)" v-if="currentUserRole === '维修工人' && (row.status === '待分配' || row.status === '维修中') && row.assignedUserId === currentUserId">开始维修</el-button>
            <el-button link type="success" @click.stop="completeRepair(row)" v-if="currentUserRole === '维修工人' && row.status === '维修中' && row.assignedUserId === currentUserId">完成维修</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filteredOrders.length"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="editingOrder ? '编辑工单' : '新增报修工单'"
      width="min(640px, 92vw)"
      :close-on-click-modal="false"
      @close="resetAddForm"
    >
      <el-form :model="addForm" label-width="90px" ref="addFormRef" :rules="addFormRules">
        <el-form-item label="所在楼栋" prop="blockId" :rules="[{ required: true, message: '请选择楼栋' }]">
          <el-select v-model="addForm.blockId" placeholder="选择楼栋" @change="onAddBlockChange">
            <el-option v-for="b in dormitoryBlockList" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间号" prop="roomId" :rules="[{ required: true, message: '请选择房间' }]">
          <el-select v-model="addForm.roomId" placeholder="选择房间">
            <el-option v-for="r in filteredRoomsForAdd" :key="r.id" :label="r.roomNumber" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障类型" prop="faultType" :rules="[{ required: true, message: '请选择故障类型' }]">
          <el-select v-model="addForm.faultType" placeholder="选择故障类型">
            <el-option label="水电故障" value="水电故障" />
            <el-option label="门窗家具" value="门窗家具" />
            <el-option label="电器设备" value="电器设备" />
            <el-option label="网络通讯" value="网络通讯" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题' }]">
          <el-input v-model="addForm.title" placeholder="报修标题" />
        </el-form-item>
        <el-form-item label="故障描述" prop="description" :rules="[{ required: true, message: '请输入描述' }, { max: 500, message: '不超过500字' }]">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="详细描述故障" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName" :rules="[{ required: true, message: '请输入联系人' }]">
          <el-input v-model="addForm.contactName" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="contactPhone" :rules="[{ required: true, pattern: /^1\d{10}$/, message: '请输入11位手机号' }]">
          <el-input v-model="addForm.contactPhone" placeholder="联系人手机" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认{{ editingOrder ? '更新' : '提交' }}</el-button>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditDialogVisible" title="审核工单" width="min(500px, 92vw)">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.action">
            <el-radio value="approve">通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="驳回原因" v-if="auditForm.action === 'reject'" :rules="[{ required: true, message: '请填写驳回原因' }]">
          <el-input v-model="auditForm.rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分配维修工弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="分配维修工" width="min(400px, 92vw)">
      <el-select v-model="assignWorkerId" placeholder="选择维修工" style="width:100%">
        <el-option v-for="w in workerList" :key="w.id" :label="w.name" :value="w.id" />
      </el-select>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 完成维修弹窗 -->
    <el-dialog v-model="completeDialogVisible" title="完成维修" width="min(500px, 92vw)">
      <el-form :model="completeForm" label-width="80px">
        <el-form-item label="维修结果" prop="result" :rules="[{ required: true, message: '请输入维修结果' }]">
          <el-input v-model="completeForm.result" type="textarea" :rows="3" placeholder="维修结果描述" />
        </el-form-item>
        <el-form-item label="耗材">
          <el-input v-model="completeForm.materials" placeholder="使用耗材（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="工单详情" size="min(600px, 90vw)" :with-header="true">
      <template v-if="detailOrder">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单编号">{{ detailOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ getUserName(detailOrder.userId) }}</el-descriptions-item>
          <el-descriptions-item label="房间">{{ getRoomInfo(detailOrder.roomId) }}</el-descriptions-item>
          <el-descriptions-item label="故障类型">{{ detailOrder.faultType }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detailOrder.status)">{{ detailOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">{{ detailOrder.priority }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailOrder.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ detailOrder.completedAt || '未完成' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailOrder.contactName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailOrder.contactPhone }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <p><strong>故障描述：</strong></p>
        <p>{{ detailOrder.description }}</p>
        <p v-if="detailOrder.remark"><strong>备注：</strong>{{ detailOrder.remark }}</p>
        <p v-if="detailOrder.reviewComment"><strong>审核意见：</strong>{{ detailOrder.reviewComment }}</p>
        <p v-if="detailOrder.assignedUserId"><strong>维修工：</strong>{{ getUserName(detailOrder.assignedUserId) }}</p>
        <p v-if="detailOrder.materials"><strong>耗材：</strong>{{ detailOrder.materials }}</p>
      </template>
      <template #footer>
        <el-button @click="detailDrawerVisible = false">关闭</el-button>
        <el-button @click="printDetail">打印</el-button>
      </template>
    </el-drawer>

    <!-- 学生详情弹窗（床位点击） -->
    <el-dialog v-model="studentDetailVisible" title="学生信息" width="min(400px, 92vw)">
      <template v-if="currentStudent">
        <p>姓名：{{ currentStudent.name }}</p>
        <p>学号：{{ currentStudent.studentId }}</p>
        <p>电话：{{ currentStudent.phone }}</p>
        <p>床位：{{ currentBedDetail?.bedNumber }}</p>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useUserStore } from '@/stores/user'
import { useResidenceStore } from '@/stores/residence'
import { useRepairOrderStore } from '@/stores/repairOrder'

// Stores
const dormitoryBlockStore = useDormitoryBlockStore()
const dormitoryRoomStore = useDormitoryRoomStore()
const userStore = useUserStore()
const residenceStore = useResidenceStore()
const repairOrderStore = useRepairOrderStore()

// 当前用户（假设取第一个宿舍管理员）
const currentUser = computed(() => {
  return userStore.userList.find(u => u.role === '宿舍管理员') || userStore.userList[0]
})
const currentUserId = computed(() => currentUser.value?.id || '')
const currentUserRole = computed(() => currentUser.value?.role || '')

// 获取用户名
function getUserName(userId) {
  const u = userStore.userList.find(u => u.id === userId)
  return u ? u.name : '未知'
}

// 获取房间信息
function getRoomInfo(roomId) {
  const r = dormitoryRoomStore.dormitoryRoomList.find(r => r.id === roomId)
  if (!r) return '未知'
  const block = dormitoryBlockStore.dormitoryBlockList.find(b => b.id === r.blockId)
  return block ? `${block.name} ${r.roomNumber}` : r.roomNumber
}

// 状态标签类型
function statusTag(status) {
  const map = {
    '待审核': 'warning',
    '待分配': 'info',
    '维修中': 'primary',
    '已完成': 'success',
    '已驳回': 'danger'
  }
  return map[status] || 'info'
}

// ========== 筛选 ==========
const searchKeyword = ref('')
const filterStatus = ref('')
const filterDateRange = ref([])

const filteredOrders = computed(() => {
  let list = repairOrderStore.repairOrderList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(o => {
      const userName = getUserName(o.userId).toLowerCase()
      return o.id.toLowerCase().includes(kw) ||
             userName.includes(kw) ||
             (o.description && o.description.toLowerCase().includes(kw))
    })
  }
  if (filterStatus.value) {
    list = list.filter(o => o.status === filterStatus.value)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2 && filterDateRange.value[0] && filterDateRange.value[1]) {
    const start = new Date(filterDateRange.value[0]).getTime()
    const end = new Date(filterDateRange.value[1]).getTime() + 86400000
    list = list.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return t >= start && t <= end
    })
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

function handleFilter() {}
function resetFilter() {
  searchKeyword.value = ''
  filterStatus.value = ''
  filterDateRange.value = []
  pageNo.value = 1
}

// 分页
const pageNo = ref(1)
const pageSize = ref(20)
const paginatedOrders = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})
function handlePageSizeChange() {
  pageNo.value = 1
}

// ========== 床位图相关 ==========
const dormitoryBlockList = computed(() => dormitoryBlockStore.dormitoryBlockList)
const selectedBlockId = ref(dormitoryBlockList.value.length > 0 ? dormitoryBlockList.value[0].id : '')
const selectedBlockName = computed(() => {
  const b = dormitoryBlockList.value.find(b => b.id === selectedBlockId.value)
  return b ? b.name : ''
})

const currentBlockRooms = computed(() => {
  if (!selectedBlockId.value) return []
  const rooms = dormitoryRoomStore.dormitoryRoomList.filter(r => r.blockId === selectedBlockId.value)
  // 排序：楼层升序，房间号升序
  rooms.sort((a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber))
  // 布局：每行 4 个房间
  const cols = 4
  const cellW = 140
  const cellH = 80
  const gap = 10
  const padding = 10
  const rows = Math.ceil(rooms.length / cols)
  const svgW = cols * (cellW + gap) + padding * 2 - gap
  const svgH = rows * (cellH + gap) + padding * 2 - gap
  svgWidth.value = svgW
  svgHeight.value = svgH

  return rooms.map((room, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = padding + col * (cellW + gap)
    const y = padding + row * (cellH + gap)
    // 计算占用数据
    const residences = residenceStore.residenceList.filter(res => res.roomId === room.id && res.status === '在住')
    const occupied = residences.length
    let bgColor = '#e6f7e6' // 空闲
    if (room.status === '维修中') bgColor = '#fff9c4'
    else if (occupied >= room.capacity) bgColor = '#ffcdd2'
    const occupyColor = occupied >= room.capacity ? '#f44336' : '#4caf50'
    return {
      ...room,
      x,
      y,
      occupied,
      bgColor,
      occupyColor
    }
  })
})

const svgWidth = ref(600)
const svgHeight = ref(400)
const roomCellW = 140
const roomCellH = 80

const selectedRoom = ref(null)
function selectRoom(room) {
  selectedRoom.value = room
  // 自动填充快速报修表单的房间信息
  repairForm.roomId = room.id
  repairForm.title = ''
  repairForm.description = ''
  repairForm.contactName = currentUser.value?.name || ''
  repairForm.contactPhone = currentUser.value?.phone || ''
  repairForm.remark = ''
}

function onBlockChange() {
  selectedRoom.value = null
  repairForm.roomId = ''
  // 重置选定房间
}

// 点击床位显示学生详情（这里点击房间弹出床位详情，可以加一个二级点击，但简化直接点击房间弹出该房间的床位列表？）
const studentDetailVisible = ref(false)
const currentStudent = ref(null)
const currentBedDetail = ref(null)
// 不复杂实现，仅展示占位

// ========== 快速报修表单 ==========
const repairFormRef = ref(null)
const repairForm = ref({
  title: '',
  faultType: '',
  description: '',
  contactName: '',
  contactPhone: '',
  remark: '',
  roomId: ''
})
function submitRepair() {
  if (!repairForm.value.roomId) {
    ElMessage.warning('请先点击左侧床位图选择房间')
    return
  }
  if (!repairFormRef.value) return
  repairFormRef.value.validate((valid) => {
    if (!valid) return
    // 构造工单
    const newOrder = {
      id: `RO_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: repairForm.value.title,
      description: repairForm.value.description,
      faultType: repairForm.value.faultType,
      userId: currentUserId.value,
      roomId: repairForm.value.roomId,
      status: '待审核',
      priority: '中',
      contactName: repairForm.value.contactName,
      contactPhone: repairForm.value.contactPhone,
      remark: repairForm.value.remark,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      completedAt: null
    }
    repairOrderStore.add(newOrder)
    ElMessage.success('报修已提交')
    resetRepairForm()
  })
}
function resetRepairForm() {
  repairForm.value = {
    title: '',
    faultType: '',
    description: '',
    contactName: currentUser.value?.name || '',
    contactPhone: currentUser.value?.phone || '',
    remark: '',
    roomId: selectedRoom.value?.id || ''
  }
}

// ========== 新增/编辑弹窗 ==========
const addDialogVisible = ref(false)
const editingOrder = ref(null)
const addFormRef = ref(null)
const addForm = ref({
  blockId: '',
  roomId: '',
  faultType: '',
  title: '',
  description: '',
  contactName: '',
  contactPhone: '',
  remark: ''
})
const addFormRules = {
  blockId: [{ required: true, message: '请选择楼栋' }],
  roomId: [{ required: true, message: '请选择房间' }],
  faultType: [{ required: true, message: '请选择故障类型' }],
  title: [{ required: true, message: '请输入标题' }],
  description: [{ required: true, message: '请输入描述' }, { max: 500, message: '不超过500字' }],
  contactName: [{ required: true, message: '请输入联系人' }],
  contactPhone: [{ required: true, pattern: /^1\d{10}$/, message: '请输入11位手机号' }]
}
const filteredRoomsForAdd = computed(() => {
  if (!addForm.value.blockId) return []
  return dormitoryRoomStore.dormitoryRoomList.filter(r => r.blockId === addForm.value.blockId)
})
function onAddBlockChange() {
  addForm.value.roomId = ''
}
function openAddDialog() {
  editingOrder.value = null
  addForm.value = {
    blockId: '',
    roomId: '',
    faultType: '',
    title: '',
    description: '',
    contactName: currentUser.value?.name || '',
    contactPhone: currentUser.value?.phone || '',
    remark: ''
  }
  addDialogVisible.value = true
}
function openEditDialog(order) {
  editingOrder.value = order
  // 找到房间的楼栋
  const room = dormitoryRoomStore.dormitoryRoomList.find(r => r.id === order.roomId)
  addForm.value = {
    blockId: room ? room.blockId : '',
    roomId: order.roomId,
    faultType: order.faultType,
    title: order.title,
    description: order.description,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    remark: order.remark
  }
  addDialogVisible.value = true
}
function confirmAdd() {
  if (!addFormRef.value) return
  addFormRef.value.validate((valid) => {
    if (!valid) return
    if (editingOrder.value) {
      // 更新
      repairOrderStore.update(editingOrder.value.id, {
        title: addForm.value.title,
        description: addForm.value.description,
        faultType: addForm.value.faultType,
        roomId: addForm.value.roomId,
        contactName: addForm.value.contactName,
        contactPhone: addForm.value.contactPhone,
        remark: addForm.value.remark,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
      ElMessage.success('工单已更新')
    } else {
      const newOrder = {
        id: `RO_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: addForm.value.title,
        description: addForm.value.description,
        faultType: addForm.value.faultType,
        userId: currentUserId.value,
        roomId: addForm.value.roomId,
        status: '待审核',
        priority: '中',
        contactName: addForm.value.contactName,
        contactPhone: addForm.value.contactPhone,
        remark: addForm.value.remark,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        completedAt: null
      }
      repairOrderStore.add(newOrder)
      ElMessage.success('工单已创建')
    }
    addDialogVisible.value = false
  })
}
function resetAddForm() {
  editingOrder.value = null
}

// ========== 删除 ==========
function handleDelete(order) {
  ElMessageBox.confirm('确认删除该报修工单？', '提示', { type: 'warning' })
    .then(() => {
      // 检查是否关联已完成维修
      const hasCompleted = order.status === '已完成' // 简化判断
      if (hasCompleted) {
        ElMessage.warning('该工单已关联维修记录，不可删除')
        return
      }
      repairOrderStore.remove(order.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}

// ========== 审核 ==========
const auditDialogVisible = ref(false)
const auditOrderId = ref('')
const auditForm = ref({ action: 'approve', rejectReason: '' })
function openAuditDialog(order) {
  auditOrderId.value = order.id
  auditForm.value = { action: 'approve', rejectReason: '' }
  auditDialogVisible.value = true
}
function confirmAudit() {
  if (auditForm.value.action === 'approve') {
    repairOrderStore.update(auditOrderId.value, { status: '待分配', reviewComment: '审核通过' })
    ElMessage.success('工单已通过，待分配')
  } else {
    if (!auditForm.value.rejectReason) {
      ElMessage.warning('请填写驳回原因')
      return
    }
    repairOrderStore.update(auditOrderId.value, { status: '已驳回', reviewComment: auditForm.value.rejectReason })
    ElMessage.success('工单已驳回')
  }
  auditDialogVisible.value = false
}

// ========== 分配 ==========
const assignDialogVisible = ref(false)
const assignOrderId = ref('')
const assignWorkerId = ref('')
const workerList = computed(() => userStore.userList.filter(u => u.role === '维修工人'))
function openAssignDialog(order) {
  assignOrderId.value = order.id
  assignWorkerId.value = ''
  assignDialogVisible.value = true
}
function confirmAssign() {
  if (!assignWorkerId.value) {
    ElMessage.warning('请选择维修工')
    return
  }
  repairOrderStore.update(assignOrderId.value, { assignedUserId: assignWorkerId.value, status: '维修中' })
  ElMessage.success('已分配维修工')
  assignDialogVisible.value = false
}

// ========== 开始维修 ==========
function startRepair(order) {
  repairOrderStore.update(order.id, { status: '维修中' })
  ElMessage.success('已开始维修')
}

// ========== 完成维修 ==========
const completeDialogVisible = ref(false)
const completeOrderId = ref('')
const completeForm = ref({ result: '', materials: '' })
function completeRepair(order) {
  completeOrderId.value = order.id
  completeForm.value = { result: '', materials: '' }
  completeDialogVisible.value = true
}
function confirmComplete() {
  if (!completeForm.value.result) {
    ElMessage.warning('请填写维修结果')
    return
  }
  repairOrderStore.update(completeOrderId.value, {
    status: '已完成',
    completedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    result: completeForm.value.result,
    materials: completeForm.value.materials
  })
  ElMessage.success('维修已完成')
  completeDialogVisible.value = false
}

// ========== 导出 ==========
function handleExport() {
  ElMessage.success('正在导出工单列表... (模拟导出)')
  // 实际可调用blob下载，这里仅示意
}

// ========== 详情抽屉 ==========
const detailDrawerVisible = ref(false)
const detailOrder = ref(null)
function openDetailDrawer(order) {
  detailOrder.value = order
  detailDrawerVisible.value = true
}
function printDetail() {
  window.print()
}

// ========== 行点击（快速查看详情） ==========
function handleRowClick(row) {
  openDetailDrawer(row)
}

// 初始化默认联系人
onMounted(() => {
  if (currentUser.value) {
    repairForm.value.contactName = currentUser.value.name
    repairForm.value.contactPhone = currentUser.value.phone
  }
})
</script>

<style scoped lang="scss">
@use './RepairCenter.scss' as *;
</style>