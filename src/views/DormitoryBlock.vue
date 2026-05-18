<template>
  <div class="page-dormitory-block">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 新增楼栋
      </el-button>
      <el-button icon="Download" @click="handleExport">导出</el-button>

      <div class="search-area">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索楼栋名称或编号"
          clearable
          prefix-icon="Search"
          @input="onSearch"
          style="width: 240px"
        />
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px; margin-left: 8px">
          <el-option label="全部" value="" />
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
        <el-button @click="onSearch" type="primary" style="margin-left: 8px">搜索</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <el-table
      :data="pagedBlocks"
      stripe
      highlight-current-row
      @row-click="handleRowClick"
      style="width: 100%"
      class="block-table"
    >
      <el-table-column prop="name" label="楼栋名称" min-width="120" />
      <el-table-column prop="code" label="楼栋编号" width="100" />
      <el-table-column prop="floorCount" label="层数" width="80" />
      <el-table-column prop="roomsPerFloor" label="每层房间数" width="100" />
      <el-table-column label="总房间数" width="100">
        <template #default="scope">
          {{ scope.row.floorCount * scope.row.roomsPerFloor }}
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="small">
            {{ scope.row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button link type="primary" size="small" @click.stop="handleDetail(scope.row)">详情</el-button>
          <el-button link type="primary" size="small" @click.stop="handleEdit(scope.row)">编辑</el-button>
          <el-button
            link
            :type="scope.row.enabled ? 'warning' : 'success'"
            size="small"
            @click.stop="handleToggleEnabled(scope.row)"
          >
            {{ scope.row.enabled ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" size="small" @click.stop="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredBlocks.length"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="onPageChange"
        @size-change="onPageSizeChange"
      />
    </div>

    <!-- 下方主舞台：左迁移轨迹 + 右楼栋详情 -->
    <div class="main-stage">
      <!-- 左侧招牌迁移轨迹 -->
      <div class="migration-panel">
        <div class="panel-header">
          <span class="panel-title">宿舍迁移轨迹</span>
          <el-tag v-if="selectedBlock" type="info" size="small">{{ selectedBlock.name }}</el-tag>
        </div>
        <div v-if="migrationEvents.length === 0" class="empty-state">
          <el-empty description="暂无迁移记录" />
        </div>
        <div v-else class="migration-timeline-svg">
          <svg width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid meet">
            <!-- 水平基线 -->
            <line x1="30" y1="60" x2="770" y2="60" stroke="#ccc" stroke-width="2" />
            <!-- 箭头 -->
            <polygon points="770,56 780,60 770,64" fill="#ccc" />
            <!-- 时间线上节点 -->
            <g v-for="(evt, idx) in migrationEvents.slice(0, 20)" :key="idx">
              <!-- 节点圆 -->
              <circle
                :cx="30 + (idx + 1) * (740 / Math.min(migrationEvents.length, 20))"
                cy="60"
                r="8"
                :fill="evt.type === '迁入' ? '#059669' : '#DC2626'"
                stroke="#fff"
                stroke-width="2"
                class="event-node"
                @mouseenter="showEventTooltip($event, evt)"
                @mouseleave="hideEventTooltip"
              />
              <!-- 上方标签（学生姓名+房间号） -->
              <text
                :x="30 + (idx + 1) * (740 / Math.min(migrationEvents.length, 20))"
                y="40"
                text-anchor="middle"
                font-size="10"
                fill="#333"
              >{{ evt.name }} {{ evt.roomNumber }}</text>
              <!-- 下方日期 -->
              <text
                :x="30 + (idx + 1) * (740 / Math.min(migrationEvents.length, 20))"
                y="80"
                text-anchor="middle"
                font-size="9"
                fill="#888"
              >{{ evt.date }}</text>
            </g>
          </svg>
          <!-- 自定义 tooltip -->
          <div v-if="tooltipVisible" class="migration-tooltip" :style="tooltipStyle">
            <div><strong>{{ tooltipData.name }}</strong></div>
            <div>房间：{{ tooltipData.roomNumber }}</div>
            <div>动作：{{ tooltipData.type }}</div>
            <div>日期：{{ tooltipData.date }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧楼栋详情配置面板 -->
      <div class="config-panel">
        <div class="panel-header">
          <span class="panel-title">楼栋配置</span>
          <el-button v-if="selectedBlock" link type="primary" @click="handleEdit(selectedBlock)">编辑</el-button>
        </div>
        <div v-if="!selectedBlock" class="empty-state">
          <el-empty description="请选择一个楼栋" />
        </div>
        <div v-else class="config-content">
          <div class="config-field">
            <label>楼栋名称</label>
            <span>{{ selectedBlock.name }}</span>
          </div>
          <div class="config-field">
            <label>楼栋编号</label>
            <span>{{ selectedBlock.code || '-' }}</span>
          </div>
          <div class="config-field">
            <label>层数</label>
            <span>{{ selectedBlock.floorCount }}</span>
          </div>
          <div class="config-field">
            <label>每层房间数</label>
            <span>{{ selectedBlock.roomsPerFloor }}</span>
          </div>
          <div class="config-field">
            <label>总房间数</label>
            <span>{{ selectedBlock.floorCount * selectedBlock.roomsPerFloor }}</span>
          </div>
          <div class="config-field">
            <label>状态</label>
            <el-tag :type="selectedBlock.enabled ? 'success' : 'info'" size="small">
              {{ selectedBlock.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="config-stats">
            <div class="stat-item">
              <span class="stat-value">{{ roomCountInBlock }}</span>
              <span class="stat-label">总房间数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ occupiedRoomCount }}</span>
              <span class="stat-label">已占用房间</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ residentCountInBlock }}</span>
              <span class="stat-label">当前住宿学生</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '编辑楼栋' : '新增楼栋'"
      width="min(640px, 92vw)"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入楼栋名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼栋编号" prop="code">
              <el-input v-model="formData.code" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="层数" prop="floorCount">
              <el-input-number v-model="formData.floorCount" :min="1" :max="100" :disabled="isEditing && hasOccupied" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每层房间数" prop="roomsPerFloor">
              <el-input-number v-model="formData.roomsPerFloor" :min="1" :max="50" :disabled="isEditing && hasOccupied" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit" :loading="formSubmitting">确认{{ isEditing ? '编辑' : '新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="楼栋详情" :size="500" destroy-on-close>
      <template v-if="detailData">
        <div class="detail-grid">
          <div class="detail-field" v-for="(value, key) in detailFields" :key="key">
            <label>{{ key }}</label>
            <span>{{ value }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-stats">
          <div class="stat-card">
            <div class="stat-value">{{ detailRoomTotal }}</div>
            <div class="stat-label">总房间数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ detailOccupiedRooms }}</div>
            <div class="stat-label">已占用房间数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ detailResidentCount }}</div>
            <div class="stat-label">当前住宿学生数</div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useResidenceStore } from '@/stores/residence'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const blockStore = useDormitoryBlockStore()
