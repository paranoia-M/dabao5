<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">楼宇设备自动化控制中心</h1>
      <p class="page-subtitle">实时监控与管理楼宇设备运行状态</p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409EFF;">
                <i class="el-icon-s-home"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalDevices }}</div>
                <div class="stat-label">总设备数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67C23A;">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.onlineDevices }}</div>
                <div class="stat-label">在线设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #E6A23C;">
                <i class="el-icon-warning"></i>
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
              <div class="stat-icon" style="background-color: #909399;">
                <i class="el-icon-s-operation"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.energyConsumption.toFixed(1) }}</div>
                <div class="stat-label">能耗(kWh)</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 设备列表区域 -->
    <div class="device-section">
      <el-card class="device-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>设备监控列表</span>
            <div class="header-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索设备名称或位置"
                class="search-input"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <i class="el-icon-search"></i>
                </template>
              </el-input>
              
              <el-select
                v-model="filterStatus"
                placeholder="状态筛选"
                class="status-filter"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部" value=""></el-option>
                <el-option label="在线" value="online"></el-option>
                <el-option label="离线" value="offline"></el-option>
                <el-option label="告警" value="warning"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table
          :data="filteredDevices"
          style="width: 100%"
          :row-class-name="tableRowClassName"
          @row-click="handleRowClick"
        >
          <el-table-column prop="name" label="设备名称" width="180">
            <template #default="{ row }">
              <div class="device-name">
                <i :class="getDeviceIcon(row.type)" class="device-icon"></i>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="设备类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="location" label="位置" width="150"></el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusTagType(row.status)"
                :effect="row.status === 'warning' ? 'dark' : 'light'"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="value" label="当前值" width="120">
            <template #default="{ row }">
              <span :class="getValueClass(row)">{{ row.value }} {{ row.unit }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="lastUpdate" label="最后更新" width="180"></el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :disabled="row.status === 'offline'"
                @click.stop="handleControl(row)"
              >
                控制
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :total="totalDevices"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 控制对话框 -->
    <el-dialog
      v-model="controlDialogVisible"
      :title="`控制设备 - ${selectedDevice?.name}`"
      width="500px"
      @close="handleDialogClose"
    >
      <div v-if="selectedDevice" class="control-dialog-content">
        <div class="device-info">
          <p><strong>设备类型：</strong>{{ selectedDevice.type }}</p>
          <p><strong>当前位置：</strong>{{ selectedDevice.location }}</p>
          <p><strong>当前状态：</strong>
            <el-tag :type="getStatusTagType(selectedDevice.status)" size="small">
              {{ getStatusText(selectedDevice.status) }}
            </el-tag>
          </p>
        </div>
        
        <el-divider></el-divider>
        
        <div class="control-form">
          <el-form
            :model="controlForm"
            label-width="100px"
            :disabled="selectedDevice.status === 'offline'"
          >
            <el-form-item label="目标值：">
              <el-input-number
                v-model="controlForm.targetValue"
                :min="selectedDevice.minValue || 0"
                :max="selectedDevice.maxValue || 100"
                :step="selectedDevice.step || 1"
                controls-position="right"
                style="width: 100%"
              />
              <div class="form-hint">范围：{{ selectedDevice.minValue || 0 }} - {{ selectedDevice.maxValue || 100 }} {{ selectedDevice.unit }}</div>
            </el-form-item>
            
            <el-form-item label="操作模式：">
              <el-radio-group v-model="controlForm.mode">
                <el-radio label="auto">自动</el-radio>
                <el-radio label="manual">手动</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="selectedDevice.type === '空调'" label="运行模式：">
              <el-select v-model="controlForm.operationMode" placeholder="请选择运行模式" style="width: 100%">
                <el-option label="制冷" value="cooling"></el-option>
                <el-option label="制热" value="heating"></el-option>
                <el-option label="通风" value="ventilation"></el-option>
                <el-option label="除湿" value="dehumidification"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="controlDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="controlLoading"
            :disabled="selectedDevice?.status === 'offline'"
            @click="handleControlSubmit"
          >
            确认控制
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 统计数据
const stats = ref({
  totalDevices: 156,
  onlineDevices: 142,
  warningDevices: 8,
  energyConsumption: 2456.8
})

// 设备数据
const devices = ref([])
const filteredDevices = ref([])
const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)

