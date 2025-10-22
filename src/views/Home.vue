
<template>
  <div class="home-container">
    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(card, index) in summaryCards" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="card-content">
            <div class="icon-wrapper" :style="{ backgroundColor: card.color }">
              <component :is="card.icon" class="icon" />
            </div>
            <div class="text-wrapper">
              <h3>{{ card.title }}</h3>
              <p class="value">{{ card.value }}</p>
              <p class="trend" :class="card.trend > 0 ? 'up' : 'down'">
                <span>{{ card.trend > 0 ? '↑' : '↓' }}</span>
                {{ Math.abs(card.trend) }}%
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">上网行为统计</span>
              <el-select v-model="timeRange" size="small" style="width: 120px" @change="updateBehaviorChart">
                <el-option label="最近7天" value="7" />
                <el-option label="最近30天" value="30" />
                <el-option label="最近90天" value="90" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="behaviorChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">安全威胁分布</span>
              <el-select v-model="threatType" size="small" style="width: 120px" @change="updateThreatChart">
                <el-option label="全部类型" value="all" />
                <el-option label="恶意软件" value="malware" />
                <el-option label="网络攻击" value="attack" />
                <el-option label="数据泄露" value="leak" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="threatChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="table-row">
      <el-col :span="24">
        <el-card shadow="hover" class="table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近安全事件</span>
              <el-button type="primary" size="small" @click="showExportDialog">导出报表</el-button>
            </div>
          </template>
          <el-table :data="securityEvents" style="width: 100%" v-loading="loading" border>
            <el-table-column prop="time" label="时间" width="180" sortable />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getEventTagType(row.type)" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源IP" width="150" />
            <el-table-column prop="target" label="目标设备" width="150" />
            <el-table-column prop="level" label="威胁等级" width="150">
              <template #default="{ row }">
                <div class="level-container">
                  <el-progress :percentage="row.level * 20" :color="getLevelColor(row.level)" :show-text="false" />
                  <span class="level-text">{{ ['低', '中', '高', '严重', '紧急'][row.level - 1] }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="showEventDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next, jumper"
              :total="total"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 导出报表弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出报表" width="30%">
      <el-form label-width="100px">
        <el-form-item label="报表格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="excel">Excel</el-radio>
            <el-radio label="pdf">PDF</el-radio>
            <el-radio label="csv">CSV</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleExport">确认导出</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 事件详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="currentEvent ? '安全事件详情 - ' + currentEvent.type : '安全事件详情'" width="50%">
      <div v-if="currentEvent" class="event-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件时间">{{ currentEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <el-tag :type="getEventTagType(currentEvent.type)">{{ currentEvent.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="威胁等级">
            <div class="level-container">
              <el-progress :percentage="currentEvent.level * 20" :color="getLevelColor(currentEvent.level)" :show-text="false" />
              <span class="level-text">{{ ['低', '中', '高', '严重', '紧急'][currentEvent.level - 1] }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="来源IP">{{ currentEvent.source }}</el-descriptions-item>
          <el-descriptions-item label="目标设备">{{ currentEvent.target }}</el-descriptions-item>
          <el-descriptions-item label="事件描述">
            <p>检测到{{ currentEvent.type }}行为，系统已自动拦截并记录该事件。</p>
            <p v-if="currentEvent.level >= 4" class="warning-text">该事件威胁等级较高，建议立即处理！</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import {
  User,
  Monitor,
  Warning,
  Connection
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 统计数据卡片
const summaryCards = ref([
  {
    title: '在线用户',
    value: '1,245',
    trend: 5.2,
    icon: User,
    color: '#409EFF'
  },
  {
    title: '监控设备',
    value: '86',
    trend: 1.8,
    icon: Monitor,
    color: '#67C23A'
  },
  {
    title: '今日告警',
    value: '32',
    trend: -12.5,
    icon: Warning,
    color: '#E6A23C'
  },
  {
    title: '网络流量',
    value: '1.2TB',
    trend: 8.3,
    icon: Connection,
    color: '#F56C6C'
  }
])

// 图表相关
const timeRange = ref('7')
const threatType = ref('all')
const behaviorChart = ref(null)
const threatChart = ref(null)
let behaviorChartInstance = null
let threatChartInstance = null

// 表格相关
const securityEvents = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(50)

// 弹窗相关
const exportDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const exportFormat = ref('excel')
const exportDateRange = ref([])
const currentEvent = ref(null)

// 初始化图表
const initCharts = () => {
  behaviorChartInstance = echarts.init(behaviorChart.value)
  threatChartInstance = echarts.init(threatChart.value)
  updateBehaviorChart()
  updateThreatChart()

  // 窗口大小变化时重新调整图表大小
  window.addEventListener('resize', () => {
    behaviorChartInstance.resize()
    threatChartInstance.resize()
  })
}

// 更新上网行为统计图表
const updateBehaviorChart = () => {
  const days = parseInt(timeRange.value)
  const xAxisData = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    xAxisData.push(`${date.getMonth() + 1}月${date.getDate()}日`)
  }

  const getRandomData = (base, variation) => {
    return xAxisData.map(() => Math.floor(base + Math.random() * variation))
  }

  behaviorChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: params => {
        let result = `${params[0].axisValue}<br>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}次<br>`
        })
        return result
      }
    },
    legend: {
      data: ['网页浏览', '视频流量', '文件下载', '即时通讯'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        interval: Math.ceil(days / 7) - 1
      }
    },
    yAxis: {
      type: 'value',
      name: '访问次数'
    },
    series: [
      {
        name: '网页浏览',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: getRandomData(300, 200),
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '视频流量',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: getRandomData(100, 150),
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '文件下载',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: getRandomData(200, 180),
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '即时通讯',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: getRandomData(150, 220),
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  })
}

// 更新安全威胁分布图表
const updateThreatChart = () => {
  const type = threatType.value
  let data = [
    { value: 1048, name: '恶意软件' },
    { value: 735, name: '网络攻击' },
    { value: 580, name: '数据泄露' },
    { value: 484, name: '违规操作' },
    { value: 300, name: '其他威胁' }
  ]

  if (type !== 'all') {
    data = data.filter(item => {
      if (type === 'malware') return item.name === '恶意软件'
      if (type === 'attack') return item.name === '网络攻击'
      if (type === 'leak') return item.name === '数据泄露'
      return true
    })
  }

  threatChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: params => {
        return `${params.name}<br>数量: ${params.value}<br>占比: ${params.percent}%`
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '威胁类型',
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
        data: data,
        color: ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#909399']
      }
    ]
  })
}

