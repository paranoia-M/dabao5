<template>
  <div class="device-management">
    <div class="page-header">
      <h1 class="page-title">设备管理</h1>
      <p class="page-description">监控和管理农业物联网设备</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :lg="3">
          <div class="stat-card">
            <div class="stat-icon online">
              <i class="el-icon-monitor"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.onlineDevices }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <div class="stat-card">
            <div class="stat-icon offline">
              <i class="el-icon-switch-button"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.offlineDevices }}</div>
              <div class="stat-label">离线设备</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <div class="stat-card">
            <div class="stat-icon warning">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.warningDevices }}</div>
              <div class="stat-label">告警设备</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :lg="3">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDevices }}</div>
              <div class="stat-label">总设备数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-row :gutter="20" align="middle">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索设备名称或编号"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-select
            v-model="statusFilter"
            placeholder="设备状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部" value="" />
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="告警" value="warning" />
          </el-select>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-select
            v-model="typeFilter"
            placeholder="设备类型"
            clearable
            @change="handleFilter"
          >
            <el-option label="全部" value="" />
            <el-option label="传感器" value="sensor" />
            <el-option label="控制器" value="controller" />
            <el-option label="网关" value="gateway" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" class="text-right">
          <el-button type="primary" @click="handleAddDevice">
            <el-icon><Plus /></el-icon>
            添加设备
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 设备列表 -->
    <div class="device-list">
      <el-table
        :data="filteredDevices"
        v-loading="loading"
        style="width: 100%"
        :default-sort="{ prop: 'lastUpdate', order: 'descending' }"
      >
        <el-table-column prop="name" label="设备名称" min-width="120">
          <template #default="{ row }">
            <div class="device-name">
              <el-icon :class="getStatusClass(row.status)">
                <Monitor v-if="row.type === 'sensor'" />
                <Cpu v-else-if="row.type === 'controller'" />
                <Connection v-else />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="设备编号" width="140" />
        <el-table-column prop="type" label="设备类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度" width="100">
          <template #default="{ row }">
            <span v-if="row.temperature">{{ row.temperature }}°C</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="humidity" label="湿度" width="100">
          <template #default="{ row }">
            <span v-if="row.humidity">{{ row.humidity }}%</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" width="160">
          <template #default="{ row }">
            {{ formatTime(row.lastUpdate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="deviceForm"
        :rules="formRules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型">
            <el-option label="传感器" value="sensor" />
            <el-option label="控制器" value="controller" />
            <el-option label="网关" value="gateway" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="deviceForm.status" placeholder="请选择设备状态">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="告警" value="warning" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh, Monitor, Cpu, Connection } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEditing = ref(false)

// 统计数据
const stats = ref({
  onlineDevices: 0,
  offlineDevices: 0,
  warningDevices: 0,
  totalDevices: 0
})

// 设备表单
const deviceForm = ref({
  name: '',
  type: '',
  location: '',
  status: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 20, message: '设备名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入安装位置', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择设备状态', trigger: 'change' }
  ]
}

// 模拟设备数据
const mockDevices = ref([
  {
    id: 'DEV001',
    name: '温度传感器1',
    type: 'sensor',
    location: '温室A区',
    status: 'online',
    temperature: 25.5,
    humidity: 65,
    lastUpdate: new Date('2024-01-15 10:30:00')
  },
  {
    id: 'DEV002',
    name: '湿度传感器1',
    type: 'sensor',
    location: '温室B区',
    status: 'online',
    temperature: 24.8,
    humidity: 70,
    lastUpdate: new Date('2024-01-15 10:28:00')
  },
  {
    id: 'DEV003',
    name: '灌溉控制器1',
    type: 'controller',
    location: '农田1号',
    status: 'offline',
    temperature: null,
    humidity: null,
    lastUpdate: new Date('2024-01-14 16:45:00')
  },
  {
    id: 'DEV004',
    name: '网关设备1',
    type: 'gateway',
    location: '控制中心',
    status: 'warning',
    temperature: 35.2,
    humidity: null,
    lastUpdate: new Date('2024-01-15 09:15:00')
  },
  {
    id: 'DEV005',
    name: '光照传感器1',
    type: 'sensor',
    location: '温室C区',
    status: 'online',
    temperature: 26.1,
    humidity: 62,
    lastUpdate: new Date('2024-01-15 10:25:00')
  }
])

// 计算属性
const filteredDevices = computed(() => {
  let filtered = mockDevices.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(query) || 
      device.id.toLowerCase().includes(query)
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(device => device.status === statusFilter.value)
  }
  
  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(device => device.type === typeFilter.value)
  }
  
  // 更新总数
  total.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

const dialogTitle = computed(() => {
  return isEditing.value ? '编辑设备' : '添加设备'
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
  updateStats()
}

const handleFilter = () => {
  currentPage.value = 1
  updateStats()
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 1000)
}

const handleAddDevice = () => {
  isEditing.value = false
  deviceForm.value = {
    name: '',
    type: '',
    location: '',
    status: ''
  }
  dialogVisible.value = true
}

const handleEdit = (device) => {
  isEditing.value = true
  deviceForm.value = { ...device }
  dialogVisible.value = true
}

const handleView = (device) => {
  ElMessage.info(`查看设备: ${device.name}`)
}

const handleDelete = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${device.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const index = mockDevices.value.findIndex(d => d.id === device.id)
    if (index > -1) {
      mockDevices.value.splice(index, 1)
      ElMessage.success('设备删除成功')
      updateStats()
    }
  } catch {
    // 用户取消删除
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  
  try {
    // 模拟异步提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (isEditing.value) {
      // 编辑设备
      const index = mockDevices.value.findIndex(d => d.id === deviceForm.value.id)
      if (index > -1) {
        mockDevices.value[index] = { ...deviceForm.value }
      }
      ElMessage.success('设备更新成功')
    } else {
      // 添加设备
      const newDevice = {
        ...deviceForm.value,
        id: `DEV${String(mockDevices.value.length + 1).padStart(3, '0')}`,
        temperature: deviceForm.value.type === 'sensor' ? 25.0 : null,
        humidity: deviceForm.value.type === 'sensor' ? 65 : null,
        lastUpdate: new Date()
      }
      mockDevices.value.push(newDevice)
      ElMessage.success('设备添加成功')
    }
    
    dialogVisible.value = false
    updateStats()
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const getStatusClass = (status) => {
  return {
    'status-icon': true,
    'status-online': status === 'online',
    'status-offline': status === 'offline',
    'status-warning': status === 'warning'
  }
}

const getStatusTagType = (status) => {
  const map = {
    online: 'success',
    offline: 'info',
    warning: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    online: '在线',
    offline: '离线',
    warning: '告警'
  }
  return map[status] || '未知'
}

const getTypeTagType = (type) => {
  const map = {
    sensor: '',
    controller: 'warning',
    gateway: 'success'
  }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = {
    sensor: '传感器',
    controller: '控制器',
    gateway: '网关'
  }
  return map[type] || '未知'
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const updateStats = () => {
  const devices = mockDevices.value
  stats.value = {
    onlineDevices: devices.filter(d => d.status === 'online').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    warningDevices: devices.filter(d => d.status === 'warning').length,
    totalDevices: devices.length
  }
}

// 生命周期
onMounted(() => {
  updateStats()
})
</script>

<style lang="scss" scoped>

@use './DeviceManagement.scss';

</style>