const roomStore = useDormitoryRoomStore()
const residenceStore = useResidenceStore()
const userStore = useUserStore()

// 筛选
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 选中行
const selectedBlockId = ref(null)
const selectedBlock = computed(() => {
  if (!selectedBlockId.value) return null
  return blockStore.findById(selectedBlockId.value)
})

// 计算过滤后的列表
const filteredBlocks = computed(() => {
  let list = blockStore.dormitoryBlockList.slice()
  if (filterStatus.value !== '' && filterStatus.value !== null) {
    const boolVal = filterStatus.value === true
    list = list.filter(item => item.enabled === boolVal)
  }
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(item =>
      item.name.toLowerCase().includes(kw) ||
      (item.code && item.code.toLowerCase().includes(kw))
    )
  }
  list.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  return list
})

const pagedBlocks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBlocks.value.slice(start, start + pageSize.value)
})

// 迁移轨迹
const migrationEvents = computed(() => {
  if (!selectedBlockId.value) return []
  const blockId = selectedBlockId.value
  // 找到该楼栋所有房间
  const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === blockId)
  const roomIds = rooms.map(r => r.id)
  // 找到这些房间的住宿记录
  const residences = residenceStore.residenceList.filter(res => roomIds.includes(res.roomId))
  const userMap = {}
  userStore.userList.forEach(u => { userMap[u.id] = u.name })
  const events = []
  residences.forEach(res => {
    const room = rooms.find(r => r.id === res.roomId)
    const roomNumber = room ? room.roomNumber : '?'
    const userName = userMap[res.userId] || '未知'
    if (res.moveInDate) {
      events.push({
        date: res.moveInDate,
        name: userName,
        roomNumber,
        type: '迁入'
      })
    }
    if (res.moveOutDate && res.status === '已退宿') {
      events.push({
        date: res.moveOutDate,
        name: userName,
        roomNumber,
        type: '迁出'
      })
    }
  })
  events.sort((a, b) => a.date.localeCompare(b.date))
  return events
})

