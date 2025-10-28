
<template>
  <div class="environment-monitor-container">
    <el-card class="dashboard-card">
      <div class="header">
        <h2>航清智慧环保数据采集分析系统</h2>
        <div class="time-display">{{ currentTime }}</div>
      </div>
      
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" v-for="item in overviewData" :key="item.title">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value" :class="item.status">{{ item.value }}</div>
              <div class="stat-trend">
                <span>{{ item.trend }} {{ item.trendValue }}</span>
                <span :style="{ color: item.trendColor }">{{ item.trendValue.includes('+') ? '↑' : '↓' }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover" class="chart-card">
              <div class="chart-title">环境参数趋势</div>
              <div class="chart-container" ref="lineChart"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover" class="chart-card">
              <div class="chart-title">异常类型分布</div>
              <div class="chart-container" ref="pieChart"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="alert-section">
        <el-card shadow="hover">
          <div class="section-header">
            <h3>实时异常预警</h3>
            <el-select v-model="alertFilter" placeholder="筛选预警级别" class="filter-select">
              <el-option label="全部" value="all" />
              <el-option label="轻微" value="轻微" />
              <el-option label="一般" value="一般" />
              <el-option label="严重" value="严重" />
              <el-option label="紧急" value="紧急" />
            </el-select>
          </div>
          
          <el-table :data="filteredAlerts" style="width: 100%" height="300" border>
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="location" label="监测点" width="120" />
            <el-table-column prop="parameter" label="参数" width="120" />
            <el-table-column prop="value" label="数值" width="100" />
            <el-table-column prop="level" label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="getAlertTagType(row.level)" size="small">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="handleAlertDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next"
              :total="alerts.length"
            />
          </div>
        </el-card>
      </div>
    </el-card>
    
    <el-dialog v-model="detailVisible" title="异常详情" width="50%">
      <div class="alert-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="异常ID">{{ currentAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="监测点">{{ currentAlert.location }}</el-descriptions-item>
          <el-descriptions-item label="参数类型">{{ currentAlert.parameter }}</el-descriptions-item>
          <el-descriptions-item label="异常数值">{{ currentAlert.value }}</el-descriptions-item>
          <el-descriptions-item label="正常范围">{{ currentAlert.normalRange }}</el-descriptions-item>
          <el-descriptions-item label="异常级别">
            <el-tag :type="getAlertTagType(currentAlert.level)">
              {{ currentAlert.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">{{ currentAlert.description }}</el-descriptions-item>
          <el-descriptions-item label="处理建议">{{ currentAlert.suggestion }}</el-descriptions-item>
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

// 数据概览
const overviewData = ref([
  { title: '监测点总数', value: '28', status: 'normal', trend: '较昨日', trendValue: '+2', trendColor: '#67C23A' },
  { title: '异常总数', value: '15', status: 'warning', trend: '较昨日', trendValue: '+5', trendColor: '#E6A23C' },
  { title: '今日新增', value: '3', status: 'danger', trend: '较昨日', trendValue: '+1', trendColor: '#F56C6C' },
  { title: '已处理', value: '8', status: 'success', trend: '较昨日', trendValue: '+3', trendColor: '#67C23A' }
])

// 图表相关
const lineChart = ref(null)
const pieChart = ref(null)
let lineChartInstance = null
let pieChartInstance = null

// 预警数据
const alerts = ref([
  { id: '20230001', time: '2023-05-15 08:23:45', location: 'A区1号', parameter: 'PM2.5', value: '85μg/m³', level: '轻微', description: 'PM2.5轻度超标', normalRange: '0-75μg/m³', suggestion: '加强通风' },
  { id: '20230002', time: '2023-05-15 09:12:33', location: 'B区3号', parameter: '温度', value: '32.5℃', level: '一般', description: '温度偏高', normalRange: '18-30℃', suggestion: '检查空调系统' },
  { id: '20230003', time: '2023-05-15 10:45:21', location: 'C区2号', parameter: '湿度', value: '85%', level: '严重', description: '湿度过高，可能造成设备损坏', normalRange: '30-70%', suggestion: '启动除湿设备' },
  { id: '20230004', time: '2023-05-15 11:30:15', location: 'D区5号', parameter: 'CO2', value: '1200ppm', level: '紧急', description: 'CO2浓度严重超标', normalRange: '0-1000ppm', suggestion: '立即疏散人员' },
  { id: '20230005', time: '2023-05-15 13:20:42', location: 'A区2号', parameter: '噪音', value: '75dB', level: '一般', description: '噪音超标', normalRange: '0-65dB', suggestion: '检查设备运行状态' },
  { id: '20230006', time: '2023-05-15 14:05:18', location: 'B区1号', parameter: 'PM10', value: '150μg/m³', level: '严重', description: 'PM10严重超标', normalRange: '0-100μg/m³', suggestion: '停止户外作业' },
  { id: '20230007', time: '2023-05-15 15:30:55', location: 'C区3号', parameter: '甲醛', value: '0.12mg/m³', level: '紧急', description: '甲醛浓度超标', normalRange: '0-0.08mg/m³', suggestion: '立即通风并排查污染源' },
  { id: '20230008', time: '2023-05-15 16:45:33', location: 'D区2号', parameter: 'TVOC', value: '0.6mg/m³', level: '一般', description: 'TVOC轻度超标', normalRange: '0-0.5mg/m³', suggestion: '加强通风' }
])

// 分页和筛选
const currentPage = ref(1)
const pageSize = ref(5)
const alertFilter = ref('all')

// 详情对话框
const detailVisible = ref(false)
const currentAlert = ref({})

// 计算属性
const filteredAlerts = computed(() => {
  let filtered = alerts.value
  if (alertFilter.value !== 'all') {
    filtered = filtered.filter(item => item.level === alertFilter.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const getAlertTagType = (level) => {
  switch (level) {
    case '轻微': return 'info'
    case '一般': return 'warning'
    case '严重': return 'danger'
    case '紧急': return 'error'
    default: return ''
  }
}

const handleAlertDetail = (alert) => {
  currentAlert.value = alert
  detailVisible.value = true
}

const handleConfirm = () => {
  ElMessage.success('异常已确认处理')
  detailVisible.value = false
}

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

const initCharts = () => {
  // 折线图
  lineChartInstance = echarts.init(lineChart.value)
  lineChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a0}: {c0}<br/>{a1}: {c1}<br/>{a2}: {c2}<br/>{a3}: {c3}'
    },
    legend: {
      data: ['PM2.5', '温度', '湿度', 'CO2'],
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      backgroundColor: '#f9f9f9'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      }
    },
    series: [
      {
        name: 'PM2.5',
        type: 'line',
        data: [45, 52, 58, 65, 72, 68, 60],
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '温度',
        type: 'line',
        data: [22, 23, 25, 28, 30, 28, 25],
        smooth: true,
        lineStyle: {
          color: '#67C23A',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '湿度',
        type: 'line',
        data: [60, 62, 65, 68, 70, 72, 65],
        smooth: true,
        lineStyle: {
          color: '#E6A23C',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: 'CO2',
        type: 'line',
        data: [400, 450, 500, 600, 700, 650, 550],
        smooth: true,
        lineStyle: {
          color: '#F56C6C',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  })
  
  // 饼图
  pieChartInstance = echarts.init(pieChart.value)
  pieChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#333'
      }
    },
    series: [
      {
        name: '异常类型',
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: 'PM2.5超标' },
          { value: 25, name: '温度异常' },
          { value: 20, name: '湿度异常' },
          { value: 10, name: 'CO2超标' },
          { value: 10, name: '其他' }
        ],
        color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
      }
    ]
  })
}

const handleResize = () => {
  lineChartInstance?.resize()
  pieChartInstance?.resize()
}

// 生命周期
onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  
  initCharts()
  window.addEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>


@use './Settings.scss';


</style>