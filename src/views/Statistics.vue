<template>
  <div class="statistics-container">
    <el-card class="dashboard-card">
      <div class="header">
        <h2 class="system-title">航清智慧环保数据采集分析系统</h2>
        <div class="time-range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            class="date-picker"
          />
          <el-button type="primary" @click="refreshData" class="refresh-btn">
            <span class="btn-text">刷新数据</span>
          </el-button>
        </div>
      </div>

      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="metric-card total-alerts">
              <div class="metric-value">{{ overviewData.totalAlerts }}</div>
              <div class="metric-label">总异常数</div>
              <div class="metric-trend">
                <span class="trend-text">同比上周 ↑12%</span>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="metric-card high-risk">
              <div class="metric-value">{{ overviewData.highRisk }}</div>
              <div class="metric-label">高风险</div>
              <div class="metric-trend">
                <span class="trend-text">需立即处理</span>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="metric-card medium-risk">
              <div class="metric-value">{{ overviewData.mediumRisk }}</div>
              <div class="metric-label">中风险</div>
              <div class="metric-trend">
                <span class="trend-text">24小时内处理</span>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="metric-card low-risk">
              <div class="metric-value">{{ overviewData.lowRisk }}</div>
              <div class="metric-label">低风险</div>
              <div class="metric-trend">
                <span class="trend-text">持续观察</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <el-card class="chart-card">
              <div class="chart-title">异常类型分布</div>
              <div class="chart-container">
                <div ref="pieChart" style="width: 100%; height: 300px;"></div>
              </div>
              <div class="chart-footer">
                <span class="footer-text">PM2.5超标占比最高，需重点关注</span>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <el-card class="chart-card">
              <div class="chart-title">异常趋势分析</div>
              <div class="chart-container">
                <div ref="lineChart" style="width: 100%; height: 300px;"></div>
              </div>
              <div class="chart-footer">
                <span class="footer-text">周三、周日异常高发，建议加强巡检</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="alert-table">
        <el-card>
          <div class="table-header">
            <h3>异常数据列表</h3>
            <div class="table-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索异常数据"
                style="width: 200px"
                clearable
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
                class="search-input"
              />
              <el-select
                v-model="riskFilter"
                placeholder="风险等级"
                clearable
                @change="handleFilterChange"
                class="risk-select"
              >
                <el-option label="高风险" value="high" />
                <el-option label="中风险" value="medium" />
                <el-option label="低风险" value="low" />
              </el-select>
              <el-button type="primary" @click="exportData" class="export-btn">
                <span class="btn-text">导出数据</span>
              </el-button>
            </div>
          </div>
          <el-table
            :data="paginatedAlerts"
            style="width: 100%"
            v-loading="loading"
            border
            stripe
            class="alert-data-table"
          >
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="time" label="时间" width="180" align="center" />
            <el-table-column prop="location" label="监测点" width="150" align="center" />
            <el-table-column prop="type" label="异常类型" width="150" align="center" />
            <el-table-column prop="value" label="监测值" width="120" align="center">
              <template #default="{ row }">
                <span :class="getValueClass(row.value, row.threshold)">
                  {{ row.value }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="阈值" width="120" align="center" />
            <el-table-column label="风险等级" width="120" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="getRiskTagType(row.riskLevel)"
                  effect="light"
                  class="risk-tag"
                >
                  {{ getRiskLabel(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleDetail(row)"
                  class="detail-btn"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="pagination"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalAlerts"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="异常详情" width="50%" class="alert-detail-dialog">
      <div v-if="currentAlert" class="alert-detail">
        <el-descriptions border :column="2" class="detail-descriptions">
          <el-descriptions-item label="异常ID">{{ currentAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="监测点">{{ currentAlert.location }}</el-descriptions-item>
          <el-descriptions-item label="异常类型">{{ currentAlert.type }}</el-descriptions-item>
          <el-descriptions-item label="监测值">
            <span :class="getValueClass(currentAlert.value, currentAlert.threshold)">
              {{ currentAlert.value }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="阈值">{{ currentAlert.threshold }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskTagType(currentAlert.riskLevel)" effect="light" class="detail-risk-tag">
              {{ getRiskLabel(currentAlert.riskLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建议措施" :span="2">
            {{ getSuggestion(currentAlert.riskLevel, currentAlert.type) }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-chart">
          <div ref="detailChart" style="width: 100%; height: 250px;"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false" class="cancel-btn">关闭</el-button>
        <el-button type="primary" @click="handleConfirm" class="confirm-btn">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportVisible" title="导出数据" width="30%" class="export-dialog">
      <div class="export-options">
        <el-radio-group v-model="exportFormat">
          <el-radio label="csv">CSV格式</el-radio>
          <el-radio label="excel">Excel格式</el-radio>
        </el-radio-group>
        <div class="export-range">
          <el-checkbox v-model="exportAllData">导出全部数据</el-checkbox>
          <div v-if="!exportAllData" class="export-page-range">
            <span>当前页数据 ({{ paginatedAlerts.length }}条)</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportVisible = false" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="doExport" class="confirm-btn">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 假数据生成
const generateMockData = () => {
  const alertTypes = ['温度异常', '湿度异常', 'PM2.5超标', '噪音超标', 'VOC超标']
  const locations = ['A区监测点', 'B区监测点', 'C区监测点', 'D区监测点', 'E区监测点']
  const riskLevels = ['high', 'medium', 'low']
  
  const alerts = []
  for (let i = 1; i <= 50; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    const baseValue = type === '温度异常' ? 25 : 
                     type === '湿度异常' ? 60 : 
                     type === 'PM2.5超标' ? 50 : 
                     type === '噪音超标' ? 60 : 0.5
    const threshold = type === '温度异常' ? 30 : 
                     type === '湿度异常' ? 70 : 
                     type === 'PM2.5超标' ? 75 : 
                     type === '噪音超标' ? 65 : 1.0
    const value = baseValue + (Math.random() * (threshold * 0.5))
    
    alerts.push({
      id: i,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      location: locations[Math.floor(Math.random() * locations.length)],
      type,
      value: value.toFixed(2),
      threshold: threshold.toFixed(2),
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)]
    })
  }
  
  return alerts
}

// 图表实例
const pieChartInstance = ref(null)
const lineChartInstance = ref(null)
const detailChartInstance = ref(null)

// 图表引用
const pieChartRef = ref(null)
const lineChartRef = ref(null)
const detailChartRef = ref(null)

// 图表初始化
const initCharts = () => {
  // 确保DOM存在
  if (pieChartRef.value) {
    pieChartInstance.value = echarts.init(pieChartRef.value)
    pieChartInstance.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: ['温度异常', '湿度异常', 'PM2.5超标', '噪音超标', 'VOC超标']
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
            { value: 12, name: '温度异常', itemStyle: { color: '#FF9D4D' } },
            { value: 8, name: '湿度异常', itemStyle: { color: '#36A3F7' } },
            { value: 15, name: 'PM2.5超标', itemStyle: { color: '#F4516C' } },
            { value: 10, name: '噪音超标', itemStyle: { color: '#34BFA3' } },
            { value: 5, name: 'VOC超标', itemStyle: { color: '#716ACA' } }
          ]
        }
      ]
    })
  }
  
  if (lineChartRef.value) {
    lineChartInstance.value = echarts.init(lineChartRef.value)
    lineChartInstance.value.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '异常数量',
          type: 'line',
          smooth: true,
          data: [12, 8, 15, 10, 5, 7, 13],
          itemStyle: {
            color: '#36A3F7'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(54, 163, 247, 0.5)'
              },
              {
                offset: 1,
                color: 'rgba(54, 163, 247, 0.1)'
              }
            ])
          }
        }
      ]
    })
  }
}

