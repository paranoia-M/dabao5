
<template>
  <div class="monitoring-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2>航清智慧环保数据采集分析系统</h2>
        <div class="time-display">{{ currentTime }}</div>
      </div>

      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" v-for="item in overviewData" :key="item.title">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" :style="{ backgroundColor: item.color }">
                  <span class="stat-icon-text">{{ item.iconText }}</span>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ item.value }}</div>
                  <div class="stat-title">{{ item.title }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-card shadow="hover">
              <template #header>
                <div class="chart-header">
                  <span>环境参数趋势</span>
                  <el-select v-model="trendDays" size="small" style="width: 120px">
                    <el-option label="最近7天" value="7" />
                    <el-option label="最近30天" value="30" />
                    <el-option label="最近90天" value="90" />
                  </el-select>
                </div>
              </template>
              <div class="chart-container">
                <div ref="trendChart" style="height: 300px"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-card shadow="hover">
              <template #header>
                <div class="chart-header">
                  <span>异常类型分布</span>
                </div>
              </template>
              <div class="chart-container">
                <div ref="pieChart" style="height: 300px"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="alert-list">
        <el-card shadow="hover">
          <template #header>
            <div class="alert-header">
              <span>最新异常预警</span>
              <el-input
                v-model="searchQuery"
                placeholder="搜索预警信息"
                clearable
                style="width: 200px"
                size="small"
              />
            </div>
          </template>
          <el-table :data="filteredAlerts" style="width: 100%" v-loading="loading">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="location" label="监测点" width="120" />
            <el-table-column prop="parameter" label="参数" width="120" />
            <el-table-column prop="value" label="数值" width="120">
              <template #default="{ row }">
                <el-tag :type="getValueTagType(row)">{{ row.value }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="级别" width="120">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row)" effect="dark">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="handleDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalAlerts"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="预警详情" width="50%">
      <div v-if="currentAlert" class="alert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预警ID">{{ currentAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="监测点">{{ currentAlert.location }}</el-descriptions-item>
          <el-descriptions-item label="参数类型">{{ currentAlert.parameter }}</el-descriptions-item>
          <el-descriptions-item label="监测数值">
            <el-tag :type="getValueTagType(currentAlert)">{{ currentAlert.value }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <el-tag :type="getLevelTagType(currentAlert)" effect="dark">
              {{ currentAlert.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准范围">{{ currentAlert.standard }}</el-descriptions-item>
          <el-descriptions-item label="持续时间">{{ currentAlert.duration }}</el-descriptions-item>
          <el-descriptions-item :span="2" label="详细描述">
            {{ currentAlert.description }}
          </el-descriptions-item>
          <el-descriptions-item :span="2" label="处理建议">
            {{ currentAlert.suggestion }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleConfirm">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 当前时间
const currentTime = ref('')
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 数据概览
const overviewData = ref([
  {
    title: '监测点总数',
    value: '28',
    iconText: '📡',
    color: '#409EFF'
  },
  {
    title: '今日异常数',
    value: '12',
    iconText: '⚠️',
    color: '#E6A23C'
  },
  {
    title: '严重异常',
    value: '3',
    iconText: '🚨',
    color: '#F56C6C'
  },
  {
    title: '已处理异常',
    value: '8',
    iconText: '✅',
    color: '#67C23A'
  }
])

// 图表相关
const trendChart = ref(null)
const pieChart = ref(null)
const trendDays = ref('7')

// 预警列表
const alerts = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalAlerts = ref(0)

// 预警详情
const detailVisible = ref(false)
const currentAlert = ref(null)

// 生成假数据
const generateMockData = () => {
  const parameters = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3', '温度', '湿度', '噪音']
  const locations = ['A区监测点', 'B区监测点', 'C区监测点', 'D区监测点', 'E区监测点']
  const levels = ['轻微', '一般', '严重', '危急']
  
  const mockAlerts = []
  
  for (let i = 1; i <= 50; i++) {
    const parameter = parameters[Math.floor(Math.random() * parameters.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    
    let value
    let standard
    
    switch (parameter) {
      case 'PM2.5':
        value = (Math.random() * 200 + 35).toFixed(1)
        standard = '≤35μg/m³'
        break
      case 'PM10':
        value = (Math.random() * 300 + 50).toFixed(1)
        standard = '≤50μg/m³'
        break
      case 'SO2':
        value = (Math.random() * 50 + 10).toFixed(1)
        standard = '≤10μg/m³'
        break
      case 'NO2':
        value = (Math.random() * 100 + 40).toFixed(1)
        standard = '≤40μg/m³'
        break
      case 'CO':
        value = (Math.random() * 5 + 1).toFixed(1)
        standard = '≤1mg/m³'
        break
      case 'O3':
        value = (Math.random() * 100 + 80).toFixed(1)
        standard = '≤80μg/m³'
        break
      case '温度':
        value = (Math.random() * 15 + 25).toFixed(1)
        standard = '20-30°C'
        break
      case '湿度':
        value = (Math.random() * 40 + 30).toFixed(1)
        standard = '40-70%'
        break
      case '噪音':
        value = (Math.random() * 30 + 50).toFixed(1)
        standard = '≤55dB'
        break
    }
    
    const now = new Date()
    const randomHours = Math.floor(Math.random() * 24)
    const randomMinutes = Math.floor(Math.random() * 60)
    const alertTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    alertTime.setHours(randomHours)
    alertTime.setMinutes(randomMinutes)
    
    mockAlerts.push({
      id: `ALERT-${1000 + i}`,
      time: alertTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      location: locations[Math.floor(Math.random() * locations.length)],
      parameter,
      value,
      standard,
      level,
      duration: `${Math.floor(Math.random() * 120) + 10}分钟`,
      description: `${parameter}数值持续${level}超标，请及时处理`,
      suggestion: level === '危急' 
        ? '立即停止相关作业，启动应急预案'
        : level === '严重'
        ? '尽快排查污染源，采取控制措施'
        : '加强监测，关注变化趋势'
    })
  }
  
  return mockAlerts.sort((a, b) => new Date(b.time) - new Date(a.time))
}

// 过滤后的预警列表
const filteredAlerts = computed(() => {
  let result = alerts.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      item =>
        item.location.toLowerCase().includes(query) ||
        item.parameter.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.level.toLowerCase().includes(query)
    )
  }
  
  totalAlerts.value = result.length
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

// 获取数值标签类型
const getValueTagType = (row) => {
  switch (row.level) {
    case '轻微':
      return 'warning'
    case '一般':
      return 'warning'
    case '严重':
      return 'danger'
    case '危急':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取级别标签类型
const getLevelTagType = (row) => {
  switch (row.level) {
    case '轻微':
      return 'warning'
    case '一般':
      return 'warning'
    case '严重':
      return 'danger'
    case '危急':
      return 'danger'
    default:
      return 'info'
  }
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
}

// 处理当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 查看详情
const handleDetail = (row) => {
  currentAlert.value = row
  detailVisible.value = true
}

// 确认处理
const handleConfirm = () => {
  ElMessage.success('已确认处理该预警')
  detailVisible.value = false
}

// 初始化图表
const initCharts = () => {
  // 趋势图
  const trendChartInstance = echarts.init(trendChart.value)
  const trendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) => `${i + 1}天前`).reverse()
    },
    yAxis: {
      type: 'value',
      name: '浓度(μg/m³)'
    },
    series: [
      {
        name: 'PM2.5',
        type: 'line',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 30),
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'PM10',
        type: 'line',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 150) + 40),
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'SO2',
        type: 'line',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 5),
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'NO2',
        type: 'line',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 60) + 20),
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'CO',
        type: 'line',
        data: Array.from({ length: 7 }, () => (Math.random() * 3 + 0.5).toFixed(1)),
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'O3',
        type: 'line',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 30),
        smooth: true,
        lineStyle: {
          width: 3
        }
      }
    ]
  }
  trendChartInstance.setOption(trendOption)

  // 饼图
  const pieChartInstance = echarts.init(pieChart.value)
  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3', '温度', '湿度', '噪音']
    },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['50%', '70%'],
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 12, name: 'PM2.5' },
          { value: 8, name: 'PM10' },
          { value: 5, name: 'SO2' },
          { value: 7, name: 'NO2' },
          { value: 3, name: 'CO' },
          { value: 6, name: 'O3' },
          { value: 4, name: '温度' },
          { value: 2, name: '湿度' },
          { value: 3, name: '噪音' }
        ]
      }
    ]
  }
  pieChartInstance.setOption(pieOption)

  // 响应式调整
  window.addEventListener('resize', () => {
    trendChartInstance.resize()
    pieChartInstance.resize()
  })
}

// 初始化数据
onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  
  alerts.value = generateMockData()
  totalAlerts.value = alerts.value.length
  loading.value = false
  
  setTimeout(() => {
    initCharts()
  }, 100)
})

// 监听趋势天数变化
watch(trendDays, () => {
  initCharts()
})
</script>

<style lang="scss" scoped>


@use './Monitoring.scss';


</style>
