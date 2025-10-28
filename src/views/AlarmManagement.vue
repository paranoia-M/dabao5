<template>
  <div class="home-container">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" v-for="card in overviewCards" :key="card.title">
          <el-card class="stat-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon" :style="{ backgroundColor: card.color }">
                <span class="icon-symbol">{{ card.icon }}</span>
              </div>
              <div class="card-info">
                <div class="card-value">{{ card.value }}</div>
                <div class="card-title">{{ card.title }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 温度湿度图表 -->
        <el-col :xs="24" :sm="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>温度湿度监测</span>
                <el-select v-model="timeRange" size="small" style="width: 120px" @change="handleTimeRangeChange">
                  <el-option label="今日" value="today"></el-option>
                  <el-option label="本周" value="week"></el-option>
                  <el-option label="本月" value="month"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-content">
                <div class="chart-mock">
                  <div class="mock-line temp-line"></div>
                  <div class="mock-line humidity-line"></div>
                  <div class="chart-legend">
                    <div class="legend-item">
                      <span class="legend-color temp-color"></span>
                      温度 (°C)
                    </div>
                    <div class="legend-item">
                      <span class="legend-color humidity-color"></span>
                      湿度 (%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 土壤数据 -->
        <el-col :xs="24" :sm="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <span>土壤监测数据</span>
            </template>
            <div class="soil-data">
              <div class="soil-item" v-for="item in soilData" :key="item.name">
                <div class="soil-info">
                  <span class="soil-name">{{ item.name }}</span>
                  <span class="soil-value">{{ item.value }}</span>
                </div>
                <el-progress 
                  :percentage="item.percentage" 
                  :color="item.color"
                  :show-text="false">
                </el-progress>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 设备状态 -->
    <div class="devices-section">
      <el-card shadow="hover">
        <template #header>
          <div class="devices-header">
            <span>设备运行状态</span>
            <el-button type="primary" size="small" @click="refreshDevices">
              <span class="refresh-icon">↻</span>
              刷新
            </el-button>
          </div>
        </template>
        <el-table 
          :data="devices" 
          v-loading="loading"
          style="width: 100%">
          <el-table-column prop="name" label="设备名称" width="180">
            <template #default="{ row }">
              <div class="device-name">
                <span class="device-icon" :class="{ 'online': row.status === 'online', 'offline': row.status === 'offline' }">
                  📊
                </span>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="设备类型" width="120"></el-table-column>
          <el-table-column prop="location" label="安装位置"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === 'online' ? 'success' : 'danger'"
                size="small">
                {{ row.status === 'online' ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                size="small" 
                :disabled="row.status === 'offline'"
                @click="handleDeviceControl(row)">
                控制
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 环境预警 -->
    <div class="alerts-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8" v-for="alert in alerts" :key="alert.type">
          <el-alert
            :title="alert.title"
            :type="alert.type"
            :description="alert.description"
            :closable="false"
            show-icon>
          </el-alert>
        </el-col>
      </el-row>
    </div>

    <!-- 设备控制弹窗 -->
    <el-dialog
      v-model="deviceControlDialog.visible"
      :title="`设备控制 - ${deviceControlDialog.deviceName}`"
      width="500px"
      center>
      <div class="device-control-content">
        <div class="control-section" v-if="deviceControlDialog.deviceType === '传感器'">
          <h4>传感器配置</h4>
          <el-form label-width="100px">
            <el-form-item label="采集频率">
              <el-select v-model="deviceControlDialog.settings.frequency" placeholder="请选择采集频率">
                <el-option label="1分钟" value="1min"></el-option>
                <el-option label="5分钟" value="5min"></el-option>
                <el-option label="10分钟" value="10min"></el-option>
                <el-option label="30分钟" value="30min"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="数据精度">
              <el-select v-model="deviceControlDialog.settings.precision" placeholder="请选择数据精度">
                <el-option label="高精度" value="high"></el-option>
                <el-option label="标准精度" value="standard"></el-option>
                <el-option label="节能模式" value="low"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="control-section" v-if="deviceControlDialog.deviceType === '控制器'">
          <h4>控制器操作</h4>
          <el-form label-width="100px">
            <el-form-item label="设备状态">
              <el-switch
                v-model="deviceControlDialog.settings.power"
                active-text="开启"
                inactive-text="关闭">
              </el-switch>
            </el-form-item>
            <el-form-item label="工作模式">
              <el-select v-model="deviceControlDialog.settings.mode" placeholder="请选择工作模式">
                <el-option label="自动模式" value="auto"></el-option>
                <el-option label="手动模式" value="manual"></el-option>
                <el-option label="定时模式" value="schedule"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="control-section">
          <h4>设备信息</h4>
          <div class="device-info">
            <div class="info-item">
              <span class="info-label">设备ID：</span>
              <span class="info-value">{{ deviceControlDialog.deviceId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">安装位置：</span>
              <span class="info-value">{{ deviceControlDialog.location }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后在线：</span>
              <span class="info-value">{{ deviceControlDialog.lastUpdate }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceControlDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeviceControl">
            确认配置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const timeRange = ref('today')
const loading = ref(false)

// 设备控制弹窗数据
const deviceControlDialog = reactive({
  visible: false,
  deviceId: null,
  deviceName: '',
  deviceType: '',
  location: '',
  lastUpdate: '',
  settings: {
    frequency: '5min',
    precision: 'standard',
    power: true,
    mode: 'auto'
  }
})

// 顶部概览卡片数据
const overviewCards = reactive([
  { title: '在线设备', value: '24', icon: '📱', color: '#409EFF' },
  { title: '环境温度', value: '26.5°C', icon: '🌡️', color: '#E6A23C' },
  { title: '土壤湿度', value: '65%', icon: '💧', color: '#67C23A' },
  { title: '光照强度', value: '850 lux', icon: '☀️', color: '#F56C6C' }
])

// 土壤数据
const soilData = reactive([
  { name: '土壤湿度', value: '65%', percentage: 65, color: '#67C23A' },
  { name: '土壤温度', value: '22°C', percentage: 44, color: '#E6A23C' },
  { name: '酸碱度', value: '6.8', percentage: 68, color: '#409EFF' },
  { name: '氮含量', value: '适中', percentage: 75, color: '#909399' }
])

// 设备数据
const devices = reactive([
  { id: 1, name: '温湿度传感器-01', type: '传感器', location: '1号大棚A区', status: 'online', lastUpdate: '2024-01-20 10:30:15' },
  { id: 2, name: '土壤监测器-02', type: '监测器', location: '2号大棚B区', status: 'online', lastUpdate: '2024-01-20 10:28:45' },
  { id: 3, name: '智能灌溉-01', type: '控制器', location: '1号大棚C区', status: 'offline', lastUpdate: '2024-01-19 16:20:30' },
  { id: 4, name: '光照传感器-01', type: '传感器', location: '3号大棚A区', status: 'online', lastUpdate: '2024-01-20 10:25:10' }
])

// 预警信息
const alerts = reactive([
  { 
    type: 'warning', 
    title: '温度预警', 
    description: '1号大棚温度偏高，建议通风降温' 
  },
  { 
    type: 'info', 
    title: '设备维护', 
    description: '智能灌溉-01设备离线，请检查连接' 
  },
  { 
    type: 'success', 
    title: '环境正常', 
    description: '当前大部分环境参数处于正常范围' 
  }
])

// 方法
const refreshDevices = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    loading.value = false
    ElMessage.success('设备状态已刷新')
    // 模拟数据更新
    devices.forEach(device => {
      if (device.status === 'online') {
        device.lastUpdate = new Date().toLocaleString('zh-CN')
      }
    })
  }, 1000)
}

const handleDeviceControl = (device) => {
  deviceControlDialog.visible = true
  deviceControlDialog.deviceId = device.id
  deviceControlDialog.deviceName = device.name
  deviceControlDialog.deviceType = device.type
  deviceControlDialog.location = device.location
  deviceControlDialog.lastUpdate = device.lastUpdate
  
  // 根据设备类型初始化设置
  if (device.type === '传感器') {
    deviceControlDialog.settings = {
      frequency: '5min',
      precision: 'standard',
      power: true,
      mode: 'auto'
    }
  } else if (device.type === '控制器') {
    deviceControlDialog.settings = {
      frequency: '5min',
      precision: 'standard',
      power: device.status === 'online',
      mode: 'auto'
    }
  }
}

const confirmDeviceControl = () => {
  ElMessage.success(`设备 ${deviceControlDialog.deviceName} 配置已更新`)
  deviceControlDialog.visible = false
  
  // 模拟配置生效
  const device = devices.find(d => d.id === deviceControlDialog.deviceId)
  if (device) {
    device.lastUpdate = new Date().toLocaleString('zh-CN')
  }
}

const handleTimeRangeChange = (value) => {
  ElMessage.info(`已切换到${getTimeRangeText(value)}数据`)
  // 这里可以添加实际的数据更新逻辑
}

const getTimeRangeText = (value) => {
  const map = {
    today: '今日',
    week: '本周',
    month: '本月'
  }
  return map[value] || '今日'
}

// 生命周期
onMounted(() => {
  ElMessage.success('航清环境应急移动源管理软件已加载')
})
</script>

<style lang="scss" scoped>

@use './AlarmManagement.scss';

</style>