// 右侧统计
const roomCountInBlock = computed(() => {
  if (!selectedBlockId.value) return 0
  return roomStore.dormitoryRoomList.filter(r => r.blockId === selectedBlockId.value).length
})
const occupiedRoomCount = computed(() => {
  if (!selectedBlockId.value) return 0
  const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === selectedBlockId.value)
  return rooms.filter(r => r.currentOccupancy > 0).length
})
const residentCountInBlock = computed(() => {
  if (!selectedBlockId.value) return 0
  const roomIds = roomStore.dormitoryRoomList.filter(r => r.blockId === selectedBlockId.value).map(r => r.id)
  return residenceStore.residenceList.filter(res => roomIds.includes(res.roomId) && res.status === '在住').length
})

// 详情抽屉数据
const showDetailDrawer = ref(false)
const detailData = ref(null)
const detailFields = computed(() => {
  if (!detailData.value) return {}
  const d = detailData.value
  return {
    '楼栋名称': d.name,
    '楼栋编号': d.code || '-',
    '层数': d.floorCount,
    '每层房间数': d.roomsPerFloor,
    '总房间数': d.floorCount * d.roomsPerFloor,
    '状态': d.enabled ? '启用' : '禁用',
    '创建时间': d.createdAt || '-',
    '更新时间': d.updatedAt || '-'
  }
})
const detailRoomTotal = computed(() => {
  if (!detailData.value) return 0
  return detailData.value.floorCount * detailData.value.roomsPerFloor
})
const detailOccupiedRooms = computed(() => {
  if (!detailData.value) return 0
  const blockId = detailData.value.id
  const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === blockId)
  return rooms.filter(r => r.currentOccupancy > 0).length
})
const detailResidentCount = computed(() => {
  if (!detailData.value) return 0
  const blockId = detailData.value.id
  const roomIds = roomStore.dormitoryRoomList.filter(r => r.blockId === blockId).map(r => r.id)
  return residenceStore.residenceList.filter(res => roomIds.includes(res.roomId) && res.status === '在住').length
})

// tooltip
const tooltipVisible = ref(false)
const tooltipData = ref({})
const tooltipStyle = ref({})

function showEventTooltip(e, evt) {
  const rect = e.target.getBoundingClientRect()
  tooltipData.value = evt
  tooltipStyle.value = {
    left: rect.left + 'px',
    top: rect.top - 40 + 'px'
  }
  tooltipVisible.value = true
}
function hideEventTooltip() {
  tooltipVisible.value = false
}