// 响应式数据
const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])
const searchQuery = ref('')
const riskFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailVisible = ref(false)
const exportVisible = ref(false)
const exportFormat = ref('csv')
const exportAllData = ref(false)
const currentAlert = ref(null)

// 假数据
const allAlerts = ref(generateMockData())
const overviewData = ref({
  totalAlerts: 50,
  highRisk: 18,
  mediumRisk: 22,
  lowRisk: 10
})

// 计算属性
const filteredAlerts = computed(() => {
  let result = [...allAlerts.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      alert =>
        alert.location.toLowerCase().includes(query) ||
        alert.type.toLowerCase().includes(query) ||
        alert.id.toString().includes(query)
    )
  }
  
  if (riskFilter.value) {
    result = result.filter(alert => alert.riskLevel === riskFilter.value)
  }
  
  return result
})

const totalAlerts = computed(() => filteredAlerts.value.length)

const paginatedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlerts.value.slice(start, end)
})

// 方法
const handleDateChange = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`已更新 ${dateRange.value[0].toLocaleDateString()} 至 ${dateRange.value[1].toLocaleDateString()} 的数据`)
  }, 500)
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    allAlerts.value = generateMockData()
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleDetail = (alert) => {
  currentAlert.value = alert
  detailVisible.value = true
  
  // 确保DOM更新后初始化图表
  nextTick(() => {
    if (detailChartRef.value) {
      detailChartInstance.value = echarts.init(detailChartRef.value)
      detailChartInstance.value.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '监测值',
            type: 'line',
            data: [22, 24, 26, 28, 32, 30, 27],
            markLine: {
              data: [
                { type: 'average', name: '平均值' },
                { yAxis: 30, name: '阈值', lineStyle: { color: '#F4516C' } }
              ]
            }
          }
        ]
      })
    }
  })
}

