<template>
  <div class="traffic-dashboard">
    <div class="dashboard-container">
      <!-- 数据概览卡片 -->
      <div class="stats-grid">
        <el-card class="stat-card" v-for="stat in stats" :key="stat.title" shadow="hover">
          <div class="stat-content">
            <div class="stat-badge" :style="{ backgroundColor: stat.color }"></div>
            <div class="stat-info">
              <h3>{{ stat.title }}</h3>
              <p class="value">{{ stat.value }}</p>
              <p class="trend" :class="{ up: stat.trend === 'up', down: stat.trend === 'down' }">
                <span class="trend-icon">{{ stat.trend === 'up' ? '↑' : '↓' }}</span>
                {{ stat.change }}
              </p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 交通地图和图表区域 -->
        <div class="visualization-section">
          <el-card shadow="hover" class="map-container">
            <template #header>
              <div class="card-header">
                <span>实时交通路况</span>
                <div class="header-actions">
                  <el-select v-model="mapType" size="small" style="width: 120px">
                    <el-option label="路况地图" value="traffic" />
                    <el-option label="热力图" value="heat" />
                    <el-option label="卫星图" value="satellite" />
                  </el-select>
                  <el-button type="primary" size="small" @click="refreshMap">刷新数据</el-button>
                </div>
              </div>
            </template>
            <div class="map-placeholder">
              <div class="map-svg">
                <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,50 L50,20 L90,80 L130,30 L170,70 L190,50" stroke="#409EFF" stroke-width="2" fill="none" />
                  <circle cx="10" cy="50" r="3" fill="#F56C6C" />
                  <circle cx="50" cy="20" r="3" fill="#67C23A" />
                  <circle cx="90" cy="80" r="3" fill="#E6A23C" />
                  <circle cx="130" cy="30" r="3" fill="#409EFF" />
                  <circle cx="170" cy="70" r="3" fill="#909399" />
                  <circle cx="190" cy="50" r="3" fill="#67C23A" />
                </svg>
              </div>
              <p>交通路况地图展示区域</p>
            </div>
            <div class="map-legend">
              <div class="legend-item" v-for="item in legendItems" :key="item.label">
                <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="hover" class="chart-container">
            <template #header>
              <div class="card-header">
                <span>交通流量趋势</span>
                <el-select v-model="timeRange" size="small" style="width: 120px">
                  <el-option label="实时" value="realtime" />
                  <el-option label="24小时" value="24h" />
                  <el-option label="7天" value="7d" />
                </el-select>
              </div>
            </template>
            <div class="chart-placeholder">
              <div class="chart-svg">
                <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,80 L30,60 L50,70 L70,40 L90,65 L110,30 L130,50 L150,20 L170,40 L190,10" 
                        stroke="#409EFF" stroke-width="2" fill="none" />
                  <path d="M10,60 L30,40 L50,50 L70,20 L90,45 L110,10 L130,30 L150,5 L170,20 L190,5" 
                        stroke="#67C23A" stroke-width="2" fill="none" stroke-dasharray="5,2" />
                </svg>
              </div>
              <p>交通流量趋势图表区域</p>
            </div>
          </el-card>
        </div>

        <!-- 交通事件表格 -->
        <div class="data-table-section">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>交通事件公告</span>
                <div class="table-actions">
                  <el-input
                    v-model="searchQuery"
                    placeholder="搜索事件"
                    clearable
                    style="width: 200px"
                    @clear="handleSearchClear"
                    @keyup.enter="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" size="small" @click="showAddDialog">
                    <el-icon><plus /></el-icon>
                    新增事件
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-table 
              :data="paginatedEvents" 
              style="width: 100%" 
              height="300" 
              stripe
              @sort-change="handleSortChange"
            >
              <el-table-column prop="time" label="时间" width="180" sortable="custom" />
              <el-table-column prop="location" label="位置" width="180" />
              <el-table-column prop="type" label="事件类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getEventTagType(row.type)" size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="事件描述" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === '已处理' ? 'success' : 'warning'" size="small">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="handleDetail(row)">详情</el-button>
                  <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[5, 10, 20]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalEvents"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="detailVisible" :title="currentEvent ? currentEvent.description : ''" width="50%">
      <div v-if="currentEvent" class="event-detail">
        <div class="detail-item">
          <label>发生时间：</label>
          <span>{{ currentEvent.time }}</span>
        </div>
        <div class="detail-item">
          <label>具体位置：</label>
          <span>{{ currentEvent.location }}</span>
        </div>
        <div class="detail-item">
          <label>事件类型：</label>
          <el-tag :type="getEventTagType(currentEvent.type)">{{ currentEvent.type }}</el-tag>
        </div>
        <div class="detail-item">
          <label>事件状态：</label>
          <el-tag :type="currentEvent.status === '已处理' ? 'success' : 'warning'">
            {{ currentEvent.status }}
          </el-tag>
        </div>
        <div class="detail-item full-width">
          <label>详细描述：</label>
          <p>{{ currentEvent.details }}</p>
        </div>
        <div class="detail-item full-width" v-if="currentEvent.image">
          <label>现场图片：</label>
          <div class="image-placeholder">
            <div class="image-icon">📷</div>
            <p>现场图片预览</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleProcessEvent" v-if="currentEvent && currentEvent.status === '未处理'">
          标记为已处理
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增事件对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增交通事件" width="50%">
      <el-form :model="newEvent" label-width="100px" :rules="eventRules" ref="eventForm">
        <el-form-item label="事件时间" prop="time">
          <el-date-picker
            v-model="newEvent.time"
            type="datetime"
            placeholder="选择事件时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="事件位置" prop="location">
          <el-input v-model="newEvent.location" placeholder="请输入事件位置" />
        </el-form-item>
        <el-form-item label="事件类型" prop="type">
          <el-select v-model="newEvent.type" placeholder="请选择事件类型" style="width: 100%">
            <el-option label="交通事故" value="交通事故" />
            <el-option label="道路施工" value="道路施工" />
            <el-option label="大客流" value="大客流" />
            <el-option label="交通管制" value="交通管制" />
            <el-option label="拥堵" value="拥堵" />
            <el-option label="设备故障" value="设备故障" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件描述" prop="description">
          <el-input v-model="newEvent.description" type="textarea" :rows="2" placeholder="请输入事件描述" />
        </el-form-item>
        <el-form-item label="详细描述" prop="details">
          <el-input v-model="newEvent.details" type="textarea" :rows="3" placeholder="请输入详细描述" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="1"
            :on-change="handleImageChange"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddEvent">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 统计数据
