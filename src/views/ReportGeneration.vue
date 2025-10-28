
<template>
  <div class="report-generation-container">
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <h1 class="platform-title">航清水资源保护与智能化系统</h1>
        <p class="subtitle">综合监测与分析系统</p>
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span>系统运行正常</span>
        </div>
      </div>
    </el-card>

    <div class="dashboard-grid">
      <el-card class="data-card" shadow="hover">
        <div class="card-header">
          <h3 class="card-title">水质监测数据概览</h3>
          <el-tag type="success" effect="light" class="update-tag">实时更新</el-tag>
        </div>
        <div class="data-overview">
          <div class="data-item" v-for="item in overviewData" :key="item.name">
            <div class="data-value">{{ item.value }}</div>
            <div class="data-label">{{ item.name }}</div>
          </div>
        </div>
        <div class="data-footer">
          <span>最后更新时间: {{ currentTime }}</span>
        </div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <div class="card-header">
          <h3 class="card-title">水质指标趋势分析</h3>
          <el-select 
            v-model="selectedIndicator" 
            placeholder="选择指标" 
            class="indicator-select"
            @change="updateChartData"
          >
            <el-option
              v-for="item in indicators"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </div>
        <div class="chart-container" ref="trendChart"></div>
        <div class="chart-legend">
          <div v-for="item in chartLegend" :key="item.name" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="map-card" shadow="hover">
        <div class="card-header">
          <h3 class="card-title">监测点分布</h3>
          <el-button type="primary" size="small" @click="refreshMap" plain>刷新数据</el-button>
        </div>
        <div class="map-container" ref="mapContainer">
          <div class="map-placeholder">
            <div class="map-grid">
              <div v-for="i in 9" :key="i" class="grid-cell"></div>
            </div>
            <div class="map-points">
              <div v-for="point in mapPoints" 
                   :key="point.id" 
                   class="map-point" 
                   :style="{ left: point.x + '%', top: point.y + '%' }"
                   :class="'level-' + point.level">
                <div class="point-tooltip">{{ point.name }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="map-legend">
          <div class="legend-item" v-for="item in mapLegend" :key="item.level">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="report-card" shadow="hover">
        <div class="card-header">
          <h3 class="card-title">最新分析报告</h3>
          <el-button type="primary" size="small" @click="showReportDialog" plain>生成报告</el-button>
        </div>
        <el-table :data="reports" style="width: 100%" height="300" stripe>
          <el-table-column prop="date" label="日期" width="120" sortable />
          <el-table-column prop="title" label="报告标题" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" effect="light">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" @click="viewReport(scope.row)" plain>查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            :page-size="5"
            :pager-count="5"
            layout="prev, pager, next"
            :total="20"
          />
        </div>
      </el-card>
    </div>

    <!-- 报告生成弹窗 -->
    <el-dialog v-model="reportDialogVisible" title="生成分析报告" width="50%">
      <el-form :model="reportForm" label-width="120px">
        <el-form-item label="报告类型">
          <el-select v-model="reportForm.type" placeholder="请选择报告类型">
            <el-option label="日常监测报告" value="daily"></el-option>
            <el-option label="专项分析报告" value="special"></el-option>
            <el-option label="年度综合报告" value="annual"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="reportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="包含指标">
          <el-checkbox-group v-model="reportForm.indicators">
            <el-checkbox v-for="item in indicators" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="报告名称">
          <el-input v-model="reportForm.name" placeholder="请输入报告名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateReport">确认生成</el-button>
      </template>
    </el-dialog>

    <!-- 报告查看弹窗 -->
    <el-dialog v-model="viewDialogVisible" :title="currentReport.title" width="70%">
      <div class="report-content">
        <h4>报告摘要</h4>
        <p>{{ reportContent.summary }}</p>
        <h4>主要指标</h4>
        <ul>
          <li v-for="(value, key) in reportContent.indicators" :key="key">
            {{ key }}: {{ value }}
          </li>
        </ul>
        <h4>分析结论</h4>
        <p>{{ reportContent.conclusion }}</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 假数据
const overviewData = ref([
  { name: '监测点数量', value: '128' },
  { name: '达标率', value: '92.5%' },
  { name: 'PH平均值', value: '7.2' },
  { name: '溶解氧(mg/L)', value: '6.8' },
  { name: '总磷(mg/L)', value: '0.12' },
  { name: '氨氮(mg/L)', value: '0.35' }
])

const indicators = ref([
  { value: 'ph', label: 'PH值' },
  { value: 'oxygen', label: '溶解氧' },
  { value: 'phosphorus', label: '总磷' },
  { value: 'nitrogen', label: '氨氮' }
])

const selectedIndicator = ref('ph')

const reports = ref([
  { date: '2023-05-15', title: '2023年第一季度水质分析报告', status: '已完成' },
  { date: '2023-04-28', title: '重点流域专项监测报告', status: '已完成' },
  { date: '2023-04-10', title: '饮用水源地安全评估', status: '已完成' },
  { date: '2023-03-22', title: '工业区周边水质变化分析', status: '已完成' },
  { date: '2023-03-15', title: '2022年度水质综合分析报告', status: '已完成' }
])

const currentTime = computed(() => {
  return new Date().toLocaleString()
})

const chartLegend = ref([
  { name: '监测点1', color: '#409EFF' },
  { name: '监测点2', color: '#67C23A' },
  { name: '监测点3', color: '#E6A23C' }
])

const mapPoints = ref([
  { id: 1, name: 'A1', x: 15, y: 30, level: 1 },
  { id: 2, name: 'B2', x: 45, y: 20, level: 2 },
  { id: 3, name: 'C3', x: 70, y: 40, level: 1 },
  { id: 4, name: 'D4', x: 30, y: 60, level: 3 },
  { id: 5, name: 'E5', x: 60, y: 70, level: 2 },
  { id: 6, name: 'F6', x: 80, y: 80, level: 1 }
])

const mapLegend = ref([
  { level: 1, label: '优良水质', color: '#67C23A' },
  { level: 2, label: '轻度污染', color: '#E6A23C' },
  { level: 3, label: '重度污染', color: '#F56C6C' }
])

const reportDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentReport = ref({})
const reportContent = ref({
  summary: '本报告基于2023年第一季度水质监测数据，对区域水质状况进行了全面分析。',
  indicators: {
    'PH平均值': '7.2',
    '溶解氧': '6.8 mg/L',
    '总磷': '0.12 mg/L',
    '氨氮': '0.35 mg/L'
  },
  conclusion: '总体水质状况良好，部分区域存在轻度污染，建议加强工业区周边水质监测。'
})

const reportForm = ref({
  type: '',
  dateRange: [],
  indicators: [],
  name: ''
})

const trendChart = ref(null)
let chartInstance = null

// 初始化图表
const initChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(trendChart.value)
  updateChartData()
}

