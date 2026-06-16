
<template>
  <div class="statistics-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="data-card traffic-publish-card">
          <div class="card-content">
            <div class="card-icon bg-blue">
              <span class="iconfont icon-traffic-publish"></span>
            </div>
            <div class="card-info">
              <div class="card-title">今日发布</div>
              <div class="card-value">1,245</div>
              <div class="card-desc">交通信息发布量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="data-card traffic-status-card">
          <div class="card-content">
            <div class="card-icon bg-green">
              <span class="iconfont icon-traffic-status"></span>
            </div>
            <div class="card-info">
              <div class="card-title">实时路况</div>
              <div class="card-value">86%</div>
              <div class="card-desc">道路通畅率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="data-card traffic-event-card">
          <div class="card-content">
            <div class="card-icon bg-orange">
              <span class="iconfont icon-traffic-event"></span>
            </div>
            <div class="card-info">
              <div class="card-title">交通事件</div>
              <div class="card-value">32</div>
              <div class="card-desc">今日上报事件</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="data-card feedback-card">
          <div class="card-content">
            <div class="card-icon bg-purple">
              <span class="iconfont icon-feedback"></span>
            </div>
            <div class="card-info">
              <div class="card-title">用户反馈</div>
              <div class="card-value">56</div>
              <div class="card-desc">待处理反馈</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3 class="chart-title">交通流量趋势</h3>
            <div class="time-range">
              <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-container">
            <div ref="trafficChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card shadow="hover" class="table-card">
          <div class="card-header">
            <h3 class="table-title">最新交通事件</h3>
            <el-button type="primary" size="small" @click="showEventDetailDialog">
              <span class="iconfont icon-refresh"></span>
              刷新
            </el-button>
          </div>
          <el-table :data="eventList" style="width: 100%" height="300" v-loading="loading">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getEventTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === '已处理' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" @click="showEventDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next"
              :total="total"
              small
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card shadow="hover" class="notice-card">
          <div class="card-header">
            <h3 class="notice-title">重要通知</h3>
            <el-button type="primary" size="small" @click="showNoticeDialog">发布通知</el-button>
          </div>
          <el-scrollbar height="350px">
            <ul class="notice-list">
              <li v-for="(notice, index) in notices" :key="index" class="notice-item" @click="showNoticeDetail(notice)">
                <div class="notice-time">{{ notice.time }}</div>
                <div class="notice-content">{{ notice.content }}</div>
                <div class="notice-arrow">
                  <span class="iconfont icon-arrow-right"></span>
                </div>
              </li>
            </ul>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>

    <!-- 事件详情弹窗 -->
    <el-dialog v-model="eventDialogVisible" title="交通事件详情" width="50%">
      <div v-if="currentEvent" class="event-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件时间">{{ currentEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="事件位置">{{ currentEvent.location }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <el-tag :type="getEventTagType(currentEvent.type)">{{ currentEvent.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="事件状态">
            <el-tag :type="currentEvent.status === '已处理' ? 'success' : 'danger'">{{ currentEvent.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="事件描述">
            <p>该路段因{{ currentEvent.type }}导致交通受阻，请过往车辆注意绕行。</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="eventDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEventAction">
          {{ currentEvent && currentEvent.status === '已处理' ? '重新处理' : '标记处理' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 通知详情弹窗 -->
    <el-dialog v-model="noticeDialogVisible" title="通知详情" width="50%">
      <div v-if="currentNotice" class="notice-detail">
        <h4>{{ currentNotice.content }}</h4>
        <div class="notice-time">发布时间：{{ currentNotice.time }}</div>
        <div class="notice-content">
          <p>根据智慧交通管理系统监测，{{ currentNotice.content }}请相关部门做好应对准备。</p>
          <p>如有疑问，请联系交通信息中心。</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="noticeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 发布通知弹窗 -->
    <el-dialog v-model="publishDialogVisible" title="发布新通知" width="50%">
      <el-form :model="newNoticeForm" label-width="80px">
        <el-form-item label="通知内容" required>
          <el-input v-model="newNoticeForm.content" type="textarea" :rows="4" placeholder="请输入通知内容"></el-input>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker v-model="newNoticeForm.time" type="date" placeholder="选择日期"></el-date-picker>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="publishNotice">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch,onBeforeUnmount  } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 数据卡片
const timeRange = ref('week')

// 事件列表
const eventList = ref([
  { time: '2023-05-01 08:30', location: '中山路与解放路交叉口', type: '拥堵', status: '已处理' },
  { time: '2023-05-01 09:15', location: '长江东路高架桥', type: '事故', status: '处理中' },
  { time: '2023-05-01 10:20', location: '人民广场地铁站', type: '施工', status: '已处理' },
  { time: '2023-05-01 11:05', location: '环城西路', type: '积水', status: '未处理' },
  { time: '2023-05-01 12:30', location: '东风南路', type: '拥堵', status: '已处理' },
  { time: '2023-05-01 14:15', location: '建设大道', type: '事故', status: '处理中' },
  { time: '2023-05-01 15:40', location: '文化路', type: '施工', status: '未处理' },
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(20)

// 通知列表
const notices = ref([
  { time: '2023-05-01', content: '关于五一假期期间交通管制的通知' },
  { time: '2023-04-28', content: '中山路部分路段施工，请绕行' },
  { time: '2023-04-25', content: '新增10个交通违法抓拍点' },
  { time: '2023-04-20', content: '关于调整部分公交线路的通知' },
  { time: '2023-04-15', content: '智慧交通系统升级维护公告' },
  { time: '2023-04-10', content: '关于开展交通违法专项整治行动的通知' },
])

// 弹窗相关
const eventDialogVisible = ref(false)
const noticeDialogVisible = ref(false)
const publishDialogVisible = ref(false)
const currentEvent = ref(null)
const currentNotice = ref(null)
const newNoticeForm = ref({
  content: '',
  time: new Date()
})

// 图表相关
const trafficChart = ref(null)
let chartInstance = null

const getEventTagType = (type) => {
  const typeMap = {
    '拥堵': 'warning',
    '事故': 'danger',
    '施工': 'info',
    '积水': ''
  }
  return typeMap[type] || ''
}

const refreshEvents = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    eventList.value = [
      { time: '2023-05-02 08:30', location: '中山路与解放路交叉口', type: '拥堵', status: '已处理' },
      { time: '2023-05-02 09:15', location: '长江东路高架桥', type: '事故', status: '处理中' },
      { time: '2023-05-02 10:20', location: '人民广场地铁站', type: '施工', status: '已处理' },
      { time: '2023-05-02 11:05', location: '环城西路', type: '积水', status: '未处理' },
      { time: '2023-05-02 12:30', location: '东风南路', type: '拥堵', status: '已处理' },
    ]
    loading.value = false
    ElMessage.success('交通事件数据已刷新')
  }, 800)
}

const showEventDetail = (event) => {
  currentEvent.value = event
  eventDialogVisible.value = true
}

const handleEventAction = () => {
  if (currentEvent.value) {
    currentEvent.value.status = currentEvent.value.status === '已处理' ? '处理中' : '已处理'
    ElMessage.success(`事件状态已更新为${currentEvent.value.status}`)
    eventDialogVisible.value = false
  }
}

const showNoticeDetail = (notice) => {
  currentNotice.value = notice
  noticeDialogVisible.value = true
}

const showNoticeDialog = () => {
  newNoticeForm.value = {
    content: '',
    time: new Date()
  }
  publishDialogVisible.value = true
}

const publishNotice = () => {
  if (!newNoticeForm.value.content) {
    ElMessage.warning('请输入通知内容')
    return
  }
  
  const formattedDate = newNoticeForm.value.time.toISOString().split('T')[0]
  notices.value.unshift({
    time: formattedDate,
    content: newNoticeForm.value.content
  })
  
  ElMessage.success('通知发布成功')
  publishDialogVisible.value = false
}

const handlePageChange = (page) => {
  currentPage.value = page
  // 模拟分页请求
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const handleTimeRangeChange = () => {
  updateChart()
}

const initChart = () => {
  if (!trafficChart.value) return
  
  chartInstance = echarts.init(trafficChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}辆/小时<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['主干道', '次干道', '支路'],
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
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
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
      name: '流量(辆/小时)',
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
          color: '#f5f5f5'
        }
      }
    },
    series: [
      {
        name: '主干道',
        type: 'line',
        smooth: true,
        data: [1200, 800, 2500, 1800, 2100, 1600],
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: '次干道',
        type: 'line',
        smooth: true,
        data: [800, 600, 1800, 1200, 1500, 1100],
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      },
      {
        name: '支路',
        type: 'line',
        smooth: true,
        data: [400, 300, 900, 600, 800, 500],
        itemStyle: {
          color: '#E6A23C'
        },
        lineStyle: {
          width: 3
        },
        symbolSize: 8,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
          ])
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const updateChart = () => {
  if (!chartInstance) return
  
  // 根据时间范围更新数据
  let xData, mainData, secondaryData, branchData
  
  if (timeRange.value === 'day') {
    xData = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
    mainData = [1200, 800, 2500, 1800, 2100, 1600]
    secondaryData = [800, 600, 1800, 1200, 1500, 1100]
    branchData = [400, 300, 900, 600, 800, 500]
  } else if (timeRange.value === 'week') {
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    mainData = [2200, 2400, 2600, 2500, 2800, 2000, 1800]
    secondaryData = [1500, 1600, 1800, 1700, 1900, 1400, 1200]
    branchData = [800, 900, 1000, 950, 1100, 700, 600]
  } else {
    xData = ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
    mainData = [2500, 2600, 2700, 2800, 2900, 3000, 3100]
    secondaryData = [1700, 1800, 1900, 2000, 2100, 2200, 2300]
    branchData = [900, 950, 1000, 1050, 1100, 1150, 1200]
  }
  
  const option = {
    xAxis: {
      data: xData
    },
    series: [
      { data: mainData },
      { data: secondaryData },
      { data: branchData }
    ]
  }
  
  chartInstance.setOption(option)
}

watch(timeRange, () => {
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

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', () => {})
})
</script>

<style lang="scss" scoped>

@use './Statistics.scss';

</style>
    