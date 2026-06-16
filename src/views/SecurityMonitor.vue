<template>
  <div class="security-monitor-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2>网络安全态势总览</h2>
        <div class="time-range">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleTimeChange"
          />
        </div>
      </div>

      <div class="statistics-grid">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon danger">
                  <span class="icon-text">!</span>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.attackCount }}</div>
                  <div class="stat-label">攻击事件</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon warning">
                  <span class="icon-text">⚠</span>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.alertCount }}</div>
                  <div class="stat-label">安全告警</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon success">
                  <span class="icon-text">✓</span>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.protectedCount }}</div>
                  <div class="stat-label">防护设备</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon primary">
                  <span class="icon-text">⏲</span>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.onlineRate }}%</div>
                  <div class="stat-label">在线率</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <el-card class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>攻击类型分布</span>
                  <el-select v-model="attackTypeFilter" size="small" placeholder="筛选攻击类型" @change="updateAttackChart">
                    <el-option label="全部" value="all" />
                    <el-option label="DDoS" value="ddos" />
                    <el-option label="SQL注入" value="sql" />
                    <el-option label="XSS" value="xss" />
                    <el-option label="暴力破解" value="brute" />
                  </el-select>
                </div>
              </template>
              <div class="chart-container">
                <div ref="attackChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <el-card class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>威胁等级趋势</span>
                  <el-radio-group v-model="threatTrendType" size="small" @change="updateThreatChart">
                    <el-radio-button label="day">日</el-radio-button>
                    <el-radio-button label="week">周</el-radio-button>
                    <el-radio-button label="month">月</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              <div class="chart-container">
                <div ref="threatChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="event-table">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>最新安全事件</span>
              <div class="table-actions">
                <el-input
                  v-model="eventSearch"
                  placeholder="搜索事件"
                  clearable
                  size="small"
                  style="width: 200px; margin-right: 10px;"
                  @clear="handleSearchClear"
                  @keyup.enter="handleSearch"
                />
                <el-button type="primary" size="small" @click="handleSearch">
                  搜索
                </el-button>
                <el-button size="small" @click="handleRefresh">
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          
          <el-table
            :data="filteredEvents"
            style="width: 100%"
            v-loading="loading"
            @row-click="handleRowClick"
          >
            <el-table-column prop="time" label="时间" width="180" sortable />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getEventTagType(row.level)">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源IP" width="150" />
            <el-table-column prop="target" label="目标" width="150" />
            <el-table-column prop="level" label="威胁等级" width="120" sortable>
              <template #default="{ row }">
                <el-rate
                  v-model="row.level"
                  disabled
                  :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                  :max="3"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === '已处理' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click.stop="showEventDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalEvents"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 事件详情弹窗 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="`安全事件详情 - ${selectedEvent?.type || ''}`"
      width="50%"
    >
      <div class="event-detail-content" v-if="selectedEvent">
        <el-descriptions border column="2">
          <el-descriptions-item label="事件时间">{{ selectedEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <el-tag :type="getEventTagType(selectedEvent.level)">
              {{ selectedEvent.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源IP">{{ selectedEvent.source }}</el-descriptions-item>
          <el-descriptions-item label="目标地址">{{ selectedEvent.target }}</el-descriptions-item>
          <el-descriptions-item label="威胁等级">
            <el-rate v-model="selectedEvent.level" disabled :max="3" />
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="selectedEvent.status === '已处理' ? 'success' : 'danger'">
              {{ selectedEvent.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="事件描述" :span="2">
            {{ selectedEvent.description }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="event-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="handleEventAction('handle')" v-if="selectedEvent.status !== '已处理'">
            立即处理
          </el-button>
          <el-button @click="handleEventAction('ignore')" v-if="selectedEvent.status !== '已忽略'">
            忽略事件
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 统计数据
const stats = ref({
  attackCount: 128,
  alertCount: 56,
  protectedCount: 24,
  onlineRate: 98.5
})

// 时间范围选择
const timeRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])
const handleTimeChange = () => {
  // 模拟时间变化时重新加载数据
  loading.value = true
  setTimeout(() => {
    stats.value = {
      attackCount: Math.floor(Math.random() * 50) + 100,
      alertCount: Math.floor(Math.random() * 30) + 40,
      protectedCount: 24,
      onlineRate: (Math.random() * 2 + 97).toFixed(1)
    }
    updateAttackChart()
    updateThreatChart()
    events.value = generateMockEvents(100)
    loading.value = false
  }, 800)
}

// 图表相关
const attackChart = ref(null)
const threatChart = ref(null)
const attackTypeFilter = ref('all')
const threatTrendType = ref('day')
let attackChartInstance = null
let threatChartInstance = null

// 事件表格相关
const events = ref(generateMockEvents(100))
const eventSearch = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalEvents = computed(() => events.value.length)

// 事件详情相关
const detailDialogVisible = ref(false)
const selectedEvent = ref(null)

const filteredEvents = computed(() => {
  let result = [...events.value]
  
  // 搜索过滤
  if (eventSearch.value) {
    const search = eventSearch.value.toLowerCase()
    result = result.filter(event => 
      event.type.toLowerCase().includes(search) || 
      event.source.toLowerCase().includes(search) || 
      event.target.toLowerCase().includes(search)
    )
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 表格操作
const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  eventSearch.value = ''
  currentPage.value = 1
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    events.value = generateMockEvents(100)
    loading.value = false
  }, 800)
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handlePageChange = (val) => {
  currentPage.value = val
}

const handleRowClick = (row) => {
  showEventDetail(row)
}

const showEventDetail = (row) => {
  selectedEvent.value = row
  detailDialogVisible.value = true
}

const handleEventAction = (action) => {
  if (!selectedEvent.value) return
  
  const index = events.value.findIndex(e => e.id === selectedEvent.value.id)
  if (index !== -1) {
    if (action === 'handle') {
      events.value[index].status = '已处理'
      selectedEvent.value.status = '已处理'
      ElMessage.success('事件已标记为已处理')
    } else if (action === 'ignore') {
      events.value[index].status = '已忽略'
      selectedEvent.value.status = '已忽略'
      ElMessage.warning('事件已忽略')
    }
  }
}

const getEventTagType = (level) => {
  if (level === 1) return ''
  if (level === 2) return 'warning'
  if (level === 3) return 'danger'
  return 'info'
}

// 生成模拟事件数据
function generateMockEvents(count) {
  const types = ['DDoS攻击', 'SQL注入', 'XSS攻击', '暴力破解', '端口扫描', '恶意软件']
  const statuses = ['未处理', '已处理', '处理中', '已忽略']
  const mockEvents = []
  
  for (let i = 0; i < count; i++) {
    const typeIndex = Math.floor(Math.random() * types.length)
    const statusIndex = Math.floor(Math.random() * statuses.length)
    const level = Math.floor(Math.random() * 3) + 1
    
    mockEvents.push({
      id: `event-${i}`,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      type: types[typeIndex],
      source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      target: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      level,
      status: statuses[statusIndex],
      description: `这是关于${types[typeIndex]}的详细描述，发生在${new Date().toLocaleDateString()}。攻击源IP为192.168.x.x，目标系统为10.0.x.x。系统已自动拦截该攻击并记录日志。`
    })
  }
  
  return mockEvents
}

// 更新攻击类型图表
const updateAttackChart = () => {
  if (!attackChartInstance) return
  
  const filter = attackTypeFilter.value
  let data = [
    { value: 35, name: 'DDoS' },
    { value: 28, name: 'SQL注入' },
    { value: 22, name: 'XSS' },
    { value: 15, name: '暴力破解' },
    { value: 10, name: '其他' }
  ]
  
  if (filter !== 'all') {
    data = data.filter(item => {
      if (filter === 'ddos') return item.name === 'DDoS'
      if (filter === 'sql') return item.name === 'SQL注入'
      if (filter === 'xss') return item.name === 'XSS'
      if (filter === 'brute') return item.name === '暴力破解'
      return true
    })
  }
  
  attackChartInstance.setOption({
    series: [{
      data: data
    }]
  })
}

// 更新威胁趋势图表
const updateThreatChart = () => {
  if (!threatChartInstance) return
  
  const type = threatTrendType.value
  let xData = []
  let lowData = []
  let mediumData = []
  let highData = []
  
  if (type === 'day') {
    xData = ['1日', '2日', '3日', '4日', '5日', '6日', '7日']
    lowData = [12, 8, 15, 10, 7, 9, 11]
    mediumData = [5, 7, 3, 8, 6, 4, 7]
    highData = [2, 3, 1, 4, 2, 3, 1]
  } else if (type === 'week') {
    xData = ['第1周', '第2周', '第3周', '第4周']
    lowData = [45, 38, 52, 47]
    mediumData = [18, 22, 15, 20]
    highData = [7, 10, 5, 8]
  } else if (type === 'month') {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月']
    lowData = [120, 95, 110, 105, 115, 125]
    mediumData = [45, 50, 40, 55, 60, 50]
    highData = [15, 20, 12, 18, 22, 25]
  }
  
  threatChartInstance.setOption({
    xAxis: {
      data: xData
    },
    series: [
      { data: lowData },
      { data: mediumData },
      { data: highData }
    ]
  })
}

// 初始化图表
const initCharts = () => {
  // 攻击类型分布图
  attackChartInstance = echarts.init(attackChart.value)
  attackChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#666'
      }
    },
    series: [
      {
        name: '攻击类型',
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
          { value: 35, name: 'DDoS' },
          { value: 28, name: 'SQL注入' },
          { value: 22, name: 'XSS' },
          { value: 15, name: '暴力破解' },
          { value: 10, name: '其他' }
        ]
      }
    ]
  })
  
  // 威胁等级趋势图
  threatChartInstance = echarts.init(threatChart.value)
  threatChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['低危', '中危', '高危'],
      textStyle: {
        color: '#666'
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
      data: ['1日', '2日', '3日', '4日', '5日', '6日', '7日'],
      axisLine: {
        lineStyle: {
          color: '#DCDFE6'
        }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#DCDFE6'
        }
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#EBEEF5'
        }
      }
    },
    series: [
      {
        name: '低危',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'inside'
        },
        emphasis: {
          focus: 'series'
        },
        data: [12, 8, 15, 10, 7, 9, 11],
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '中危',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'inside'
        },
        emphasis: {
          focus: 'series'
        },
        data: [5, 7, 3, 8, 6, 4, 7],
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '高危',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'inside'
        },
        emphasis: {
          focus: 'series'
        },
        data: [2, 3, 1, 4, 2, 3, 1],
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  })
  
  // 响应式调整
  window.addEventListener('resize', () => {
    attackChartInstance.resize()
    threatChartInstance.resize()
  })
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>

@use './SecurityMonitor.scss';

</style>