// 控制对话框相关
const controlDialogVisible = ref(false)
const selectedDevice = ref(null)
const controlLoading = ref(false)
const controlForm = ref({
  targetValue: 0,
  mode: 'auto',
  operationMode: 'cooling'
})

// 模拟设备数据
const mockDevices = [
  { id: 1, name: '中央空调-1F', type: '空调', location: '一楼大厅', status: 'online', value: 24, unit: '°C', minValue: 16, maxValue: 30, step: 1, lastUpdate: '2024-01-15 10:30:25' },
  { id: 2, name: '照明系统-走廊', type: '照明', location: '一楼走廊', status: 'online', value: 75, unit: '%', minValue: 0, maxValue: 100, step: 10, lastUpdate: '2024-01-15 10:28:15' },
  { id: 3, name: '安防摄像头-入口', type: '安防', location: '主入口', status: 'warning', value: '异常', unit: '', lastUpdate: '2024-01-15 10:25:45' },
  { id: 4, name: '电梯-1号', type: '电梯', location: 'A栋', status: 'online', value: '运行中', unit: '', lastUpdate: '2024-01-15 10:22:30' },
  { id: 5, name: '消防报警器-仓库', type: '消防', location: '地下仓库', status: 'offline', value: '--', unit: '', lastUpdate: '2024-01-15 09:45:10' },
  { id: 6, name: '中央空调-2F', type: '空调', location: '二楼办公区', status: 'online', value: 22, unit: '°C', minValue: 16, maxValue: 30, step: 1, lastUpdate: '2024-01-15 10:29:55' },
  { id: 7, name: '通风系统-地下室', type: '通风', location: '地下室', status: 'online', value: 85, unit: '%', minValue: 0, maxValue: 100, step: 5, lastUpdate: '2024-01-15 10:27:40' },
  { id: 8, name: '给排水泵-1号', type: '给排水', location: '水泵房', status: 'online', value: '正常', unit: '', lastUpdate: '2024-01-15 10:26:20' },
  { id: 9, name: '能耗监测-总表', type: '能耗', location: '配电室', status: 'online', value: 156.8, unit: 'kW', lastUpdate: '2024-01-15 10:31:05' },
  { id: 10, name: '门禁系统-侧门', type: '门禁', location: '侧门', status: 'warning', value: '未关闭', unit: '', lastUpdate: '2024-01-15 10:24:15' },
  { id: 11, name: '照明系统-会议室', type: '照明', location: '201会议室', status: 'online', value: 60, unit: '%', minValue: 0, maxValue: 100, step: 10, lastUpdate: '2024-01-15 10:23:50' },
  { id: 12, name: '中央空调-3F', type: '空调', location: '三楼研发部', status: 'online', value: 23, unit: '°C', minValue: 16, maxValue: 30, step: 1, lastUpdate: '2024-01-15 10:30:10' }
]

// 初始化数据
const initData = () => {
  devices.value = [...mockDevices]
  totalDevices.value = devices.value.length
  filterDevices()
}

// 过滤设备
const filterDevices = () => {
  let result = [...devices.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(device => 
      device.name.toLowerCase().includes(query) || 
      device.location.toLowerCase().includes(query)
    )
  }
  
  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(device => device.status === filterStatus.value)
  }
  
  totalDevices.value = result.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  filteredDevices.value = result.slice(start, end)
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  filterDevices()
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  filterDevices()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  filterDevices()
}

// 当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  filterDevices()
}

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (row.status === 'warning') {
    return 'warning-row'
  } else if (row.status === 'offline') {
    return 'offline-row'
  }
  return ''
}

// 获取设备图标
const getDeviceIcon = (type) => {
  const icons = {
    '空调': 'el-icon-s-promotion',
    '照明': 'el-icon-sunny',
    '安防': 'el-icon-video-camera',
    '电梯': 'el-icon-sort-up',
    '消防': 'el-icon-fire',
    '通风': 'el-icon-wind-power',
    '给排水': 'el-icon-watermelon',
    '能耗': 'el-icon-data-line',
    '门禁': 'el-icon-lock'
  }
  return icons[type] || 'el-icon-s-help'
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const types = {
    '空调': 'primary',
    '照明': 'success',
    '安防': 'warning',
    '电梯': 'info',
    '消防': 'danger',
    '通风': '',
    '给排水': 'primary',
    '能耗': 'success',
    '门禁': 'warning'
  }
  return types[type] || ''
}