// 获取安全事件数据
const getSecurityEvents = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    const mockData = []
    const types = ['恶意软件', '网络攻击', '数据泄露', '违规操作', '其他威胁']
    const sources = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.5']
    const targets = ['服务器A', '服务器B', '数据库C', '应用D', '文件服务器E']

    for (let i = 0; i < 10; i++) {
      const typeIndex = Math.floor(Math.random() * types.length)
      const sourceIndex = Math.floor(Math.random() * sources.length)
      const targetIndex = Math.floor(Math.random() * targets.length)
      const level = Math.floor(Math.random() * 5) + 1

      mockData.push({
        time: `2023-06-${Math.floor(Math.random() * 30) + 1} ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        type: types[typeIndex],
        source: sources[sourceIndex],
        target: targets[targetIndex],
        level: level
      })
    }

    securityEvents.value = mockData
    loading.value = false
  }, 800)
}

// 事件标签类型
const getEventTagType = (type) => {
  switch (type) {
    case '恶意软件':
      return 'danger'
    case '网络攻击':
      return 'warning'
    case '数据泄露':
      return 'success'
    case '违规操作':
      return 'info'
    default:
      return ''
  }
}

// 威胁等级颜色
const getLevelColor = (level) => {
  const colors = ['#67C23A', '#67C23A', '#E6A23C', '#F56C6C', '#F56C6C']
  return colors[level - 1]
}

// 分页变化
const handlePageChange = (val) => {
  currentPage.value = val
  getSecurityEvents()
}

// 显示导出弹窗
const showExportDialog = () => {
  exportDialogVisible.value = true
}

// 显示事件详情
const showEventDetail = (event) => {
  currentEvent.value = event
  detailDialogVisible.value = true
}

// 导出报表
const handleExport = () => {
  exportDialogVisible.value = false
  ElMessage.success(`报表导出成功，格式: ${exportFormat.value}`)
}

// 监听时间范围变化
watch(timeRange, () => {
  updateBehaviorChart()
})

// 监听威胁类型变化
watch(threatType, () => {
  updateThreatChart()
})

// 初始化
onMounted(() => {
  initCharts()
  getSecurityEvents()
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>
    