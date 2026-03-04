<template>
  <div class="device-monitor">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h1 class="page-title">楼宇设备监控中心</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加设备
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon running">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.runningDevices }}</div>
                <div class="stat-label">运行中设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.warningDevices }}</div>
                <div class="stat-label">告警设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon offline">
                <el-icon><CloseBold /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.offlineDevices }}</div>
                <div class="stat-label">离线设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalDevices }}</div>
                <div class="stat-label">总设备数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="设备名称">
          <el-input
            v-model="filterForm.name"
            placeholder="请输入设备名称"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select
            v-model="filterForm.type"
            placeholder="请选择设备类型"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="item in deviceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select
            v-model="filterForm.status"
            placeholder="请选择设备状态"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="item in deviceStatus"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 设备列表 -->
    <el-card class="device-list-card" shadow="never">
      <el-table
        :data="deviceList"
        v-loading="loading"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="id" label="设备ID" width="100" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="type" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" min-width="180" />
        <el-table-column prop="status" label="设备状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              :effect="row.status === 'warning' ? 'dark' : 'light'"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度(℃)" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.temperature > 30 }">
              {{ row.temperature }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="humidity" label="湿度(%)" width="100" />
        <el-table-column prop="power" label="功率(W)" width="100" />
        <el-table-column prop="lastUpdate" label="最后更新" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click.stop="handleControl(row)"
              :type="row.status === 'running' ? 'warning' : 'success'"
            >
              {{ row.status === 'running' ? '停止' : '启动' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加设备对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加新设备"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
        ref="addFormRef"
      >
        <el-form-item label="设备名称" prop="name">
          <el-input
            v-model="addForm.name"
            placeholder="请输入设备名称"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select
            v-model="addForm.type"
            placeholder="请选择设备类型"
          >
            <el-option
              v-for="item in deviceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input
            v-model="addForm.location"
            placeholder="请输入安装位置"
          />
        </el-form-item>
        <el-form-item label="初始状态" prop="status">
          <el-radio-group v-model="addForm.status">
            <el-radio label="running">运行中</el-radio>
            <el-radio label="stopped">已停止</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddDevice" :loading="adding">
            确认添加
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Refresh,
  Plus,
  Search,
  Cpu,
  Warning,
  CloseBold,
  DataLine
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const showAddDialog = ref(false)
const adding = ref(false)
const addFormRef = ref(null)

// 统计数据
const stats = reactive({
  runningDevices: 0,
  warningDevices: 0,
  offlineDevices: 0,
  totalDevices: 0
})

// 筛选表单
const filterForm = reactive({
  name: '',
  type: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 添加表单
const addForm = reactive({
  name: '',
  type: '',
  location: '',
  status: 'running'
})

// 表单验证规则
const addFormRules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入安装位置', trigger: 'blur' }
  ]
}

// 设备类型选项
const deviceTypes = [
  { label: '空调系统', value: 'air_conditioner' },
  { label: '照明系统', value: 'lighting' },
  { label: '安防监控', value: 'security' },
  { label: '电梯系统', value: 'elevator' },
  { label: '消防系统', value: 'fire_protection' },
  { label: '给排水系统', value: 'water_supply' }
]

// 设备状态选项
const deviceStatus = [
  { label: '运行中', value: 'running' },
  { label: '已停止', value: 'stopped' },
  { label: '告警中', value: 'warning' },
  { label: '离线', value: 'offline' }
]

// 模拟设备数据
const mockDevices = Array.from({ length: 45 }, (_, i) => ({
  id: `DEV${String(i + 1).padStart(3, '0')}`,
  name: `设备${i + 1}`,
  type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)].value,
  location: `楼层${Math.floor(Math.random() * 10) + 1}-区域${Math.floor(Math.random() * 5) + 1}`,
  status: ['running', 'stopped', 'warning', 'offline'][Math.floor(Math.random() * 4)],
  temperature: Math.floor(Math.random() * 40),
  humidity: Math.floor(Math.random() * 100),
  power: Math.floor(Math.random() * 5000),
  lastUpdate: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
}))

// 计算属性：筛选后的设备列表
const deviceList = computed(() => {
  let filtered = [...mockDevices]
  
  if (filterForm.name) {
    filtered = filtered.filter(device => 
      device.name.includes(filterForm.name)
    )
  }
  
  if (filterForm.type) {
    filtered = filtered.filter(device => 
      device.type === filterForm.type
    )
  }
  
  if (filterForm.status) {
    filtered = filtered.filter(device => 
      device.status === filterForm.status
    )
  }
  
  // 更新统计数据
  updateStats(filtered)
  
  // 分页
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  pagination.total = filtered.length
  
  return filtered.slice(start, end)
})

// 方法
const handleSearch = () => {
  pagination.currentPage = 1
  loading.value = true
  
  // 模拟异步搜索
  setTimeout(() => {
    loading.value = false
    ElMessage.success('搜索完成')
  }, 300)
}

const handleReset = () => {
  filterForm.name = ''
  filterForm.type = ''
  filterForm.status = ''
  pagination.currentPage = 1
  handleSearch()
}

const handleRefresh = () => {
  loading.value = true
  
  // 模拟刷新数据
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 500)
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

const handleRowClick = (row) => {
  ElMessage.info(`点击了设备：${row.name}`)
}

const handleControl = (row) => {
  ElMessageBox.confirm(
    `确定要${row.status === 'running' ? '停止' : '启动'}设备 ${row.name} 吗？`,
    '设备控制',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`设备 ${row.name} 已${row.status === 'running' ? '停止' : '启动'}`)
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 ${row.name} 吗？此操作不可恢复。`,
    '删除设备',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    ElMessage.success(`设备 ${row.name} 已删除`)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleAddDevice = () => {
  if (!addFormRef.value) return
  
  addFormRef.value.validate((valid) => {
    if (!valid) return
    
    adding.value = true
    
    // 模拟异步添加
    setTimeout(() => {
      adding.value = false
      showAddDialog.value = false
      ElMessage.success('设备添加成功')
      
      // 重置表单
      Object.keys(addForm).forEach(key => {
        if (key !== 'status') {
          addForm[key] = ''
        }
      })
      addForm.status = 'running'
    }, 800)
  })
}

const handleDialogClose = () => {
  // 重置表单
  Object.keys(addForm).forEach(key => {
    if (key !== 'status') {
      addForm[key] = ''
    }
  })
  addForm.status = 'running'
  
  // 清除表单验证
  if (addFormRef.value) {
    addFormRef.value.clearValidate()
  }
}

const getTypeTagType = (type) => {
  const typeMap = {
    air_conditioner: 'primary',
    lighting: 'success',
    security: 'warning',
    elevator: 'info',
    fire_protection: 'danger',
    water_supply: ''
  }
  return typeMap[type] || ''
}

const getTypeText = (type) => {
  const typeItem = deviceTypes.find(item => item.value === type)
  return typeItem ? typeItem.label : type
}

const getStatusTagType = (status) => {
  const statusMap = {
    running: 'success',
    stopped: 'info',
    warning: 'warning',
    offline: 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    running: '运行中',
    stopped: '已停止',
    warning: '告警中',
    offline: '离线'
  }
  return textMap[status] || status
}

const updateStats = (devices) => {
  stats.totalDevices = devices.length
  stats.runningDevices = devices.filter(d => d.status === 'running').length
  stats.warningDevices = devices.filter(d => d.status === 'warning').length
  stats.offlineDevices = devices.filter(d => d.status === 'offline').length
}

// 生命周期
onMounted(() => {
  loading.value = true
  
  // 模拟初始化加载
  setTimeout(() => {
    loading.value = false
    updateStats(mockDevices)
    pagination.total = mockDevices.length
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './DeviceMonitor.scss';

</style>