// 获取状态标签样式
const getStatusTagType = (status) => {
  const types = {
    'online': 'success',
    'offline': 'info',
    'warning': 'danger'
  }
  return types[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    'online': '在线',
    'offline': '离线',
    'warning': '告警'
  }
  return texts[status] || '未知'
}

// 获取值样式类
const getValueClass = (row) => {
  if (row.status === 'warning') {
    return 'warning-value'
  } else if (row.status === 'offline') {
    return 'offline-value'
  }
  return ''
}

// 行点击事件
const handleRowClick = (row) => {
  console.log('点击设备:', row)
}

// 控制设备
const handleControl = (device) => {
  selectedDevice.value = { ...device }
  controlForm.value.targetValue = typeof device.value === 'number' ? device.value : device.minValue || 0
  controlDialogVisible.value = true
}

// 对话框关闭
const handleDialogClose = () => {
  controlForm.value = {
    targetValue: 0,
    mode: 'auto',
    operationMode: 'cooling'
  }
}

// 提交控制
const handleControlSubmit = async () => {
  if (!selectedDevice.value) return
  
  controlLoading.value = true
  
  // 模拟异步请求
  setTimeout(() => {
    controlLoading.value = false
    controlDialogVisible.value = false
    
    // 更新设备状态
    const deviceIndex = devices.value.findIndex(d => d.id === selectedDevice.value.id)
    if (deviceIndex !== -1) {
      devices.value[deviceIndex].value = controlForm.value.targetValue
      devices.value[deviceIndex].lastUpdate = new Date().toLocaleString('zh-CN')
      
      // 重新过滤
      filterDevices()
    }
    
    ElMessage.success(`设备控制指令已发送：${selectedDevice.value.name} 设置为 ${controlForm.value.targetValue}${selectedDevice.value.unit || ''}`)
  }, 1500)
}

// 模拟实时更新
let updateInterval
const simulateRealTimeUpdate = () => {
  updateInterval = setInterval(() => {
    // 随机更新一个设备的值
    if (devices.value.length > 0) {
      const randomIndex = Math.floor(Math.random() * devices.value.length)
      const device = devices.value[randomIndex]
      
      if (device.status === 'online' && typeof device.value === 'number') {
        // 模拟值波动
        const change = Math.random() > 0.5 ? 1 : -1
        const newValue = device.value + change
        
        // 确保在合理范围内
        if (device.minValue !== undefined && device.maxValue !== undefined) {
          if (newValue >= device.minValue && newValue <= device.maxValue) {
            device.value = newValue
            device.lastUpdate = new Date().toLocaleString('zh-CN')
            
            // 检查是否进入告警状态
            if (device.type === '空调' && (newValue > 28 || newValue < 18)) {
              device.status = 'warning'
              stats.value.warningDevices++
            }
            
            // 重新过滤
            filterDevices()
          }
        }
      }
    }
  }, 5000)
}

// 生命周期钩子
onMounted(() => {
  initData()
  simulateRealTimeUpdate()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style lang="scss" scoped>


@use './Dashboard.scss';
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .page-header {
    margin-bottom: 30px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .page-subtitle {
      font-size: 14px;
      color: #909399;
    }
  }

  .stats-cards {
    margin-bottom: 30px;

    .stat-card {
      margin-bottom: 20px;

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;

          i {
            font-size: 24px;
            color: white;
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .device-section {
    .device-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 16px;
        color: #303133;

        .header-actions {
          display: flex;
          gap: 12px;

          .search-input {
            width: 200px;
          }

          .status-filter {
            width: 120px;
          }
        }
      }

      .device-name {
        display: flex;
        align-items: center;
        gap: 8px;

        .device-icon {
          font-size: 16px;
          color: #409EFF;
        }
      }

      .warning-value {
        color: #f56c6c;
        font-weight: 500;
      }

      .offline-value {
        color: #909399;
      }

      :deep(.warning-row) {
        background-color: #fef0f0;

        &:hover {
          background-color: #fde2e2 !important;
        }
      }

      :deep(.offline-row) {
        background-color: #f4f4f5;

        &:hover {
          background-color: #e9e9eb !important;
        }
      }

      .pagination-container {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }

  .control-dialog-content {
    .device-info {
      p {
        margin: 8px 0;
        font-size: 14px;
        color: #606266;

        strong {
          color: #303133;
        }
      }
    }

    .control-form {
      .form-hint {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}


</style>