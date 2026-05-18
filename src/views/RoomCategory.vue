<template>
  <div class="page-room-category">
    <!-- 顶部信息条 -->
    <div class="rc-top-banner">
      <div class="banner-left">
        <span class="banner-icon">
          <el-icon :size="22"><Setting /></el-icon>
        </span>
        <div class="banner-text">
          <h2>房间类型配置</h2>
          <p>管理宿舍房间类型字典，维护基础配置信息</p>
        </div>
      </div>
      <div class="banner-right">
        <div class="banner-stat">
          <span class="stat-label">类型总数</span>
          <span class="stat-value">{{ roomCategoryStore.total }}</span>
        </div>
        <div class="banner-stat">
          <span class="stat-label">启用</span>
          <span class="stat-value stat-active">{{ enabledCount }}</span>
        </div>
        <div class="banner-stat">
          <span class="stat-label">禁用</span>
          <span class="stat-value stat-inactive">{{ disabledCount }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="rc-filter-bar">
      <div class="filter-left">
        <el-input
          v-model="keyword"
          placeholder="搜索类型名称"
          clearable
          class="filter-input"
          @keyup.enter="doSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" clearable class="filter-select" @change="doSearch">
          <el-option label="全部" value="" />
          <el-option label="启用" value="启用" />
          <el-option label="禁用" value="禁用" />
        </el-select>
        <el-select v-model="capacityFilter" placeholder="床位容量" clearable class="filter-select" @change="doSearch">
          <el-option label="所有" value="0" />
          <el-option label="1-2人" value="1-2" />
          <el-option label="3-4人" value="3-4" />
          <el-option label="5-6人" value="5-6" />
          <el-option label="7人以上" value="7+" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="doSearch">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增类型</el-button>
      </div>
    </div>

    <!-- 主舞台：左侧比例环 + 右侧配置面板 -->
    <div class="rc-main-stage">
      <!-- 左侧：房间类型比例环（招牌积木） -->
      <div class="stage-left">
        <div class="rc-ring-card card-decor-header">
          <div class="card-header-with-bar">
            <span class="header-bar"></span>
            <span class="header-title">房间类型比例环</span>
          </div>
          <div class="ring-body">
            <div class="ring-container" ref="ringRef" @mouseleave="clearHoveredType">
              <div class="ring-visual" :style="gradientStyle"></div>
              <div class="ring-center">
                <span class="ring-total">{{ totalRooms }}</span>
                <span class="ring-label">房间总数</span>
              </div>
              <div
                v-for="(seg, idx) in ringSegments"
                :key="idx"
                class="ring-segment"
                :style="seg.style"
                @mouseenter="hoveredType = seg.id"
              ></div>
            </div>
            <div class="ring-legend">
              <div
                v-for="(item, idx) in legendItems"
                :key="item.id"
                class="legend-item"
                :class="{ 'legend-active': hoveredType === item.id }"
                @mouseenter="hoveredType = item.id"
                @mouseleave="hoveredType = null"
              >
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-count">{{ item.count }}间</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：配置面板 -->
      <div class="stage-right">
        <div class="rc-config-card card-decor-header">
          <div class="card-header-with-bar">
            <span class="header-bar"></span>
            <span class="header-title">类型详情</span>
          </div>
          <div class="config-body" v-if="selectedCategory">
            <div class="config-field">
              <span class="field-label">名称</span>
              <span class="field-value">{{ selectedCategory.name }}</span>
            </div>
            <div class="config-field">
              <span class="field-label">床位数</span>
              <span class="field-value">{{ selectedCategory.capacity }}人</span>
            </div>
            <div class="config-field">
              <span class="field-label">状态</span>
              <el-tag
                :type="selectedCategory.status === '启用' ? 'success' : 'info'"
                size="small"
              >{{ selectedCategory.status }}</el-tag>
            </div>
            <div class="config-field config-desc">
              <span class="field-label">描述</span>
              <span class="field-value-desc">{{ selectedCategory.description }}</span>
            </div>
            <div class="config-field">
              <span class="field-label">关联房间</span>
              <span class="field-value">{{ categoryRoomCount[selectedCategory.id] || 0 }}间</span>
            </div>
            <div class="config-actions">
              <el-button type="primary" size="small" :icon="Edit" @click="openEditDialog(selectedCategory)">编辑</el-button>
              <el-button
                :type="selectedCategory.status === '启用' ? 'warning' : 'success'"
                size="small"
                @click="toggleCategoryStatus(selectedCategory)"
              >
                {{ selectedCategory.status === '启用' ? '禁用' : '启用' }}
              </el-button>
            </div>
          </div>
          <div class="config-empty" v-else>
            <el-empty description="请从列表或比例环中选择一个类型" :image-size="80" />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作栏 + 表格区（明细列表） -->
    <div class="rc-list-section">
      <div class="rc-toolbar">
        <div class="toolbar-left">
          <el-button
            :disabled="selectedIds.length === 0"
            type="success"
            size="small"
            :icon="Check"
            @click="batchEnable"
          >批量启用</el-button>
          <el-button
            :disabled="selectedIds.length === 0"
            type="warning"
            size="small"
            :icon="Close"
            @click="batchDisable"
          >批量禁用</el-button>
          <el-button
            :disabled="selectedIds.length === 0"
            size="small"
            :icon="Download"
            @click="exportCSV"
          >导出CSV</el-button>
        </div>
        <div class="toolbar-right">
          <el-button size="small" :icon="Upload" @click="handleTemplateDownload">模板下载</el-button>
          <el-upload
            :show-file-list="false"
            accept=".csv"
            :before-upload="handleImportCSV"
          >
            <el-button size="small" :icon="UploadFilled">导入CSV</el-button>
          </el-upload>
        </div>
      </div>

      <el-table
        :data="filteredList"
        stripe
        highlight-current-row
        style="width: 100%"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        row-class-name="rc-table-row"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="name" label="类型名称" min-width="140">
          <template #default="{ row }">
            <div class="cell-name">{{ row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="床位数" width="80" align="center">
          <template #default="{ row }">
            <span class="cell-capacity">{{ row.capacity }}人</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center" >
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-desc">{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="related" label="关联房间" width="90" align="center">
          <template #default="{ row }">
            <span class="cell-related">{{ categoryRoomCount[row.id] || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="openEditDialog(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
            <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑房间类型' : '新增房间类型'"
      :width="min(640, 92)"
      class="rc-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型名称" prop="name">
              <el-input v-model="form.name" placeholder="如：温馨单人间" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大床位数" prop="capacity">
              <el-input-number v-model="form.capacity" :min="1" :max="12" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="form.area" :min="0" :step="0.5" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认月租金(元)" prop="rent">
              <el-input-number v-model="form.rent" :min="0" :step="50" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="软硬件设施" prop="facilities">
          <el-input
            v-model="form.facilities"
            type="textarea"
            :rows="2"
            placeholder="描述房间配备的设施，不少于10字"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="阳台" prop="balcony">
              <el-switch v-model="form.balcony" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="独立卫浴" prop="bathroom">
              <el-switch v-model="form.bathroom" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="空调" prop="airCon">
              <el-switch v-model="form.airCon" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="暖气" prop="heating">
              <el-switch v-model="form.heating" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="更多补充说明" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="类型详情"
      size="400px"
      class="rc-drawer"
    >
      <template v-if="detailCategory">
        <div class="drawer-field">
          <span class="drawer-label">类型名称</span>
          <span class="drawer-value">{{ detailCategory.name }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">最大床位数</span>
          <span class="drawer-value">{{ detailCategory.capacity }}人</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">状态</span>
          <el-tag :type="detailCategory.status === '启用' ? 'success' : 'info'" size="small">{{ detailCategory.status }}</el-tag>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">描述</span>
          <span class="drawer-value">{{ detailCategory.description }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">关联房间数</span>
          <span class="drawer-value">{{ categoryRoomCount[detailCategory.id] || 0 }}间</span>
        </div>
        <div class="drawer-section-title">衍生字段</div>
        <div class="drawer-field">
          <span class="drawer-label">软硬件设施</span>
          <span class="drawer-value">{{ detailCategory.description }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">阳台</span>
          <span class="drawer-value">{{ detailCategory.balcony ? '有' : '无' }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">独立卫浴</span>
          <span class="drawer-value">{{ detailCategory.bathroom ? '有' : '无' }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">空调配置</span>
          <span class="drawer-value">{{ detailCategory.airCon ? '有' : '无' }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">暖气配置</span>
          <span class="drawer-value">{{ detailCategory.heating ? '有' : '无' }}</span>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Check, Close, Download, Upload, UploadFilled, Setting } from '@element-plus/icons-vue'
import { useRoomCategoryStore } from '@/stores/roomCategory'
import { useDormitoryRoomStore } from '@/stores/dormitoryRoom'
import { useDormitoryBlockStore } from '@/stores/dormitoryBlock'
import { useUserStore } from '@/stores/user'

// ======================== Store ========================
const roomCategoryStore = useRoomCategoryStore()
const dormitoryRoomStore = useDormitoryRoomStore()
const dormitoryBlockStore = useDormitoryBlockStore()
const userStore = useUserStore()

// ======================== 筛选状态 ========================
const keyword = ref('')
const statusFilter = ref('')
const capacityFilter = ref('0')
const searchTrigger = ref(0)

const doSearch = () => { searchTrigger.value++ }
const resetFilters = () => {
  keyword.value = ''
  statusFilter.value = ''
  capacityFilter.value = '0'
  searchTrigger.value++
}

// ======================== 过滤计算 ========================
const filteredList = computed(() => {
  let list = roomCategoryStore.roomCategoryList || []
  // 关键词
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(kw))
  }
  // 状态
  if (statusFilter.value) {
    list = list.filter(c => c.status === statusFilter.value)
  }
  // 容量区间
  if (capacityFilter.value !== '0') {
    list = list.filter(c => {
      if (capacityFilter.value === '1-2') return c.capacity >= 1 && c.capacity <= 2
      if (capacityFilter.value === '3-4') return c.capacity >= 3 && c.capacity <= 4
      if (capacityFilter.value === '5-6') return c.capacity >= 5 && c.capacity <= 6
      if (capacityFilter.value === '7+') return c.capacity >= 7
      return true
    })
  }
  return list
})

// ======================== 统计 ========================
const enabledCount = computed(() => roomCategoryStore.roomCategoryList.filter(c => c.status === '启用').length)
const disabledCount = computed(() => roomCategoryStore.roomCategoryList.filter(c => c.status === '禁用').length)
const totalRooms = computed(() => dormitoryRoomStore.dormitoryRoomList.length)

// 每个类型关联的房间数
const categoryRoomCount = computed(() => {
  const map = {}
  roomCategoryStore.roomCategoryList.forEach(c => { map[c.id] = 0 })
  dormitoryRoomStore.dormitoryRoomList.forEach(r => {
    if (map[r.categoryId] !== undefined) map[r.categoryId]++
  })
  return map
})

// ======================== 比例环（招牌积木——房间类型比例环） ========================
const colors = ['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316']
const ringRef = ref(null)
const hoveredType = ref(null)

const ringSegments = computed(() => {
  const list = filteredList.value
  const segments = []
  const total = list.reduce((s, c) => s + (categoryRoomCount.value[c.id] || 0), 0)
  let currentDeg = 0
  list.forEach((cat, idx) => {
    const count = categoryRoomCount.value[cat.id] || 0
    const ratio = total > 0 ? count / total : 0
    const deg = ratio * 360
    const color = colors[idx % colors.length]
    segments.push({
      id: cat.id,
      name: cat.name,
      count,
      color,
      style: {
        transform: `rotate(${currentDeg}deg)`,
        clip: deg > 180 ? 'rect(0, 100px, 200px, 0)' : 'rect(0, 100px, 200px, 100px)',
        background: deg > 180 ? `conic-gradient(transparent ${180}deg, ${color} ${180}deg 360deg)` : color
      },
      segDeg: deg
    })
    currentDeg += deg
  })
  return segments
})

const gradientStyle = computed(() => {
  const list = filteredList.value
  const total = list.reduce((s, c) => s + (categoryRoomCount.value[c.id] || 0), 0)
  if (total === 0) return { background: '#e5e7eb' }
  let parts = []
  let current = 0
  list.forEach((cat, idx) => {
    const count = categoryRoomCount.value[cat.id] || 0
    const pct = total > 0 ? (count / total) * 100 : 0
    if (pct > 0) {
      const start = current
      const end = current + pct
      parts.push(`${colors[idx % colors.length]} ${start}% ${end}%`)
      current = end
    }
  })
  if (parts.length === 0) return { background: '#e5e7eb' }
  return { background: `conic-gradient(${parts.join(', ')})` }
})

const legendItems = computed(() => {
  const list = filteredList.value
  const total = list.reduce((s, c) => s + (categoryRoomCount.value[c.id] || 0), 0)
  return list.map((cat, idx) => ({
    id: cat.id,
    name: cat.name,
    count: categoryRoomCount.value[cat.id] || 0,
    color: colors[idx % colors.length],
    pct: total > 0 ? (((categoryRoomCount.value[cat.id] || 0) / total) * 100).toFixed(1) : '0'
  }))
})

const clearHoveredType = () => { hoveredType.value = null }

// ======================== 选中与配置面板 ========================
const selectedCategory = ref(null)

const handleRowClick = (row) => {
  selectedCategory.value = row
}

// 从比例环点选
watch(hoveredType, (val) => {
  if (val) {
    const found = roomCategoryStore.roomCategoryList.find(c => c.id === val)
    if (found) selectedCategory.value = found
  }
})

// ======================== 批量选择 ========================
const selectedIds = ref([])
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(s => s.id)
}

// ======================== 新增/编辑 ========================
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const form = ref({
  name: '',
  capacity: 4,
  area: 20,
  rent: 800,
  facilities: '',
  balcony: false,
  bathroom: false,
  airCon: true,
  heating: false,
  description: ''
})

const defaultForm = () => ({
  name: '',
  capacity: 4,
  area: 20,
  rent: 800,
  facilities: '',
  balcony: false,
  bathroom: false,
  airCon: true,
  heating: false,
  description: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入类型名称', trigger: 'blur' },
    { max: 30, message: '名称不超过30字', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const dup = roomCategoryStore.roomCategoryList.find(
          c => c.name.toLowerCase() === value.toLowerCase() && c.id !== editingId.value
        )
        if (dup) callback(new Error('名称已存在，请更换'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  capacity: [
    { required: true, message: '请设置床位数', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value < 1 || value > 12) callback(new Error('床位数须为1-12'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  area: [
    { required: true, message: '请输入面积', trigger: 'blur' }
  ],
  rent: [
    { required: true, message: '请输入月租金', trigger: 'blur' }
  ],
  facilities: [
    { required: true, message: '请填写软硬件设施描述', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && value.length < 10) callback(new Error('设施描述不少于10字'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  form.value = defaultForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    name: row.name,
    capacity: row.capacity || 4,
    area: row.area ?? 20,
    rent: row.rent ?? 800,
    facilities: row.facilities || row.description || '',
    balcony: row.balcony ?? false,
    bathroom: row.bathroom ?? false,
    airCon: row.airCon ?? true,
    heating: row.heating ?? false,
    description: row.description || ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      capacity: form.value.capacity,
      status: '启用',
      description: form.value.description || form.value.facilities || ''
    }
    if (isEdit.value) {
      const old = roomCategoryStore.roomCategoryList.find(c => c.id === editingId.value)
      if (old && old.status === '启用') {
        const relatedCount = categoryRoomCount.value[editingId.value] || 0
        if (relatedCount > 0) {
          await ElMessageBox.confirm(
            `已关联 ${relatedCount} 间宿舍，修改后旧房间类型标签保留但新房间不再可选。是否继续？`,
            '确认修改',
            { confirmButtonText: '继续修改', cancelButtonText: '取消', type: 'warning' }
          )
        }
      }
      roomCategoryStore.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      roomCategoryStore.add({
        id: 'rc_' + Date.now(),
        ...payload
      })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}

// ======================== 删除 ========================
const handleDelete = async (row) => {
  const related = categoryRoomCount.value[row.id] || 0
  if (related > 0) {
    ElMessage.warning(`该类型已绑定 ${related} 间宿舍，请先解除关联`)
    return
  }
  try {
    await ElMessageBox.confirm('删除后将不可恢复，是否继续？', '确认删除', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    roomCategoryStore.update(row.id, { status: '禁用' })
    roomCategoryStore.remove(row.id)
    ElMessage.success('删除成功')
    if (selectedCategory.value?.id === row.id) selectedCategory.value = null
  } catch {
    // cancelled
  }
}

// ======================== 单行启用/禁用 ========================
const toggleCategoryStatus = (row) => {
  const newStatus = row.status === '启用' ? '禁用' : '启用'
  roomCategoryStore.update(row.id, { status: newStatus })
  ElMessage.success(`已${newStatus}`)
  // 更新选中的引用
  if (selectedCategory.value?.id === row.id) {
    selectedCategory.value = { ...selectedCategory.value, status: newStatus }
  }
}

// ======================== 批量操作 ========================
const batchEnable = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一条房间类型')
    return
  }
  selectedIds.value.forEach(id => roomCategoryStore.update(id, { status: '启用' }))
  ElMessage.success(`已批量启用 ${selectedIds.value.length} 条`)
  selectedIds.value = []
}

const batchDisable = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一条房间类型')
    return
  }
  ElMessageBox.confirm('批量禁用后，新建房间时该类型不再可选。确认继续？', '批量禁用', {
    confirmButtonText: '确认禁用',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    selectedIds.value.forEach(id => roomCategoryStore.update(id, { status: '禁用' }))
    ElMessage.success(`已批量禁用 ${selectedIds.value.length} 条`)
    selectedIds.value = []
  }).catch(() => {})
}

// ======================== 导出CSV ========================
const exportCSV = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一条房间类型')
    return
  }
  const selected = roomCategoryStore.roomCategoryList.filter(c => selectedIds.value.includes(c.id))
  const header = '名称,床位数,状态,关联房间数,描述'
  const rows = selected.map(c =>
    `${c.name},${c.capacity},${c.status},${categoryRoomCount.value[c.id] || 0},"${(c.description || '').replace(/"/g, '""')}"`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `房间类型配置_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

// ======================== 模板下载 ========================
const handleTemplateDownload = () => {
  const header = '名称,床位数,状态,描述'
  const csv = '\uFEFF' + header
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '房间类型导入模板.csv'
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('模板已下载')
}

// ======================== 导入CSV ========================
const handleImportCSV = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      ElMessage.error('CSV文件内容为空或格式错误')
      return
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('名称')
    const capacityIdx = headers.indexOf('床位数')
    const statusIdx = headers.indexOf('状态')
    const descIdx = headers.indexOf('描述')
    if (nameIdx === -1 || capacityIdx === -1) {
      ElMessage.error('CSV文件缺少必要列：名称、床位数')
      return
    }
    let successCount = 0
    let skipCount = 0
    const existingNames = new Set(roomCategoryStore.roomCategoryList.map(c => c.name.toLowerCase()))
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      if (cols.length <= nameIdx || !cols[nameIdx]) continue
      const name = cols[nameIdx]
      const cap = parseInt(cols[capacityIdx], 10)
      if (existingNames.has(name.toLowerCase())) {
        skipCount++
        continue
      }
      const status = statusIdx > -1 && cols[statusIdx] ? cols[statusIdx] : '启用'
      const desc = descIdx > -1 && cols[descIdx] ? cols[descIdx] : ''
      roomCategoryStore.add({
        id: 'rc_' + Date.now() + '_' + i,
        name,
        capacity: isNaN(cap) ? 4 : cap,
        status: status === '禁用' ? '禁用' : '启用',
        description: desc
      })
      existingNames.add(name.toLowerCase())
      successCount++
    }
    ElMessage.success(`导入完成：成功 ${successCount} 条，跳过重复 ${skipCount} 条`)
  }
  reader.readAsText(file)
  return false // 阻止默认上传
}

// ======================== 详情抽屉 ========================
const drawerVisible = ref(false)
const detailCategory = ref(null)

const openDetailDrawer = (row) => {
  detailCategory.value = {
    ...row,
    balcony: row.balcony ?? false,
    bathroom: row.bathroom ?? false,
    airCon: row.airCon ?? true,
    heating: row.heating ?? false,
    area: row.area ?? 20,
    rent: row.rent ?? 800,
    facilities: row.facilities || row.description || ''
  }
  drawerVisible.value = true
}

// 辅助
const min = (a, b) => Math.min(a, b)
</script>

<style scoped lang="scss">
@use './RoomCategory.scss' as *;
</style>