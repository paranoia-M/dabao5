
<template>
  <div class="behavior-management-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2 class="system-title">网络通信网关调节配置管理系统</h2>
        <div class="time-range">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleTimeChange"
            class="time-picker"
          />
          <el-button type="primary" @click="refreshData" class="refresh-btn">刷新数据</el-button>
        </div>
      </div>

      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">今日访问量</div>
                <div class="stat-value">{{ statistics.todayVisits }}</div>
                <div class="stat-compare">
                  <span :class="getCompareClass(compareData.visitChange)">
                    {{ compareData.visitChange > 0 ? '↑' : '↓' }} {{ Math.abs(compareData.visitChange) }}%
                  </span>
                  较昨日
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">异常行为</div>
                <div class="stat-value">{{ statistics.abnormal }}</div>
                <div class="stat-compare">
                  <span :class="getCompareClass(compareData.abnormalChange)">
                    {{ compareData.abnormalChange > 0 ? '↑' : '↓' }} {{ Math.abs(compareData.abnormalChange) }}%
                  </span>
                  较昨日
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">安全事件</div>
                <div class="stat-value">{{ statistics.securityEvents }}</div>
                <div class="stat-compare">
                  <span :class="getCompareClass(compareData.securityChange)">
                    {{ compareData.securityChange > 0 ? '↑' : '↓' }} {{ Math.abs(compareData.securityChange) }}%
                  </span>
                  较昨日
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-title">审计日志</div>
                <div class="stat-value">{{ statistics.auditLogs }}</div>
                <div class="stat-compare">
                  <span :class="getCompareClass(compareData.auditChange)">
                    {{ compareData.auditChange > 0 ? '↑' : '↓' }} {{ Math.abs(compareData.auditChange) }}%
                  </span>
                  较昨日
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :span="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <div class="chart-header">
                <h3>上网行为趋势</h3>
                <el-select v-model="trendType" placeholder="选择类型" size="small" @change="updateTrendChart">
                  <el-option label="全部类型" value="all" />
                  <el-option label="HTTP访问" value="http" />
                  <el-option label="FTP传输" value="ftp" />
                  <el-option label="邮件收发" value="email" />
                  <el-option label="视频流量" value="video" />
                </el-select>
              </div>
              <div class="chart-container">
                <div ref="behaviorTrendChart" style="height: 300px"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <div class="chart-header">
                <h3>安全事件类型分布</h3>
                <el-select v-model="eventType" placeholder="选择时段" size="small" @change="updateEventChart">
                  <el-option label="最近24小时" value="24h" />
                  <el-option label="最近7天" value="7d" />
                  <el-option label="最近30天" value="30d" />
                </el-select>
              </div>
              <div class="chart-container">
                <div ref="securityEventChart" style="height: 300px"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="recent-events">
        <el-card shadow="hover">
          <div class="table-header">
            <h3>最近安全事件</h3>
            <el-button type="primary" @click="showEventAnalysis">事件分析</el-button>
          </div>
          <el-table :data="recentEvents" style="width: 100%" border>
            <el-table-column prop="time" label="时间" width="180" sortable />
            <el-table-column prop="type" label="事件类型" width="120" />
            <el-table-column prop="source" label="来源IP" width="150" />
            <el-table-column prop="target" label="目标" />
            <el-table-column prop="level" label="级别" width="100" sortable>
              <template #default="scope">
                <el-tag :type="getLevelTagType(scope.row.level)" effect="light">
                  {{ scope.row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="handleDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :total="totalEvents"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="事件详情" width="50%" class="event-detail-dialog">
      <div v-if="currentEvent" class="event-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件ID">
            <el-tag>{{ currentEvent.id }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <el-tag :type="getEventTypeTag(currentEvent.type)">{{ currentEvent.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重级别">
            <el-tag :type="getLevelTagType(currentEvent.level)" effect="dark">
              {{ currentEvent.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源IP">{{ currentEvent.source }}</el-descriptions-item>
          <el-descriptions-item label="目标">{{ currentEvent.target }}</el-descriptions-item>
          <el-descriptions-item label="详细描述">
            <div class="event-description">{{ currentEvent.description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="处理建议" v-if="currentEvent.suggestion">
            <div class="event-suggestion">{{ currentEvent.suggestion }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEventProcess" v-if="currentEvent && currentEvent.status === '未处理'">
          标记为已处理
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="analysisVisible" title="安全事件分析" width="60%" class="analysis-dialog">
      <div class="analysis-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="analysis-chart">
              <h4>事件级别分布</h4>
              <div ref="levelAnalysisChart" style="height: 250px"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="analysis-chart">
              <h4>事件来源TOP5</h4>
              <div ref="sourceAnalysisChart" style="height: 250px"></div>
            </div>
          </el-col>
        </el-row>
        <div class="analysis-summary">
          <h4>安全态势分析</h4>
          <el-alert :title="analysisSummary" type="info" :closable="false" />
        </div>
      </div>
      <template #footer>
        <el-button @click="analysisVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportAnalysisReport">导出报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 统计数据
const statistics = ref({
  todayVisits: 1245,
  abnormal: 23,
  securityEvents: 15,
  auditLogs: 3421
})

// 对比数据
const compareData = ref({
  visitChange: 12.5,
  abnormalChange: -8.3,
  securityChange: 5.6,
  auditChange: 18.2
})

// 时间范围
const timeRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])

// 图表类型选择
const trendType = ref('all')
const eventType = ref('24h')

// 最近事件表格数据
const recentEvents = ref([
  {
    id: 'EV20230001',
    time: '2023-05-15 09:23:45',
    type: '暴力破解',
    source: '192.168.1.105',
    target: 'Web服务器',
    level: '高危',
    description: '检测到多次尝试登录失败，疑似暴力破解攻击。建议立即封锁该IP并检查系统日志。',
    suggestion: '1. 立即封锁来源IP\n2. 检查系统登录日志\n3. 加强密码策略',
    status: '未处理'
  },
  {
    id: 'EV20230002',
    time: '2023-05-15 10:12:33',
    type: '异常访问',
    source: '192.168.1.203',
    target: '数据库服务器',
    level: '中危',
    description: '检测到非工作时间异常访问数据库行为。该IP通常在办公时间活动，此次访问行为异常。',
    suggestion: '1. 核实访问人员身份\n2. 检查数据库访问日志\n3. 加强数据库访问控制',
    status: '已处理'
  },
  {
    id: 'EV20230003',
    time: '2023-05-14 15:45:21',
    type: '恶意软件',
    source: '192.168.1.156',
    target: '文件服务器',
    level: '高危',
    description: '检测到恶意软件下载行为。用户从可疑网站下载了可执行文件，系统已拦截。',
    suggestion: '1. 扫描该终端\n2. 检查网络流量\n3. 加强终端防护',
    status: '处理中'
  },
  {
    id: 'EV20230004',
    time: '2023-05-14 11:32:10',
    type: '数据泄露',
    source: '192.168.1.189',
    target: '外部网络',
    level: '严重',
    description: '检测到敏感数据外传行为。员工试图通过邮件发送客户数据到外部邮箱。',
    suggestion: '1. 立即制止该行为\n2. 调查数据泄露范围\n3. 加强数据防泄漏策略',
    status: '未处理'
  },
  {
    id: 'EV20230005',
    time: '2023-05-13 16:23:54',
    type: '违规访问',
    source: '192.168.1.134',
    target: '财务系统',
    level: '中危',
    description: '检测到未授权访问财务系统行为。该员工无财务系统访问权限。',
    suggestion: '1. 核实访问意图\n2. 检查权限分配\n3. 加强权限管理',
    status: '已处理'
  }
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const totalEvents = ref(25)

// 弹窗相关
const detailVisible = ref(false)
const analysisVisible = ref(false)
const currentEvent = ref(null)

// 分析数据
const analysisSummary = ref('近期安全态势分析显示，暴力破解和异常访问事件占比最高，建议加强身份认证和访问控制策略。高危及以上级别事件占比30%，需重点关注。')

// 图表引用
const behaviorTrendChart = ref(null)
const securityEventChart = ref(null)
const levelAnalysisChart = ref(null)
const sourceAnalysisChart = ref(null)

// 方法定义
const handleTimeChange = () => {
  ElMessage.success(`时间范围已更新: ${formatDate(timeRange.value[0])} 至 ${formatDate(timeRange.value[1])}`)
  refreshData()
}

const formatDate = (date) => {
  return date.toLocaleDateString('zh-CN')
}

const refreshData = () => {
  ElMessage.info('正在刷新数据...')
  // 模拟数据刷新
  setTimeout(() => {
    statistics.value = {
      todayVisits: Math.floor(Math.random() * 2000) + 500,
      abnormal: Math.floor(Math.random() * 50) + 10,
      securityEvents: Math.floor(Math.random() * 30) + 5,
      auditLogs: Math.floor(Math.random() * 5000) + 2000
    }
    ElMessage.success('数据刷新成功')
  }, 1000)
}

const handlePageChange = (page) => {
  currentPage.value = page
  ElMessage.info(`切换到第 ${page} 页`)
}

const handleDetail = (event) => {
  currentEvent.value = event
  detailVisible.value = true
}

const handleEventProcess = () => {
  if (currentEvent.value) {
    currentEvent.value.status = '已处理'
    ElMessage.success(`事件 ${currentEvent.value.id} 已标记为已处理`)
    detailVisible.value = false
  }
}

const showEventAnalysis = () => {
  analysisVisible.value = true
  nextTick(() => {
    initAnalysisCharts()
  })
}

const exportAnalysisReport = () => {
  ElMessage.success('分析报告导出成功')
  analysisVisible.value = false
}

const getLevelTagType = (level) => {
  switch (level) {
    case '严重': return 'danger'
    case '高危': return 'danger'
    case '中危': return 'warning'
    case '低危': return 'success'
    default: return 'info'
  }
}

const getEventTypeTag = (type) => {
  switch (type) {
    case '暴力破解': return 'danger'
    case '异常访问': return 'warning'
    case '恶意软件': return 'danger'
    case '数据泄露': return 'danger'
    case '违规访问': return 'warning'
    default: return 'info'
  }
}

const getCompareClass = (value) => {
  return value > 0 ? 'positive' : 'negative'
}

// 初始化图表
const initCharts = () => {
  // 上网行为趋势图
  const trendChart = echarts.init(behaviorTrendChart.value)
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a0}: {c0}次<br/>{a1}: {c1}次<br/>{a2}: {c2}次<br/>{a3}: {c3}次'
    },
    legend: {
      data: ['HTTP访问', 'FTP传输', '邮件收发', '视频流量'],
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
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '访问量(次)'
    },
    series: [
      {
        name: 'HTTP访问',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: 'FTP传输',
        type: 'line',
        smooth: true,
        data: [220, 182, 191, 234, 290, 330, 310],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '邮件收发',
        type: 'line',
        smooth: true,
        data: [150, 232, 201, 154, 190, 330, 410],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '视频流量',
        type: 'line',
        smooth: true,
        data: [320, 332, 301, 334, 390, 330, 320],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  })

  // 安全事件分布图
  const eventChart = echarts.init(securityEventChart.value)
  eventChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '事件类型',
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
          { value: 35, name: '暴力破解' },
          { value: 25, name: '异常访问' },
          { value: 20, name: '恶意软件' },
          { value: 15, name: '数据泄露' },
          { value: 5, name: '其他' }
        ],
        color: ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#909399']
      }
    ]
  })

  // 响应式调整
  window.addEventListener('resize', () => {
    trendChart.resize()
    eventChart.resize()
  })
}

const initAnalysisCharts = () => {
  // 事件级别分析图
  const levelChart = echarts.init(levelAnalysisChart.value)
  levelChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '事件级别',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 10, name: '严重' },
          { value: 20, name: '高危' },
          { value: 30, name: '中危' },
          { value: 40, name: '低危' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        color: ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A']
      }
    ]
  })

  // 事件来源分析图
  const sourceChart = echarts.init(sourceAnalysisChart.value)
  sourceChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['192.168.1.105', '192.168.1.203', '192.168.1.156', '192.168.1.189', '192.168.1.134']
    },
    series: [
      {
        name: '事件数量',
        type: 'bar',
        data: [12, 8, 6, 5, 4],
        itemStyle: {
          color: function(params) {
            const colorList = ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A', '#909399']
            return colorList[params.dataIndex]
          }
        }
      }
    ]
  })

  window.addEventListener('resize', () => {
    levelChart.resize()
    sourceChart.resize()
  })
}

const updateTrendChart = () => {
  // 模拟根据类型筛选更新图表
  ElMessage.info(`已切换显示: ${trendType.value === 'all' ? '全部类型' : trendType.value}`)
}

const updateEventChart = () => {
  // 模拟根据时段筛选更新图表
  ElMessage.info(`已切换时段: ${eventType.value === '24h' ? '最近24小时' : eventType.value === '7d' ? '最近7天' : '最近30天'}`)
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>

@use './BehaviorManagement.scss';

</style>
    