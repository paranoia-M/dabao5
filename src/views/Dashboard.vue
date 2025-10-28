<template>
  <div class="dashboard-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card temperature" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <i class="icon-temperature">🌡️</i>
          </div>
          <div class="stat-info">
            <div class="stat-value">26.5°C</div>
            <div class="stat-label">环境温度</div>
            <div class="stat-trend positive">+0.3°C</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card humidity" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <i class="icon-humidity">💧</i>
          </div>
          <div class="stat-info">
            <div class="stat-value">65%</div>
            <div class="stat-label">空气湿度</div>
            <div class="stat-trend negative">-2%</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card soil" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <i class="icon-soil">🌱</i>
          </div>
          <div class="stat-info">
            <div class="stat-value">42%</div>
            <div class="stat-label">土壤湿度</div>
            <div class="stat-trend stable">稳定</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card light" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <i class="icon-light">☀️</i>
          </div>
          <div class="stat-info">
            <div class="stat-value">850 lux</div>
            <div class="stat-label">光照强度</div>
            <div class="stat-trend positive">+50 lux</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">环境数据趋势</span>
            <el-select v-model="chartTimeRange" size="small" style="width: 120px">
              <el-option label="24小时" value="24h" />
              <el-option label="7天" value="7d" />
              <el-option label="30天" value="30d" />
            </el-select>
          </div>
        </template>
        <div class="chart-container">
          <div class="mock-chart">
            <div class="chart-line temperature-line"></div>
            <div class="chart-line humidity-line"></div>
            <div class="chart-line soil-line"></div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color temperature"></span>
                <span>温度</span>
              </div>
              <div class="legend-item">
                <span class="legend-color humidity"></span>
                <span>湿度</span>
              </div>
              <div class="legend-item">
                <span class="legend-color soil"></span>
                <span>土壤湿度</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">设备状态分布</span>
          </div>
        </template>
        <div class="chart-container">
          <div class="mock-pie-chart">
            <div class="pie-chart">
              <div class="pie-segment online"></div>
              <div class="pie-segment offline"></div>
              <div class="pie-segment warning"></div>
            </div>
            <div class="pie-legend">
              <div class="legend-item">
                <span class="legend-dot online"></span>
                <span>在线 (85%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot offline"></span>
                <span>离线 (10%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot warning"></span>
                <span>警告 (5%)</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 设备列表 -->
    <el-card class="device-list-card" shadow="never">
      <template #header>
        <div class="device-list-header">
          <span class="card-title">设备监控</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索设备"
              size="small"
              style="width: 200px; margin-right: 16px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="statusFilter" placeholder="状态筛选" size="small" style="width: 120px;">
              <el-option label="全部" value="" />
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="警告" value="warning" />
            </el-select>
          </div>
        </div>
      </template>
      
      <el-table :data="filteredDevices" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="type" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.type)" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'online' ? 'success' : row.status === 'warning' ? 'warning' : 'info'"
              size="small"
            >
              {{ row.status === 'online' ? '在线' : row.status === 'warning' ? '警告' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度" width="100">
          <template #default="{ row }">
            {{ row.temperature ? `${row.temperature}°C` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="humidity" label="湿度" width="100">
          <template #default="{ row }">
            {{ row.humidity ? `${row.humidity}%` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              size="small"
              :disabled="row.status === 'offline'"
              @click="handleDeviceControl(row)"
            >
              控制
            </el-button>
            <el-button type="primary" link size="small" @click="handleDeviceDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalDevices"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 控制对话框 -->
    <el-dialog
      v-model="controlDialogVisible"
      title="设备控制"
      width="500px"
      :before-close="handleControlDialogClose"
    >
      <div class="control-form">
        <el-form :model="controlForm" label-width="100px">
          <el-form-item label="设备名称">
            <el-input v-model="controlForm.deviceName" disabled />
          </el-form-item>
          <el-form-item label="控制类型">
            <el-select v-model="controlForm.controlType" placeholder="请选择控制类型">
              <el-option label="灌溉控制" value="irrigation" />
              <el-option label="通风控制" value="ventilation" />
              <el-option label="光照控制" value="lighting" />
              <el-option label="温度控制" value="temperature" />
            </el-select>
          </el-form-item>
          <el-form-item label="控制参数">
            <el-input-number
              v-model="controlForm.controlValue"
              :min="0"
              :max="100"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleControlDialogClose">取消</el-button>
          <el-button type="primary" :loading="controlLoading" @click="handleControlSubmit">
            确认控制
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const chartTimeRange = ref('24h')
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const controlDialogVisible = ref(false)
const controlLoading = ref(false)

// 控制表单
const controlForm = ref({
  deviceName: '',
  controlType: '',
  controlValue: 50
})

// 模拟设备数据
const devices = ref([
  { id: 1, name: '温室1号传感器', type: '温湿度', location: 'A区温室', status: 'online', temperature: 26.5, humidity: 65, lastUpdate: '2024-01-20 10:30:25' },
  { id: 2, name: '土壤监测器1', type: '土壤', location: 'B区农田', status: 'online', temperature: null, humidity: 42, lastUpdate: '2024-01-20 10:28:15' },
  { id: 3, name: '光照传感器1', type: '光照', location: 'C区大棚', status: 'warning', temperature: null, humidity: null, lastUpdate: '2024-01-20 09:45:30' },
  { id: 4, name: '灌溉控制器1', type: '控制器', location: 'A区温室', status: 'online', temperature: null, humidity: null, lastUpdate: '2024-01-20 10:25:10' },
  { id: 5, name: '通风设备1', type: '控制器', location: 'B区农田', status: 'offline', temperature: null, humidity: null, lastUpdate: '2024-01-19 16:20:45' },
  { id: 6, name: '温室2号传感器', type: '温湿度', location: 'C区大棚', status: 'online', temperature: 24.8, humidity: 68, lastUpdate: '2024-01-20 10:32:40' },
  { id: 7, name: '土壤监测器2', type: '土壤', location: 'A区温室', status: 'online', temperature: null, humidity: 38, lastUpdate: '2024-01-20 10:29:55' },
  { id: 8, name: '气象站1', type: '气象', location: '园区中心', status: 'online', temperature: 25.2, humidity: 62, lastUpdate: '2024-01-20 10:31:20' }
])

// 计算属性
const totalDevices = computed(() => devices.value.length)

const filteredDevices = computed(() => {
  let filtered = devices.value
  
  // 搜索筛选
  if (searchKeyword.value) {
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      device.location.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(device => device.status === statusFilter.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const getDeviceTypeTag = (type) => {
  const typeMap = {
    '温湿度': '',
    '土壤': 'success',
    '光照': 'warning',
    '控制器': 'info',
    '气象': 'danger'
  }
  return typeMap[type] || ''
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleDeviceControl = (device) => {
  if (device.status === 'offline') {
    ElMessage.warning('设备离线，无法控制')
    return
  }
  
  controlForm.value.deviceName = device.name
  controlDialogVisible.value = true
}

const handleDeviceDetail = (device) => {
  ElMessage.info(`查看设备详情: ${device.name}`)
}

const handleControlDialogClose = () => {
  controlDialogVisible.value = false
  controlForm.value.controlType = ''
  controlForm.value.controlValue = 50
}

const handleControlSubmit = async () => {
  if (!controlForm.value.controlType) {
    ElMessage.warning('请选择控制类型')
    return
  }
  
  controlLoading.value = true
  
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  controlLoading.value = false
  controlDialogVisible.value = false
  ElMessage.success('控制指令发送成功')
  
  // 重置表单
  controlForm.value.controlType = ''
  controlForm.value.controlValue = 50
}

// 生命周期
onMounted(() => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>

@use './Dashboard.scss';

</style>