const stats = ref([
  { title: '实时车流量', value: '24,532', change: '5.2%', trend: 'up', color: '#409EFF' },
  { title: '拥堵路段', value: '18', change: '2.1%', trend: 'down', color: '#E6A23C' },
  { title: '交通事故', value: '7', change: '1.3%', trend: 'up', color: '#F56C6C' },
  { title: '设备在线', value: '98%', change: '0.5%', trend: 'up', color: '#67C23A' }
])

// 地图相关
const mapType = ref('traffic')
const timeRange = ref('realtime')

// 地图图例
const legendItems = ref([
  { label: '畅通', color: '#67C23A' },
  { label: '缓行', color: '#E6A23C' },
  { label: '拥堵', color: '#F56C6C' },
  { label: '事故', color: '#909399' },
  { label: '施工', color: '#409EFF' }
])

// 交通事件数据
const events = ref([
  {
    id: 1,
    time: '2023-05-15 08:30',
    location: '中山路与解放路交叉口',
    type: '交通事故',
    description: '两车追尾事故',
    details: '一辆黑色轿车与一辆白色SUV在中山路与解放路交叉口发生追尾事故，无人员伤亡，造成该路段东向西方向拥堵。',
    status: '已处理',
    image: true
  },
  {
    id: 2,
    time: '2023-05-15 09:15',
    location: '环城东路高架',
    type: '道路施工',
    description: '高架路面维修',
    details: '环城东路高架南向北方向正在进行路面维修，占用最右侧车道，预计施工将持续至下午5点。',
    status: '未处理',
    image: false
  },
  {
    id: 3,
    time: '2023-05-15 10:00',
    location: '人民广场地铁站',
    type: '大客流',
    description: '早高峰大客流',
    details: '人民广场地铁站早高峰客流较大，站内采取限流措施，建议乘客错峰出行或选择其他交通方式。',
    status: '已处理',
    image: true
  },
  {
    id: 4,
    time: '2023-05-15 11:20',
    location: '长江大桥',
    type: '交通管制',
    description: '重大活动交通管制',
    details: '因重大活动需要，长江大桥双向将实施临时交通管制，管制时间为12:00-14:00，请车辆绕行。',
    status: '未处理',
    image: false
  },
  {
    id: 5,
    time: '2023-05-15 12:45',
    location: '南京西路商圈',
    type: '拥堵',
    description: '商圈周边道路拥堵',
    details: '南京西路商圈周边道路因节假日车流量大，目前拥堵严重，建议前往该区域的车辆选择公共交通。',
    status: '未处理',
    image: true
  },
  {
    id: 6,
    time: '2023-05-15 14:30',
    location: '机场高速',
    type: '交通事故',
    description: '多车连环相撞',
    details: '机场高速北向南方向发生多车连环相撞事故，造成该方向交通中断，救援人员已赶赴现场。',
    status: '已处理',
    image: true
  },
  {
    id: 7,
    time: '2023-05-15 15:10',
    location: '地铁3号线',
    type: '设备故障',
    description: '地铁信号故障',
    details: '地铁3号线因信号设备故障，部分列车运行延误，技术人员正在抢修，预计30分钟后恢复正常。',
    status: '已处理',
    image: false
  }
])

