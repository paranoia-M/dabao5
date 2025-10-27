
<template>
  <div class="monitor-container">
    <el-card class="dashboard-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">环境监测实时数据</span>
          <el-tag type="success" effect="light">实时更新</el-tag>
        </div>
      </template>
      
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in overviewData" :key="item.title">
            <div class="data-card" :class="item.status">
              <div class="data-value">{{ item.value }}</div>
              <div class="data-title">{{ item.title }}</div>
              <div class="data-trend">
                <span class="trend-icon" :class="item.trend">
                  {{ item.trend === 'up' ? '↑' : '↓' }}
                </span>
                <span class="trend-value">{{ item.change }}%</span>
              </div>
              <div class="data-status">{{ getStatusText(item.status) }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="dashboard-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">实时监测图表</span>
          <div class="chart-controls">
            <el-select v-model="chartType" size="small" style="width: 120px">
              <el-option label="折线图" value="line" />
              <el-option label="柱状图" value="bar" />
            </el-select>
            <el-button size="small" @click="refreshChart">刷新数据</el-button>
          </div>
        </div>
      </template>
      
      <div class="chart-container">
        <div ref="chartRef" style="height: 400px"></div>
      </div>
    </el-card>

    <el-card class="dashboard-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">异常数据告警</span>
          <el-badge :value="alarmData.length" class="badge" />
        </div>
      </template>
      
      <el-table :data="alarmData" style="width: 100%" height="300" v-loading="loading" stripe>
        <el-table-column prop="time" label="时间" width="180" sortable />
        <el-table-column prop="location" label="监测点" width="120" />
        <el-table-column prop="type" label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === '超标' ? 'danger' : 'warning'" effect="light">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="数值" />
        <el-table-column prop="standard" label="标准值" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="handleAlarm(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next"
          :total="alarmData.length"
        />
      </div>
    </el-card>

    <!-- 处理告警弹窗 -->
    <el-dialog v-model="dialogVisible" title="处理异常数据" width="500px">
      <el-form :model="currentAlarm" label-width="100px">
        <el-form-item label="监测点">
          <el-input v-model="currentAlarm.location" disabled />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-input v-model="currentAlarm.type" disabled />
        </el-form-item>
        <el-form-item label="当前数值">
          <el-input v-model="currentAlarm.value" disabled />
        </el-form-item>
        <el-form-item label="标准值">
          <el-input v-model="currentAlarm.standard" disabled />
        </el-form-item>
        <el-form-item label="处理措施" required>
          <el-select v-model="currentAlarm.action" placeholder="请选择处理措施" style="width: 100%">
            <el-option label="设备校准" value="calibration" />
            <el-option label="人工检查" value="manual" />
            <el-option label="系统误报" value="false" />
            <el-option label="其他措施" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" v-if="currentAlarm.action">
          <el-input v-model="currentAlarm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAlarm">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 数据概览
const overviewData = ref([
  { title: '温度(℃)', value: '26.5', change: 2.3, trend: 'up', status: 'normal' },
  { title: '湿度(%)', value: '45.2', change: 1.1, trend: 'up', status: 'normal' },
  { title: 'PM2.5(μg/m³)', value: '35', change: -5.2, trend: 'down', status: 'normal' },
  { title: '噪音(dB)', value: '52', change: 0.8, trend: 'up', status: 'warning' },
  { title: 'CO2(ppm)', value: '480', change: -3.5, trend: 'down', status: 'normal' },
  { title: 'TVOC(ppb)', value: '220', change: 12.3, trend: 'up', status: 'danger' }
])

// 告警数据
const alarmData = ref([
  { time: '2023-05-15 08:23:45', location: 'A区-1号', type: '超标', value: '78', standard: '≤50' },
  { time: '2023-05-15 09:12:33', location: 'B区-3号', type: '异常', value: '0', standard: '≥10' },
  { time: '2023-05-15 10:45:21', location: 'C区-2号', type: '超标', value: '65', standard: '≤50' },
  { time: '2023-05-15 11:30:15', location: 'A区-4号', type: '异常', value: '1200', standard: '≤1000' },
  { time: '2023-05-15 13:20:42', location: 'D区-1号', type: '超标', value: '58', standard: '≤50' }
])

const chartType = ref('line')
const chartRef = ref(null)
let chartInstance = null
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentAlarm = ref({
  time: '',
  location: '',
  type: '',
  value: '',
  standard: '',
  action: '',
  remark: ''
})

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    normal: '正常',
    warning: '警告',
    danger: '危险'
  }
  return statusMap[status] || ''
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const tempData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10) + 20)
  const humiData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 20) + 30)
  const pm25Data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 10)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        return `
          <div style="font-weight:bold;margin-bottom:5px">${params[0].axisValue}</div>
          ${params.map(item => `
            <div style="display:flex;align-items:center">
              <span style="display:inline-block;width:10px;height:10px;background:${item.color};margin-right:5px"></span>
              ${item.seriesName}: <strong>${item.value}</strong>
            </div>
          `).join('')}
        `
      }
    },
    legend: {
      data: ['温度', '湿度', 'PM2.5'],
      textStyle: {
        color: '#666'
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
      data: hours,
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '温度',
        type: chartType.value,
        data: tempData,
        smooth: true,
        itemStyle: {
          color: '#f56c6c'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 6
      },
      {
        name: '湿度',
        type: chartType.value,
        data: humiData,
        smooth: true,
        itemStyle: {
          color: '#409eff'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 6
      },
      {
        name: 'PM2.5',
        type: chartType.value,
        data: pm25Data,
        smooth: true,
        itemStyle: {
          color: '#e6a23c'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 6
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 刷新图表数据
const refreshChart = () => {
  loading.value = true
  setTimeout(() => {
    updateChart()
    loading.value = false
    ElMessage.success('图表数据已刷新')
  }, 800)
}

// 处理告警
const handleAlarm = (row) => {
  currentAlarm.value = { ...row, action: '', remark: '' }
  dialogVisible.value = true
}

// 提交告警处理
const submitAlarm = () => {
  if (!currentAlarm.value.action) {
    ElMessage.warning('请选择处理措施')
    return
  }
  
  // 模拟处理告警
  setTimeout(() => {
    dialogVisible.value = false
    ElMessage.success('告警处理成功')
    // 在实际应用中，这里应该更新告警状态
  }, 500)
}

// 监听图表类型变化
watch(chartType, () => {
  updateChart()
})

onMounted(() => {
  initChart()
  
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
})
</script>

<style lang="scss" scoped>

@use './Alarm.scss';

</style>