// 更新图表数据
const updateChartData = () => {
  if (!chartInstance) return
  
  // 根据选择的指标生成不同的数据
  let seriesData = []
  if (selectedIndicator.value === 'ph') {
    seriesData = [
      { name: '监测点1', data: [7.1, 7.0, 7.2, 7.3, 7.1, 7.2, 7.0] },
      { name: '监测点2', data: [7.0, 7.1, 7.3, 7.2, 7.4, 7.3, 7.2] },
      { name: '监测点3', data: [7.2, 7.3, 7.1, 7.0, 7.2, 7.1, 7.3] }
    ]
  } else if (selectedIndicator.value === 'oxygen') {
    seriesData = [
      { name: '监测点1', data: [6.5, 6.7, 6.8, 6.9, 6.7, 6.8, 6.6] },
      { name: '监测点2', data: [6.6, 6.8, 6.9, 6.7, 7.0, 6.9, 6.8] },
      { name: '监测点3', data: [6.7, 6.9, 6.7, 6.6, 6.8, 6.7, 6.9] }
    ]
  } else if (selectedIndicator.value === 'phosphorus') {
    seriesData = [
      { name: '监测点1', data: [0.10, 0.11, 0.12, 0.13, 0.11, 0.12, 0.10] },
      { name: '监测点2', data: [0.11, 0.12, 0.13, 0.12, 0.14, 0.13, 0.12] },
      { name: '监测点3', data: [0.12, 0.13, 0.11, 0.10, 0.12, 0.11, 0.13] }
    ]
  } else if (selectedIndicator.value === 'nitrogen') {
    seriesData = [
      { name: '监测点1', data: [0.30, 0.32, 0.34, 0.35, 0.33, 0.34, 0.32] },
      { name: '监测点2', data: [0.32, 0.34, 0.35, 0.33, 0.36, 0.35, 0.34] },
      { name: '监测点3', data: [0.34, 0.35, 0.33, 0.32, 0.34, 0.33, 0.35] }
    ]
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}<br>`
        })
        return result
      }
    },
    legend: {
      data: seriesData.map(item => item.name)
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
    },
    yAxis: {
      type: 'value',
      name: indicators.value.find(item => item.value === selectedIndicator.value)?.label || '指标值'
    },
    series: seriesData.map(item => ({
      name: item.name,
      type: 'line',
      smooth: true,
      data: item.data,
      lineStyle: {
        width: 3
      },
      symbolSize: 8
    }))
  }
  
  chartInstance.setOption(option)
}

// 刷新地图数据
const refreshMap = () => {
  // 模拟地图数据刷新
  mapPoints.value.forEach(point => {
    point.x = Math.random() * 80 + 10
    point.y = Math.random() * 80 + 10
    point.level = Math.floor(Math.random() * 3) + 1
  })
  ElMessage.success('地图数据已刷新')
}

// 显示报告生成对话框
const showReportDialog = () => {
  reportDialogVisible.value = true
}

// 生成报告
const generateReport = () => {
  if (!reportForm.value.type) {
    ElMessage.warning('请选择报告类型')
    return
  }
  
  if (!reportForm.value.dateRange || reportForm.value.dateRange.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return
  }
  
  if (reportForm.value.indicators.length === 0) {
    ElMessage.warning('请至少选择一个指标')
    return
  }
  
  if (!reportForm.value.name) {
    ElMessage.warning('请输入报告名称')
    return
  }
  
  // 模拟报告生成
  const newReport = {
    date: new Date().toISOString().split('T')[0],
    title: reportForm.value.name,
    status: '已完成'
  }
  
  reports.value.unshift(newReport)
  reportDialogVisible.value = false
  reportForm.value = {
    type: '',
    dateRange: [],
    indicators: [],
    name: ''
  }
  
  ElMessage.success('报告生成成功')
}

// 查看报告
const viewReport = (report) => {
  currentReport.value = report
  viewDialogVisible.value = true
}

// 响应式调整图表大小
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>

@use './ReportGeneration.scss';

</style>
    