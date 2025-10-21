<template>
  <div class="monitor-container">
    <el-card class="status-overview" shadow="never">
      <div class="header">
        <h2 class="title">系统状态概览</h2>
        <el-tag type="success" effect="light" class="status-tag">运行正常</el-tag>
      </div>
      
      <el-row :gutter="20" class="metrics-row">
        <el-col :span="6" v-for="(metric, index) in metrics" :key="index">
          <el-card shadow="hover" class="metric-card-wrapper">
            <div class="metric-card">
              <div class="metric-value">{{ metric.value }}</div>
              <div class="metric-title">{{ metric.title }}</div>
              <el-progress 
                :percentage="metric.percentage" 
                :status="metric.status" 
                :stroke-width="10"
                class="metric-progress"
                :show-text="false"
              />
              <div class="metric-footer">
                <span :class="['status-dot', metric.status]"></span>
                <span class="status-text">{{ getStatusText(metric.status) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="alert-section" shadow="never">
      <div class="header">
        <h2 class="title">告警信息</h2>
        <div class="header-actions">
          <el-button type="primary" size="small" @click="refreshAlerts" plain>
            <span class="button-text">刷新数据</span>
          </el-button>
          <el-button size="small" @click="showAlertStats" plain>
            <span class="button-text">统计信息</span>
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="alerts" 
        style="width: 100%" 
        v-loading="loading"
        class="alert-table"
        stripe
        border
      >
        <el-table-column prop="time" label="告警时间" width="180" align="center" />
        <el-table-column prop="level" label="告警级别" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlertTagType(row.level)" effect="light" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="告警来源" width="150" align="center" />
        <el-table-column prop="message" label="告警内容" min-width="200" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showAlertDetail(row)" plain>详情</el-button>
            <el-button size="small" type="primary" @click="handleAlert(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :small="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalAlerts"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never">
          <div class="header">
            <h3 class="chart-title">CPU使用率趋势</h3>
            <el-select 
              v-model="cpuTimeRange" 
              size="small" 
              style="width: 120px"
              @change="fetchCpuData"
            >
              <el-option label="1小时" value="1h" />
              <el-option label="6小时" value="6h" />
              <el-option label="24小时" value="24h" />
            </el-select>
          </div>
          <div class="chart-container">
            <div ref="cpuChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <div class="header">
            <h3 class="chart-title">内存使用率趋势</h3>
            <el-select 
              v-model="memoryTimeRange" 
              size="small" 
              style="width: 120px"
              @change="fetchMemoryData"
            >
              <el-option label="1小时" value="1h" />
              <el-option label="6小时" value="6h" />
              <el-option label="24小时" value="24h" />
            </el-select>
          </div>
          <div class="chart-container">
            <div ref="memoryChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警详情弹窗 -->
    <el-dialog
      v-model="alertDetailVisible"
      :title="currentAlert ? '告警详情 - ' + currentAlert.message : '告警详情'"
      width="600px"
    >
      <div v-if="currentAlert" class="alert-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="告警ID">{{ currentAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="告警时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getAlertTagType(currentAlert.level)" size="small">
              {{ currentAlert.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警来源">{{ currentAlert.source }}</el-descriptions-item>
          <el-descriptions-item label="详细内容">{{ currentAlert.message }}</el-descriptions-item>
        </el-descriptions>
        <div class="alert-actions">
          <el-button type="primary" @click="handleAlert(currentAlert)">标记为已处理</el-button>
          <el-button @click="alertDetailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 告警统计弹窗 -->
    <el-dialog
      v-model="alertStatsVisible"
      title="告警统计信息"
      width="500px"
    >
      <div class="stats-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="总告警数">{{ totalAlerts }}</el-descriptions-item>
          <el-descriptions-item label="严重告警">
            {{ getAlertCountByLevel('严重') }} 条
          </el-descriptions-item>
          <el-descriptions-item label="警告告警">
            {{ getAlertCountByLevel('警告') }} 条
          </el-descriptions-item>
          <el-descriptions-item label="一般告警">
            {{ getAlertCountByLevel('一般') }} 条
          </el-descriptions-item>
          <el-descriptions-item label="最近告警时间">
            {{ getLatestAlertTime() }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

// 系统指标数据
const metrics = ref([
  { title: 'CPU使用率', value: '32%', percentage: 32, status: 'success' },
  { title: '内存使用', value: '5.2/16GB', percentage: 32.5, status: 'success' },
  { title: '磁盘空间', value: '1.2/2TB', percentage: 60, status: 'warning' },
  { title: '网络流量', value: '256Mbps', percentage: 64, status: 'success' }
])

// 告警数据
const alerts = ref([
  { id: 1, time: '2023-05-15 08:23:45', level: '警告', source: '服务器A', message: 'CPU使用率超过80%' },
  { id: 2, time: '2023-05-15 08:15:32', level: '严重', source: '数据库B', message: '连接数达到上限' },
  { id: 3, time: '2023-05-15 07:58:12', level: '一般', source: '网络设备C', message: '端口异常波动' },
  { id: 4, time: '2023-05-15 07:42:56', level: '警告', source: '服务器D', message: '内存使用率超过75%' },
  { id: 5, time: '2023-05-15 07:30:18', level: '一般', source: '应用服务E', message: '响应时间超过阈值' }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalAlerts = ref(25)

const cpuTimeRange = ref('1h')
const memoryTimeRange = ref('1h')

const cpuChart = ref(null)
const memoryChart = ref(null)
const alertDetailVisible = ref(false)
const alertStatsVisible = ref(false)
const currentAlert = ref(null)

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    success: '正常',
    warning: '警告',
    danger: '危险'
  }
  return statusMap[status] || '未知'
}

// 获取告警标签类型
const getAlertTagType = (level) => {
  switch (level) {
    case '严重': return 'danger'
    case '警告': return 'warning'
    default: return ''
  }
}

// 显示告警详情
const showAlertDetail = (alert) => {
  currentAlert.value = alert
  alertDetailVisible.value = true
}

// 显示告警统计
const showAlertStats = () => {
  alertStatsVisible.value = true
}

// 处理告警
const handleAlert = (alert) => {
  ElMessageBox.confirm(
    `确认要将该告警标记为已处理吗？<br>${alert.message}`,
    '处理告警',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true
    }
  ).then(() => {
    const index = alerts.value.findIndex(item => item.id === alert.id)
    if (index !== -1) {
      alerts.value.splice(index, 1)
      totalAlerts.value -= 1
      ElMessage.success('告警已处理')
      alertDetailVisible.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 刷新告警
const refreshAlerts = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    // 模拟新增告警
    const newAlert = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      level: ['一般', '警告', '严重'][Math.floor(Math.random() * 3)],
      source: ['服务器A', '数据库B', '网络设备C', '应用服务D'][Math.floor(Math.random() * 4)],
      message: ['CPU使用率高', '内存泄漏', '磁盘空间不足', '网络延迟高'][Math.floor(Math.random() * 4)]
    }
    alerts.value.unshift(newAlert)
    totalAlerts.value += 1
    loading.value = false
    ElMessage.success('告警数据已刷新')
  }, 800)
}

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchAlertData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchAlertData()
}

// 获取告警数据
const fetchAlertData = () => {
  // 模拟分页数据请求
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 获取CPU数据
const fetchCpuData = () => {
  // 模拟不同时间范围的数据
  const dataMap = {
    '1h': [20, 25, 30, 45, 40, 35, 50],
    '6h': [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
    '24h': [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 85, 80, 75, 70, 65, 60, 55]
  }
  updateCpuChart(dataMap[cpuTimeRange.value] || dataMap['1h'])
}

// 获取内存数据
const fetchMemoryData = () => {
  // 模拟不同时间范围的数据
  const dataMap = {
    '1h': [25, 30, 28, 35, 40, 38, 45],
    '6h': [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
    '24h': [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40]
  }
  updateMemoryChart(dataMap[memoryTimeRange.value] || dataMap['1h'])
}

// 更新CPU图表
const updateCpuChart = (data) => {
  const cpuChartInstance = echarts.getInstanceByDom(cpuChart.value)
  if (cpuChartInstance) {
    cpuChartInstance.setOption({
      xAxis: {
        data: generateTimeLabels(cpuTimeRange.value)
      },
      series: [{
        data: data
      }]
    })
  }
}

// 更新内存图表
const updateMemoryChart = (data) => {
  const memoryChartInstance = echarts.getInstanceByDom(memoryChart.value)
  if (memoryChartInstance) {
    memoryChartInstance.setOption({
      xAxis: {
        data: generateTimeLabels(memoryTimeRange.value)
      },
      series: [{
        data: data
      }]
    })
  }
}

// 生成时间标签
const generateTimeLabels = (range) => {
  const count = range === '1h' ? 7 : range === '6h' ? 12 : 24
  const interval = range === '1h' ? 10 : range === '6h' ? 30 : 60
  const labels = []
  for (let i = 0; i < count; i++) {
    const minutes = i * interval
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    labels.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }
  return labels
}

// 获取告警数量按级别
const getAlertCountByLevel = (level) => {
  return alerts.value.filter(alert => alert.level === level).length
}

// 获取最近告警时间
const getLatestAlertTime = () => {
  if (alerts.value.length === 0) return '无告警'
  return alerts.value[0].time
}

// 初始化图表
const initCharts = () => {
  // CPU使用率图表
  const cpuChartInstance = echarts.init(cpuChart.value)
  cpuChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>使用率: {c}%'
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
      data: generateTimeLabels('1h'),
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'CPU使用率',
        data: [20, 25, 30, 45, 40, 35, 50],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  })

  // 内存使用率图表
  const memoryChartInstance = echarts.init(memoryChart.value)
  memoryChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>使用率: {c}%'
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
      data: generateTimeLabels('1h'),
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '内存使用率',
        data: [25, 30, 28, 35, 40, 38, 45],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  })

  // 响应式调整图表大小
  window.addEventListener('resize', () => {
    cpuChartInstance.resize()
    memoryChartInstance.resize()
  })
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    fetchAlertData()
    fetchCpuData()
    fetchMemoryData()
  })
})