// 新增事件表单
const newEvent = ref({
  time: '',
  location: '',
  type: '',
  description: '',
  details: '',
  status: '未处理',
  image: false
})

// 表单验证规则
const eventRules = {
  time: [{ required: true, message: '请选择事件时间', trigger: 'blur' }],
  location: [{ required: true, message: '请输入事件位置', trigger: 'blur' }],
  type: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入事件描述', trigger: 'blur' }],
  details: [{ required: true, message: '请输入详细描述', trigger: 'blur' }]
}

// 搜索和分页
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const totalEvents = computed(() => filteredEvents.value.length)

// 排序
const sortParams = ref({ prop: '', order: '' })

// 过滤事件
const filteredEvents = computed(() => {
  let result = events.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      event =>
        event.location.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
    )
  }
  
  // 排序
  if (sortParams.value.prop) {
    const { prop, order } = sortParams.value
    result = [...result].sort((a, b) => {
      if (order === 'ascending') {
        return a[prop] > b[prop] ? 1 : -1
      } else {
        return a[prop] < b[prop] ? 1 : -1
      }
    })
  }
  
  return result
})

// 分页数据
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredEvents.value.slice(start, end)
})

// 对话框控制
const detailVisible = ref(false)
const addDialogVisible = ref(false)
const currentEvent = ref(null)
const eventForm = ref(null)

// 方法
const refreshMap = () => {
  // 模拟地图数据刷新
  stats.value.forEach(stat => {
    const change = Math.random() * 5
    stat.change = change.toFixed(1) + '%'
    stat.trend = Math.random() > 0.5 ? 'up' : 'down'
    
    if (stat.title === '实时车流量') {
      const baseValue = Math.floor(Math.random() * 20000) + 20000
      stat.value = baseValue.toLocaleString()
    } else if (stat.title === '拥堵路段') {
      const baseValue = Math.floor(Math.random() * 10) + 10
      stat.value = baseValue
    } else if (stat.title === '交通事故') {
      const baseValue = Math.floor(Math.random() * 5) + 3
      stat.value = baseValue
    }
  })
  
  ElMessage.success('地图数据已刷新')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleSortChange = ({ prop, order }) => {
  sortParams.value = { prop, order }
}

const handleDetail = (event) => {
  currentEvent.value = event
  detailVisible.value = true
}

const handleProcessEvent = () => {
  if (currentEvent.value) {
    const index = events.value.findIndex(e => e.id === currentEvent.value.id)
    if (index !== -1) {
      events.value[index].status = '已处理'
      currentEvent.value.status = '已处理'
      ElMessage.success('事件状态已更新')
    }
  }
}

const handleDelete = (event) => {
  ElMessageBox.confirm('确定要删除此事件吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = events.value.findIndex(e => e.id === event.id)
    if (index !== -1) {
      events.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const showAddDialog = () => {
  // 重置表单
  newEvent.value = {
    time: '',
    location: '',
    type: '',
    description: '',
    details: '',
    status: '未处理',
    image: false
  }
  addDialogVisible.value = true
}

const handleImageChange = (file) => {
  newEvent.value.image = true
}

const handleAddEvent = () => {
  eventForm.value.validate((valid) => {
    if (valid) {
      // 生成新ID
      const newId = Math.max(...events.value.map(e => e.id)) + 1
      
      // 格式化时间
      const formattedTime = new Date(newEvent.value.time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
      
      // 添加新事件
      events.value.unshift({
        id: newId,
        time: formattedTime,
        location: newEvent.value.location,
        type: newEvent.value.type,
        description: newEvent.value.description,
        details: newEvent.value.details,
        status: newEvent.value.status,
        image: newEvent.value.image
      })
      
      ElMessage.success('事件添加成功')
      addDialogVisible.value = false
      
      // 重置到第一页
      currentPage.value = 1
    }
  })
}

const getEventTagType = (type) => {
  switch (type) {
    case '交通事故': return 'danger'
    case '道路施工': return 'warning'
    case '大客流': return 'info'
    case '交通管制': return ''
    case '拥堵': return 'warning'
    case '设备故障': return 'danger'
    default: return 'info'
  }
}

onMounted(() => {
  // 模拟数据加载
  setTimeout(() => {
    ElMessage.success('数据加载完成')
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>