// 操作函数
const showAddDialog = ref(false)
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const formSubmitting = ref(false)
const formData = ref({
  name: '',
  code: '',
  floorCount: 1,
  roomsPerFloor: 1,
  enabled: true,
  remark: ''
})
const formRules = {
  name: [
    { required: true, message: '请输入楼栋名称', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!value.trim()) return
      const exists = blockStore.dormitoryBlockList.some(item =>
        item.name === value.trim() && item.id !== editingId.value
      )
      if (exists) callback(new Error('楼栋名称已存在'))
      else callback()
    }, trigger: 'blur' }
  ],
  floorCount: [
    { required: true, message: '请输入层数', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '层数范围 1-100', trigger: 'blur' }
  ],
  roomsPerFloor: [
    { required: true, message: '请输入每层房间数', trigger: 'blur' },
    { type: 'number', min: 1, max: 50, message: '房间数范围 1-50', trigger: 'blur' }
  ]
}
const hasOccupied = computed(() => {
  if (!editingId.value) return false
  const blockId = editingId.value
  const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === blockId)
  return rooms.some(r => r.currentOccupancy > 0)
})

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', code: '', floorCount: 1, roomsPerFloor: 1, enabled: true, remark: '' }
  showFormDialog.value = true
}

function handleEdit(row) {
  isEditing.value = true
  editingId.value = row.id
  formData.value = {
    name: row.name,
    code: row.code || '',
    floorCount: row.floorCount,
    roomsPerFloor: row.roomsPerFloor,
    enabled: row.enabled,
    remark: row.remark || ''
  }
  showFormDialog.value = true
}

async function handleFormSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  formSubmitting.value = true
  try {
    if (isEditing.value) {
      blockStore.update(editingId.value, {
        name: formData.value.name.trim(),
        code: formData.value.code.trim(),
        floorCount: formData.value.floorCount,
        roomsPerFloor: formData.value.roomsPerFloor,
        enabled: formData.value.enabled,
        remark: formData.value.remark
      })
      ElMessage.success('更新成功')
    } else {
      blockStore.add({
        name: formData.value.name.trim(),
        code: formData.value.code.trim(),
        floorCount: formData.value.floorCount,
        roomsPerFloor: formData.value.roomsPerFloor,
        enabled: formData.value.enabled,
        remark: formData.value.remark
      })
      ElMessage.success('新增成功')
    }
    showFormDialog.value = false
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    formSubmitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该楼栋吗？删除后不可恢复。', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 检查关联
      const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === row.id)
      if (rooms.length > 0) {
        ElMessage.error('该楼栋下存在房间或学生住宿记录，无法删除')
        return
      }
      blockStore.remove(row.id)
      ElMessage.success('删除成功')
      if (selectedBlockId.value === row.id) selectedBlockId.value = null
    } catch (err) {
      ElMessage.error(err.message || '删除失败')
    }
  }).catch(() => {})
}

function handleToggleEnabled(row) {
  const action = row.enabled ? '禁用' : '启用'
  const msg = row.enabled
    ? '确定要禁用该楼栋吗？禁用后无法在住宿安排中选择该楼栋。'
    : '确定要启用该楼栋吗？'
  ElMessageBox.confirm(msg, '操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    if (row.enabled) {
      // 检查是否有住宿学生
      const rooms = roomStore.dormitoryRoomList.filter(r => r.blockId === row.id)
      const roomIds = rooms.map(r => r.id)
      const residents = residenceStore.residenceList.filter(res => roomIds.includes(res.roomId) && res.status === '在住')
      if (residents.length > 0) {
        ElMessage.warning(`该楼栋仍有 ${residents.length} 名学生住宿，禁用将影响其楼栋选择`)
      }
    }
    blockStore.update(row.id, { enabled: !row.enabled })
    ElMessage.success(`已${action}`)
  }).catch(() => {})
}

function handleDetail(row) {
  detailData.value = row
  showDetailDrawer.value = true
}

function handleExport() {
  // 本示例中模拟导出，实际应为调用接口下载
  ElMessage.success('导出成功，文件已生成')
}

function handleRowClick(row) {
  selectedBlockId.value = row.id
}

function onSearch() {
  currentPage.value = 1
}

function onReset() {
  searchKeyword.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

function onPageChange(page) {
  currentPage.value = page
}

function onPageSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

// 默认选中第一条
watch(() => blockStore.dormitoryBlockList, (list) => {
  if (list.length > 0 && !selectedBlockId.value) {
    selectedBlockId.value = list[0].id
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use './DormitoryBlock.scss' as *;
</style>