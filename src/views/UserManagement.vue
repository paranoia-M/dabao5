<template>
  <div class="network-behavior-audit-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2 class="system-title">网络通信网关调节配置管理系统</h2>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            class="date-picker"
          />
          <el-button type="primary" @click="refreshData" class="refresh-btn">数据刷新</el-button>
        </div>
      </div>

      <div class="statistics-grid">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon bg-blue">
                  <span class="iconfont icon-user-group"></span>
                </div>
                <div class="stat-info">
                  <h3>活跃用户</h3>
                  <p class="stat-value">{{ statistics.activeUsers }}</p>
                  <p class="stat-desc">较上周 <span class="text-success">↑12%</span></p>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon bg-green">
                  <span class="iconfont icon-traffic"></span>
                </div>
                <div class="stat-info">
                  <h3>网络流量</h3>
                  <p class="stat-value">{{ statistics.traffic }} GB</p>
                  <p class="stat-desc">较上周 <span class="text-danger">↓5%</span></p>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon bg-orange">
                  <span class="iconfont icon-security"></span>
                </div>
                <div class="stat-info">
                  <h3>安全事件</h3>
                  <p class="stat-value">{{ statistics.securityEvents }}</p>
                  <p class="stat-desc">较上周 <span class="text-success">↓18%</span></p>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon bg-purple">
                  <span class="iconfont icon-audit"></span>
                </div>
                <div class="stat-info">
                  <h3>审计日志</h3>
                  <p class="stat-value">{{ statistics.auditLogs }}</p>
                  <p class="stat-desc">较上周 <span class="text-success">↑8%</span></p>
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
              <div class="chart-header">
                <h3>上网行为趋势分析</h3>
                <el-tooltip content="展示近7天网络使用情况" placement="top">
                  <span class="iconfont icon-help"></span>
                </el-tooltip>
              </div>
              <div class="chart-container">
                <div ref="behaviorChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <el-card class="chart-card">
              <div class="chart-header">
                <h3>安全事件分类统计</h3>
                <el-tooltip content="各类安全事件占比情况" placement="top">
                  <span class="iconfont icon-help"></span>
                </el-tooltip>
              </div>
              <div class="chart-container">
                <div ref="securityChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="recent-events">
        <el-card>
          <div class="table-header">
            <h3>实时安全事件监控</h3>
            <div class="search-box">
              <el-input
                v-model="searchQuery"
                placeholder="请输入事件类型/来源IP/描述关键词"
                class="search-input"
                clearable
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch">
                    <span class="iconfont icon-search"></span>
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
          
          <el-table
            :data="filteredEvents"
            style="width: 100%"
            border
            stripe
            v-loading="loading"
            class="event-table"
          >
            <el-table-column prop="time" label="发生时间" width="180" sortable />
            <el-table-column prop="type" label="事件类型" width="120" />
            <el-table-column prop="level" label="威胁等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" effect="light">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源IP" width="150" />
            <el-table-column prop="description" label="事件描述" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" plain @click="handleDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="totalEvents"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>
    
    <el-dialog v-model="detailVisible" title="安全事件详情" width="50%" class="event-detail-dialog">
      <div v-if="currentEvent" class="event-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件时间">
            <span class="detail-value">{{ currentEvent.time }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <span class="detail-value">{{ currentEvent.type }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="威胁等级">
            <el-tag :type="getLevelTagType(currentEvent.level)" effect="light">
              {{ currentEvent.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源IP">
            <span class="detail-value">{{ currentEvent.source }}</span>
            <el-button size="small" type="text" @click="handleIpAnalysis(currentEvent.source)">IP分析</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="目标IP" v-if="currentEvent.target">
            <span class="detail-value">{{ currentEvent.target }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">
            <div class="detail-text">{{ currentEvent.description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="处理建议">
            <div class="detail-text">{{ currentEvent.suggestion || '暂无建议' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleMarkAsRead">标记为已处理</el-button>
      </template>
    </el-dialog>

    <!-- IP分析弹窗 -->
    <el-dialog v-model="ipAnalysisVisible" title="IP地址分析" width="40%" class="ip-analysis-dialog">
      <div v-if="currentIp" class="ip-analysis-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="IP地址">
            <span class="detail-value">{{ currentIp }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="地理位置">
            <span class="detail-value">{{ ipInfo.location || '未知' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="归属组织">
            <span class="detail-value">{{ ipInfo.organization || '未知' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="威胁情报">
            <el-tag :type="ipInfo.threatLevel ? 'danger' : 'success'">
              {{ ipInfo.threatLevel ? '已知威胁' : '未发现威胁' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="历史事件">
            <div class="event-list">
              <div v-for="(event, index) in ipInfo.historyEvents" :key="index" class="event-item">
                {{ event.time }} - {{ event.type }} ({{ event.level }})
              </div>
              <div v-if="!ipInfo.historyEvents.length">无历史事件记录</div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="ipAnalysisVisible = false">关闭</el-button>
        <el-button type="danger" v-if="ipInfo.threatLevel" @click="handleBlockIp">加入黑名单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 假数据
const statistics = ref({
  activeUsers: 342,
  traffic: 1245.6,
  securityEvents: 28,
  auditLogs: 1563
})

const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])

const securityEvents = ref([
  { 
    id: 1, 
    time: '2023-05-15 08:23:45', 
    type: '暴力破解', 
    level: '高危', 
    source: '192.168.1.105', 
    target: '192.168.1.1', 
    description: '检测到多次SSH登录失败尝试，疑似暴力破解攻击', 
    suggestion: '1. 检查SSH配置\n2. 考虑启用双因素认证\n3. 临时封锁该IP' 
  },
  { 
    id: 2, 
    time: '2023-05-15 10:12:33', 
    type: '恶意软件', 
    level: '中危', 
    source: '192.168.1.78', 
    description: '检测到可疑文件下载行为，文件hash匹配已知恶意软件特征', 
    suggestion: '1. 扫描该终端设备\n2. 检查下载文件\n3. 更新防病毒特征库' 
  },
  { 
    id: 3, 
    time: '2023-05-14 15:45:21', 
    type: '数据泄露', 
    level: '高危', 
    source: '192.168.1.42', 
    description: '检测到大量数据外传行为，传输量异常(超过1GB)', 
    suggestion: '1. 立即阻断该连接\n2. 检查数据敏感性\n3. 审计用户权限' 
  },
  { 
    id: 4, 
    time: '2023-05-14 09:30:15', 
    type: '违规访问', 
    level: '低危', 
    source: '192.168.1.56', 
    description: '用户访问了受限网站(赌博类)', 
    suggestion: '1. 提醒用户注意上网行为规范\n2. 记录到用户行为档案' 
  },
  { 
    id: 5, 
    time: '2023-05-13 14:22:10', 
    type: '异常登录', 
    level: '中危', 
    source: '192.168.1.89', 
    description: '非工作时间登录系统(凌晨2点)', 
    suggestion: '1. 确认是否为正常业务需要\n2. 检查登录行为是否合规' 
  },
  { 
    id: 6, 
    time: '2023-05-13 11:05:37', 
    type: '端口扫描', 
    level: '中危', 
    source: '203.156.34.78', 
    description: '检测到外部IP对多个端口进行扫描(1小时内尝试连接50+端口)', 
    suggestion: '1. 考虑将该IP加入黑名单\n2. 检查防火墙规则\n3. 监控后续行为' 
  },
  { 
    id: 7, 
    time: '2023-05-12 16:33:48', 
    type: '权限提升', 
    level: '高危', 
    source: '192.168.1.23', 
    description: '检测到非常规权限变更操作(普通用户获取管理员权限)', 
    suggestion: '1. 立即核查权限变更日志\n2. 回滚异常权限\n3. 调查操作来源' 
  },
  { 
    id: 8, 
    time: '2023-05-12 08:55:12', 
    type: 'DDoS攻击', 
    level: '高危', 
    source: '多个IP', 
    description: '检测到针对Web服务的异常流量(峰值达到5Gbps)', 
    suggestion: '1. 启用DDoS防护措施\n2. 联系ISP进行流量清洗\n3. 准备应急响应预案' 
  },
  { 
    id: 9, 
    time: '2023-05-11 13:47:29', 
    type: 'SQL注入', 
    level: '高危', 
    source: '192.168.1.67', 
    description: '检测到SQL注入尝试(针对/user/login接口)', 
    suggestion: '1. 检查应用代码\n2. 修补漏洞\n3. 过滤输入参数' 
  },
  { 
    id: 10, 
    time: '2023-05-11 09:12:56', 
    type: '钓鱼邮件', 
    level: '中危', 
    source: '外部邮件', 
    description: '检测到可疑邮件发送给多名员工(伪装成IT部门)', 
    suggestion: '1. 提醒员工注意邮件安全\n2. 标记类似邮件为垃圾邮件\n3. 开展安全意识培训' 
  }
])

const behaviorChartData = {
  days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  traffic: [120, 200, 150, 80, 70, 110, 130],
  activeUsers: [80, 120, 100, 70, 60, 90, 110],
  securityEvents: [5, 3, 7, 2, 4, 1, 6]
}

const securityChartData = {
  types: ['暴力破解', '恶意软件', '数据泄露', '违规访问', '其他'],
  counts: [12, 8, 5, 10, 3]
}

// IP分析相关数据
const ipAnalysisVisible = ref(false)
const currentIp = ref('')
const ipInfo = ref({
  location: '',
  organization: '',
  threatLevel: false,
  historyEvents: []
})

// 表格相关
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailVisible = ref(false)
const currentEvent = ref(null)

const filteredEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  let result = securityEvents.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.type.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query)
    )
  }
  
  return result.slice(start, end)
})

const totalEvents = computed(() => {
  if (searchQuery.value) {
    return filteredEvents.value.length
  }
  return securityEvents.value.length
})

// 图表实例
const behaviorChart = ref(null)
const securityChart = ref(null)
let behaviorChartInstance = null
let securityChartInstance = null

// 方法
const handleDateChange = () => {
  loading.value = true
  setTimeout(() => {
    statistics.value = {
      activeUsers: Math.floor(Math.random() * 100) + 300,
      traffic: (Math.random() * 1000 + 500).toFixed(1),
      securityEvents: Math.floor(Math.random() * 20) + 10,
      auditLogs: Math.floor(Math.random() * 1000) + 1000
    }
    loading.value = false
    ElMessage.success('数据已更新')
  }, 800)
}

const refreshData = () => {
  handleDateChange()
  initCharts()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleDetail = (row) => {
  currentEvent.value = row
  detailVisible.value = true
}

const handleMarkAsRead = () => {
  const index = securityEvents.value.findIndex(item => item.id === currentEvent.value.id)
  if (index !== -1) {
    securityEvents.value.splice(index, 1)
  }
  detailVisible.value = false
  ElMessage.success('事件已标记为已处理')
}

const handleIpAnalysis = (ip) => {
  currentIp.value = ip
  // 模拟IP信息查询
  ipInfo.value = {
    location: ip.startsWith('192.168') ? '内网IP' : '中国 北京',
    organization: ip.startsWith('192.168') ? '内部网络' : '某云计算公司',
    threatLevel: Math.random() > 0.7,
    historyEvents: securityEvents.value
      .filter(e => e.source === ip)
      .map(e => ({ time: e.time, type: e.type, level: e.level }))
      .slice(0, 3)
  }
  ipAnalysisVisible.value = true
}

const handleBlockIp = () => {
  ElMessage.success(`IP ${currentIp.value} 已加入黑名单`)
  ipAnalysisVisible.value = false
}

const getLevelTagType = (level) => {
  switch (level) {
    case '高危': return 'danger'
    case '中危': return 'warning'
    case '低危': return 'info'
    default: return ''
  }
}

// 初始化图表
const initCharts = () => {
  if (behaviorChartInstance) {
    behaviorChartInstance.dispose()
  }
  if (securityChartInstance) {
    securityChartInstance.dispose()
  }
  
  behaviorChartInstance = echarts.init(behaviorChart.value)
  securityChartInstance = echarts.init(securityChart.value)
  
  // 上网行为趋势图
  behaviorChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['网络流量(GB)', '活跃用户', '安全事件'],
      textStyle: {
        color: '#606266'
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
      data: behaviorChartData.days,
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
        name: '网络流量(GB)',
        type: 'line',
        smooth: true,
        data: behaviorChartData.traffic,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8
      },
      {
        name: '活跃用户',
        type: 'line',
        smooth: true,
        data: behaviorChartData.activeUsers,
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8
      },
      {
        name: '安全事件',
        type: 'bar',
        data: behaviorChartData.securityEvents,
        itemStyle: {
          color: '#E6A23C'
        },
        barWidth: '40%'
      }
    ]
  })
  
  // 安全事件分类图
  securityChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: securityChartData.types,
      textStyle: {
        color: '#606266'
      }
    },
    series: [
      {
        name: '事件分类',
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
            fontWeight: 'bold',
            color: '#303133'
          }
        },
        labelLine: {
          show: false
        },
        data: securityChartData.types.map((type, index) => ({
          value: securityChartData.counts[index],
          name: type,
          itemStyle: {
            color: ['#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#909399'][index]
          }
        }))
      }
    ]
  })
}

// 响应式调整图表大小
const resizeCharts = () => {
  if (behaviorChartInstance) {
    behaviorChartInstance.resize()
  }
  if (securityChartInstance) {
    securityChartInstance.resize()
  }
}

// 生命周期
onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

watch(
  () => dateRange.value,
  () => {
    refreshData()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@use './UserManagement.scss';
</style>