const handleConfirm = () => {
  ElMessage.success('异常已确认处理')
  detailVisible.value = false
}

const exportData = () => {
  exportVisible.value = true
}

const doExport = () => {
  exportVisible.value = false
  const format = exportFormat.value === 'csv' ? 'CSV' : 'Excel'
  const range = exportAllData.value ? '全部数据' : '当前页数据'
  ElMessage.success(`已成功导出${range}为${format}格式`)
}

const getRiskTagType = (riskLevel) => {
  switch (riskLevel) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'info'
  }
}

const getRiskLabel = (riskLevel) => {
  switch (riskLevel) {
    case 'high':
      return '高风险'
    case 'medium':
      return '中风险'
    case 'low':
      return '低风险'
    default:
      return '未知'
  }
}

const getValueClass = (value, threshold) => {
  return parseFloat(value) > parseFloat(threshold) ? 'exceed-value' : ''
}

const getSuggestion = (riskLevel, type) => {
  if (riskLevel === 'high') {
    return `立即处理${type}问题，启动应急预案，通知相关人员`
  } else if (riskLevel === 'medium') {
    return `24小时内处理${type}问题，加强监测频率`
  } else {
    return `持续观察${type}情况，记录数据变化趋势`
  }
}

// 生命周期钩子
onMounted(() => {
  initCharts()
  
  // 窗口大小变化时重新调整图表大小
  window.addEventListener('resize', () => {
    pieChartInstance.value?.resize()
    lineChartInstance.value?.resize()
    if (detailVisible.value) {
      detailChartInstance.value?.resize()
    }
  })
})

onUnmounted(() => {
  // 组件卸载时销毁图表实例
  pieChartInstance.value?.dispose()
  lineChartInstance.value?.dispose()
  detailChartInstance.value?.dispose()
  
  // 移除事件监听
  window.removeEventListener('resize', () => {
    pieChartInstance.value?.resize()
    lineChartInstance.value?.resize()
    detailChartInstance.value?.resize()
  })
})
</script>

<style lang="scss" scoped>
@use './Statistics.scss';
</style>