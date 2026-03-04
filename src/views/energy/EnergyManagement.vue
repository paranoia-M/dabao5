<template>
  <div class="energy-management">
    <!-- 页面标题和统计概览 -->
    <div class="page-header">
      <h1 class="page-title">能源管理系统</h1>
      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <div class="stat-card total-energy">
              <div class="stat-icon">
                <el-icon><Lightning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(totalEnergy) }} kWh</div>
                <div class="stat-label">总能耗</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <div class="stat-card today-energy">
              <div class="stat-icon">
                <el-icon><Sunny /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(todayEnergy) }} kWh</div>
                <div class="stat-label">今日能耗</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <div class="stat-card cost-savings">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">¥{{ formatNumber(costSavings) }}</div>
                <div class="stat-label">本月节省</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <div class="stat-card carbon-reduction">
              <div class="stat-icon">
                <el-icon><Promotion /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(carbonReduction) }} t</div>
                <div class="stat-label">碳减排量</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 能耗图表区域 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <div class="chart-card">
            <div class="chart-header">
              <h3>能耗趋势分析</h3>
              <div class="chart-controls">
                <el-select v-model="chartTimeRange" placeholder="选择时间范围" size="small" @change="updateChartData">
                  <el-option label="最近7天" value="7days" />
                  <el-option label="最近30天" value="30days" />
                  <el-option label="最近90天" value="90days" />
                </el-select>
              </div>
            </div>
            <div class="chart-container">
              <div ref="energyChart" class="energy-chart"></div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <div class="chart-card">
            <div class="chart-header">
              <h3>能耗分布</h3>
            </div>
            <div class="chart-container">
              <div ref="pieChart" class="pie-chart"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 设备列表区域 -->
    <div class="device-section">
      <div class="section-header">
        <h2>设备监控</h2>
        <div class="section-controls">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备"
            clearable
            size="small"
            style="width: 200px; margin-right: 10px;"
            @input="handleSearch"
          />
          <el-select v-model="deviceStatusFilter" placeholder="状态筛选" size="small" @change="filterDevices">
            <el-option label="全部" value="all" />
            <el-option label="运行中" value="running" />
            <el-option label="待机" value="standby" />
            <el-option label="故障" value="fault" />
          </el-select>
        </div>
      </div>
      
      <el-table :data="filteredDevices" style="width: 100%" :loading="loading">
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="type" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="150" />
        <el-table-column prop="power" label="功率" width="100">
          <template #default="{ row }">
            {{ row.power }} kW
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="energyConsumption" label="今日能耗" width="120">
          <template #default="{ row }">
            {{ row.energyConsumption }} kWh
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleControl(row)" :disabled="row.status === 'fault'">
              {{ row.status === 'running' ? '关闭' : '启动' }}
            </el-button>
            <el-button size="small" type="info" @click="showDetail(row)">详情</el-button>
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
    </div>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备详情" width="600px">
      <div v-if="selectedDevice" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备名称">{{ selectedDevice.name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ selectedDevice.type }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedDevice.location }}</el-descriptions-item>
          <el-descriptions-item label="功率">{{ selectedDevice.power }} kW</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(selectedDevice.status)">
              {{ getStatusText(selectedDevice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="今日能耗">{{ selectedDevice.energyConsumption }} kWh</el-descriptions-item>
          <el-descriptions-item label="本月能耗">{{ selectedDevice.monthlyEnergy }} kWh</el-descriptions-item>
          <el-descriptions-item label="安装日期">{{ selectedDevice.installDate }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-chart">
          <h4>最近24小时能耗趋势</h4>
          <div ref="detailChart" class="detail-chart-container"></div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleControl(selectedDevice)" :disabled="selectedDevice?.status === 'fault'">
            {{ selectedDevice?.status === 'running' ? '关闭设备' : '启动设备' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

// 修复：使用正确的图标导入方式
import { Lightning, Sunny, Money, Promotion } from '@element-plus/icons-vue'

// 响应式数据
const totalEnergy = ref(12560.8)
const todayEnergy = ref(356.2)
const costSavings = ref(8560.5)
const carbonReduction = ref(12.8)

const chartTimeRange = ref('7days')
const energyChart = ref(null)
const pieChart = ref(null)
const detailChart = ref(null)

const searchKeyword = ref('')
const deviceStatusFilter = ref('all')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)

const detailDialogVisible = ref(false)
const selectedDevice = ref(null)

// 设备数据
const devices = ref([
  { id: 1, name: '中央空调主机', type: '空调', location: 'B1层机房', power: 120, status: 'running', energyConsumption: 85.6, monthlyEnergy: 2560, installDate: '2023-01-15' },
  { id: 2, name: '照明系统A区', type: '照明', location: 'A区走廊', power: 15, status: 'standby', energyConsumption: 12.3, monthlyEnergy: 369, installDate: '2023-02-20' },
  { id: 3, name: '电梯1号', type: '电梯', location: '1号楼', power: 25, status: 'running', energyConsumption: 45.8, monthlyEnergy: 1374, installDate: '2023-01-10' },
  { id: 4, name: '水泵系统', type: '水泵', location: 'B2层泵房', power: 45, status: 'fault', energyConsumption: 0, monthlyEnergy: 0, installDate: '2023-03-05' },
  { id: 5, name: '通风系统', type: '通风', location: '楼顶机房', power: 30, status: 'running', energyConsumption: 67.2, monthlyEnergy: 2016, installDate: '2023-01-25' },
  { id: 6, name: '安防监控', type: '安防', location: '监控中心', power: 8, status: 'running', energyConsumption: 19.2, monthlyEnergy: 576, installDate: '2023-02-15' },
  { id: 7, name: '消防系统', type: '消防', location: '消防控制室', power: 12, status: 'standby', energyConsumption: 2.4, monthlyEnergy: 72, installDate: '2023-01-30' },
  { id: 8, name: '数据中心', type: 'IT设备', location: '3层机房', power: 80, status: 'running', energyConsumption: 192, monthlyEnergy: 5760, installDate: '2023-01-05' },
  { id: 9, name: '给排水系统', type: '给排水', location: 'B1层', power: 35, status: 'running', energyConsumption: 52.5, monthlyEnergy: 1575, installDate: '2023-02-28' },
  { id: 10, name: '停车场照明', type: '照明', location: '地下停车场', power: 20, status: 'standby', energyConsumption: 8.6, monthlyEnergy: 258, installDate: '2023-03-10' },
])

// 计算属性
const filteredDevices = computed(() => {
  let filtered = devices.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(keyword) ||
      device.location.toLowerCase().includes(keyword) ||
      device.type.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  if (deviceStatusFilter.value !== 'all') {
    filtered = filtered.filter(device => device.status === deviceStatusFilter.value)
  }
  
  // 更新总数
  totalDevices.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const getDeviceTypeTag = (type) => {
  const typeMap = {
    '空调': 'primary',
    '照明': 'success',
    '电梯': 'warning',
    '水泵': 'info',
    '通风': '',
    '安防': 'danger',
    '消防': 'danger',
    'IT设备': 'info',
    '给排水': ''
  }
  return typeMap[type] || ''
}

const getStatusTag = (status) => {
  const statusMap = {
    'running': 'success',
    'standby': 'warning',
    'fault': 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    'running': '运行中',
    'standby': '待机',
    'fault': '故障'
  }
  return textMap[status] || status
}

const handleSearch = () => {
  currentPage.value = 1
}

const filterDevices = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleControl = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要${device.status === 'running' ? '关闭' : '启动'}设备 "${device.name}" 吗？`,
      '设备控制',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟设备状态切换
    loading.value = true
    setTimeout(() => {
      device.status = device.status === 'running' ? 'standby' : 'running'
      ElMessage.success(`设备 ${device.name} ${device.status === 'running' ? '已启动' : '已关闭'}`)
      loading.value = false
    }, 500)
    
  } catch (error) {
    // 用户取消操作
  }
}

const showDetail = (device) => {
  selectedDevice.value = device
  detailDialogVisible.value = true
  
  nextTick(() => {
    if (detailChart.value) {
      initDetailChart()
    }
  })
}

// 图表相关方法
const initEnergyChart = () => {
  if (!energyChart.value) return
  
  const chart = echarts.init(energyChart.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c} kWh'
    },
    legend: {
      data: ['能耗']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '能耗 (kWh)'
    },
    series: [
      {
        name: '能耗',
        type: 'line',
        smooth: true,
        data: [320, 332, 301, 334, 390, 330, 320],
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

const initPieChart = () => {
  if (!pieChart.value) return
  
  const chart = echarts.init(pieChart.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} kWh ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '能耗分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 2560, name: '空调系统' },
          { value: 5760, name: 'IT设备' },
          { value: 1374, name: '电梯' },
          { value: 2016, name: '通风系统' },
          { value: 1575, name: '给排水' },
          { value: 627, name: '照明系统' },
          { value: 648, name: '其他' }
        ]
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

const initDetailChart = () => {
  if (!detailChart.value) return
  
  const chart = echarts.init(detailChart.value)
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10) + 1)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>能耗: {c} kWh'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '能耗 (kWh)'
    },
    series: [
      {
        name: '能耗',
        type: 'line',
        smooth: true,
        data: data,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

const updateChartData = () => {
  // 这里可以模拟根据时间范围更新图表数据
  ElMessage.info(`已切换到${chartTimeRange.value}数据`)
}

// 生命周期钩子
onMounted(() => {
  totalDevices.value = devices.value.length
  
  nextTick(() => {
    initEnergyChart()
    initPieChart()
  })
})

// 监听分页变化
watch([currentPage, pageSize], () => {
  // 这里可以模拟加载更多数据
})
</script>

<style lang="scss" scoped>

@use './EnergyManagement.scss';
.energy-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 20px;
    }

    .statistics-overview {
      .stat-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          color: white;

          .el-icon {
            font-size: 28px;
          }
        }

        .stat-content {
          flex: 1;

          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }

      .total-energy .stat-icon {
        background: linear-gradient(135deg, #409EFF, #66b1ff);
      }

      .today-energy .stat-icon {
        background: linear-gradient(135deg, #67C23A, #85ce61);
      }

      .cost-savings .stat-icon {
        background: linear-gradient(135deg, #E6A23C, #ebb563);
      }

      .carbon-reduction .stat-icon {
        background: linear-gradient(135deg, #909399, #a6a9ad);
      }
    }
  }

  .chart-section {
    margin-bottom: 24px;

    .chart-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      height: 400px;
      display: flex;
      flex-direction: column;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0;
        }
      }

      .chart-container {
        flex: 1;
        position: relative;

        .energy-chart,
        .pie-chart {
          width: 100%;
          height: 100%;
        }
      }
    }
  }

  .device-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }

      .section-controls {
        display: flex;
        align-items: center;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .device-detail {
    .detail-chart {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }

      .detail-chart-container {
        width: 100%;
        height: 300px;
      }
    }
  }
}

@media (max-width: 768px) {
  .energy-management {
    padding: 10px;

    .page-header {
      .statistics-overview {
        .el-col {
          margin-bottom: 16px;
        }
      }
    }

    .chart-section {
      .el-col {
        margin-bottom: 16px;
      }
    }

    .device-section {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .section-controls {
          width: 100%;
          justify-content: space-between;
        }
      }
    }
  }
}

</style>