// 监听时间范围变化
watch([cpuTimeRange, memoryTimeRange], () => {
  if (cpuTimeRange.value) fetchCpuData()
  if (memoryTimeRange.value) fetchMemoryData()
})
</script>

<style lang="scss" scoped>
@use './Report.scss';
.monitor-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);

  .status-overview, .alert-section {
    margin-bottom: 20px;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
        color: #303133;
      }

      .status-tag {
        font-size: 14px;
        padding: 0 10px;
        height: 28px;
        line-height: 28px;
      }

      .header-actions {
        display: flex;
        gap: 10px;

        .button-text {
          margin-left: 5px;
        }
      }
    }
  }

  .metrics-row {
    margin-bottom: -20px;

    .metric-card-wrapper {
      margin-bottom: 20px;

      .metric-card {
        padding: 15px;

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 5px;
        }

        .metric-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 15px;
        }

        .metric-progress {
          margin-bottom: 10px;
        }

        .metric-footer {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #606266;

          .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;

            &.success {
              background-color: #67c23a;
            }

            &.warning {
              background-color: #e6a23c;
            }

            &.danger {
              background-color: #f56c6c;
            }
          }
        }
      }
    }
  }

  .alert-table {
    margin-top: 15px;
  }

  .pagination {
    margin-top: 15px;
    justify-content: flex-end;
  }

  .chart-row {
    margin-bottom: 20px;

    .chart-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .chart-container {
      margin-top: 15px;
    }
  }

  .alert-detail-content {
    .alert-actions {
      margin-top: 20px;
      text-align: right;
    }
  }
}
</style>