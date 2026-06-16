<template>
  <div class="traffic-info-container">
    <el-card class="dashboard-card">
      <div class="header">
        <h2 class="system-title">智慧交通信息发布管理系统</h2>
        <el-divider class="title-divider" />
      </div>
      
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(stat, index) in statsData" :key="index">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                  <span class="icon-text">{{ stat.iconText }}</span>
                </div>
                <div class="stat-info">
                  <h3 class="stat-title">{{ stat.title }}</h3>
                  <p class="value">{{ stat.value }}</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="chart-container">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <h3 class="chart-title">交通流量统计</h3>
              <div class="chart-wrapper">
                <div class="fake-chart traffic-flow" ref="trafficChart">
                  <div class="chart-bar" v-for="(item, index) in trafficFlowData" :key="index" 
                       :style="{ height: item.value + '%' }">
                    <span class="bar-label">{{ item.time }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <h3 class="chart-title">事件类型分布</h3>
              <div class="chart-wrapper">
                <div class="fake-chart event-distribution" ref="eventChart">
                  <div class="pie-slice" v-for="(item, index) in eventDistribution" :key="index"
                       :style="{ '--percentage': item.percentage, '--color': item.color }">
                    <span class="slice-label">{{ item.type }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="recent-events">
        <el-card shadow="hover" class="events-card">
          <div class="table-header">
            <h3 class="events-title">最新交通事件</h3>
            <el-button type="primary" size="small" @click="handleRefresh" class="refresh-btn">
              刷新数据
            </el-button>
          </div>
          
          <el-table :data="paginatedEvents" style="width: 100%" border class="events-table">
            <el-table-column prop="id" label="事件ID" width="100" />
            <el-table-column prop="type" label="事件类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getEventTagType(row.type)" class="event-tag">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="发生位置" />
            <el-table-column prop="time" label="发生时间" width="180" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === '已处理' ? 'success' : 'warning'" class="status-tag">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="showEventDetail(row)" class="detail-btn">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20]"
              :small="true"
              layout="total, sizes, prev, pager, next"
              :total="totalEvents"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              class="custom-pagination"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 事件详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="currentEvent.id + ' - 事件详情'" width="50%" class="event-detail-dialog">
      <div class="event-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件类型">{{ currentEvent.type }}</el-descriptions-item>
          <el-descriptions-item label="发生位置">{{ currentEvent.location }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="currentEvent.status === '已处理' ? 'success' : 'warning'">{{ currentEvent.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="事件描述">
            <div class="event-description">
              {{ getEventDescription(currentEvent) }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEventAction" v-if="currentEvent.status !== '已处理'">
          {{ currentEvent.status === '未处理' ? '开始处理' : '标记为已处理' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 统计数据
const statsData = ref([
  { title: '今日事件总数', value: '128', iconText: '∑', color: '#f56c6c' },
  { title: '处理中事件', value: '24', iconText: '⏳', color: '#e6a23c' },
  { title: '监控点位', value: '56', iconText: '📍', color: '#409eff' },
  { title: '交通指数', value: '6.8', iconText: '📊', color: '#67c23a' }
])

// 交通流量数据
const trafficFlowData = ref([
  { time: '00:00', value: 30 },
  { time: '04:00', value: 15 },
  { time: '08:00', value: 85 },
  { time: '12:00', value: 70 },
  { time: '16:00', value: 90 },
  { time: '20:00', value: 60 }
])

// 事件分布数据
const eventDistribution = ref([
  { type: '交通事故', percentage: '35%', color: '#f56c6c' },
  { type: '道路施工', percentage: '20%', color: '#e6a23c' },
  { type: '信号灯故障', percentage: '15%', color: '#409eff' },
  { type: '车辆违停', percentage: '10%', color: '#909399' },
  { type: '其他', percentage: '20%', color: '#67c23a' }
])

// 事件列表
const eventList = ref([
  { id: 'EV20230001', type: '交通事故', location: '中山路与解放路交叉口', time: '2023-05-15 08:23:45', status: '已处理' },
  { id: 'EV20230002', type: '道路施工', location: '人民路东段', time: '2023-05-15 09:12:33', status: '处理中' },
  { id: 'EV20230003', type: '信号灯故障', location: '建设大道与花园路交叉口', time: '2023-05-15 10:45:21', status: '未处理' },
  { id: 'EV20230004', type: '车辆违停', location: '中心广场北侧', time: '2023-05-15 11:03:56', status: '已处理' },
  { id: 'EV20230005', type: '交通拥堵', location: '高速入口收费站', time: '2023-05-15 12:34:12', status: '处理中' },
  { id: 'EV20230006', type: '设施损坏', location: '和平路护栏', time: '2023-05-15 13:22:09', status: '未处理' },
  { id: 'EV20230007', type: '交通事故', location: '环城西路', time: '2023-05-15 14:15:37', status: '处理中' },
  { id: 'EV20230008', type: '道路积水', location: '东风路低洼处', time: '2023-05-15 15:08:44', status: '已处理' }
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const totalEvents = ref(8)

// 计算分页后的事件列表
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return eventList.value.slice(start, end)
})

// 事件详情弹窗
const detailDialogVisible = ref(false)
const currentEvent = ref({})

// 获取事件标签类型
const getEventTagType = (type) => {
  const typeMap = {
    '交通事故': 'danger',
    '道路施工': 'warning',
    '信号灯故障': 'info',
    '车辆违停': '',
    '交通拥堵': 'danger',
    '设施损坏': 'warning',
    '道路积水': 'info'
  }
  return typeMap[type] || ''
}

// 获取事件描述
const getEventDescription = (event) => {
  const descriptions = {
    '交通事故': `${event.location}发生一起交通事故，${event.status === '已处理' ? '已由交警处理完毕' : '正在处理中，请绕行'}。`,
    '道路施工': `${event.location}正在进行道路施工，预计工期3天，${event.status === '已处理' ? '施工已完成' : '施工中，请注意绕行'}。`,
    '信号灯故障': `${event.location}交通信号灯出现故障，${event.status === '已处理' ? '已修复' : '技术人员正在赶往现场'}。`,
    '车辆违停': `${event.location}有车辆违规停放，${event.status === '已处理' ? '已处理' : '等待交警处理'}。`,
    '交通拥堵': `${event.location}出现交通拥堵，${event.status === '已处理' ? '交通已恢复通畅' : '建议驾驶员选择其他路线'}。`,
    '设施损坏': `${event.location}交通设施损坏，${event.status === '已处理' ? '已修复' : '等待维修'}。`,
    '道路积水': `${event.location}出现道路积水，${event.status === '已处理' ? '积水已清除' : '请车辆谨慎通行'}。`
  }
  return descriptions[event.type] || '暂无详细描述信息。'
}

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  // 模拟API调用
  fetchEventData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // 模拟API调用
  fetchEventData()
}

// 刷新事件列表
const handleRefresh = () => {
  // 模拟API调用
  fetchEventData()
}

// 显示事件详情
const showEventDetail = (event) => {
  currentEvent.value = { ...event }
  detailDialogVisible.value = true
}

// 处理事件操作
const handleEventAction = () => {
  if (currentEvent.value.status === '未处理') {
    currentEvent.value.status = '处理中'
  } else if (currentEvent.value.status === '处理中') {
    currentEvent.value.status = '已处理'
  }
  
  // 更新主列表
  const index = eventList.value.findIndex(e => e.id === currentEvent.value.id)
  if (index !== -1) {
    eventList.value[index] = { ...currentEvent.value }
  }
  
  // 模拟API调用
  updateEventStatus(currentEvent.value.id, currentEvent.value.status)
}

// 模拟API函数
const fetchEventData = () => {
  // 模拟API调用
  console.log(`获取事件数据，页码: ${currentPage.value}, 每页大小: ${pageSize.value}`)
}

const updateEventStatus = (eventId, status) => {
  // 模拟API调用
  console.log(`更新事件状态，ID: ${eventId}, 新状态: ${status}`)
}

// 模拟图表初始化
onMounted(() => {
  // 模拟数据加载
  fetchEventData()
})
</script>

<style lang="scss" scoped>

@use './TrafficInfo.scss';

</style>