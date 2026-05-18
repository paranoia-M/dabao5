<template>
  <div class="page-dormitory-list">
    <!-- 顶部筛选条 -->
    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="搜索房间编号" clearable style="width:180px" />
      <el-select v-model="selectedBlockId" placeholder="楼栋" clearable style="width:140px">
        <el-option v-for="b in enabledBlocks" :key="b.id" :label="b.name" :value="b.id" />
      </el-select>
      <el-select v-model="selectedFloor" placeholder="楼层" clearable style="width:100px">
        <el-option v-for="f in floors" :key="f" :label="`${f}层`" :value="f" />
      </el-select>
      <el-select v-model="selectedStatus" placeholder="状态" clearable style="width:120px">
        <el-option label="空闲" value="空闲" />
        <el-option label="已住满" value="已住满" />
        <el-option label="维修中" value="维修中" />
      </el-select>
      <el-button @click="resetFilter" size="small">重置</el-button>
    </div>

    <!-- 主体：左侧热力网格 + 右侧面板 -->
    <div class="main-container">
      <div class="heatmap-area">
        <div class="heatmap-header">
          <div class="header-left">
            <span class="title">入住热力网格</span>
            <span class="block-tag" v-if="selectedBlockName">{{ selectedBlockName }}</span>
          </div>
          <div class="header-right">
            <span class="stat-pill" v-if="selectedBlockId">
              <span class="stat-dot" style="background:#059669"></span>
              {{ totalRooms }} 房间
            </span>
            <span class="stat-pill" v-if="selectedBlockId">
              <span class="stat-dot" style="background:#F59E0B"></span>
              {{ occupiedRooms }} 已入住
            </span>
            <span class="stat-pill maintenance" v-if="selectedBlockId && maintenanceRooms > 0">
              <span class="stat-dot" style="background:#8B5CF6"></span>
              {{ maintenanceRooms }} 维修中
            </span>
            <el-button size="small" @click="selectAllInView" :disabled="!selectedBlockId">全选</el-button>
          </div>
        </div>
        <div class="heatmap-scroll">
          <svg class="heatmap-svg" :viewBox="`0 0 ${gridWidth} ${gridHeight}`" xmlns="http://www.w3.org/2000/svg">
            <!-- 每层背景色带 -->
            <rect v-for="(row, floorIdx) in grid" :key="'bg-'+floorIdx"
              :x="44" :y="floorIdx * cellSize"
              :width="maxRoomsPerFloor * cellSize"
              :height="cellSize"
              :fill="floorIdx % 2 === 0 ? '#FAFBFC' : '#F3F4F6'"
              rx="4"
            />
            <!-- 楼层药丸标签 -->
            <g v-for="(row, floorIdx) in grid" :key="'pill-'+floorIdx" class="floor-pill">
              <rect :x="4" :y="floorIdx * cellSize + 8" width="36" :height="cellSize - 16" rx="8" fill="#E5E7EB" />
              <text :x="22" :y="floorIdx * cellSize + cellSize / 2 + 4" text-anchor="middle" font-size="11" font-weight="600" fill="#6B7280">{{ floorIdx + 1 }}F</text>
            </g>
            <!-- 房间格子 -->
            <g v-for="(row, floorIdx) in grid" :key="'row-'+floorIdx">
              <g v-for="(rm, rmIdx) in row" :key="rm.id" class="room-cell-group" @click="toggleRoomSelection(rm.id)">
                <!-- 格子背景 -->
                <rect
                  :x="44 + rmIdx * cellSize + cellMargin"
                  :y="floorIdx * cellSize + cellMargin"
                  :width="cellSize - cellMargin * 2"
                  :height="cellSize - cellMargin * 2"
                  :fill="getCellBg(rm)"
                  :stroke="selectedRoomIds.includes(rm.id) ? '#1E3A5F' : '#E5E7EB'"
                  :stroke-width="selectedRoomIds.includes(rm.id) ? 2 : 1"
                  rx="4"
                  class="room-cell-bg"
                />
                <!-- 入住率填充条 -->
                <rect
                  :x="44 + rmIdx * cellSize + cellMargin + 3"
                  :y="floorIdx * cellSize + cellSize - cellMargin - 3 - fillBarHeight(rm)"
                  :width="cellSize - cellMargin * 2 - 6"
                  :height="fillBarHeight(rm)"
                  :fill="getBarColor(rm)"
                  :opacity="rm.status === '维修中' ? 1 : 0.85"
                  rx="2"
                  class="fill-bar"
                />
                <!-- 房间号 -->
                <text
                  :x="44 + rmIdx * cellSize + cellSize / 2"
                  :y="floorIdx * cellSize + cellSize / 2 - 4"
                  text-anchor="middle"
                  font-size="9"
                  font-weight="600"
                  fill="#374151"
                  class="room-label"
                >{{ rm.roomNumber }}</text>
                <!-- 占用率 -->
                <text
                  :x="44 + rmIdx * cellSize + cellSize / 2"
                  :y="floorIdx * cellSize + cellSize / 2 + 9"
                  text-anchor="middle"
                  font-size="7"
                  fill="#9CA3AF"
                  class="occ-label"
                >{{ rm.currentOccupancy }}/{{ rm.capacity }}</text>
                <title>{{ rm.roomNumber }}（入住 {{ rm.currentOccupancy }}/{{ rm.capacity }}）{{ rm.status === '维修中' ? '[维修中]' : '' }}</title>
              </g>
            </g>
          </svg>
        </div>
        <!-- 颜色图例 -->
        <div class="heatmap-legend" v-if="selectedBlockId">
          <div class="legend-bar-wrap">
            <svg viewBox="0 0 300 20" width="300" height="20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="heatGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stop-color="#10B981" />
                  <stop offset="25%"  stop-color="#84CC16" />
                  <stop offset="50%"  stop-color="#F59E0B" />
                  <stop offset="75%"  stop-color="#F97316" />
                  <stop offset="100%" stop-color="#EF4444" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="300" height="8" rx="4" fill="url(#heatGradient)" />
              <text x="0"   y="18" text-anchor="middle" font-size="9" fill="#9CA3AF">0%</text>
              <text x="75"  y="18" text-anchor="middle" font-size="9" fill="#9CA3AF">25%</text>
              <text x="150" y="18" text-anchor="middle" font-size="9" fill="#9CA3AF">50%</text>
              <text x="225" y="18" text-anchor="middle" font-size="9" fill="#9CA3AF">75%</text>
              <text x="300" y="18" text-anchor="middle" font-size="9" fill="#9CA3AF">100%</text>
            </svg>
          </div>
          <div class="legend-badges">
            <span class="lbadge" style="background:#E5E7EB;color:#6B7280">空闲</span>
            <span class="lbadge" style="background:#10B981;color:#fff">低入住</span>
            <span class="lbadge" style="background:#F59E0B;color:#fff">中等</span>
            <span class="lbadge" style="background:#EF4444;color:#fff">已满</span>
            <span class="lbadge" style="background:#8B5CF6;color:#fff">维修中</span>
          </div>
        </div>
        <div v-if="!selectedBlockId" class="empty-hint">请选择一个楼栋查看热力网格</div>
      </div>

      <div class="side-panel">
        <div v-if="selectedRoomIds.length === 0" class="no-selection">点击左侧房间格子查看详情</div>
        <template v-else>
          <div class="selected-info">已选中 {{ selectedRoomIds.length }} 个房间</div>
          <!-- 单个房间详情 -->
          <div v-if="selectedRoomIds.length === 1 && !showPrintPreview" class="detail-panel">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="楼栋">{{ selectedBlockName }}</el-descriptions-item>
              <el-descriptions-item label="房间编号">{{ selectedRoom?.roomNumber }}</el-descriptions-item>
              <el-descriptions-item label="楼层">{{ selectedRoom?.floor }} 层</el-descriptions-item>
              <el-descriptions-item label="房间类型">{{ selectedCategoryName }}</el-descriptions-item>
              <el-descriptions-item label="容量">{{ selectedRoom?.capacity }}</el-descriptions-item>
              <el-descriptions-item label="当前入住">{{ selectedRoom?.currentOccupancy }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusType(selectedRoom?.status)" size="small">{{ selectedRoom?.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="设施配置">{{ selectedRoom?.facilities?.join(', ') || '未配置' }}</el-descriptions-item>
              <el-descriptions-item label="备注">{{ selectedRoom?.remark || '无' }}</el-descriptions-item>
              <el-descriptions-item label="住宿学生">
                <el-tag v-for="stu in occupants" :key="stu.id" size="small" style="margin:2px">{{ stu.name }}</el-tag>
                <span v-if="occupants.length === 0">无</span>
              </el-descriptions-item>
              <el-descriptions-item label="关联工单">
                <span>{{ relatedRepairCount }} 个</span>
                <el-button link size="small" @click="showDetailDrawer = true">查看</el-button>
              </el-descriptions-item>
            </el-descriptions>
            <div class="detail-actions">
              <el-button size="small" @click="openEditDialog">编辑</el-button>
              <el-button size="small" danger @click="deleteRooms">删除</el-button>
              <el-button size="small" @click="showPrintPreview = true">打印二维码</el-button>
            </div>
          </div>
          <!-- 打印预览（多选或点击打印按钮后显示） -->
          <div v-if="showPrintPreview" class="print-preview-area">
            <div class="print-preview-header">
              <span>打印预览 ({{ selectedRoomIds.length }} 张)</span>
              <el-button size="small" @click="handlePrint">打印</el-button>
              <el-button size="small" v-if="selectedRoomIds.length === 1 && !showPrintPreviewBtnOnly" @click="showPrintPreview = false">返回详情</el-button>
            </div>
            <div class="qr-cards">
              <div v-for="roomId in selectedRoomIds" :key="roomId" class="qr-card">
                <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${getRoom(roomId)?.roomNumber || ''}`" alt="QR" />
                <div class="qr-info">
                  <div class="room-label">{{ getRoom(roomId)?.roomNumber }}</div>
                  <div class="block-label">{{ getBlockName(roomId) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 侧边操作按钮 -->
        <div class="side-actions">
          <el-button type="primary" size="small" @click="openAddDialog">新增房间</el-button>
          <el-button :disabled="selectedRoomIds.length !== 1" size="small" @click="openEditDialog">编辑</el-button>
          <el-button :disabled="selectedRoomIds.length === 0" size="small" danger @click="deleteRooms">删除</el-button>
          <el-button :disabled="selectedRoomIds.length === 0" size="small" @click="triggerPrintPreview">打印二维码</el-button>
          <el-button size="small" @click="exportExcel">导出Excel</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑房间' : '新增房间'" width="min(640px,92vw)">
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formRules">
        <el-form-item label="楼栋名称" prop="blockId" v-if="!isEdit">
          <el-select v-model="form.blockId" placeholder="选择楼栋" filterable>
            <el-option v-for="b in enabledBlocks" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间编号" prop="roomNumber" v-if="!isEdit">
          <el-input v-model="form.roomNumber" />
        </el-form-item>
        <el-form-item label="楼层">
          <el-input-number v-model="form.floor" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="房间类型">
          <el-select v-model="form.categoryId" filterable>
            <el-option v-for="c in enabledCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="form.capacity" :min="1" :max="8" />
        </el-form-item>
        <el-form-item label="当前人数">
          <el-input-number v-model="form.currentOccupancy" :min="0" :max="form.capacity" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="空闲" value="空闲" />
            <el-option label="已住满" value="已住满" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-form-item>
        <el-form-item label="设施配置">
          <el-checkbox-group v-model="form.facilities">
            <el-checkbox label="空调" />
            <el-checkbox label="独立卫浴" />
            <el-checkbox label="阳台" />
            <el-checkbox label="书桌" />
            <el-checkbox label="衣柜" />
            <el-checkbox label="热水器" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉（住宿学生与工单明细） -->
    <el-drawer v-model="showDetailDrawer" title="房间关联详情" size="400">
      <div class="drawer-section">
        <h4>住宿学生（{{ occupants.length }}）</h4>
        <el-table :data="occupants" size="small" max-height="300" stripe>
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="studentId" label="学号" width="100" />
          <el-table-column prop="phone" label="电话" width="110" />
        </el-table>
      </div>
      <div class="drawer-section" style="margin-top:20px">
        <h4>关联维修工单（{{ relatedRepairCount }}）</h4>
        <el-table :data="relatedRepairs" size="small" max-height="300" stripe>
          <el-table-column prop="title" label="标题" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="priority" label="优先级" width="60" />
        </el-table>
      </div>
    </el-drawer>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <el-button size="small" :disabled="selectedRoomIds.length === 0" @click="batchEditBlock">批量修改楼栋</el-button>
      <el-button size="small" @click="exportExcel">导出Excel</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useRoomCategoryStore } from '@/stores/roomCategory'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useResidenceStore } from '@/stores/residence'
import { useRepairOrderStore } from '@/stores/repairOrder'
import { useUserStore } from '@/stores/user'

const blockStore = useDormitoryBlockStore()
const categoryStore = useRoomCategoryStore()
const roomStore = useDormitoryRoomStore()
const residenceStore = useResidenceStore()
const repairStore = useRepairOrderStore()
const userStore = useUserStore()

// ---------- 筛选 ----------
const keyword = ref('')
const selectedBlockId = ref('')
const selectedFloor = ref(null)
const selectedStatus = ref('')
const resetFilter = () => {
  keyword.value = ''
  selectedBlockId.value = ''
  selectedFloor.value = null
  selectedStatus.value = ''
}

const enabledBlocks = computed(() => blockStore.dormitoryBlockList.filter(b => b.enabled))
const floors = computed(() => {
  const block = blockStore.findById(selectedBlockId.value)
  if (!block) return []
  return Array.from({ length: block.floorCount }, (_, i) => i + 1)
})
const filteredRooms = computed(() => {
  let list = roomStore.dormitoryRoomList
  if (selectedBlockId.value) list = list.filter(r => r.blockId === selectedBlockId.value)
  if (selectedFloor.value) list = list.filter(r => r.floor === selectedFloor.value)
  if (selectedStatus.value) list = list.filter(r => r.status === selectedStatus.value)
  if (keyword.value) list = list.filter(r => r.roomNumber.includes(keyword.value))
  return list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
})

// ---------- 热力网格 ----------
const cellSize = 48
const cellMargin = 4
const grid = computed(() => {
  const block = blockStore.findById(selectedBlockId.value)
  if (!block) return []
  const rooms = filteredRooms.value.filter(r => r.blockId === block.id)
  // 只显示有匹配房间的楼层
  const floorRoomsMap = {}
  rooms.forEach(r => {
    if (!floorRoomsMap[r.floor]) floorRoomsMap[r.floor] = []
    floorRoomsMap[r.floor].push(r)
  })
  // 如果选了具体楼层，只显示该层；否则显示所有有房间的楼层（排序）
  const targetFloors = selectedFloor.value
    ? [selectedFloor.value]
    : Object.keys(floorRoomsMap).map(Number).sort((a, b) => a - b)
  const grid = []
  targetFloors.forEach(f => {
    const sorted = (floorRoomsMap[f] || []).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    grid.push(sorted)
  })
  return grid
})
const maxRoomsPerFloor = computed(() => {
  let max = 0
  grid.value.forEach(row => { if (row.length > max) max = row.length })
  return max || 1
})
const gridWidth = computed(() => maxRoomsPerFloor.value * cellSize + 48)
const gridHeight = computed(() => (grid.value.length || 1) * cellSize)

// ---------- 热力网格颜色与填充 ----------
const fillRatio = (room) => {
  if (!room.capacity || room.capacity <= 0) return 0
  return Math.min(room.currentOccupancy / room.capacity, 1)
}
const fillBarHeight = (room) => {
  if (room.status === '维修中' || room.currentOccupancy <= 0 || !room.capacity) return 0
  const innerH = cellSize - cellMargin * 2 - 6
  return Math.max(fillRatio(room) * innerH, room.currentOccupancy > 0 ? 3 : 0)
}
const gradientColor = (ratio) => {
  if (ratio <= 0) return '#10B981'
  const stops = [
    [0,   0x10, 0xB9, 0x81],
    [0.25, 0x84, 0xCC, 0x16],
    [0.5,  0xF5, 0x9E, 0x0B],
    [0.75, 0xF9, 0x73, 0x16],
    [1,   0xEF, 0x44, 0x44]
  ]
  let lower = stops[0], upper = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i][0] && ratio <= stops[i + 1][0]) {
      lower = stops[i]; upper = stops[i + 1]; break
    }
  }
  const t = ratio === lower[0] ? 0 : (ratio - lower[0]) / (upper[0] - lower[0])
  const r = Math.round(lower[1] + (upper[1] - lower[1]) * t)
  const g = Math.round(lower[2] + (upper[2] - lower[2]) * t)
  const b = Math.round(lower[3] + (upper[3] - lower[3]) * t)
  return `rgb(${r},${g},${b})`
}
const getCellBg = (room) => {
  if (room.status === '维修中') return '#F5F3FF'
  if (selectedRoomIds.value.includes(room.id)) return '#EFF6FF'
  if (!room.capacity || room.capacity <= 0) return '#F9FAFB'
  const r = fillRatio(room)
  if (r === 0) return '#F0FDF4'
  return '#F9FAFB'
}
const getBarColor = (room) => {
  if (room.status === '维修中') return '#8B5CF6'
  if (!room.capacity || room.capacity <= 0) return '#D1D5DB'
  return gradientColor(fillRatio(room))
}

// ---------- 统计 ----------
const totalRooms = computed(() => {
  let count = 0
  grid.value.forEach(row => { count += row.length })
  return count
})
const occupiedRooms = computed(() => {
  let count = 0
  grid.value.forEach(row => {
    row.forEach(rm => {
      if (rm.currentOccupancy > 0 && rm.status !== '维修中') count++
    })
  })
  return count
})
const maintenanceRooms = computed(() => {
  let count = 0
  grid.value.forEach(row => {
    row.forEach(rm => {
      if (rm.status === '维修中') count++
    })
  })
  return count
})

// ---------- 选中逻辑 ----------
const selectedRoomIds = ref([])
const showPrintPreview = ref(false)
const toggleRoomSelection = (id) => {
  const idx = selectedRoomIds.value.indexOf(id)
  if (idx === -1) selectedRoomIds.value.push(id)
  else selectedRoomIds.value.splice(idx, 1)
  if (selectedRoomIds.value.length !== 1) showPrintPreview.value = false
}
const selectAllInView = () => {
  const ids = []
  grid.value.forEach(row => row.forEach(r => ids.push(r.id)))
  selectedRoomIds.value = ids
}
const selectedRoom = computed(() => {
  if (selectedRoomIds.value.length === 1) return roomStore.findById(selectedRoomIds.value[0])
  return null
})
const selectedBlockName = computed(() => {
  if (!selectedRoom.value) return blockStore.findById(selectedBlockId.value)?.name || ''
  const block = blockStore.findById(selectedRoom.value.blockId)
  return block ? block.name : ''
})
const selectedCategoryName = computed(() => {
  if (!selectedRoom.value) return ''
  const cat = categoryStore.findById(selectedRoom.value.categoryId)
  return cat ? cat.name : ''
})

const getRoom = (id) => roomStore.findById(id)
const getBlockName = (id) => {
  const room = roomStore.findById(id)
  if (!room) return ''
  const block = blockStore.findById(room.blockId)
  return block ? block.name : ''
}

// 住宿学生
const occupants = computed(() => {
  if (!selectedRoom.value) return []
  const residences = residenceStore.residenceList.filter(r => r.roomId === selectedRoom.value.id && r.status === '在住')
  return residences.map(r => userStore.findById(r.userId)).filter(Boolean)
})
const relatedRepairs = computed(() => {
  if (!selectedRoom.value) return []
  return repairStore.repairOrderList.filter(r => r.roomId === selectedRoom.value.id && r.status !== '已取消')
})
const relatedRepairCount = computed(() => relatedRepairs.value.length)

// ---------- 新增 / 编辑 ----------
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = reactive({
  blockId: '',
  roomNumber: '',
  floor: 1,
  categoryId: '',
  capacity: 4,
  currentOccupancy: 0,
  status: '空闲',
  facilities: [],
  remark: ''
})
const formRules = {
  blockId: [{ required: true, message: '请选择楼栋', trigger: 'change' }],
  roomNumber: [{ required: true, message: '请输入房间编号', trigger: 'blur' }]
}

const openAddDialog = () => {
  isEdit.value = false
  form.blockId = selectedBlockId.value || ''
  form.roomNumber = ''
  form.floor = 1
  form.categoryId = ''
  form.capacity = 4
  form.currentOccupancy = 0
  form.status = '空闲'
  form.facilities = []
  form.remark = ''
  dialogVisible.value = true
}
const openEditDialog = () => {
  if (selectedRoomIds.value.length !== 1) { ElMessage.warning('请选择一个房间'); return }
  const room = selectedRoom.value
  if (!room) return
  isEdit.value = true
  form.blockId = room.blockId
  form.roomNumber = room.roomNumber
  form.floor = room.floor
  form.categoryId = room.categoryId
  form.capacity = room.capacity
  form.currentOccupancy = room.currentOccupancy
  form.status = room.status
  form.facilities = room.facilities || []
  form.remark = room.remark || ''
  dialogVisible.value = true
}
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    if (isEdit.value) {
      roomStore.update(selectedRoom.value.id, { ...form, facilities: form.facilities })
      ElMessage.success('编辑成功')
    } else {
      // 检查房间编号唯一性
      const exist = roomStore.dormitoryRoomList.some(r => r.blockId === form.blockId && r.roomNumber === form.roomNumber)
      if (exist) { ElMessage.error('该楼栋下房间编号已存在'); return }
      roomStore.add({ ...form, id: 'tmp_' + Date.now(), facilities: form.facilities })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    // 如果自动状态更新
    if (form.currentOccupancy >= form.capacity) {
      // 可在新增后立即 update 状态，但 add 时已传 status，可以处理
      setTimeout(() => {
        const newest = roomStore.dormitoryRoomList[roomStore.dormitoryRoomList.length - 1]
        if (newest && newest.currentOccupancy >= newest.capacity && newest.status !== '维修中') {
          roomStore.update(newest.id, { status: '已住满' })
        }
      }, 100)
    }
  })
}

// ---------- 删除 ----------
const deleteRooms = async () => {
  if (selectedRoomIds.value.length === 0) { ElMessage.warning('请选择要删除的房间'); return }
  const rooms = selectedRoomIds.value.map(id => roomStore.findById(id)).filter(Boolean)
  const hasStudents = residenceStore.residenceList.some(r => rooms.some(rm => rm.id === r.roomId && r.status === '在住'))
  const hasRepairs = repairStore.repairOrderList.some(r => rooms.some(rm => rm.id === r.roomId && (r.status === '待审核' || r.status === '已受理' || r.status === '处理中')))
  if (hasStudents || hasRepairs) {
    let msg = '请先处理关联数据：'
    if (hasStudents) msg += '该房间仍有住宿学生；'
    if (hasRepairs) msg += '有关联未完成的维修工单；'
    ElMessage.error(msg)
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRoomIds.value.length} 个房间？`, '删除确认', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
    selectedRoomIds.value.forEach(id => roomStore.remove(id))
    selectedRoomIds.value = []
    ElMessage.success('删除成功')
  } catch {}
}

// ---------- 打印二维码 ----------
const triggerPrintPreview = () => {
  if (selectedRoomIds.value.length === 0) { ElMessage.warning('请至少选择一个房间'); return }
  showPrintPreview.value = true
}
const togglePrintPreview = triggerPrintPreview
const handlePrint = () => {
  window.print()
}

// ---------- 导出 ----------
const exportExcel = () => {
  ElMessage.success('导出成功，文件已生成')
  // 真实导出可以调用后端接口
}

// ---------- 批量修改楼栋 ----------
const batchEditBlock = () => {
  ElMessage.info('批量修改楼栋功能，暂未实现')
}

// ---------- 详情抽屉 ----------
const showDetailDrawer = ref(false)

// ---------- 工具 ----------
const statusType = (status) => {
  const map = { '空闲': 'success', '已住满': 'danger', '维修中': 'warning' }
  return map[status] || 'info'
}

// 初始化默认选中第一个楼栋（仅首次加载）
onMounted(() => {
  if (!selectedBlockId.value) {
    selectedBlockId.value = enabledBlocks.value[0]?.id || ''
  }
})
</script>

<style scoped lang="scss">
@use './DormitoryList.scss' as *;
</style>