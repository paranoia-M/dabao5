<template>
  <div class="home-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon primary">
                <i class="el-icon-monitor"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalDevices }}</div>
                <div class="stat-label">总设备数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon success">
                <i class="el-icon-connection"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.onlineDevices }}</div>
                <div class="stat-label">在线设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <i class="el-icon-warning-outline"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.alerts }}</div>
                <div class="stat-label">今日告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon info">
                <i class="el-icon-data-analysis"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.dataVolume }}</div>
                <div class="stat-label">数据量(MB)</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：设备状态图表 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>设备状态分布</span>
                <el-button type="primary" text>查看详情</el-button>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-demo">
                  <div class="chart-bars">
                    <div 
                      v-for="(item, index) in deviceStatusData" 
                      :key="index"
                      class="chart-bar"
                      :style="{ height: item.value * 2 + 'px', backgroundColor: item.color }"
                    >
                      <span class="bar-label">{{ item.value }}</span>
                    </div>
                  </div>
                  <div class="chart-labels">
                    <div 
                      v-for="(item, index) in deviceStatusData" 
                      :key="index"
                      class="chart-label"
                    >
                      {{ item.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：最近告警 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8">
          <el-card class="alerts-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>最近告警</span>
                <el-tag type="danger" size="small">{{ recentAlerts.length }}</el-tag>
              </div>
            </template>
            <div class="alerts-list">
              <div 
                v-for="(alert, index) in recentAlerts" 
                :key="index"
                class="alert-item"
                :class="getAlertClass(alert.level)"
              >
                <div class="alert-icon">
                  <i :class="getAlertIcon(alert.level)"></i>
                </div>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-time">{{ alert.time }}</div>
                </div>
                <div class="alert-status">
                  <el-tag 
                    :type="getAlertTagType(alert.level)" 
                    size="small"
                  >
                    {{ getAlertLevelText(alert.level) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 设备列表 -->
      <el-card class="devices-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>设备列表</span>
            <div class="header-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索设备..."
                class="search-input"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <i class="el-icon-search"></i>
                </template>
              </el-input>
              <el-select 
                v-model="statusFilter" 
                placeholder="状态筛选"
                clearable
                @change="handleFilter"
              >
                <el-option label="全部" value=""></el-option>
                <el-option label="在线" value="online"></el-option>
                <el-option label="离线" value="offline"></el-option>
                <el-option label="故障" value="error"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredDevices" 
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="id" label="设备ID" width="100">
            <template #default="{ row }">
              <span class="device-id">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="设备名称" min-width="150">
            <template #default="{ row }">
              <div class="device-name">
                <i class="el-icon-monitor"></i>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="设备类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getDeviceTypeTag(row.type)" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusTagType(row.status)" 
                size="small"
                effect="light"
              >
                <i :class="getStatusIcon(row.status)" class="status-icon"></i>
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" min-width="120" />
          <el-table-column prop="lastUpdate" label="最后更新" width="160" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link 
                size="small"
                @click="handleViewDevice(row)"
              >
                查看
              </el-button>
              <el-button 
                type="primary" 
                link 
                size="small"
                @click="handleAnalyze(row)"
              >
                分析
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const stats = ref({
  totalDevices: 156,
  onlineDevices: 128,
  alerts: 12,
  dataVolume: 2456
})

const deviceStatusData = ref([
  { name: '在线', value: 128, color: '#67C23A' },
  { name: '离线', value: 18, color: '#909399' },
  { name: '故障', value: 10, color: '#E6A23C' }
])

const recentAlerts = ref([
  { id: 1, title: '设备信号异常', level: 'high', time: '10分钟前' },
  { id: 2, title: '数据包丢失', level: 'medium', time: '25分钟前' },
  { id: 3, title: 'CPU使用率过高', level: 'low', time: '1小时前' },
  { id: 4, title: '内存不足警告', level: 'medium', time: '2小时前' }
])

const devices = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 计算属性
const totalDevices = computed(() => devices.value.length)

const filteredDevices = computed(() => {
  let filtered = devices.value
  
  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      device.id.includes(searchQuery.value)
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(device => device.status === statusFilter.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const getAlertClass = (level) => {
  const classMap = {
    high: 'alert-high',
    medium: 'alert-medium',
    low: 'alert-low'
  }
  return classMap[level] || ''
}

const getAlertIcon = (level) => {
  const iconMap = {
    high: 'el-icon-warning',
    medium: 'el-icon-info',
    low: 'el-icon-question'
  }
  return iconMap[level] || 'el-icon-info'
}

const getAlertTagType = (level) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[level] || 'info'
}

const getAlertLevelText = (level) => {
  const textMap = {
    high: '高危',
    medium: '中危',
    low: '低危'
  }
  return textMap[level] || '未知'
}

const getDeviceTypeTag = (type) => {
  const typeMap = {
    '基站': 'primary',
    '终端': 'success',
    '中继': 'warning',
    '监控': 'info'
  }
  return typeMap[type] || 'info'
}

const getStatusTagType = (status) => {
  const typeMap = {
    online: 'success',
    offline: 'info',
    error: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusIcon = (status) => {
  const iconMap = {
    online: 'el-icon-success',
    offline: 'el-icon-turn-off',
    error: 'el-icon-error'
  }
  return iconMap[status] || 'el-icon-question'
}

const getStatusText = (status) => {
  const textMap = {
    online: '在线',
    offline: '离线',
    error: '故障'
  }
  return textMap[status] || '未知'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleViewDevice = (device) => {
  ElMessage.success(`查看设备: ${device.name}`)
}

const handleAnalyze = (device) => {
  ElMessage.info(`开始分析设备: ${device.name}`)
}

// 模拟数据初始化
const initMockData = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    devices.value = Array.from({ length: 45 }, (_, index) => ({
      id: `DEV${String(index + 1).padStart(3, '0')}`,
      name: `无线电设备 ${index + 1}`,
      type: ['基站', '终端', '中继', '监控'][index % 4],
      status: ['online', 'offline', 'error'][index % 3],
      location: `位置${index + 1}`,
      lastUpdate: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
    }))
    
    loading.value = false
  }, 1000)
}

// 生命周期
onMounted(() => {
  initMockData()
})
</script>

<style lang="scss" scoped>


@use './SystemLogs.scss';


</style>